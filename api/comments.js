const { createClient } = require('@libsql/client');

let tursoClient = null;
function getClient() {
  if (!tursoClient && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    tursoClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
  }
  return tursoClient;
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const client = getClient();
  if (!client) {
    return res.status(500).json({ error: 'Turso database credentials not configured in Vercel environment.' });
  }

  // Ensure table exists
  try {
    await client.execute(`
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
  } catch (err) {
    console.error('Error verifying table in Vercel function:', err);
  }

  // GET: Fetch comments
  if (req.method === 'GET') {
    try {
      const rs = await client.execute('SELECT * FROM comments ORDER BY created_at DESC');
      const comments = rs.rows.map(row => {
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

      return res.status(200).json(comments);
    } catch (err) {
      console.error('Error fetching comments on Vercel:', err);
      return res.status(500).json({ error: 'មិនអាចទាញយកមតិយោបល់បានទេ' });
    }
  }

  // POST: Add new comment
  if (req.method === 'POST') {
    // In Vercel, req.body is pre-parsed if JSON
    let payload = req.body;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch (e) { payload = {}; }
    }
    payload = payload || {};

    // Spam honeypot
    if (payload.website_url_hp) {
      return res.status(400).json({ error: 'ការបញ្ជូនត្រូវបានបដិសេធ (Spam bot detected)។' });
    }

    const author = (payload.author || '').trim().slice(0, 60);
    const role = (payload.role || '').trim().slice(0, 50) || 'អ្នកប្រើប្រាស់ Windows';
    const avatarBg = (payload.avatarBg || '').trim().slice(0, 100);
    const rating = Math.min(5, Math.max(1, parseInt(payload.rating || 5, 10)));
    const title = (payload.title || '').trim().slice(0, 100);
    const comment = (payload.comment || '').trim().slice(0, 1500);
    const tags = Array.isArray(payload.tags) ? payload.tags.slice(0, 5) : [];

    if (!author || !title || comment.length < 2) {
      return res.status(400).json({ error: 'សូមបំពេញព័ត៌មានឱ្យបានត្រឹមត្រូវ និងសរសេរមតិយ៉ាងតិច ២ តួអក្សរ។' });
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

    try {
      await client.execute({
        sql: `INSERT INTO comments (id, author, role, avatar_bg, rating, title, comment, tags, date, helpful_count, verified)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          newComment.id,
          newComment.author,
          newComment.role,
          newComment.avatarBg,
          newComment.rating,
          newComment.title,
          newComment.comment,
          JSON.stringify(newComment.tags),
          newComment.date,
          0,
          1
        ]
      });

      return res.status(200).json({
        success: true,
        comment: newComment,
        message: 'ការវាយតម្លៃរបស់អ្នកត្រូវបានផ្សព្វផ្សាយដោយជោគជ័យ!'
      });
    } catch (err) {
      console.error('Error saving comment on Vercel:', err);
      return res.status(500).json({ error: 'បញ្ហាម៉ាស៊ីនមេផ្ទៃក្នុង (Internal Server Error)' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
