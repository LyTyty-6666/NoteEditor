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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const client = getClient();
  if (!client) {
    return res.status(500).json({ error: 'Turso database credentials not configured.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { id } = body || {};

  if (!id) {
    return res.status(400).json({ error: 'ខ្វះលេខសម្គាល់មតិយោបល់' });
  }

  try {
    await client.execute({
      sql: 'UPDATE comments SET helpful_count = helpful_count + 1 WHERE id = ?',
      args: [id]
    });
    return res.status(200).json({ success: true, message: 'បានបោះឆ្នោតគាំទ្រជោគជ័យ' });
  } catch (err) {
    console.error('Error upvoting on Vercel:', err);
    return res.status(500).json({ error: 'បញ្ហាម៉ាស៊ីនមេផ្ទៃក្នុង' });
  }
};
