/* ═══════════════════════════════════════════
   login-modal.js — 공유 로그인 모달 컴포넌트
   모든 페이지에 <script src="login-modal.js"> 로 포함
═══════════════════════════════════════════ */
(function () {
  /* ── 스타일 주입 ── */
  const css = `
  .nav-login-btn {
    padding: 7px 16px;
    border-radius: 20px;
    border: 1.5px solid var(--rose);
    background: transparent;
    color: var(--rose);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    font-family: 'Noto Sans KR', sans-serif;
  }
  .nav-login-btn:hover,
  .nav-login-btn.logged-in {
    background: var(--rose);
    color: #fff;
  }
  /* ── 로그인 모달 ── */
  .lm-backdrop {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 2000;
    align-items: flex-end;
    justify-content: center;
  }
  .lm-backdrop.open { display: flex; }
  @media (min-width: 480px) {
    .lm-backdrop { align-items: center; }
  }
  .lm-sheet {
    background: #fff;
    width: 100%;
    max-width: 480px;
    border-radius: 20px 20px 0 0;
    padding: 28px 24px 32px;
    position: relative;
    animation: lm-slide-up 0.25s ease;
  }
  @media (min-width: 480px) {
    .lm-sheet { border-radius: 20px; max-height: 90vh; overflow-y: auto; }
  }
  @keyframes lm-slide-up {
    from { transform: translateY(30px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .lm-handle {
    width: 40px; height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin: 0 auto 20px;
  }
  @media (min-width: 480px) { .lm-handle { display: none; } }
  .lm-close {
    position: absolute; top: 16px; right: 16px;
    width: 32px; height: 32px;
    border: none; background: var(--border);
    border-radius: 50%; font-size: 15px;
    cursor: pointer; display: flex;
    align-items: center; justify-content: center;
  }
  .lm-title {
    font-family: 'Noto Serif KR', serif;
    font-size: 20px; font-weight: 600;
    color: var(--dark); margin-bottom: 4px;
  }
  .lm-sub {
    font-size: 13px; color: var(--sub);
    margin-bottom: 24px;
  }
  /* 소셜 버튼 */
  .lm-social { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
  .lm-kakao-btn {
    width: 100%; padding: 14px;
    border-radius: 12px; border: none;
    background: #FEE500; color: #3C1E1E;
    font-size: 15px; font-weight: 700;
    cursor: pointer; display: flex;
    align-items: center; justify-content: center; gap: 8px;
    font-family: 'Noto Sans KR', sans-serif;
    transition: filter 0.15s;
  }
  .lm-kakao-btn:hover { filter: brightness(0.95); }
  .lm-naver-btn {
    width: 100%; padding: 14px;
    border-radius: 12px; border: none;
    background: #03C75A; color: #fff;
    font-size: 15px; font-weight: 700;
    cursor: pointer; display: flex;
    align-items: center; justify-content: center; gap: 8px;
    font-family: 'Noto Sans KR', sans-serif;
    transition: filter 0.15s;
  }
  .lm-naver-btn:hover { filter: brightness(0.92); }
  /* 구분선 */
  .lm-divider {
    display: flex; align-items: center; gap: 12px;
    color: var(--sub); font-size: 12px;
    margin-bottom: 20px;
  }
  .lm-divider::before, .lm-divider::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }
  /* 전화번호 입력 */
  .lm-input-wrap { margin-bottom: 12px; }
  .lm-input-row { display: flex; gap: 8px; }
  .lm-input {
    flex: 1; padding: 13px 14px;
    border: 1.5px solid var(--border); border-radius: 12px;
    font-size: 15px; color: var(--dark); outline: none;
    font-family: 'Noto Sans KR', sans-serif;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  .lm-input:focus { border-color: var(--rose); }
  .lm-send-btn {
    padding: 13px 16px;
    border-radius: 12px; border: none;
    background: var(--rose); color: #fff;
    font-size: 14px; font-weight: 700;
    cursor: pointer; white-space: nowrap;
    font-family: 'Noto Sans KR', sans-serif;
    transition: background 0.15s;
  }
  .lm-send-btn:hover { background: var(--rose-dark); }
  .lm-send-btn:disabled { background: var(--border); color: var(--sub); cursor: not-allowed; }
  .lm-otp-wrap { display: none; margin-top: 10px; }
  .lm-otp-wrap.show { display: block; }
  .lm-hint { font-size: 12px; color: var(--sub); margin-top: 6px; }
  .lm-confirm-btn {
    width: 100%; padding: 15px;
    border-radius: 12px; border: none;
    background: var(--rose); color: #fff;
    font-size: 15px; font-weight: 700;
    cursor: pointer; margin-top: 12px;
    font-family: 'Noto Sans KR', sans-serif;
    transition: background 0.15s;
  }
  .lm-confirm-btn:hover { background: var(--rose-dark); }
  .lm-terms {
    font-size: 11px; color: var(--sub);
    text-align: center; margin-top: 16px; line-height: 1.6;
  }
  .lm-terms a { color: var(--rose); text-decoration: none; }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── 모달 HTML 주입 ── */
  const html = `
  <div class="lm-backdrop" id="lmBackdrop" onclick="handleLmBackdrop(event)">
    <div class="lm-sheet">
      <div class="lm-handle"></div>
      <button class="lm-close" onclick="closeLoginModal()">✕</button>

      <div id="lmLoginView">
        <p class="lm-title">로그인 / 회원가입</p>
        <p class="lm-sub">헤어이어에 오신 걸 환영해요 💇</p>

        <div class="lm-social">
          <button class="lm-kakao-btn" onclick="socialLogin('kakao')">
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.744 1.607 5.15 4 6.594V21l3.5-2.188C10.29 18.928 11.137 19 12 19c5.523 0 10-3.477 10-8S17.523 3 12 3z" fill="#3C1E1E"/></svg>
            카카오로 시작하기
          </button>
          <button class="lm-naver-btn" onclick="socialLogin('naver')">
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M16 13.23L8.3 3H3v18h5V7.77L15.7 21H21V3h-5z" fill="#fff"/></svg>
            네이버로 시작하기
          </button>
        </div>

        <div class="lm-divider">또는 전화번호로</div>

        <div class="lm-input-wrap">
          <div class="lm-input-row">
            <input class="lm-input" type="tel" id="lmPhone" placeholder="010-0000-0000" maxlength="13"
              oninput="formatLmPhone(this)" />
            <button class="lm-send-btn" id="lmSendBtn" onclick="sendOtp()">인증번호 발송</button>
          </div>
          <div class="lm-otp-wrap" id="lmOtpWrap">
            <input class="lm-input" type="text" id="lmOtp" placeholder="인증번호 6자리"
              maxlength="6" style="width:100%;margin-top:4px" />
            <p class="lm-hint" id="lmOtpHint">📱 입력하신 번호로 인증번호를 발송했어요. (데모 — 실제 발송 없음)</p>
            <button class="lm-confirm-btn" onclick="confirmOtp()">로그인 완료</button>
          </div>
        </div>

        <p class="lm-terms">
          로그인 시 <a href="#">이용약관</a> 및 <a href="#">개인정보처리방침</a>에 동의하게 됩니다.
        </p>
      </div>

      <div id="lmLoggedView" style="display:none;text-align:center;padding:16px 0;">
        <div style="font-size:48px;margin-bottom:12px;">👤</div>
        <p style="font-size:16px;font-weight:700;color:var(--dark);margin-bottom:6px;" id="lmUserName">사용자</p>
        <p style="font-size:13px;color:var(--sub);margin-bottom:24px;" id="lmUserPhone"></p>
        <button onclick="logout()" style="padding:12px 32px;border-radius:12px;border:1.5px solid var(--border);background:#fff;color:var(--dark);font-size:14px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">로그아웃</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  /* ── 로그인 버튼 nav에 삽입 ── */
  function injectLoginBtn() {
    const hamburger = document.getElementById('hamburger');
    const navInner = document.querySelector('.nav-inner');
    const target = hamburger || navInner;
    if (!target) return;

    const btn = document.createElement('button');
    btn.className = 'nav-login-btn';
    btn.id = 'navLoginBtn';
    btn.onclick = openLoginModal;
    updateBtnLabel(btn);

    if (hamburger) {
      hamburger.parentNode.insertBefore(btn, hamburger);
    } else {
      navInner.appendChild(btn);
    }
  }

  /* ── 상태 ── */
  let user = null;
  try { user = JSON.parse(localStorage.getItem('haireo_user')); } catch(e) {}

  function updateBtnLabel(btn) {
    btn = btn || document.getElementById('navLoginBtn');
    if (!btn) return;
    if (user) {
      btn.textContent = user.name || '내 계정';
      btn.classList.add('logged-in');
    } else {
      btn.textContent = '로그인';
      btn.classList.remove('logged-in');
    }
  }

  /* ── 공개 함수 ── */
  window.openLoginModal = function () {
    const backdrop = document.getElementById('lmBackdrop');
    if (!backdrop) return;
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (user) {
      document.getElementById('lmLoginView').style.display = 'none';
      document.getElementById('lmLoggedView').style.display = 'block';
      document.getElementById('lmUserName').textContent = user.name || '사용자';
      document.getElementById('lmUserPhone').textContent = user.phone || '';
    } else {
      document.getElementById('lmLoginView').style.display = 'block';
      document.getElementById('lmLoggedView').style.display = 'none';
    }
  };

  window.closeLoginModal = function () {
    document.getElementById('lmBackdrop').classList.remove('open');
    document.body.style.overflow = '';
  };

  window.handleLmBackdrop = function (e) {
    if (e.target === document.getElementById('lmBackdrop')) window.closeLoginModal();
  };

  window.formatLmPhone = function (el) {
    let v = el.value.replace(/\D/g,'');
    if (v.length > 3 && v.length <= 7) v = v.slice(0,3)+'-'+v.slice(3);
    else if (v.length > 7) v = v.slice(0,3)+'-'+v.slice(3,7)+'-'+v.slice(7,11);
    el.value = v;
  };

  window.sendOtp = function () {
    const phone = document.getElementById('lmPhone').value.trim();
    if (phone.replace(/\D/g,'').length < 10) {
      alert('올바른 전화번호를 입력해주세요.'); return;
    }
    const btn = document.getElementById('lmSendBtn');
    btn.disabled = true; btn.textContent = '발송 완료';
    document.getElementById('lmOtpWrap').classList.add('show');
    setTimeout(() => document.getElementById('lmOtp').focus(), 200);
  };

  window.confirmOtp = function () {
    const otp = document.getElementById('lmOtp').value.trim();
    if (otp.length < 4) { alert('인증번호를 입력해주세요.'); return; }
    const phone = document.getElementById('lmPhone').value.trim();
    user = { phone, name: phone.slice(-4) + '님' };
    localStorage.setItem('haireo_user', JSON.stringify(user));
    window.closeLoginModal();
    updateBtnLabel();
  };

  window.socialLogin = function (provider) {
    const name = provider === 'kakao' ? '카카오 사용자' : '네이버 사용자';
    user = { name, provider };
    localStorage.setItem('haireo_user', JSON.stringify(user));
    window.closeLoginModal();
    updateBtnLabel();
  };

  window.logout = function () {
    user = null;
    localStorage.removeItem('haireo_user');
    window.closeLoginModal();
    updateBtnLabel();
  };

  /* ── DOM 준비 후 버튼 삽입 ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLoginBtn);
  } else {
    injectLoginBtn();
  }
})();
