const http = require('http');
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

// Initialize Turso Client
let tursoClient = null;
if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  try {
    const { createClient } = require('@libsql/client');
    tursoClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
    console.log('[Turso] Connected to cloud database:', process.env.TURSO_DATABASE_URL);
  } catch (err) {
    console.warn('[Turso] Error initializing client, using fallback:', err.message);
  }
} else {
  console.log('[Turso] No credentials configured. Using local JSON fallback.');
}

// Auto-initialize database table
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
    console.log('[Turso] Comments table verified & ready.');
  } catch (err) {
    console.error('[Turso] Error initializing table:', err);
  }
}
initDatabase();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.exe': 'application/octet-stream'
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8'
};

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

const server = http.createServer(async (req, res) => {
  const [pathname] = req.url.split('?');

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // API Route: GET /api/comments
  if (pathname === '/api/comments' && req.method === 'GET') {
    try {
      const comments = await fetchComments();
      res.writeHead(200, CORS_HEADERS);
      res.end(JSON.stringify(comments));
    } catch (err) {
      res.writeHead(500, CORS_HEADERS);
      res.end(JSON.stringify({ error: 'មិនអាចទាញយកមតិយោបល់បានទេ' }));
    }
    return;
  }

  // API Route: POST /api/comments
  if (pathname === '/api/comments' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');

        // Bot honeypot filter
        if (payload.website_url_hp) {
          res.writeHead(400, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'ការបញ្ជូនត្រូវបានបដិសេធ (Spam bot detected)។' }));
          return;
        }

        const author = (payload.author || '').trim().slice(0, 60);
        const role = (payload.role || '').trim().slice(0, 50) || 'អ្នកប្រើប្រាស់ Windows';
        const avatarBg = (payload.avatarBg || '').trim().slice(0, 100);
        const rating = Math.min(5, Math.max(1, parseInt(payload.rating || 5, 10)));
        const title = (payload.title || '').trim().slice(0, 100);
        const comment = (payload.comment || '').trim().slice(0, 1500);
        const tags = Array.isArray(payload.tags) ? payload.tags.slice(0, 5) : [];

        if (!author || !title || comment.length < 2) {
          res.writeHead(400, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'សូមបំពេញព័ត៌មានឱ្យបានត្រឹមត្រូវ និងសរសេរមតិយ៉ាងតិច ២ តួអក្សរ។' }));
          return;
        }

        const newComment = {
          id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          author,
          role,
          avatarBg,
          rating,
          title,
          comment,
          tags,
          date: new Date().toISOString().split('T')[0],
          helpfulCount: 0,
          verified: true
        };

        await addComment(newComment);

        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({
          success: true,
          comment: newComment,
          message: 'ការវាយតម្លៃរបស់អ្នកត្រូវបានផ្សព្វផ្សាយដោយជោគជ័យ!'
        }));
      } catch (e) {
        console.error('Error saving comment:', e);
        res.writeHead(500, CORS_HEADERS);
        res.end(JSON.stringify({ error: 'បញ្ហាម៉ាស៊ីនមេផ្ទៃក្នុង (Internal Server Error)' }));
      }
    });
    return;
  }

  // API Route: POST /api/upvote
  if (pathname === '/api/upvote' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { id } = JSON.parse(body || '{}');
        if (!id) {
          res.writeHead(400, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'ខ្វះលេខសម្គាល់មតិយោបល់' }));
          return;
        }

        await upvoteComment(id);

        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({ success: true, message: 'បានបោះឆ្នោតគាំទ្រជោគជ័យ' }));
      } catch (e) {
        console.error('Error upvoting:', e);
        res.writeHead(500, CORS_HEADERS);
        res.end(JSON.stringify({ error: 'បញ្ហាម៉ាស៊ីនមេផ្ទៃក្នុង' }));
      }
    });
    return;
  }

  // Static File Serving
  let reqUrl = pathname;
  if (reqUrl === '/') reqUrl = '/index.html';
  
  const filePath = path.join(__dirname, decodeURIComponent(reqUrl));
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    const headers = {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    };
    
    if (ext === '.exe') {
      headers['Content-Disposition'] = `attachment; filename="${path.basename(filePath)}"`;
    }
    
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}/ with live Turso database comments API`);
});
