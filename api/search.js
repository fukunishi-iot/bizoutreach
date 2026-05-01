export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'API key not configured' }); return; }

  const location = req.query.location || '';
  const keyword  = req.query.keyword  || '';
  const type     = req.query.type     || '';
  const placeId  = req.query.placeId  || '';

  try {
    // 詳細取得モード
    if (placeId) {
      const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
      url.searchParams.set('place_id', placeId);
      url.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total');
      url.searchParams.set('language', 'ja');
      url.searchParams.set('key', apiKey);
      const r = await fetch(url.toString());
      const d = await r.json();
      res.status(200).json(d);
      return;
    }

    // ジオコーディング
    const geoUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    geoUrl.searchParams.set('address', location + ' 日本');
    geoUrl.searchParams.set('key', apiKey);
    const geoRes  = await fetch(geoUrl.toString());
    const geoData = await geoRes.json();
    if (geoData.status !== 'OK') {
      res.status(400).json({ error: '地域が見つかりません: ' + geoData.status });
      return;
    }
    const loc = geoData.results[0].geometry.location;

    // テキスト検索
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.set('query', location + ' ' + keyword);
    searchUrl.searchParams.set('location', loc.lat + ',' + loc.lng);
    searchUrl.searchParams.set('radius', '3000');
    searchUrl.searchParams.set('language', 'ja');
    searchUrl.searchParams.set('key', apiKey);
    if (type) searchUrl.searchParams.set('type', type);

    const sRes  = await fetch(searchUrl.toString());
    const sData = await sRes.json();
    res.status(200).json({ ...sData, _location: loc });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
