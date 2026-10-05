const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const COMMENTS_FILE = path.join(__dirname, 'data', 'comments.json');

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

function readComments() {
  try {
    if (fs.existsSync(COMMENTS_FILE)) {
      const data = fs.readFileSync(COMMENTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading comments.json:', err);
  }
  return [];
}

function writeComments(comments) {
  try {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing comments.json:', err);
  }
}

const server = http.createServer((req, res) => {
  const [pathname] = req.url.split('?');

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // API Route: GET /api/comments
  if (pathname === '/api/comments' && req.method === 'GET') {
    const comments = readComments();
    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify(comments));
    return;
  }

  // API Route: POST /api/comments
  if (pathname === '/api/comments' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');

        // Bot honeypot filter
        if (payload.website_url_hp) {
          res.writeHead(400, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'Spam bot detected.' }));
          return;
        }

        const author = (payload.author || '').trim().slice(0, 60);
        const role = (payload.role || '').trim().slice(0, 50) || 'អ្នកប្រើប្រាស់ Windows';
        const rating = Math.min(5, Math.max(1, parseInt(payload.rating || 5, 10)));
        const title = (payload.title || '').trim().slice(0, 100);
        const comment = (payload.comment || '').trim().slice(0, 1500);
        const tags = Array.isArray(payload.tags) ? payload.tags.slice(0, 5) : [];

        if (!author || !title || comment.length < 10) {
          res.writeHead(400, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'Missing required fields or comment too short.' }));
          return;
        }

        const newComment = {
          id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          author,
          role,
          rating,
          title,
          comment,
          tags,
          date: new Date().toISOString().split('T')[0],
          helpfulCount: 0,
          verified: true
        };

        const list = readComments();
        list.unshift(newComment);
        writeComments(list);

        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({
          success: true,
          id: newComment.id,
          date: newComment.date,
          message: 'Comment published successfully!'
        }));
      } catch (e) {
        res.writeHead(500, CORS_HEADERS);
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  }

  // API Route: POST /api/upvote
  if (pathname === '/api/upvote' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body || '{}');
        if (!id) {
          res.writeHead(400, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'Missing review id' }));
          return;
        }

        const list = readComments();
        const item = list.find(r => r.id === id);
        if (item) {
          item.helpfulCount = (item.helpfulCount || 0) + 1;
          writeComments(list);
        }

        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, CORS_HEADERS);
        res.end(JSON.stringify({ error: 'Internal error' }));
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

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/ with live comments API`);
});
