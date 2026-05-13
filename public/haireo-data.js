/* ═══════════════════════════════════════════════
   haireo-data.js — 공유 데이터 레이어
   localStorage 기반. Firebase 교체 가능 구조.
   모든 CRUD 이 파일 한 곳에서 관리.
═══════════════════════════════════════════════ */
const HD = (function () {
  const KEYS = { salons: 'haireo_salons', cards: 'haireo_style_cards' };

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  }
  function persist(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { console.warn('[HD] persist failed:', key, e.name); return false; }
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  return {
    /* ── 살롱 ── */
    getSalons()  { return load(KEYS.salons); },
    getSalon(id) { return load(KEYS.salons).find(s => s.id === id) || null; },
    saveSalon(data) {
      const list = load(KEYS.salons);
      const now = new Date().toISOString();
      const salon = { createdAt: now, ...data, id: data.id || uid(), updatedAt: now };
      const idx = list.findIndex(s => s.id === salon.id);
      if (idx >= 0) list[idx] = salon; else list.push(salon);
      persist(KEYS.salons, list);
      return salon;
    },
    deleteSalon(id) { persist(KEYS.salons, load(KEYS.salons).filter(s => s.id !== id)); },

    /* ── 디자이너 인증 ── */
    findDesigner(loginId, password) {
      for (const salon of load(KEYS.salons)) {
        const d = (salon.designers || []).find(
          d => d.loginId === loginId && d.password === password
        );
        if (d) return { ...d, salonId: salon.id, salonName: salon.name };
      }
      return null;
    },

    /* ── 스타일카드 ── */
    getCards()             { return load(KEYS.cards); },
    getCardsBySalon(sid)   { return load(KEYS.cards).filter(c => c.salonId === sid); },
    getCardsByDesigner(lid){ return load(KEYS.cards).filter(c => c.designerLoginId === lid); },
    saveCard(data) {
      const cards = load(KEYS.cards);
      const card = { ...data, id: uid(), createdAt: new Date().toISOString() };
      cards.unshift(card);
      if (!persist(KEYS.cards, cards)) {
        const slim = cards.map(c => ({ ...c, photos: [] }));
        persist(KEYS.cards, slim);
        return { ...card, photos: [] };
      }
      return card;
    },
    deleteCard(id) { persist(KEYS.cards, load(KEYS.cards).filter(c => c.id !== id)); },
  };
})();
