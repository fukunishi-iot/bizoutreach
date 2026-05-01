export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { location, keyword, type, maxResults, placeId } = req.query;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) { res.status(500).json({ error: 'API key not configured' }); return; }

  try {
    // 詳細取得モード
    if (placeId) {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total&language=ja&key=${apiKey}`;
      const r = await fetch(url);
      const d = await r.json();
      res.status(200).json(d);
      return;
    }

    // ジオコーディング
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location + ' 日本')}&key=${apiKey}`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    if (geoData.status !== 'OK') { res.status(400).json({ error: '地域が見つかりません: ' + geoData.status }); return; }
    const loc = geoData.results[0].geometry.location;

    // テキスト検索
    let searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(location + ' ' + keyword)}&location=${loc.lat},${loc.lng}&radius=3000&language=ja&key=${apiKey}`;
    if (type) searchUrl += `&type=${type}`;

    const sRes = await fetch(searchUrl);
    const sData = await sRes.json();
    res.status(200).json({ ...sData, _location: loc });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
