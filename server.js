const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const KAKAO_REST_KEY = process.env.KAKAO_REST_KEY || 'e0fbb0b0e576d9627ea2c2e236e24e93';

app.use(express.static(path.join(__dirname, 'public')));

// 카카오 로컬 키워드 검색 프록시
app.get('/api/salons', async (req, res) => {
  const { lat, lng, radius = 2000, query = '미용실' } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat, lng 필수' });

  const params = new URLSearchParams({
    query,
    x: lng,
    y: lat,
    radius,
    sort: 'distance',
    size: 15,
  });

  try {
    const r = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
      { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } }
    );
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error('Kakao keyword API error:', err);
    res.status(500).json({ error: 'API 오류' });
  }
});

// 좌표 → 행정동명 프록시
app.get('/api/region', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat, lng 필수' });

  try {
    const r = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`,
      { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } }
    );
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'API 오류' });
  }
});

// 지역명 → 좌표 검색 (자동완성 & 지역 이동)
app.get('/api/search-location', async (req, res) => {
  const { query } = req.query;
  if (!query || query.trim().length < 2) return res.json({ results: [] });

  const headers = { Authorization: `KakaoAK ${KAKAO_REST_KEY}` };
  const q = encodeURIComponent(query.trim());

  try {
    // 1차: 주소 검색 (시/구/동 등 행정구역에 강함)
    const addrR = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${q}&size=5`,
      { headers }
    );
    const addrData = await addrR.json();
    const results = (addrData.documents || []).map(d => ({
      name: d.address_name,
      x: d.x,
      y: d.y,
    }));

    // 2차: 부족하면 키워드 검색으로 보충 (지명·동네 이름 등)
    if (results.length < 4) {
      const kwR = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${q}&size=5`,
        { headers }
      );
      const kwData = await kwR.json();
      const used = new Set(results.map(r => r.name));
      (kwData.documents || []).forEach(d => {
        if (!used.has(d.place_name)) {
          results.push({ name: d.place_name, address: d.address_name, x: d.x, y: d.y });
          used.add(d.place_name);
        }
      });
    }

    res.json({ results: results.slice(0, 6) });
  } catch (err) {
    console.error('search-location error:', err);
    res.status(500).json({ error: 'API 오류' });
  }
});

app.listen(PORT, () => {
  console.log(`헤어이어 서버 실행 중 → http://localhost:${PORT}`);
});
