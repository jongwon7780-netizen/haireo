const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

const KAKAO_REST_KEY       = process.env.KAKAO_REST_KEY       || '';
const KAKAO_JS_KEY         = process.env.KAKAO_JS_KEY         || '';
const SUPABASE_URL         = process.env.SUPABASE_URL         || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ─── 프론트 환경 변수 공급 ───────────────────────────── */
app.get('/api/config', (req, res) => {
  res.json({
    kakaoJsKey:      KAKAO_JS_KEY,
    supabaseUrl:     process.env.SUPABASE_URL      || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  });
});

/* ─── 카카오 로컬 API 프록시 (CORS 우회용) ─────────────── */

// 키워드 미용실 검색
app.get('/api/salons', async (req, res) => {
  const { lat, lng, radius = 2000, query = '미용실' } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat, lng 필수' });
  const params = new URLSearchParams({ query, x: lng, y: lat, radius, sort: 'distance', size: 15 });
  try {
    const r = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
      { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } }
    );
    res.json(await r.json());
  } catch (err) {
    console.error('Kakao keyword API error:', err);
    res.status(500).json({ error: 'API 오류' });
  }
});

// 좌표 → 행정동명
app.get('/api/region', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat, lng 필수' });
  try {
    const r = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`,
      { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } }
    );
    res.json(await r.json());
  } catch (err) {
    res.status(500).json({ error: 'API 오류' });
  }
});

// 지역명 → 좌표 (자동완성 + 지역 이동)
app.get('/api/search-location', async (req, res) => {
  const { query } = req.query;
  if (!query || query.trim().length < 2) return res.json({ results: [] });
  const headers = { Authorization: `KakaoAK ${KAKAO_REST_KEY}` };
  const q = encodeURIComponent(query.trim());
  try {
    const addrR   = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${q}&size=5`, { headers });
    const addrData = await addrR.json();
    const results = (addrData.documents || []).map(d => ({ name: d.address_name, x: d.x, y: d.y }));
    if (results.length < 4) {
      const kwR   = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${q}&size=5`, { headers });
      const kwData = await kwR.json();
      const used   = new Set(results.map(r => r.name));
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

/* ─── 조회수/클릭 기록 ─────────────────────────────────────── */
app.post('/api/track', async (req, res) => {
  const { salon_name, event_type } = req.body || {};
  if (!salon_name || !event_type || !SUPABASE_URL) return res.json({ ok: false });
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ salon_name, event_type }),
    });
    res.json({ ok: true });
  } catch (e) { res.json({ ok: false }); }
});

/* ─── 통계 조회 ─────────────────────────────────────────────── */
app.get('/api/stats', async (req, res) => {
  const { salon_name } = req.query;
  if (!salon_name || !SUPABASE_URL) return res.json({ today: 0, week: 0, naver: 0 });
  const hdr = { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` };
  const enc  = encodeURIComponent(salon_name);
  const todayISO = new Date().toISOString().slice(0, 10) + 'T00:00:00Z';
  const weekISO  = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10) + 'T00:00:00Z';
  try {
    const [a, b, c] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/views?salon_name=eq.${enc}&event_type=eq.view&created_at=gte.${todayISO}`, { headers: hdr }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/views?salon_name=eq.${enc}&event_type=eq.view&created_at=gte.${weekISO}`, { headers: hdr }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/views?salon_name=eq.${enc}&event_type=eq.naver_click&created_at=gte.${weekISO}`, { headers: hdr }).then(r => r.json()),
    ]);
    res.json({
      today: Array.isArray(a) ? a.length : 0,
      week:  Array.isArray(b) ? b.length : 0,
      naver: Array.isArray(c) ? c.length : 0,
    });
  } catch (e) { res.json({ today: 0, week: 0, naver: 0 }); }
});

/* ─── 로컬 개발용 서버 (Vercel에서는 module.exports만 사용) ── */
if (require.main === module) {
  app.listen(PORT, () => console.log(`헤어이어 서버 실행 중 → http://localhost:${PORT}`));
}

module.exports = app;
