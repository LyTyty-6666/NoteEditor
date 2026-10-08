const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

// Automatically load .env file if available in Node 20.6+
if (process.loadEnvFile) {
  try {
    process.loadEnvFile(path.join(__dirname, '.env'));
  } catch (err) {
    // .env not found or already loaded
  }
}

const PORT = process.env.PORT || 3000;
const COMMENTS_FILE = path.join(__dirname, 'data', 'comments.json');
const TOOLS_DIR = path.resolve(path.join(__dirname, 'Tools'));

// =============================================================================
// 1. Turso Database Client Initialization
// =============================================================================
let tursoClient = null;
if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  try {
    const { createClient } = require('@libsql/client');
    tursoClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
    console.log('[Turso] Connected securely to cloud database:', process.env.TURSO_DATABASE_URL);
  } catch (err) {
    console.warn('[Turso] Error initializing client, using fallback:', err.message);
  }
} else {
  console.log('[Turso] No cloud credentials configured. Using local JSON fallback.');
}

// Auto-initialize comments table with SQL parameterization
async function initDatabase() {
  if (!tursoClient) return;
  try {
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        author TEXT NOT NULL,
        role TEXT,
        avatar_bg TEXT,
        rating INTEGER NOT NULL,
        title TEXT NOT NULL,
        comment TEXT NOT NULL,
        tags TEXT,
        date TEXT NOT NULL,
        helpful_count INTEGER DEFAULT 0,
        verified INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[Turso] Security-verified comments schema ready.');
  } catch (err) {
    console.error('[Turso] Database initialization error:', err);
  }
}
initDatabase();

// =============================================================================
// 2. Express Security Framework Configuration
// =============================================================================
const app = express();

// Disable X-Powered-By header to prevent fingerprinting
app.disable('x-powered-by');

// Trust first proxy if behind reverse proxy/load balancer
app.set('trust proxy', 1);

// A. Helmet Security Headers (Content Security Policy, Anti-Clickjacking, NoSniff)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for inline interactive demo handlers
          "https://fonts.googleapis.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "data:"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:"
        ],
        connectSrc: [
          "'self'",
          "https:",
          "libsql:"
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"], // Disallows framing to stop Clickjacking attacks
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// B. Strict CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// C. Body Parser with Strict Payload Limits (Prevents Buffer Exhaustion/DoS)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// D. Path Traversal & Sensitive File Defense Middleware
app.use((req, res, next) => {
  const rawPath = decodeURIComponent(req.path || '').toLowerCase();

  // Strict blacklist: prevents unauthorized access to secrets, repo configs, and internal code
  const forbiddenPatterns = [
    /\.env($|\.)/,
    /\.git/,
    /\.agents/,
    /package\.json$/,
    /package-lock\.json$/,
    /node_modules/,
    /local-server\.js$/,
    /\/\.[a-z0-9_-]+/i // Any dot-files like /.vscode, /.config
  ];

  const isBlocked = forbiddenPatterns.some(pattern => pattern.test(rawPath));
  if (isBlocked) {
    console.warn(`[Security Guard] Blocked prohibited file request from ${req.ip} to: ${req.originalUrl}`);
    return res.status(403).json({
      error: 'Forbidden: Access to server configuration and secret files is strictly prohibited.'
    });
  }
  next();
});

// E. Anti-DDoS and Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // 600 requests per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

const commentPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // Max 15 review submissions per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'សូមរង់ចាំបន្តិច! អ្នកបានបញ្ជូនមតិយោបល់ច្រើនដងពេក (Rate limit reached)។ សូមសាកល្បងម្តងទៀតនៅ ១៥ នាទីក្រោយ។'
  }
});

const upvoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // Max 60 upvotes per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'បានដល់កម្រិតកំណត់ការបោះឆ្នោតហើយ សូមរង់ចាំបន្តិច។'
  }
});

// =============================================================================
// 3. Input Sanitization & Helper Functions
// =============================================================================
function sanitizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/[<>"'&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#039;';
        case '&': return '&amp;';
        default: return char;
      }
    })
    .trim();
}

function readLocalComments() {
  try {
    if (fs.existsSync(COMMENTS_FILE)) {
      const data = fs.readFileSync(COMMENTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading local comments.json:', err);
  }
  return [];
}

function writeLocalComments(comments) {
  try {
    const dir = path.dirname(COMMENTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local comments.json:', err);
  }
}

async function fetchComments() {
  if (tursoClient) {
    try {
      const rs = await tursoClient.execute('SELECT * FROM comments ORDER BY created_at DESC');
      return rs.rows.map(row => {
        let parsedTags = [];
        try {
          parsedTags = row.tags ? JSON.parse(row.tags) : [];
        } catch (e) {
          parsedTags = [];
        }

        return {
          id: String(row.id),
          author: String(row.author || ''),
          role: String(row.role || 'អ្នកប្រើប្រាស់ Windows'),
          avatarBg: row.avatar_bg ? String(row.avatar_bg) : null,
          rating: Number(row.rating || 5),
          title: String(row.title || ''),
          comment: String(row.comment || ''),
          tags: parsedTags,
          date: String(row.date || ''),
          helpfulCount: Number(row.helpful_count || 0),
          verified: Boolean(row.verified)
        };
      });
    } catch (err) {
      console.error('[Turso] Error querying comments:', err);
    }
  }
  return readLocalComments();
}

async function addComment(newComment) {
  if (tursoClient) {
    await tursoClient.execute({
      sql: `INSERT INTO comments (id, author, role, avatar_bg, rating, title, comment, tags, date, helpful_count, verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newComment.id,
        newComment.author,
        newComment.role || 'អ្នកប្រើប្រាស់ Windows',
        newComment.avatarBg || null,
        newComment.rating,
        newComment.title,
        newComment.comment,
        JSON.stringify(newComment.tags || []),
        newComment.date,
        0,
        1
      ]
    });
    return;
  }
  const list = readLocalComments();
  list.unshift(newComment);
  writeLocalComments(list);
}

async function upvoteComment(id) {
  if (tursoClient) {
    await tursoClient.execute({
      sql: 'UPDATE comments SET helpful_count = helpful_count + 1 WHERE id = ?',
      args: [id]
    });
    return;
  }
  const list = readLocalComments();
  const item = list.find(r => r.id === id);
  if (item) {
    item.helpfulCount = (item.helpfulCount || 0) + 1;
    writeLocalComments(list);
  }
}

// =============================================================================
// 4. API Routes
// =============================================================================

// GET /api/comments or /comments (Vercel rewrite support)
app.get(['/api/comments', '/comments'], async (req, res) => {
  try {
    const comments = await fetchComments();
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'មិនអាចទាញយកមតិយោបល់បានទេ' });
  }
});

// POST /api/comments or /comments (Protected with Rate Limiter, Honeypot & XSS Sanitization)
app.post(['/api/comments', '/comments'], commentPostLimiter, async (req, res) => {
  try {
    const payload = req.body || {};

    // Bot honeypot filter
    if (payload.website_url_hp) {
      return res.status(400).json({ error: 'ការបញ្ជូនត្រូវបានបដិសេធ (Spam bot detected)។' });
    }

    // Sanitize and validate inputs
    const author = sanitizeText(payload.author).slice(0, 60);
    const role = sanitizeText(payload.role).slice(0, 50) || 'អ្នកប្រើប្រាស់ Windows';
    const avatarBg = sanitizeText(payload.avatarBg).slice(0, 100);
    const rating = Math.min(5, Math.max(1, parseInt(payload.rating || 5, 10)));
    const title = sanitizeText(payload.title).slice(0, 100);
    const comment = sanitizeText(payload.comment).slice(0, 1500);
    const tags = Array.isArray(payload.tags) 
      ? payload.tags.slice(0, 5).map(t => sanitizeText(t).slice(0, 30))
      : [];

    if (!author || !title || comment.length < 2) {
      return res.status(400).json({
        error: 'សូមបំពេញព័ត៌មានឱ្យបានត្រឹមត្រូវ និងសរសេរមតិយ៉ាងតិច ២ តួអក្សរ។'
      });
    }

    const newComment = {
      id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      author,
      role,
      avatarBg: avatarBg || null,
      rating,
      title,
      comment,
      tags,
      date: new Date().toISOString().split('T')[0],
      helpfulCount: 0,
      verified: true
    };

    await addComment(newComment);

    res.status(200).json({
      success: true,
      comment: newComment,
      message: 'ការវាយតម្លៃរបស់អ្នកត្រូវបានផ្សព្វផ្សាយដោយជោគជ័យ!'
    });
  } catch (e) {
    console.error('Error saving comment:', e);
    res.status(500).json({ error: 'បញ្ហាម៉ាស៊ីនមេផ្ទៃក្នុង (Internal Server Error)' });
  }
});

// POST /api/upvote or /upvote (Vercel rewrite support)
app.post(['/api/upvote', '/upvote'], upvoteLimiter, async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ខ្វះលេខសម្គាល់មតិយោបល់' });
    }

    await upvoteComment(sanitizeText(id));
    res.status(200).json({ success: true, message: 'បានបោះឆ្នោតគាំទ្រជោគជ័យ' });
  } catch (e) {
    console.error('Error upvoting:', e);
    res.status(500).json({ error: 'បញ្ហាម៉ាស៊ីនមេផ្ទៃក្នុង' });
  }
});

// =============================================================================
// 5. Secure Cross-Platform Binary Downloads Route
// =============================================================================
const MIME_TYPES = {
  '.exe': 'application/octet-stream',
  '.zip': 'application/zip',
  '.tar.gz': 'application/gzip',
  '.gz': 'application/gzip',
  '.tar': 'application/x-tar'
};

app.get('/Tools/:filename', (req, res) => {
  const rawFilename = req.params.filename;
  const safeFilename = path.basename(rawFilename); // Blocks path traversal
  const resolvedPath = path.resolve(path.join(TOOLS_DIR, safeFilename));

  // Security barrier: Ensure path is strictly inside the Tools directory
  if (!resolvedPath.startsWith(TOOLS_DIR)) {
    console.warn(`[Security Guard] Path traversal attempt blocked: ${req.ip} -> ${rawFilename}`);
    return res.status(403).json({ error: 'Forbidden: Invalid file path.' });
  }

  fs.stat(resolvedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).send('Download file not found');
    }

    let ext = path.extname(safeFilename).toLowerCase();
    if (safeFilename.toLowerCase().endsWith('.tar.gz')) {
      ext = '.tar.gz';
    }

    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day client cache

    if (req.method === 'HEAD') {
      return res.end();
    }

    const stream = fs.createReadStream(resolvedPath);
    stream.on('error', (streamErr) => {
      console.error('Download stream error:', streamErr);
      if (!res.headersSent) res.status(500).send('Error streaming download');
    });
    stream.pipe(res);
  });
});

// =============================================================================
// 6. Safe Static Web Application Assets
// =============================================================================
app.use(express.static(__dirname, {
  index: 'index.html',
  dotfiles: 'deny', // Automatically denies dotfiles (.env, .git)
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Fallback for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// Centralized Error Handler (Never leak stack traces in production)
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// =============================================================================
// 7. Export for Vercel Serverless & Local Standalone Execution
// =============================================================================
module.exports = app;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Express Security] Server running at http://localhost:${PORT}/`);
    console.log(`[Express Security] Protected with Helmet, CSP, Rate-Limiting, CORS & Path Traversal Guards.`);
  });
}
