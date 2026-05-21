/* ═══════════════════════════════════════════════
   owner-bar.js — 사장님 전용 관리 바 (공유 컴포넌트)
   모든 페이지에 <script src="owner-bar.js"> 로 포함
   로그인: admin / haireo1234
═══════════════════════════════════════════════ */
(function () {
  const SALONS = [
    { id:'s1', name:'마포살롱 블랑' },
    { id:'s2', name:'강남 헤어스튜디오' },
    { id:'s3', name:'홍대 그린헤어' },
    { id:'s4', name:'이태원 살롱드무드' },
    { id:'s5', name:'합정 헤어아뜰리에' },
  ];
  const HOURS    = [10,11,12,13,14,15,16,17,18,19,20,21];
  const SLOT_KEY = 'haireo_owner_slots';
  const AUTH_KEY = 'haireo_owner_auth';

  /* ── 날짜 ── */
  function todayStr() {
    const n = new Date();
    return `${n.getFullYear()}-${pad(n.getMonth()+1)}-${pad(n.getDate())}`;
  }
  function pad(n) { return String(n).padStart(2,'0'); }
  function todayLabel() {
    const n = new Date();
    const wd = ['일','월','화','수','목','금','토'][n.getDay()];
    return `${n.getMonth()+1}/${n.getDate()}(${wd})`;
  }

  /* ── 상태 ── */
  let ownerAuth = null;
  let slotsStore = {};
  let activeSalonId = SALONS[0].id;

  try { ownerAuth = JSON.parse(localStorage.getItem(AUTH_KEY)); } catch(e) {}

  function loadSlots() {
    try { slotsStore = JSON.parse(localStorage.getItem(SLOT_KEY)) || {}; } catch(e) { slotsStore = {}; }
  }
  function saveAndBroadcast() {
    localStorage.setItem(SLOT_KEY, JSON.stringify(slotsStore));
    window.dispatchEvent(new CustomEvent('haireo-slots-changed', { detail: slotsStore }));
  }
  function getSlotSt(salonId, h) {
    return slotsStore?.[todayStr()]?.[salonId]?.[`${pad(h)}:00`] ?? 'open';
  }
  function toggleSlot(salonId, h) {
    const t = todayStr(), key = `${pad(h)}:00`;
    if (!slotsStore[t]) slotsStore[t] = {};
    if (!slotsStore[t][salonId]) slotsStore[t][salonId] = {};
    slotsStore[t][salonId][key] = getSlotSt(salonId, h) === 'open' ? 'booked' : 'open';
    saveAndBroadcast();
    renderSlotBtns();
  }
  loadSlots();

  /* ── CSS 주입 ── */
  const css = `
  /* 로그인 모달 */
  .om-backdrop {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.55); z-index: 3100;
    align-items: center; justify-content: center;
    padding: 16px;
  }
  .om-backdrop.open { display: flex; }
  .om-sheet {
    background: #fff; border-radius: 20px;
    padding: 32px 28px 28px; width: 100%; max-width: 380px;
    animation: lm-slide-up 0.2s ease; position: relative;
  }
  .om-close {
    position: absolute; top: 14px; right: 14px;
    width: 30px; height: 30px; border: none;
    background: var(--border, #E8E0D8); border-radius: 50%;
    font-size: 14px; cursor: pointer; line-height: 1;
    display: flex; align-items: center; justify-content: center;
  }
  .om-title {
    font-family: 'Noto Serif KR', serif; font-size: 20px;
    font-weight: 700; color: var(--dark, #2D2D2D); margin-bottom: 5px;
  }
  .om-sub { font-size: 13px; color: var(--sub, #7A7A7A); margin-bottom: 22px; }
  .om-field { margin-bottom: 12px; }
  .om-field label {
    font-size: 12px; font-weight: 700; color: var(--dark, #2D2D2D);
    display: block; margin-bottom: 5px;
  }
  .om-field input {
    width: 100%; padding: 13px 14px;
    border: 1.5px solid var(--border, #E8E0D8); border-radius: 12px;
    font-size: 15px; color: var(--dark, #2D2D2D); outline: none;
    font-family: 'Noto Sans KR', sans-serif;
    box-sizing: border-box; transition: border-color 0.2s;
  }
  .om-field input:focus { border-color: var(--rose, #C4725A); }
  .om-err { font-size: 12px; color: #D95C5C; margin: 6px 0 8px; display: none; }
  .om-err.show { display: block; }
  .om-submit {
    width: 100%; padding: 15px; border-radius: 12px; border: none;
    background: var(--dark, #2D2D2D); color: #fff;
    font-size: 15px; font-weight: 700; cursor: pointer;
    font-family: 'Noto Sans KR', sans-serif;
    margin-top: 4px; transition: background 0.15s;
  }
  .om-submit:hover { background: #111; }

  /* 관리 바 */
  .owner-bar {
    position: fixed; top: 0; left: 0; right: 0;
    z-index: 2500;
    background: #1C1C1E; color: #fff;
    padding: 10px 14px 12px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.45);
    font-family: 'Noto Sans KR', sans-serif;
    box-sizing: border-box;
  }
  .ob-row1 {
    display: flex; align-items: center;
    justify-content: space-between;
    gap: 8px; margin-bottom: 10px;
  }
  .ob-left { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .ob-badge {
    font-size: 11px; font-weight: 800; letter-spacing: 0.3px;
    background: var(--rose, #C4725A); color: #fff;
    padding: 3px 9px; border-radius: 20px; white-space: nowrap; flex-shrink: 0;
  }
  .ob-salon-select {
    background: rgba(255,255,255,0.1); color: #fff;
    border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;
    padding: 5px 8px; font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: 'Noto Sans KR', sans-serif;
    min-width: 0; max-width: 150px;
  }
  .ob-salon-select option { background: #1C1C1E; }
  .ob-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .ob-date { font-size: 13px; font-weight: 700; opacity: 0.8; }
  .ob-logout {
    padding: 5px 12px; border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.3);
    background: transparent; color: rgba(255,255,255,0.85);
    font-size: 12px; cursor: pointer;
    font-family: 'Noto Sans KR', sans-serif;
    white-space: nowrap; transition: background 0.15s;
  }
  .ob-logout:hover { background: rgba(255,255,255,0.12); }
  .ob-slots {
    display: flex; gap: 5px; flex-wrap: nowrap;
    overflow-x: auto; padding-bottom: 2px;
    scrollbar-width: none; -webkit-overflow-scrolling: touch;
  }
  .ob-slots::-webkit-scrollbar { display: none; }
  .ob-slot {
    flex-shrink: 0; min-width: 50px; height: 52px;
    border-radius: 10px; border: none;
    font-size: 13px; font-weight: 700; cursor: pointer;
    user-select: none; -webkit-tap-highlight-color: transparent;
    transition: transform 0.1s cubic-bezier(0.34,1.56,0.64,1),
                background 0.12s, box-shadow 0.12s;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 2px; line-height: 1;
    font-family: 'Noto Sans KR', sans-serif;
  }
  .ob-slot.open {
    background: #4CAF82; color: #fff;
    box-shadow: 0 3px 10px rgba(76,175,130,0.5);
  }
  .ob-slot.booked {
    background: #D95C5C; color: #fff;
    box-shadow: 0 3px 10px rgba(217,92,92,0.45);
  }
  .ob-slot:active { transform: scale(0.9); }
  .ob-slot-sub { font-size: 9px; opacity: 0.9; font-weight: 600; }

  /* 바 활성 시 sticky 요소 밀어내기 */
  body.owner-bar-active .nav { top: var(--ob-h, 114px) !important; }
  body.owner-bar-active .filters { top: calc(var(--ob-h, 114px) + 64px) !important; }
  body.owner-bar-active .search-filter-bar { top: calc(var(--ob-h, 114px) + 64px) !important; }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── 로그인 모달 주입 ── */
  document.body.insertAdjacentHTML('beforeend', `
  <div class="om-backdrop" id="omBackdrop" onclick="if(event.target===this)closeOwnerModal()">
    <div class="om-sheet">
      <button class="om-close" onclick="closeOwnerModal()">✕</button>
      <p class="om-title">사장님 로그인</p>
      <p class="om-sub">헤어이어 파트너 전용 관리 화면</p>
      <div class="om-field">
        <label>아이디</label>
        <input type="text" id="omId" placeholder="admin" autocomplete="username" />
      </div>
      <div class="om-field">
        <label>비밀번호</label>
        <input type="password" id="omPw" placeholder="••••••••" autocomplete="current-password"
          onkeydown="if(event.key==='Enter')ownerLogin()" />
      </div>
      <p class="om-err" id="omErr">아이디 또는 비밀번호가 틀렸습니다.</p>
      <button class="om-submit" onclick="ownerLogin()">로그인</button>
    </div>
  </div>`);

  /* ── 관리 바 주입 ── */
  document.body.insertAdjacentHTML('afterbegin', `
  <div class="owner-bar" id="ownerBar" style="display:none;">
    <div class="ob-row1">
      <div class="ob-left">
        <span class="ob-badge">관리자</span>
        <select class="ob-salon-select" id="obSalonSelect" onchange="ownerSelectSalon(this.value)">
          ${SALONS.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="ob-right">
        <span class="ob-date" id="obDate"></span>
        <button class="ob-logout" onclick="ownerLogout()">로그아웃</button>
      </div>
    </div>
    <div class="ob-slots" id="obSlotsRow"></div>
  </div>`);

  /* ── 슬롯 버튼 렌더 ── */
  function renderSlotBtns() {
    const row = document.getElementById('obSlotsRow');
    if (!row) return;
    row.innerHTML = HOURS.map(h => {
      const st = getSlotSt(activeSalonId, h);
      return `<button class="ob-slot ${st}"
        onclick="ownerToggle(${h})"
        aria-label="${h}시 ${st==='open'?'예약가능':'마감'}">
        ${h}시<span class="ob-slot-sub">${st==='open'?'가능':'마감'}</span>
      </button>`;
    }).join('');
  }

  function applyBarHeight() {
    const bar = document.getElementById('ownerBar');
    if (!bar) return;
    requestAnimationFrame(() => {
      const h = bar.offsetHeight;
      document.documentElement.style.setProperty('--ob-h', h + 'px');
      document.body.style.paddingTop = h + 'px';
    });
  }

  function showOwnerBar() {
    const bar = document.getElementById('ownerBar');
    if (!bar) return;
    document.getElementById('obDate').textContent = todayLabel();
    bar.style.display = 'block';
    document.body.classList.add('owner-bar-active');
    renderSlotBtns();
    applyBarHeight();
  }
  function hideOwnerBar() {
    const bar = document.getElementById('ownerBar');
    if (bar) bar.style.display = 'none';
    document.body.classList.remove('owner-bar-active');
    document.body.style.paddingTop = '';
    document.documentElement.style.removeProperty('--ob-h');
  }

  /* ── 공개 함수 ── */
  window.openOwnerModal = function () {
    document.getElementById('omBackdrop').classList.add('open');
    setTimeout(() => { const el = document.getElementById('omId'); if (el) el.focus(); }, 100);
  };
  window.closeOwnerModal = function () {
    document.getElementById('omBackdrop').classList.remove('open');
    document.getElementById('omErr').classList.remove('show');
  };
  window.ownerLogin = function () {
    /* owner-bar 모달 입력칸 우선, 비어있으면 login-modal 입력칸 사용 */
    const omId = (document.getElementById('omId')?.value || '').trim();
    const omPw = (document.getElementById('omPw')?.value || '').trim();
    const lmId = (document.getElementById('lmOwnerId')?.value || '').trim();
    const lmPw = (document.getElementById('lmOwnerPw')?.value || '').trim();
    const id = omId || lmId;
    const pw = omPw || lmPw;

    if ((id === 'admin' || id === 'test') && pw === '1234') {
      localStorage.setItem('ownerLoggedIn', 'true');
      localStorage.setItem('ownerName', '테스트샵 사장님');
      window.location.href = '/for-salon.html';
    } else {
      /* 오류 표시 — 어느 모달이 열려있든 처리 */
      const lmErr = document.getElementById('lmOwnerErr');
      const omErr = document.getElementById('omErr');
      if (lmErr) { lmErr.textContent = '아이디 또는 비밀번호가 올바르지 않습니다.'; lmErr.style.display = 'block'; }
      if (omErr) { omErr.classList.add('show'); }
    }
  };
  window.ownerLogout = function () {
    ownerAuth = null;
    localStorage.removeItem(AUTH_KEY);
    hideOwnerBar();
  };
  window.ownerSelectSalon = function (salonId) {
    activeSalonId = salonId;
    renderSlotBtns();
  };
  window.ownerToggle = function (h) { toggleSlot(activeSalonId, h); };

  /* ── nav 버튼 가로채기 ── */
  function interceptNav() {
    document.querySelectorAll('.nav-salon').forEach(el => {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        ownerAuth ? showOwnerBar() : window.openOwnerModal();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      interceptNav();
      if (ownerAuth) showOwnerBar();
    });
  } else {
    interceptNav();
    if (ownerAuth) showOwnerBar();
  }
})();
