export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const key = process.env.GOOGLE_API_KEY;
  if (!key) { res.status(500).json({ error: 'API key not configured' }); return; }
  res.status(200).json({ key });
}
