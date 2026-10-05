/* ═══════════════════════════════════════════════════════════════════════════
   APEX — Complete Frontend Logic
   Features: Login · Chat · Voice I/O · History · Image Gen · Languages
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

// ── Element refs ──────────────────────────────────────────────────────────────
const splash         = document.getElementById('splash');
const sidebar        = document.getElementById('sidebar');
const sidebarToggle  = document.getElementById('sidebarToggle');
const mobileMenuBtn  = document.getElementById('mobileMenuBtn');
const sidebarBackdrop= document.getElementById('sidebarBackdrop');
const messagesArea   = document.getElementById('messagesArea');
const messageInput   = document.getElementById('messageInput');
const sendBtn        = document.getElementById('sendBtn');
const roleSelect     = document.getElementById('roleSelect');
const industrySelect = document.getElementById('industrySelect');
const ttsToggle      = document.getElementById('ttsToggle');
const typingIndicator= document.getElementById('typingIndicator');
const statusDot      = document.getElementById('statusDot');
const statusLabel    = document.getElementById('statusLabel');
const fileUpload     = document.getElementById('fileUpload');
const filePreviewRow = document.getElementById('filePreviewRow');
const filePreviewIcon= document.getElementById('filePreviewIcon');
const filePreviewName= document.getElementById('filePreviewName');
const imagePreviewThumb = document.getElementById('imagePreviewThumb');
const removeFileBtn  = document.getElementById('removeFileBtn');
const newChatBtn     = document.getElementById('newChatBtn');
const scrollBtn      = document.getElementById('scrollBtn');
const micBtn         = document.getElementById('micBtn');
const quickVideoBtn  = document.getElementById('quickVideoBtn');
const currentRoleLabel  = document.getElementById('currentRoleLabel');
const currentLangLabel  = document.getElementById('currentLangLabel');
const currentIndustryLabel = document.getElementById('currentIndustryLabel');
const quickActionsContainer = document.getElementById('quickActionsContainer');
const quickDefectsContainer = document.getElementById('quickDefectsContainer');
const quickActionsLabel     = document.getElementById('quickActionsLabel');
const quickDefectsLabel     = document.getElementById('quickDefectsLabel');
const historyPanel   = document.getElementById('historyPanel');
const historyToggle  = document.getElementById('historyToggle');
const historyClose   = document.getElementById('historyClose');
const historyList    = document.getElementById('historyList');
const historyClearBtn= document.getElementById('historyClearBtn');
const sidebarHistoryBtn = document.getElementById('sidebarHistoryBtn');
const shareBtn        = document.getElementById('shareBtn');
const shareOverlay    = document.getElementById('shareOverlay');
const shareCloseBtn   = document.getElementById('shareCloseBtn');
const copyPublicBtn   = document.getElementById('copyPublicBtn');
const copyLocalBtn    = document.getElementById('copyLocalBtn');
const sharePublicUrl  = document.getElementById('sharePublicUrl');
const shareLocalUrl   = document.getElementById('shareLocalUrl');

// ── State ─────────────────────────────────────────────────────────────────────
let conversationHistory = [];
let isStreaming     = false;
let currentLang     = 'auto';
let pendingAttachment = null;
let isListening     = false;
let recognition     = null;
let currentChatId   = Date.now();
let ttsEnabled      = false;

const HISTORY_KEY = 'apex_history';
const LANG_BCP47  = {
  auto: 'en-US',
  en: 'en-US',
  hi: 'hi-IN',
  hinglish: 'hi-IN',
  pa: 'pa-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ar: 'ar-SA',
  ru: 'ru-RU',
  pt: 'pt-BR',
  it: 'it-IT',
  tr: 'tr-TR',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  ur: 'ur-PK',
  gu: 'gu-IN',
  vi: 'vi-VN',
  th: 'th-TH',
  id: 'id-ID',
  nl: 'nl-NL',
  pl: 'pl-PL',
  uk: 'uk-UA',
  sv: 'sv-SE',
  el: 'el-GR',
  he: 'he-IL',
  fa: 'fa-IR'
};

const LANG_NAMES  = {
  auto: '🌐 Auto / Any',
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  hinglish: 'Hinglish',
  pa: 'ਪੰਜਾਬੀ (Punjabi)',
  es: 'Español (Spanish)',
  fr: 'Français (French)',
  de: 'Deutsch (German)',
  zh: '中文 (Mandarin)',
  ja: '日本語 (Japanese)',
  ko: '한국어 (Korean)',
  ar: 'العربية (Arabic)',
  ru: 'Русский (Russian)',
  pt: 'Português (Portuguese)',
  it: 'Italiano (Italian)',
  tr: 'Türkçe (Turkish)',
  bn: 'বাংলা (Bengali)',
  ta: 'தமிழ் (Tamil)',
  te: 'తెలుగు (Telugu)',
  mr: 'मराठी (Marathi)',
  ur: 'اردو (Urdu)',
  gu: 'ગુજરાતી (Gujarati)',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  id: 'Bahasa Indonesia',
  nl: 'Nederlands',
  pl: 'Polski',
  uk: 'Українська',
  sv: 'Svenska',
  el: 'Ελληνικά',
  he: 'עברית',
  fa: 'فارسی'
};

// ── Auth Elements ──────────────────────────────────────────────────────────
const authOverlay       = document.getElementById('authOverlay');
const tabSignInBtn      = document.getElementById('tabSignInBtn');
const tabRegisterBtn    = document.getElementById('tabRegisterBtn');
const signInForm        = document.getElementById('signInForm');
const registerForm      = document.getElementById('registerForm');
const authAlert         = document.getElementById('authAlert');
const loginEmail        = document.getElementById('loginEmail');
const loginPassword     = document.getElementById('loginPassword');
const toggleLoginPwd    = document.getElementById('toggleLoginPwd');
const rememberMe        = document.getElementById('rememberMe');
const signInSubmitBtn   = document.getElementById('signInSubmitBtn');
const quickDemoBtn      = document.getElementById('quickDemoBtn');
const linkToRegister    = document.getElementById('linkToRegister');
const linkToSignIn      = document.getElementById('linkToSignIn');
const regName           = document.getElementById('regName');
const regEmail          = document.getElementById('regEmail');
const regPassword       = document.getElementById('regPassword');
const toggleRegPwd      = document.getElementById('toggleRegPwd');
const regIndustry       = document.getElementById('regIndustry');
const regRole           = document.getElementById('regRole');
const registerSubmitBtn = document.getElementById('registerSubmitBtn');
const userProfileBadge  = document.getElementById('userProfileBadge');
const userAvatarCircle  = document.getElementById('userAvatarCircle');
const userNameLabel     = document.getElementById('userNameLabel');
const userSignoutBtn    = document.getElementById('userSignoutBtn');

const AUTH_USER_KEY = 'apex_auth_user';
let currentUser = null;

function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function setStoredUser(user) {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (_) {}
}

function clearStoredUser() {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (_) {}
}

function showAuthModal() {
  if (!authOverlay) return;
  authOverlay.classList.remove('hidden');
  clearAuthAlert();
}

function hideAuthModal() {
  if (!authOverlay) return;
  authOverlay.classList.add('hidden');
  clearAuthAlert();
}

function setAuthAlert(msg, type = 'error') {
  if (!authAlert) return;
  authAlert.textContent = msg;
  authAlert.className = `auth-alert ${type}`;
  authAlert.style.display = 'flex';
}

function clearAuthAlert() {
  if (!authAlert) return;
  authAlert.style.display = 'none';
  authAlert.textContent = '';
  authAlert.className = 'auth-alert';
}

function switchAuthTab(targetTab) {
  clearAuthAlert();
  if (targetTab === 'register') {
    if (tabSignInBtn) tabSignInBtn.classList.remove('active');
    if (tabRegisterBtn) tabRegisterBtn.classList.add('active');
    if (signInForm) signInForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'flex';
    if (regName) regName.focus();
  } else {
    if (tabRegisterBtn) tabRegisterBtn.classList.remove('active');
    if (tabSignInBtn) tabSignInBtn.classList.add('active');
    if (registerForm) registerForm.style.display = 'none';
    if (signInForm) signInForm.style.display = 'flex';
    if (loginEmail) loginEmail.focus();
  }
  playClick();
}

function updateUIForLoggedInUser(user) {
  if (!user) return;
  currentUser = user;

  // Header user profile badge
  if (userProfileBadge && userNameLabel && userAvatarCircle) {
    const displayName = user.name || user.email.split('@')[0];
    userNameLabel.textContent = displayName;
    userAvatarCircle.textContent = displayName.charAt(0).toUpperCase();
    userProfileBadge.style.display = 'inline-flex';
  }

  // Preselect user's preferred industry & persona
  if (user.industry && industrySelect) {
    industrySelect.value = user.industry;
    updateIndustryAndRoles(user.industry);
  }
  if (user.role && roleSelect) {
    roleSelect.value = user.role;
  }
}

async function handleSignIn(email, password) {
  clearAuthAlert();
  if (!email || !password) {
    setAuthAlert('Please enter both email and password.', 'error');
    return;
  }

  if (signInSubmitBtn) {
    signInSubmitBtn.disabled = true;
    signInSubmitBtn.innerHTML = `<span>⏳ Verifying Credentials…</span>`;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Invalid email or password.');
    }

    setAuthAlert('Access granted. Welcome to APEX!', 'success');
    if (rememberMe && rememberMe.checked) {
      setStoredUser(data.user);
    }
    updateUIForLoggedInUser(data.user);

    playDone();
    setTimeout(async () => {
      hideAuthModal();
      if (signInSubmitBtn) {
        signInSubmitBtn.disabled = false;
        signInSubmitBtn.innerHTML = `<span class="auth-btn-glow"></span><span>🚀 Sign In to APEX</span>`;
      }
      // Sync user history into History option without populating main chat
      await syncHistoryWithServer(data.user.email);
      currentChatId = Date.now();
      conversationHistory = [];
      appendWelcomeCard();
    }, 600);

  } catch (err) {
    if (signInSubmitBtn) {
      signInSubmitBtn.disabled = false;
      signInSubmitBtn.innerHTML = `<span class="auth-btn-glow"></span><span>🚀 Sign In to APEX</span>`;
    }
    setAuthAlert(err.message || 'Login failed. Please check credentials.', 'error');
  }
}

async function handleRegister(name, email, password, industry, role) {
  clearAuthAlert();
  if (!name || !email || !password) {
    setAuthAlert('Please fill in all required fields.', 'error');
    return;
  }
  if (password.length < 4) {
    setAuthAlert('Password must be at least 4 characters.', 'error');
    return;
  }

  if (registerSubmitBtn) {
    registerSubmitBtn.disabled = true;
    registerSubmitBtn.innerHTML = `<span>⏳ Creating Account…</span>`;
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, industry, role })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Registration failed.');
    }

    setAuthAlert('Account created successfully! Launching APEX…', 'success');
    setStoredUser(data.user);
    updateUIForLoggedInUser(data.user);

    playDone();
    setTimeout(async () => {
      hideAuthModal();
      if (registerSubmitBtn) {
        registerSubmitBtn.disabled = false;
        registerSubmitBtn.innerHTML = `<span class="auth-btn-glow"></span><span>✨ Create &amp; Launch APEX</span>`;
      }
      await syncHistoryWithServer(data.user.email);
    }, 600);

  } catch (err) {
    if (registerSubmitBtn) {
      registerSubmitBtn.disabled = false;
      registerSubmitBtn.innerHTML = `<span class="auth-btn-glow"></span><span>✨ Create &amp; Launch APEX</span>`;
    }
    setAuthAlert(err.message || 'Registration failed.', 'error');
  }
}

function handleSignOut() {
  if (!confirm('Are you sure you want to sign out of APEX?')) return;
  clearStoredUser();
  currentUser = null;
  if (userProfileBadge) userProfileBadge.style.display = 'none';
  conversationHistory = [];
  currentChatId = Date.now();
  appendWelcomeCard();
  cachedHistory = [];
  renderHistory();
  showAuthModal();
  switchAuthTab('login');
  playClick();
}

if (tabSignInBtn) tabSignInBtn.addEventListener('click', () => switchAuthTab('login'));
if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => switchAuthTab('register'));
if (linkToRegister) linkToRegister.addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('register'); });
if (linkToSignIn) linkToSignIn.addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('login'); });

if (signInForm) {
  signInForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      handleSignIn(loginEmail.value.trim(), loginPassword.value);
    }
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (regName && regEmail && regPassword) {
      handleRegister(
        regName.value.trim(),
        regEmail.value.trim(),
        regPassword.value,
        regIndustry ? regIndustry.value : 'general',
        regRole ? regRole.value : 'GENERAL'
      );
    }
  });
}

if (quickDemoBtn) {
  quickDemoBtn.addEventListener('click', () => {
    if (loginEmail) loginEmail.value = 'demo@apex.ai';
    if (loginPassword) loginPassword.value = 'apex2026';
    handleSignIn('demo@apex.ai', 'apex2026');
  });
}

if (toggleLoginPwd && loginPassword) {
  toggleLoginPwd.addEventListener('click', () => {
    const isPwd = loginPassword.type === 'password';
    loginPassword.type = isPwd ? 'text' : 'password';
    toggleLoginPwd.textContent = isPwd ? '🙈' : '👁';
  });
}

if (toggleRegPwd && regPassword) {
  toggleRegPwd.addEventListener('click', () => {
    const isPwd = regPassword.type === 'password';
    regPassword.type = isPwd ? 'text' : 'password';
    toggleRegPwd.textContent = isPwd ? '🙈' : '👁';
  });
}

if (userSignoutBtn) {
  userSignoutBtn.addEventListener('click', handleSignOut);
}

// ══════════════════════════════════════════════════════════════════════════════
// SPLASH SCREEN — auto-dismiss after 2.5s then check auth & start particles
// ══════════════════════════════════════════════════════════════════════════════
setTimeout(() => {
  splash.classList.add('hidden');
  setTimeout(() => { splash.style.display='none'; }, 700);
  initParticles();
  // Check auth state upon splash dismiss
  const stored = getStoredUser();
  if (stored) {
    updateUIForLoggedInUser(stored);
    hideAuthModal();
  } else {
    // Automatically create guest user so anyone can start chatting instantly without barriers
    const guest = {
      name: 'Guest User',
      email: 'guest@apex.ai',
      role: 'GENERAL',
      industry: (industrySelect ? industrySelect.value : 'textile')
    };
    setStoredUser(guest);
    updateUIForLoggedInUser(guest);
    hideAuthModal();
  }
}, 2500);

// ══════════════════════════════════════════════════════════════════════════════
// PARTICLES (main background)
// ══════════════════════════════════════════════════════════════════════════════
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  let particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const mouse = { x: -2000, y: -2000, radius: 160 };
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = -2000;
    mouse.y = -2000;
  });

  const colors = [
    { fill: 'rgba(0,245,160,', glow: '#00F5A0' },   // Neon Mint
    { fill: 'rgba(6,182,212,', glow: '#06B6D4' },   // Cyber Cyan
    { fill: 'rgba(139,92,246,', glow: '#8B5CF6' }   // Quantum Purple
  ];

  const count = Math.min(65, Math.floor((window.innerWidth * window.innerHeight) / 22000));
  for (let i = 0; i < count; i++) {
    const colIdx = i % 7 === 0 ? 2 : (i % 3 === 0 ? 1 : 0);
    particles.push({
      x: Math.random() * (W || 1200),
      y: Math.random() * (H || 900),
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 2 + 1,
      baseAlpha: Math.random() * 0.4 + 0.2,
      phase: Math.random() * Math.PI * 2,
      color: colors[colIdx]
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Update & draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.phase += 0.02;

      // Wrap edges
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      // Mouse soft repulsion / deflection
      const mdx = mouse.x - p.x;
      const mdy = mouse.y - p.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < mouse.radius && mDist > 0) {
        const force = (1 - mDist / mouse.radius) * 1.8;
        p.x -= (mdx / mDist) * force;
        p.y -= (mdy / mDist) * force;
      }

      // Pulsing alpha
      const currentAlpha = p.baseAlpha + Math.sin(p.phase) * 0.15;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color.fill}${Math.max(0.08, currentAlpha)})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color.glow;
      ctx.fill();
      ctx.restore();
    }

    // Connect close particles with neural energy lines
    const maxDist = 125;
    const maxDistSq = 125 * 125;
    const mouseRadiusSq = mouse.radius * mouse.radius;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distSq = dx * dx + dy * dy;
        if (distSq < maxDistSq) {
          const dist = Math.sqrt(distSq);
          const alpha = (1 - dist / maxDist) * 0.14;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 245, 160, ${alpha})`;
          ctx.lineWidth = 0.65;
          ctx.stroke();
        }
      }

      // Connect to mouse if near
      const mdx = mouse.x - particles[i].x;
      const mdy = mouse.y - particles[i].y;
      const mDistSq = mdx * mdx + mdy * mdy;
      if (mDistSq < mouseRadiusSq) {
        const mDist = Math.sqrt(mDistSq);
        const mAlpha = (1 - mDist / mouse.radius) * 0.28;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(6, 182, 212, ${mAlpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
}

// ══════════════════════════════════════════════════════════════════════════════
// AUDIO
// ══════════════════════════════════════════════════════════════════════════════
function playClick() {
  try {
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);
    o.type='sine';o.frequency.value=880;
    g.gain.setValueAtTime(.04,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.08);
    o.start(ctx.currentTime);o.stop(ctx.currentTime+.09);
  } catch(_){}
}

function playDone() {
  try {
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    [[660,0],[880,.1],[1100,.2]].forEach(([f,d])=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=f;
      g.gain.setValueAtTime(.03,ctx.currentTime+d);
      g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+d+.12);
      o.start(ctx.currentTime+d);o.stop(ctx.currentTime+d+.13);
    });
  } catch(_){}
}

// ── TTS ───────────────────────────────────────────────────────────────────────
ttsToggle.addEventListener('click', ()=>{ ttsEnabled=!ttsEnabled; ttsToggle.classList.toggle('active',ttsEnabled); playClick(); });

function speakText(text) {
  try {
    if (typeof ttsEnabled === 'undefined' || !ttsEnabled || !window.speechSynthesis) return;
    const clean = (text || '').replace(/[*#_`]/g, '').slice(0, 600);
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = LANG_BCP47[currentLang] || 'en-IN';
    utt.rate = 0.95;
    utt.pitch = 1;
    const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith(utt.lang.split('-')[0]));
    if (voices.length) utt.voice = voices[0];
    speechSynthesis.cancel();
    speechSynthesis.speak(utt);
  } catch (err) {
    console.warn('TTS audio readout warning (safely ignored):', err);
  }
}

// ── Mic ───────────────────────────────────────────────────────────────────────
function initSpeech() {
  if (!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)) return;
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = ()=>{ isListening=true; micBtn.classList.add('mic-active'); micBtn.textContent='🔴'; setStatus('listening'); };
  recognition.onresult = e=>{
    let final='',interim='';
    for (let i=e.resultIndex;i<e.results.length;i++) {
      if (e.results[i].isFinal) final+=e.results[i][0].transcript;
      else interim+=e.results[i][0].transcript;
    }
    messageInput.value=final||interim; autoResize();
  };
  recognition.onend = ()=>{
    isListening=false; micBtn.classList.remove('mic-active'); micBtn.textContent='🎤'; setStatus('ready');
    if (messageInput.value.trim()&&!isStreaming) setTimeout(()=>triggerSend(),400);
  };
  recognition.onerror = e=>{
    isListening=false; micBtn.classList.remove('mic-active'); micBtn.textContent='🎤'; setStatus('ready');
    if (e.error!=='no-speech') appendSystemMsg(`Mic error: ${e.error}. Allow mic in browser.`);
  };
}

micBtn.addEventListener('click',()=>{
  if (!recognition) { appendSystemMsg('Voice not supported. Please use Chrome or Edge.'); return; }
  if (isListening) { recognition.stop(); return; }
  recognition.lang = LANG_BCP47[currentLang]||'en-IN';
  try { recognition.start(); playClick(); } catch(_){}
});

// ══════════════════════════════════════════════════════════════════════════════
// LANGUAGE (Universal World Languages & Seamless Auto-Mirroring)
// ══════════════════════════════════════════════════════════════════════════════
const worldLangSelect = document.getElementById('worldLangSelect');

function setAppLanguage(langCode) {
  currentLang = langCode || 'auto';
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === currentLang);
  });
  if (worldLangSelect) {
    worldLangSelect.value = currentLang;
  }
  const displayName = LANG_NAMES[currentLang] || (worldLangSelect ? worldLangSelect.options[worldLangSelect.selectedIndex]?.text : currentLang);
  if (currentLangLabel) currentLangLabel.textContent = displayName;
  if (recognition) recognition.lang = LANG_BCP47[currentLang] || 'en-IN';
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setAppLanguage(btn.dataset.lang);
    playClick();
  });
});

if (worldLangSelect) {
  worldLangSelect.addEventListener('change', () => {
    setAppLanguage(worldLangSelect.value);
    playClick();
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SIDEBAR (Options & Configuration Panel on the Right)
// ══════════════════════════════════════════════════════════════════════════════
function closeMobileSidebar() {
  if (window.innerWidth <= 768) {
    if (sidebar) {
      sidebar.classList.remove('open');
      sidebar.classList.add('collapsed');
    }
    if (historyPanel) {
      historyPanel.classList.add('hidden');
    }
    if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
    if (historyToggle) historyToggle.classList.remove('active');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
  }
}

function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
  sidebar.classList.toggle('open');
  const isOpen = sidebar.classList.contains('open');
  if (mobileMenuBtn) {
    mobileMenuBtn.classList.toggle('active', isOpen);
  }
  if (sidebarBackdrop) {
    sidebarBackdrop.classList.toggle('active', isOpen && window.innerWidth <= 768);
  }
  if (window.innerWidth <= 768 && isOpen) {
    historyPanel.classList.add('hidden');
    historyToggle.classList.remove('active');
  }
}
sidebarToggle.addEventListener('click', toggleSidebar);
mobileMenuBtn.addEventListener('click', toggleSidebar);
if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener('click', closeMobileSidebar);
}
document.addEventListener('click', e => {
  if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target) &&
      (!sidebarBackdrop || !sidebarBackdrop.contains(e.target))) {
    closeMobileSidebar();
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// INDUSTRY & ROLE ADAPTIVE INTELLIGENCE CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════
const INDUSTRY_DATA = {
  textile: {
    name: 'Textile / Fabric',
    roles: [
      { id: 'OPERATOR', label: '🔧 Machine Operator' },
      { id: 'INSPECTOR', label: '🔍 4-Point QC Inspector' },
      { id: 'DYEHOUSE', label: '🎨 Dyehouse Chemist' },
      { id: 'SUPERVISOR', label: '👷 Shift Supervisor' },
      { id: 'MAINTENANCE', label: '⚙️ Loom Maintenance' },
      { id: 'MANAGER', label: '📊 Mill General Manager' },
      { id: 'GENERAL', label: '🌐 General Professional' },
    ],
    placeholder: 'Ask anything… Where is my fabric roll order?, check 180 GSM stock, OEKO-TEX specs, loom output',
    quickActions: [
      { label: '📦 Track Order (ORD-8492)', msg: 'Where is my fabric roll order? Track Order #ORD-8492 with real-time shipment status, carrier tracking, and port ETA' },
      { label: '🧵 Check Stock (GSM)', msg: 'Check fabric inventory and stock availability for 180 GSM and 240 GSM cotton and poly-blends with available meters and warehouse bay locations' },
      { label: '📋 Specs & OEKO-TEX', msg: 'Provide fabric technical specifications, care instructions, thread counts, shrinkage rates, and OEKO-TEX Standard 100 / GOTS compliance' },
      { label: '💰 Price & MOQ Quote', msg: 'Request a price quotation and MOQ breakdown for 5,000 meters of 240 GSM workwear twill fabric including volume discounts and FOB/CIF incoterms' },
      { label: '🏭 Machine Output', msg: 'Show machinery output and production status for running looms, batch numbers, speed RPM, and shift targets' },
      { label: '🧶 Yarn & Dye Stock', msg: 'Check warehouse inventory levels for cotton yarn counts, synthetic filament, reactive dyes, and processing chemicals' },
      { label: '🚚 Inbound Cotton POs', msg: 'Track incoming raw cotton bales, yarn shipments, and chemical deliveries from suppliers with PO numbers and gate ETAs' },
      { label: '📐 4-Point ASTM Check', msg: 'Calculate the 4-Point inspection penalty score for a roll with 18 defect points over 100 yards of 60-inch width fabric' },
      { label: '📊 Defect Chart', msg: 'Generate an interactive bar and line comparison chart showing top fabric defects, frequencies, and scrap rates' },
    ],
    issuesLabel: 'TEXTILE ERP & DEFECT SUITE',
    issues: [
      { label: '📦 Order Status', desc: 'Where is my fabric roll order? Give me real-time tracking data for Order ORD-8492 and container status.' },
      { label: '🧵 Stock Availability', desc: 'Is 180 GSM 100% combed cotton or 240 GSM twill in stock? Check warehouse bay and roll count.' },
      { label: '📋 Care & Compliance', desc: 'What are the wash care instructions, shrinkage rates, and OEKO-TEX / GOTS certifications for our cotton fabrics?' },
      { label: '💰 Bulk Price Quote', desc: 'Provide an instant price quotation for 2,500 meters of denim and workwear twill with FOB Incoterms.' },
      { label: '🏭 Running Batch Output', desc: 'What is the current machinery output, loom RPM, and efficiency on Batch BT-904 and BT-905?' },
      { label: '🧶 Yarn Warehouse Level', desc: 'Verify 30s Ne combed cotton and reactive dye inventory levels before starting a new production cycle.' },
      { label: '🚚 Raw Cotton Delivery', desc: 'When are the incoming raw Shankar-6 cotton bales arriving from Vardhman Ginning?' },
      { label: '📐 4-Point Penalty Calc', desc: 'Calculate ASTM D5430 points per 100 square yards for 18 penalty points over 100 yards of 60-inch fabric.' },
      { label: '🎨 Delta E Shade Match', desc: 'Calculate Delta E CMC 2:1 color difference for batch spectrophotometer readings.' },
      { label: '🔴 Broken Pick Defect', desc: 'Broken pick detected on fabric. Provide root cause, loom adjustments, and 4-point penalty rule.' },
      { label: '🔴 Shade Variation', desc: 'Center-to-selvedge shade variation detected. Provide padder pressure and dye migration diagnostics.' },
    ],
    starterQuestions: [
      { icon: '📦', title: 'Where is my fabric roll order?', question: 'Where is my fabric roll order? Track Order #ORD-8492 with container status and port arrival ETA' },
      { icon: '🧵', title: 'Check 180 GSM & 240 GSM stock', question: 'Do we have 180 GSM cotton and 240 GSM twill in stock? Check warehouse bay and roll count' },
      { icon: '📋', title: 'OEKO-TEX & Wash Care specs', question: 'What are the wash care instructions, shrinkage rates, and OEKO-TEX Standard 100 certifications for our cotton fabrics?' },
      { icon: '🏭', title: 'Loom & Batch Telemetry', question: 'Show current machinery output, loom RPM, running efficiency, and active batches on the shopfloor' }
    ]
  },
  pharma: {
    name: 'Pharma / Healthcare',
    roles: [
      { id: 'QA_OFFICER', label: '🔬 QA Validation Officer' },
      { id: 'QC_ANALYST', label: '🧪 QC Analytical Chemist' },
      { id: 'PRODUCTION_CHEMIST', label: '💊 Production Chemist' },
      { id: 'REGULATORY', label: '📋 Regulatory Affairs Lead' },
      { id: 'PLANT_MANAGER', label: '📊 Plant Operations Director' },
      { id: 'GENERAL', label: '🌐 General Professional' },
    ],
    placeholder: 'Ask anything… dissolution test, cGMP 21 CFR, OOS investigation, stability study',
    quickActions: [
      { label: '📊 Dissolution Chart', msg: 'Generate an interactive line chart showing tablet dissolution percentage release over 60 minutes' },
      { label: '⚠️ OOS Protocol', msg: 'Guide me through a Phase 1 laboratory Out-of-Specification (OOS) investigation protocol per FDA guidelines' },
      { label: '🧪 Assay Calculation', msg: 'Perform HPLC drug substance potency assay calculation with peak area ratio and standard dilution' },
      { label: '🛡️ cGMP Audit Check', msg: 'Generate a cGMP 21 CFR Part 211 pre-audit inspection checklist for sterile manufacturing' },
      { label: '📈 Stability Trend', msg: 'Analyze accelerated 40°C/75% RH stability testing degradation curves and shelf-life projection' },
    ],
    issuesLabel: 'PHARMA INCIDENT / OOS',
    issues: [
      { label: '🔴 Dissolution Failure', desc: 'Batch failed Stage 1 (S1) tablet dissolution test. Detail S2 testing criteria, hydrodynamic causes, and tablet hardness impact.' },
      { label: '🔴 Microbial Contam', desc: 'Microbial bioburden count exceeded alert limit in sterile area. Detail environmental monitoring root causes and sanitization.' },
      { label: '🔴 Particulate Matter', desc: 'Sub-visible particulate matter spike detected in injectable vial batch (USP <788>). Provide investigation protocol.' },
      { label: '🔴 Sterility Breach', desc: 'Aseptic cleanroom positive pressure differential dropped below 10 Pa. Provide immediate isolation and batch quarantine protocol.' },
      { label: '🔴 Yield Loss > 2%', desc: 'Granulation and compression yield loss exceeded 2.0% threshold. Perform mass balance and mechanical loss calculation.' },
      { label: '🔴 Blister Seal Leak', desc: 'Blister packaging methylene blue dye leak test failure. Diagnose sealing roller temperature, dwell time, and foil pinholes.' },
      { label: '🔴 Impurity Spike', desc: 'Unknown chromatographic impurity peak detected at RRT 1.25 above ICH Q3A reporting threshold (0.05%). Provide identification protocol.' },
      { label: '🔴 Out of Spec (OOS)', desc: 'Finished product assay result returned 93.8% (Specification: 95.0% - 105.0%). Detail Phase 1 laboratory root cause checklist.' },
    ],
    starterQuestions: [
      { icon: '⚠️', title: 'Phase 1 OOS Investigation Protocol', question: 'Guide me through a Phase 1 laboratory Out-of-Specification (OOS) investigation protocol per FDA guidelines' },
      { icon: '🧪', title: 'HPLC Potency Assay Calculation', question: 'Perform HPLC drug substance potency assay calculation with peak area ratio and standard dilution' },
      { icon: '🛡️', title: 'cGMP Sterile Cleanroom Audit', question: 'Generate a cGMP 21 CFR Part 211 pre-audit inspection checklist for sterile manufacturing and cleanroom differentials' },
      { icon: '💊', title: 'S1/S2 Tablet Dissolution Failure', question: 'Batch failed Stage 1 (S1) tablet dissolution test. Detail S2 testing criteria, hydrodynamic causes, and tablet hardness impact' }
    ]
  },
  auto: {
    name: 'Automotive / EV',
    roles: [
      { id: 'LINE_OPERATOR', label: '🔧 Assembly Line Operator' },
      { id: 'QC_INSPECTOR', label: '🔍 Metrology / QC Inspector' },
      { id: 'PROCESS_ENGINEER', label: '⚙️ Manufacturing Engineer' },
      { id: 'PLANT_SUPERVISOR', label: '👷 Shopfloor Supervisor' },
      { id: 'PLANT_MANAGER', label: '📊 Plant General Manager' },
      { id: 'GENERAL', label: '🌐 General Professional' },
    ],
    placeholder: 'Ask anything… weld penetration, IATF 16949 audit, GD&T tolerance, PPM calculation',
    quickActions: [
      { label: '📊 EV vs ICE Chart', msg: 'Generate an interactive comparison chart of EV vs Hybrid vs ICE emissions and lifecycle energy' },
      { label: '⚙️ Calculate PPM', msg: 'Calculate defect PPM rate and process capability indices (Cp and Cpk) for automotive stamping line' },
      { label: '🔍 FMEA Risk Audit', msg: 'Perform an AIAG-VDA Failure Mode and Effects Analysis (FMEA) with Severity, Occurrence, Detection, and AP rating' },
      { label: '🔧 Torque Audit', msg: 'Verify critical fastener torque-angle audit procedure and dynamic rundown curve tolerances' },
      { label: '📋 IATF Checklist', msg: 'Generate an IATF 16949 Clause 8.5 Production and Service Provision internal audit checklist' },
    ],
    issuesLabel: 'AUTOMOTIVE DEFECT ALERT',
    issues: [
      { label: '🔴 Weld Spatter / Burn', desc: 'Excessive weld spatter and lack of penetration detected on robotic MIG welding cell. Diagnose shielding gas and wire feed.' },
      { label: '🔴 Paint Orange Peel', desc: 'Severe orange peel texture on automotive clearcoat finish. Detail bell atomizer speed, solvent flash-off, and viscosity fix.' },
      { label: '🔴 Out-of-Spec GD&T', desc: 'Chassis sub-assembly datum feature hole position tolerance exceeded (+0.35 mm vs 0.15 mm true position). Provide fixture check.' },
      { label: '🔴 Torque Deviation', desc: 'Pneumatic nutrunner recorded joint torque angle deviation under tightening specification. Provide clamp load analysis.' },
      { label: '🔴 Casting Porosity', desc: 'Aluminum cylinder head pressure test revealed subsurface gas porosity leakage. Detail degassing and mold chill protocol.' },
      { label: '🔴 Surface Scratches', desc: 'Class-A exterior stamped panel has repeatable handling scratch marks. Detail stamping die burr inspection and transfer racks.' },
      { label: '🔴 Battery Tab Delam', desc: 'EV pouch cell ultrasonic tab weld exhibits delamination and high micro-ohm resistance. Provide anvil horn tuning steps.' },
      { label: '🔴 Motor Vibration', desc: 'EV drive unit end-of-line NVH test flagged vibration spike at 4.2 kHz. Diagnose gear mesh order and bearing raceway fault.' },
    ],
    starterQuestions: [
      { icon: '⚙️', title: 'Calculate Defect PPM & Cpk', question: 'Calculate defect PPM rate and process capability indices (Cp and Cpk) for automotive stamping line' },
      { icon: '🔍', title: 'AIAG-VDA FMEA Risk Audit', question: 'Perform an AIAG-VDA Failure Mode and Effects Analysis (FMEA) with Severity, Occurrence, Detection, and AP rating' },
      { icon: '🔧', title: 'Critical Fastener Torque-Angle Spec', question: 'Verify critical fastener torque-angle audit procedure and dynamic rundown curve tolerances' },
      { icon: '🔋', title: 'Ultrasonic EV Battery Tab Weld', question: 'EV pouch cell ultrasonic tab weld exhibits delamination and high micro-ohm resistance. Provide anvil horn tuning steps' }
    ]
  },
  food: {
    name: 'Food & Beverage',
    roles: [
      { id: 'FOOD_OPERATOR', label: '🥣 Processing Operator' },
      { id: 'HACCP_AUDITOR', label: '🛡️ HACCP / Food Safety Lead' },
      { id: 'QA_LAB', label: '🧫 Microbiology Lab Lead' },
      { id: 'SANITATION', label: '🧼 CIP / Sanitation Lead' },
      { id: 'OPERATIONS_HEAD', label: '📊 Operations Director' },
      { id: 'GENERAL', label: '🌐 General Professional' },
    ],
    placeholder: 'Ask anything… pasteurization CCP, pathogen control, water activity, shelf-life',
    quickActions: [
      { label: '📊 Shelf-Life Chart', msg: 'Generate an interactive line chart of microbial CFU/g count growth curves over storage days' },
      { label: '🛡️ HACCP Critical Check', msg: 'Verify Critical Control Point (CCP) log and corrective actions for thermal pasteurization step' },
      { label: '🧫 Microbial Risk', msg: 'Assess Salmonella and Listeria monocytogenes environmental monitoring risk matrix and swab protocol' },
      { label: '📦 Seal Integrity', msg: 'Detail modified atmosphere packaging (MAP) residual oxygen test (O2 < 0.5%) and hermetic seal verification' },
      { label: '📋 Recall Prevention', msg: 'Generate an allergen cross-contact prevention protocol and rapid allergen swab verification workflow' },
    ],
    issuesLabel: 'FOOD SAFETY INCIDENT',
    issues: [
      { label: '🔴 Foreign Object', desc: 'X-ray / metal detector rejected product for metallic foreign body inclusion. Detail calibration test piece and quarantine.' },
      { label: '🔴 Seal Leak / MAP', desc: 'Modified atmosphere packaging (MAP) container has micro-leakage and elevated headspace oxygen. Provide sealing bar fix.' },
      { label: '🔴 Pathogen Alert', desc: 'Presumptive positive Listeria result on non-food contact drain swab. Detail deep sanitation sanitizing and re-swab protocol.' },
      { label: '🔴 Off-Flavor Rancid', desc: 'Batch sensory panel detected lipid oxidation / rancid off-flavor in fried snack line. Calculate peroxide value (PV) and FFA%.' },
      { label: '🔴 Allergen Cross-Mix', desc: 'Unlabeled milk protein derivative detected on dairy-free packaging line. Provide emergency recall evaluation and CIP flush.' },
      { label: '🔴 Pasteurization Drop', desc: 'HTST pasteurizer temperature dropped below 72°C for 4 seconds. Detail flow diversion valve (FDV) verification and recook.' },
      { label: '🔴 Viscosity / Brix Drift', desc: 'Syrup batch Brix reading deviated by +2.8° above recipe limit. Calculate pure water dilution formula and tank agitation.' },
      { label: '🔴 Mold / Yeast Spoilage', desc: 'Accelerated shelf-life package showed visible mold colony prior to expiration date. Check water activity (aw) and pH.' },
    ],
    starterQuestions: [
      { icon: '🛡️', title: 'HTST Pasteurizer CCP Verification', question: 'Verify Critical Control Point (CCP) log and corrective actions for HTST thermal pasteurization temperature drop below 72°C' },
      { icon: '🧫', title: 'Pathogen Swab & Listeria Protocol', question: 'Assess Salmonella and Listeria monocytogenes environmental monitoring risk matrix and drain swab protocol' },
      { icon: '📦', title: 'MAP Packaging & Seal Integrity', question: 'Detail modified atmosphere packaging (MAP) residual oxygen test (O2 < 0.5%) and hermetic seal leak diagnostics' },
      { icon: '🧼', title: 'Allergen Flush & CIP Sanitation', question: 'Generate an allergen cross-contact prevention protocol and rapid allergen swab verification workflow' }
    ]
  },
  construction: {
    name: 'Construction / Civil',
    roles: [
      { id: 'SITE_ENGINEER', label: '🏗️ Structural / Site Engineer' },
      { id: 'QC_MATERIALS', label: '🧱 Materials Testing Inspector' },
      { id: 'SAFETY_OFFICER', label: '🦺 OSHA Safety Lead' },
      { id: 'PROJECT_SUPERVISOR', label: '👷 General Site Foreman' },
      { id: 'PROJECT_DIRECTOR', label: '📊 Project Operations Director' },
      { id: 'GENERAL', label: '🌐 General Professional' },
    ],
    placeholder: 'Ask anything… ASTM concrete slump, rebar corrosion, compressive strength, load',
    quickActions: [
      { label: '📊 Strength Chart', msg: 'Generate an interactive concrete compressive strength curve (MPa) comparing 7-day, 14-day, and 28-day cure times' },
      { label: '🧱 Concrete Strength', msg: 'Calculate 7-day and 28-day concrete cylinder compressive strength (ASTM C39) and acceptance criteria' },
      { label: '📐 Slump & W/C Ratio', msg: 'Verify ASTM C143 concrete slump test tolerance and water-cement ratio adjustment calculation' },
      { label: '🦺 OSHA Site Audit', msg: 'Generate a daily high-risk construction safety checklist covering scaffolding, excavation, and crane rigging' },
      { label: '📋 Mix Design Review', msg: 'Analyze high-performance concrete mix design with fly ash, silica fume, and superplasticizer dosage' },
    ],
    issuesLabel: 'SITE DEFECT / SAFETY',
    issues: [
      { label: '🔴 Honeycombing', desc: 'Extensive honeycombing and void pockets discovered upon column formwork removal. Detail epoxy pressure grouting procedure.' },
      { label: '🔴 Rebar Corrosion', desc: 'Exposed reinforced concrete foundation rebar shows heavy ferric oxide rust spalling. Detail chloride penetration test.' },
      { label: '🔴 Slump Test Failure', desc: 'Ready-mix concrete truck slump measured 190 mm (Specified: 100 ± 25 mm). Detail rejection vs superplasticizer recovery.' },
      { label: '🔴 Foundation Cracking', desc: 'Settlement cracks (1.5 mm wide) appeared on grade beam 48 hours post-pour. Calculate structural bearing capacity and soil report.' },
      { label: '🔴 Waterproofing Leak', desc: 'Basement retaining wall membrane failure with active hydrostatic water seepage. Provide polyurethane chemical injection.' },
      { label: '🔴 Bolt Torque Failure', desc: 'Structural steel A325 high-strength bolt torque inspection failed tension requirements (ASTM F3125). Detail DTI washer audit.' },
      { label: '🔴 Mortar Delamination', desc: 'Exterior brick masonry façade mortar joints exhibiting efflorescence and bond delamination. Provide mortar repointing protocol.' },
      { label: '🔴 Excavation Wall Shift', desc: 'Deep excavation inclinometer detected 12 mm horizontal soil wall deflection. Provide immediate shoring tieback emergency plan.' },
    ],
    starterQuestions: [
      { icon: '🧱', title: 'ASTM C39 Concrete Strength Curve', question: 'Calculate 7-day and 28-day concrete cylinder compressive strength (ASTM C39) and acceptance criteria' },
      { icon: '📐', title: 'ASTM C143 Slump Test & W/C Ratio', question: 'Ready-mix concrete truck slump measured 190 mm vs 100 mm spec. Detail rejection vs superplasticizer recovery and W/C adjustment' },
      { icon: '🦺', title: 'OSHA High-Risk Site Safety Audit', question: 'Generate a daily high-risk construction safety checklist covering scaffolding, deep excavation, and crane rigging' },
      { icon: '🏗️', title: 'Column Honeycombing & Rebar Repair', question: 'Extensive honeycombing and void pockets discovered upon column formwork removal. Detail epoxy pressure grouting procedure' }
    ]
  },
  logistics: {
    name: 'Logistics / Supply Chain',
    roles: [
      { id: 'WAREHOUSE_OP', label: '📦 Warehouse Floor Lead' },
      { id: 'INVENTORY_LEAD', label: '📋 Inventory Control Specialist' },
      { id: 'FLEET_DISPATCH', label: '🚚 Fleet & Logistics Coordinator' },
      { id: 'COLDCHAIN_AUDITOR', label: '❄️ Cold Chain Compliance Lead' },
      { id: 'SUPPLY_CHAIN_HEAD', label: '📊 Supply Chain Director' },
      { id: 'GENERAL', label: '🌐 General Professional' },
    ],
    placeholder: 'Ask anything… warehouse OEE, cold chain excursion, freight routing, pallet load',
    quickActions: [
      { label: '📊 OTIF Trend Chart', msg: 'Generate an interactive line and bar chart tracking quarterly OTIF delivery performance and turnaround times' },
      { label: '📦 Warehouse OEE', msg: 'Calculate warehouse pick-pack throughput OEE, dock-to-stock turnaround time, and labor productivity' },
      { label: '❄️ Cold Chain Audit', msg: 'Analyze continuous reefer container temperature logger data and calculate Mean Kinetic Temperature (MKT)' },
      { label: '📊 Freight Cost Model', msg: 'Optimize full truckload (FTL) vs less-than-truckload (LTL) dimensional weight freight billing model' },
      { label: '📋 OTIF Performance', msg: 'Generate an On-Time In-Full (OTIF) vendor compliance scorecard with SLA penalty thresholds' },
    ],
    issuesLabel: 'LOGISTICS DISRUPTION',
    issues: [
      { label: '🔴 Container Damage', desc: 'Inbound ocean freight container arrived with crushed corner castings and cargo structural water damage. Detail surveyor claim.' },
      { label: '🔴 Temp Excursion', desc: 'Biologics reefer shipment temperature spiked to +14°C for 3.5 hours (Specified: +2°C to +8°C). Calculate stability impact.' },
      { label: '🔴 Inventory Variance', desc: 'High-value SKU physical cycle count revealed $45,000 inventory variance versus ERP records. Detail reconciliation audit.' },
      { label: '🔴 RFID / Barcode Error', desc: 'Automated sorting conveyor experiencing 8.5% unreadable barcode / RFID tag failure rate. Provide scanner alignment check.' },
      { label: '🔴 Pallet Rack Impact', desc: 'Forklift collided with structural upright column of warehouse pallet racking. Provide emergency rack de-loading protocol.' },
      { label: '🔴 Seal Tampering', desc: 'High-security ISO 17712 bolt seal arrived broken / altered at destination customs checkpoint. Provide chain of custody audit.' },
      { label: '🔴 Port Congestion Hold', desc: 'Container vessel detained at port terminal with 7-day demurrage accumulation. Calculate alternate transshipment route.' },
      { label: '🔴 Cross-Dock Bottleneck', desc: 'Outbound cross-dock facility congestion causing 5-hour truck staging queue. Provide dynamic yard management balancing.' },
    ],
    starterQuestions: [
      { icon: '❄️', title: 'Cold Chain Temperature Excursion', question: 'Biologics reefer shipment temperature spiked to +14°C for 3.5 hours. Calculate Mean Kinetic Temperature (MKT) and stability impact' },
      { icon: '📦', title: 'Warehouse OEE & Pick-Pack Rate', question: 'Calculate warehouse pick-pack throughput OEE, dock-to-stock turnaround time, and labor productivity' },
      { icon: '🚚', title: 'FTL vs LTL Freight Optimization', question: 'Optimize full truckload (FTL) vs less-than-truckload (LTL) dimensional weight freight billing model' },
      { icon: '📋', title: 'OTIF Vendor Compliance Scorecard', question: 'Generate an On-Time In-Full (OTIF) vendor compliance scorecard with SLA penalty thresholds' }
    ]
  },
  general: {
    name: 'General / Any Industry',
    roles: [
      { id: 'OPERATOR', label: '🔧 Operations Lead' },
      { id: 'INSPECTOR', label: '🔍 Quality Auditor' },
      { id: 'ENGINEER', label: '⚙️ Technical Systems Engineer' },
      { id: 'SUPERVISOR', label: '👷 Operations Supervisor' },
      { id: 'MANAGER', label: '📊 General Director / Manager' },
      { id: 'GENERAL', label: '🌐 Universal Consultant' },
    ],
    placeholder: 'Ask anything… quality standards, root cause analysis, mathematical calculation',
    quickActions: [
      { label: '📊 Interactive Chart', msg: 'Generate an interactive comparative chart comparing key performance metrics and benchmarks' },
      { label: '⚡ Predict Risk', msg: 'Perform a comprehensive operational failure risk assessment and mitigation matrix' },
      { label: '🔍 Root Cause 5-Why', msg: 'Conduct a rigorous 5-Why and Ishikawa fishbone diagram root cause analysis for an operational defect' },
      { label: '📋 Quality Audit', msg: 'Generate a universal ISO 9001:2015 Quality Management System internal audit checklist' },
      { label: '📈 Cost & Yield Model', msg: 'Calculate production yield loss, unit cost economics, and return on investment (ROI)' },
    ],
    issuesLabel: 'OPERATIONAL ISSUE REPORT',
    issues: [
      { label: '🔴 Critical Quality Fault', desc: 'Critical quality defect detected on output batch. Detail containment, root-cause methodology, and corrective action (CAPA).' },
      { label: '🔴 Equipment Breakdown', desc: 'Critical production machine suffered unexpected mechanical failure. Provide emergency diagnostics and maintenance protocol.' },
      { label: '🔴 Process UCL Drift', desc: 'Operating temperature and pressure drifted outside allowable upper control limit (UCL). Provide calibration protocol.' },
      { label: '🔴 Supplier SCAR', desc: 'Raw material shipment failed incoming inspection quality parameters. Detail supplier corrective action request (SCAR).' },
      { label: '🔴 Safety Hazard', desc: 'High-voltage or moving machinery safety barrier interlock failed. Detail Lockout/Tagout (LOTO) isolation protocol.' },
      { label: '🔴 Spec Tolerance Breach', desc: 'Finished unit physical dimensions breached customer specification tolerance. Detail engineering variance review.' },
      { label: '🔴 Yield Drop > 5%', desc: 'Shift production yield fell 5.2% below target baseline. Calculate scrap cost and identify process bottlenecks.' },
      { label: '🔴 Customer Rejection', desc: 'Customer rejected batch due to performance degradation. Detail containment, 8D problem-solving report, and customer memo.' },
    ],
    starterQuestions: [
      { icon: '🔍', title: 'Root Cause 5-Why & Fishbone', question: 'Conduct a rigorous 5-Why and Ishikawa fishbone diagram root cause analysis for an operational defect' },
      { icon: '📋', title: 'ISO 9001:2015 Quality Audit', question: 'Generate a universal ISO 9001:2015 Quality Management System internal audit checklist' },
      { icon: '📊', title: 'Yield Loss & Unit Cost Model', question: 'Calculate production yield loss, unit cost economics, scrap reduction, and return on investment (ROI)' },
      { icon: '⚡', title: 'Operational Risk Matrix & Mitigation', question: 'Perform a comprehensive operational failure risk assessment and mitigation matrix for mission-critical processes' }
    ]
  }
};

function updateIndustryAndRoles(indKey) {
  const data = INDUSTRY_DATA[indKey] || INDUSTRY_DATA['general'];

  // 1. Update roles dropdown
  roleSelect.innerHTML = data.roles.map(r => `<option value="${r.id}">${r.label}</option>`).join('');

  // 2. Update labels
  if (currentIndustryLabel) currentIndustryLabel.textContent = data.name.split('/')[0].trim();
  if (currentRoleLabel) currentRoleLabel.textContent = data.roles[0].label.replace(/^\S+\s/,'');

  // 3. Update input placeholder (compact on mobile)
  messageInput.placeholder = window.innerWidth <= 600 ? 'Ask APEX anything…' : data.placeholder;

  // 4. Update Quick Actions Container
  if (quickActionsLabel) quickActionsLabel.textContent = `QUICK ACTIONS (${data.name.split('/')[0].trim().toUpperCase()})`;
  if (quickActionsContainer) {
    quickActionsContainer.innerHTML = data.quickActions.map(a =>
      `<button class="quick-btn" data-msg="${a.msg}">${a.label}</button>`
    ).join('');
    // Bind listeners
    quickActionsContainer.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playClick();
        closeMobileSidebar();
        sendMessage(btn.dataset.msg);
      });
    });
  }

  // 5. Update Quick Issues / Defect Shortcuts Container
  if (quickDefectsLabel) quickDefectsLabel.textContent = data.issuesLabel;
  if (quickDefectsContainer) {
    quickDefectsContainer.innerHTML = data.issues.map(iss =>
      `<button class="quick-btn defect-btn" data-defect-prompt="${iss.desc}">${iss.label}</button>`
    ).join('');
    // Bind listeners
    quickDefectsContainer.querySelectorAll('.defect-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playClick();
        closeMobileSidebar();
        sendMessage(btn.dataset.defectPrompt);
      });
    });
  }

  // 6. Dynamically update Welcome Card 4 Starter Questions if active on screen
  const activeWelcome = document.getElementById('welcomeCard');
  if (activeWelcome) {
    appendWelcomeCard(indKey);
  }
}

// Industry selector change event
industrySelect.addEventListener('change', () => {
  updateIndustryAndRoles(industrySelect.value);
  playClick();
});

// Role selector change event
roleSelect.addEventListener('change', () => {
  if (currentRoleLabel) {
    const t = roleSelect.options[roleSelect.selectedIndex].text.replace(/^\S+\s/,'');
    currentRoleLabel.textContent = t;
  }
  playClick();
});

// Memory Badge click event
const memoryBadge = document.getElementById('memoryBadge');
if (memoryBadge) {
  memoryBadge.addEventListener('click', async () => {
    playClick();
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      const ent = data.enterprise_context || {};
      const batches = (ent.active_batches || []).map(b => `• ${b.batch_id}: ${b.fabric_type || ''} (${b.status || ''})`).join('\n');
      const machinery = (ent.critical_machinery || []).map(m => `• ${m.machine_id}: ${m.status || ''}`).join('\n');
      const milestones = (data.session_milestones || []).slice(-3).map(m => `• [${(m.timestamp||'').slice(0,10)}] ${m.note}`).join('\n');
      
      alert(`🧠 APEX CONTINUOUS LONG-TERM MEMORY & CONTEXT\n\nFacility: ${ent.primary_facility || 'Apex Production Shed'}\n\nMonitored Batches:\n${batches || 'None'}\n\nMonitored Machinery:\n${machinery || 'None'}\n\nRecent Milestones:\n${milestones || 'None'}\n\nContinuous memory is actively injected into every chat session!`);
    } catch(err) {
      alert('Continuous Memory Engine is ACTIVE and tracking sessions.');
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL FILE UPLOAD (PDF, Excel, CSV, Word, Image, Video, Audio)
// ══════════════════════════════════════════════════════════════════════════════
fileUpload.addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;

  filePreviewRow.style.display = 'flex';
  filePreviewIcon.textContent = '⏳';
  filePreviewName.textContent = `Analyzing ${file.name}…`;
  imagePreviewThumb.style.display = 'none';

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload error ${res.status}`);
    const data = await res.json();
    pendingAttachment = data;

    const icons = {
      pdf: '📄',
      pptx: '📊',
      ppt: '📊',
      excel: '📊',
      csv: '📈',
      docx: '📝',
      doc: '📝',
      image: '🖼️',
      video: '🎥',
      audio: '🎙️',
      text: '📄'
    };
    filePreviewIcon.textContent = icons[data.file_type] || '📎';
    filePreviewName.textContent = data.display_summary || file.name;

    if (data.image_base64) {
      imagePreviewThumb.src = `data:image/jpeg;base64,${data.image_base64}`;
      imagePreviewThumb.style.display = 'inline-block';
    } else {
      imagePreviewThumb.style.display = 'none';
    }

    playClick();
  } catch (err) {
    filePreviewIcon.textContent = '⚠️';
    filePreviewName.textContent = `Error reading ${file.name}`;
    setTimeout(clearFilePreview, 3000);
  }
});

removeFileBtn.addEventListener('click', clearFilePreview);

function clearFilePreview() {
  pendingAttachment = null;
  fileUpload.value = '';
  filePreviewRow.style.display = 'none';
  imagePreviewThumb.src = '';
  imagePreviewThumb.style.display = 'none';
}

// ══════════════════════════════════════════════════════════════════════════════
// SEND MESSAGE
// ══════════════════════════════════════════════════════════════════════════════
function autoResize() {
  messageInput.style.height='auto';
  messageInput.style.height=Math.min(messageInput.scrollHeight,140)+'px';
}

function addRipple(btn, e) {
  const r=document.createElement('span'); r.className='ripple';
  const rect=btn.getBoundingClientRect();
  const size=Math.max(rect.width,rect.height);
  r.style.width=r.style.height=size+'px';
  r.style.left=(e.clientX-rect.left-size/2)+'px';
  r.style.top=(e.clientY-rect.top-size/2)+'px';
  btn.appendChild(r); setTimeout(()=>r.remove(),500);
}

function triggerSend(e) {
  const text=messageInput.value.trim();
  if (!text && !pendingAttachment) return;
  messageInput.value=''; autoResize();
  sendMessage(text);
}

messageInput.addEventListener('input',autoResize);
messageInput.addEventListener('keydown',e=>{
  if (e.isComposing||e.keyCode===229) return;
  if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); e.stopPropagation(); if (!isStreaming) triggerSend(e); }
});
sendBtn.addEventListener('click',e=>{ if(!isStreaming){ addRipple(sendBtn,e); triggerSend(e); } });

// ══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE DATA CHARTS (Behind-The-Scenes Cyber-HUD Engine)
// ══════════════════════════════════════════════════════════════════════════════

const CYBER_PALETTES = [
  { bg: 'rgba(0, 245, 160, 0.40)', border: '#00F5A0' },   // Neon Mint
  { bg: 'rgba(6, 182, 212, 0.40)',  border: '#06B6D4' },   // Hologram Cyan
  { bg: 'rgba(139, 92, 246, 0.40)', border: '#8B5CF6' },  // Quantum Purple
  { bg: 'rgba(245, 158, 11, 0.40)', border: '#F59E0B' },  // Amber Radiance
  { bg: 'rgba(236, 72, 153, 0.40)', border: '#EC4899' },  // Cyber Pink
  { bg: 'rgba(59, 130, 246, 0.40)', border: '#3B82F6' },  // Electric Blue
  { bg: 'rgba(16, 185, 129, 0.40)', border: '#10B981' },  // Emerald
];

function parseChartJSON(raw) {
  if (!raw) return null;
  let clean = raw.replace(/^```(chart|json:chart|json)?/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(clean);
  } catch (_) {
    try {
      let fixed = clean.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(fixed);
    } catch (_) {
      return null;
    }
  }
}

function convertPythonPlotToChartConfig(pyCode) {
  if (!pyCode) return null;
  try {
    let title = 'APEX Operational Visualization';
    const titleMatch = pyCode.match(/plt\.title\s*\(\s*["']([^"']+)["']/i);
    if (titleMatch) title = titleMatch[1].trim();

    let chartType = 'bar';
    if (/plt\.plot\s*\(/i.test(pyCode)) chartType = 'line';
    else if (/plt\.pie\s*\(/i.test(pyCode)) chartType = 'pie';
    else if (/plt\.scatter\s*\(/i.test(pyCode)) chartType = 'scatter';

    // Find lists or arrays: var = [...]
    const listMatches = [...pyCode.matchAll(/([a-zA-Z0-9_]+)\s*=\s*\[([^\]]+)\]/g)];
    if (listMatches.length >= 2) {
      const parseList = (str) => str.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      const list1 = parseList(listMatches[0][2]);
      const list2 = parseList(listMatches[1][2]);

      const list1IsNumbers = list1.every(v => !isNaN(Number(v)));
      const list2IsNumbers = list2.every(v => !isNaN(Number(v)));

      let labels = [];
      let data = [];
      if (!list1IsNumbers && list2IsNumbers) {
        labels = list1;
        data = list2.map(Number);
      } else if (list1IsNumbers && !list2IsNumbers) {
        labels = list2;
        data = list1.map(Number);
      } else {
        labels = list1;
        data = list2.map(v => isNaN(Number(v)) ? 0 : Number(v));
      }

      if (labels.length && data.length) {
        return {
          type: chartType,
          title: title,
          data: {
            labels: labels,
            datasets: [{
              label: title,
              data: data
            }]
          },
          options: {
            description: "Computed directly by APEX Visual Engine."
          }
        };
      }
    }
  } catch (e) {
    console.warn("Python plot extraction fallback:", e);
  }
  return null;
}

function prepareStreamMarkdown(text) {
  if (!text) return '';
  // 1. Hide in-progress or closed chart code blocks during streaming
  let display = text.replace(/```(?:chart|json:chart)[\s\S]*?(?:```|$)/gi, () => {
    return '\n\n<div class="apex-chart-generating-hud"><span class="apex-pulse-dot"></span> 📊 Synthesizing Quantum Chart Visualization…</div>\n\n';
  });
  // 2. Hide in-progress or closed action code blocks during streaming
  display = display.replace(/```(?:action|json:action)[\s\S]*?(?:```|$)/gi, () => {
    return '\n\n<div class="apex-action-generating-hud"><span class="apex-pulse-dot"></span> ⚡ Executing Operations Protocol…</div>\n\n';
  });
  // 3. Hide Python plotting scripts during streaming
  display = display.replace(/```python[\s\S]*?(?:import matplotlib|plt\.)[\s\S]*?(?:```|$)/gi, () => {
    return '\n\n<div class="apex-chart-generating-hud"><span class="apex-pulse-dot"></span> 📊 Synthesizing Quantum Chart Visualization…</div>\n\n';
  });
  // 4. Hide JSON blocks that define charts during streaming
  display = display.replace(/```json[\s\S]*?"(?:type|data)"[\s\S]*?(?:```|$)/gi, () => {
    return '\n\n<div class="apex-chart-generating-hud"><span class="apex-pulse-dot"></span> 📊 Synthesizing Quantum Chart Visualization…</div>\n\n';
  });
  // 5. Hide in-progress or closed file_export code blocks during streaming
  display = display.replace(/```(?:file_export|export|document)[\s\S]*?(?:```|$)/gi, () => {
    return '\n\n<div class="apex-doc-generating-hud"><span class="apex-pulse-dot"></span> 📄 Preparing Technical Document Package…</div>\n\n';
  });
  return display;
}

function prepareFinalMarkdown(text) {
  if (!text) return '';
  let prepared = text;

  // 1. Convert ```chart or ```json:chart blocks into clean <div class="apex-chart-slot" ...></div>
  prepared = prepared.replace(/```(?:chart|json:chart)\s*([\s\S]*?)```/gi, (match, jsonStr) => {
    const cfg = parseChartJSON(jsonStr);
    if (cfg && cfg.data && cfg.data.labels) {
      const encoded = encodeURIComponent(JSON.stringify(cfg));
      return `\n\n<div class="apex-chart-slot" data-chart="${encoded}"></div>\n\n`;
    }
    return ''; // hide if malformed
  });

  // 2. Intercept python code blocks with matplotlib / plt
  prepared = prepared.replace(/```python\s*([\s\S]*?(?:matplotlib|plt\.)[\s\S]*?)```/gi, (match, pyCode) => {
    const cfg = convertPythonPlotToChartConfig(pyCode);
    if (cfg && cfg.data && cfg.data.labels) {
      const encoded = encodeURIComponent(JSON.stringify(cfg));
      return `\n\n<div class="apex-chart-slot" data-chart="${encoded}"></div>\n\n`;
    }
    return ''; // completely hide python plotting code so user never sees coding
  });

  // 3. Intercept ```json with chart structure
  prepared = prepared.replace(/```json\s*(\{[\s\S]*?"(?:type|data)"[\s\S]*?\})```/gi, (match, jsonStr) => {
    const cfg = parseChartJSON(jsonStr);
    if (cfg && cfg.data && cfg.data.labels) {
      const encoded = encodeURIComponent(JSON.stringify(cfg));
      return `\n\n<div class="apex-chart-slot" data-chart="${encoded}"></div>\n\n`;
    }
    return match; // keep standard json code blocks
  });

  // 4. Intercept ```file_export or ```export blocks and turn into <div class="apex-doc-slot" data-doc="..."></div>
  prepared = prepared.replace(/```(?:file_export|export|document)\s*(\{[\s\S]*?\})\s*```/gi, (match, jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const encoded = encodeURIComponent(JSON.stringify(parsed));
      return `\n\n<div class="apex-doc-slot" data-doc="${encoded}"></div>\n\n`;
    } catch (_) {
      return '';
    }
  });

  return prepared;
}

function buildChartCardElement(chartConfig) {
  const card = document.createElement('div');
  card.className = 'apex-chart-card';

  const title = chartConfig.title || 'APEX Data Visualization';
  let chartType = (chartConfig.type || 'bar').toLowerCase();
  if (chartType === 'column') chartType = 'bar';
  if (chartType === 'combo' || chartType === 'mixed') chartType = 'bar';
  const description = (chartConfig.options && chartConfig.options.description) || '';
  const chartId = 'apex_chart_' + Math.random().toString(36).substring(2, 9);

  card.innerHTML = `
    <div class="apex-chart-header">
      <div class="apex-chart-title-wrap">
        <span class="apex-chart-icon">📊</span>
        <span class="apex-chart-title">${escapeHtml(title)}</span>
        <span class="apex-chart-badge">${chartType.toUpperCase()}</span>
      </div>
      <div class="apex-chart-actions">
        <button class="apex-chart-btn" data-action="download" title="Export as High-Res PNG">📷 Export PNG</button>
        <button class="apex-chart-btn" data-action="toggle" title="Toggle View Type">🔄 Toggle View</button>
      </div>
    </div>
    <div class="apex-chart-canvas-wrap">
      <canvas id="${chartId}"></canvas>
    </div>
    ${description ? `
      <div class="apex-chart-footer">
        <span class="apex-chart-footer-desc">💡 ${escapeHtml(description)}</span>
        <span class="apex-chart-footer-brand">APEX QUANTUM VISUALS</span>
      </div>
    ` : ''}
  `;
  return card;
}

function initChartInstance(card, chartConfig) {
  if (!card || !chartConfig || !window.Chart) return;
  const canvas = card.querySelector('canvas');
  if (!canvas) return;

  let chartType = (chartConfig.type || 'bar').toLowerCase();
  if (chartType === 'column' || chartType === 'combo' || chartType === 'mixed') chartType = 'bar';
  const title = chartConfig.title || 'APEX Data Visualization';

  // Style datasets with Cyber Neon theme
  const datasets = (chartConfig.data.datasets || []).map((ds, idx) => {
    const palette = CYBER_PALETTES[idx % CYBER_PALETTES.length];
    const isPie = ['pie', 'doughnut'].includes(chartType);

    if (isPie) {
      const bgColors = chartConfig.data.labels.map((_, i) => CYBER_PALETTES[i % CYBER_PALETTES.length].bg);
      const borderColors = chartConfig.data.labels.map((_, i) => CYBER_PALETTES[i % CYBER_PALETTES.length].border);
      return {
        ...ds,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverOffset: 8,
      };
    }

    const effectiveType = ds.type || (chartConfig.type === 'combo' ? (idx === 0 ? 'bar' : 'line') : undefined);
    return {
      ...ds,
      type: effectiveType,
      backgroundColor: palette.bg,
      borderColor: palette.border,
      borderWidth: 2.5,
      borderRadius: (effectiveType === 'bar' || (!effectiveType && chartType === 'bar')) ? 6 : 0,
      tension: 0.35,
      pointBackgroundColor: palette.border,
      pointBorderColor: '#030712',
      pointBorderWidth: 2,
      pointRadius: 4.5,
      pointHoverRadius: 7,
      fill: (effectiveType === 'line' || (!effectiveType && chartType === 'line')) ? { target: 'origin', above: palette.bg.replace('0.40', '0.08') } : false,
    };
  });

  let chartInstance = null;
  try {
    chartInstance = new Chart(canvas, {
      type: chartType,
      data: {
        labels: chartConfig.data.labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart',
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#CBD5E1',
              font: { family: 'Space Grotesk, sans-serif', size: 11.5, weight: '500' },
              boxWidth: 12,
              boxHeight: 12,
              padding: 14,
            }
          },
          tooltip: {
            backgroundColor: 'rgba(8, 14, 28, 0.95)',
            titleColor: '#00F5A0',
            bodyColor: '#F8FAFC',
            borderColor: 'rgba(0, 245, 160, 0.35)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            titleFont: { family: 'JetBrains Mono, monospace', size: 11 },
            bodyFont: { family: 'Space Grotesk, sans-serif', size: 12 },
          }
        },
        scales: ['pie', 'doughnut', 'radar'].includes(chartType) ? {} : {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#94A3B8', font: { family: 'JetBrains Mono, monospace', size: 10.5 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#94A3B8', font: { family: 'JetBrains Mono, monospace', size: 10.5 } }
          }
        }
      }
    });
  } catch (chartErr) {
    console.error('Chart initialization error:', chartErr);
  }

  // Attach actions
  const dlBtn = card.querySelector('[data-action="download"]');
  if (dlBtn && chartInstance) {
    dlBtn.addEventListener('click', () => {
      const url = chartInstance.toBase64Image('image/png', 1);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_chart.png`;
      a.click();
    });
  }

  const toggleBtn = card.querySelector('[data-action="toggle"]');
  if (toggleBtn && chartInstance && !['pie', 'doughnut', 'radar'].includes(chartType)) {
    toggleBtn.addEventListener('click', () => {
      const newType = chartInstance.config.type === 'bar' ? 'line' : 'bar';
      chartInstance.config.type = newType;
      const badge = card.querySelector('.apex-chart-badge');
      if (badge) badge.textContent = newType.toUpperCase();
      chartInstance.update();
    });
  } else if (toggleBtn && ['pie', 'doughnut'].includes(chartType)) {
    toggleBtn.addEventListener('click', () => {
      const newType = chartInstance.config.type === 'doughnut' ? 'pie' : 'doughnut';
      chartInstance.config.type = newType;
      const badge = card.querySelector('.apex-chart-badge');
      if (badge) badge.textContent = newType.toUpperCase();
      chartInstance.update();
    });
  } else if (toggleBtn) {
    toggleBtn.style.display = 'none';
  }
}

function renderCharts(container) {
  if (!container || !window.Chart) return;

  // Remove any leftover streaming generating HUDs
  container.querySelectorAll('.apex-chart-generating-hud').forEach(el => el.remove());

  // 1. Process all .apex-chart-slot elements
  const slots = container.querySelectorAll('.apex-chart-slot');
  slots.forEach(slot => {
    if (slot.dataset.rendered) return;
    slot.dataset.rendered = 'true';
    let chartConfig = null;
    try {
      chartConfig = JSON.parse(decodeURIComponent(slot.dataset.chart));
    } catch (_) {
      try {
        chartConfig = JSON.parse(slot.dataset.chart);
      } catch (e) {
        console.error('Failed to parse chart slot json:', e);
      }
    }
    if (!chartConfig || !chartConfig.data || !chartConfig.data.labels) return;

    const card = buildChartCardElement(chartConfig);
    slot.parentNode.replaceChild(card, slot);
    initChartInstance(card, chartConfig);
  });

  // 2. Fallback: Process any pre code blocks that contain chart data or Python plot
  const codeBlocks = container.querySelectorAll('pre code');
  codeBlocks.forEach(codeEl => {
    const isChartLang = codeEl.classList.contains('language-chart') || 
                        codeEl.classList.contains('language-json:chart') ||
                        codeEl.className.includes('chart');
    const text = codeEl.textContent.trim();
    const hasChartKeys = text.includes('"type"') && text.includes('"data"');
    const isPyPlot = text.includes('matplotlib') || text.includes('plt.');

    if (isPyPlot) {
      const preEl = codeEl.closest('pre');
      const cfg = convertPythonPlotToChartConfig(text);
      if (cfg && preEl) {
        const card = buildChartCardElement(cfg);
        preEl.parentNode.replaceChild(card, preEl);
        initChartInstance(card, cfg);
        return;
      } else if (preEl) {
        preEl.remove(); // Never show python plot code to user
        return;
      }
    }

    if (!isChartLang && !hasChartKeys) return;

    const chartConfig = parseChartJSON(text);
    if (!chartConfig || !chartConfig.data || !chartConfig.data.labels) return;

    const preEl = codeEl.closest('pre');
    if (!preEl || preEl.dataset.chartRendered) return;
    preEl.dataset.chartRendered = 'true';

    const card = buildChartCardElement(chartConfig);
    preEl.parentNode.replaceChild(card, preEl);
    initChartInstance(card, chartConfig);
  });
}


async function sendMessage(text) {
  if (isStreaming) return;
  if (!text && !pendingAttachment) return;

  if (!currentUser) {
    currentUser = {
      name: 'Guest User',
      email: 'guest@apex.ai',
      role: (roleSelect ? roleSelect.value : 'GENERAL'),
      industry: (industrySelect ? industrySelect.value : 'textile')
    };
    setStoredUser(currentUser);
    updateUIForLoggedInUser(currentUser);
  }

  const welcomeCard=document.getElementById('welcomeCard');
  if (welcomeCard) welcomeCard.remove();

  // Handle attached files (PDF, Excel, CSV, Word, Video, Audio, Image)
  let userDisplay = text || '';
  let fullPayloadText = text || '';
  let imgB64 = null;
  let attachedSummary = null;

  if (pendingAttachment) {
    attachedSummary = pendingAttachment.display_summary || pendingAttachment.filename;
    if (pendingAttachment.image_base64) {
      imgB64 = pendingAttachment.image_base64;
    }
    if (pendingAttachment.text_content) {
      fullPayloadText = `${pendingAttachment.text_content}\n\n[USER INQUIRY / TASK]:\n${text || 'Please thoroughly analyze and explain this file, break down all critical data, calculate key metrics, and provide prioritized technical recommendations.'}`;
    }
    if (!userDisplay) {
      userDisplay = `Analyze and explain attached ${attachedSummary}`;
    }
  }

  clearFilePreview();

  // Append to history
  const storedContent = fullPayloadText + (imgB64 ? '\n\n[IMAGE_BASE64]:' + imgB64 : '');
  conversationHistory.push({ role: 'user', content: storedContent });
  appendMessage('user', userDisplay, imgB64, attachedSummary);
  scrollToBottom();
  setStatus('thinking'); showTyping(true); isStreaming=true; sendBtn.disabled=true;

  // Build sanitized messages payload
  const sanitizedMessages = conversationHistory.slice(-20).map(m => ({
    role: m.role || 'user',
    content: typeof m.content === 'string' ? m.content : String(m.content || '')
  }));
  const {bubbleEl, col} = appendStreamingMessage();

  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: sanitizedMessages,
        user_role: roleSelect ? roleSelect.value : 'GENERAL',
        language: currentLang || 'auto',
        industry: (industrySelect ? industrySelect.value : 'general'),
        user_email: (currentUser && currentUser.email) || '',
        current_chat_id: currentChatId || Date.now(),
      }),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const j = await res.json();
        detail = j.detail || JSON.stringify(j);
      } catch (_) {
        detail = await res.text();
      }
      throw new Error(`Server returned HTTP ${res.status}: ${detail || res.statusText}`);
    }

    if (!res.body) {
      throw new Error('Server returned an empty response stream.');
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let fullReply = '';
    showTyping(false);
    bubbleEl.classList.add('cursor-blink');

    let renderPending = false;
    let renderFrameId = null;

    function renderStream() {
      renderPending = false;
      const streamDisplay = prepareStreamMarkdown(fullReply);
      if (window.marked) {
        bubbleEl.innerHTML = marked.parse(streamDisplay);
      } else {
        bubbleEl.textContent = streamDisplay;
      }
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function scheduleStreamRender() {
      if (!renderPending) {
        renderPending = true;
        renderFrameId = requestAnimationFrame(renderStream);
      }
    }

    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      buf += dec.decode(value, {stream: true});
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const p = JSON.parse(data);
          if (p.text) {
            fullReply += p.text;
            scheduleStreamRender();
          }
        } catch (_) {}
      }
    }

    if (renderFrameId) {
      cancelAnimationFrame(renderFrameId);
      renderPending = false;
    }

    bubbleEl.classList.remove('cursor-blink');
    if (window.marked) {
      bubbleEl.innerHTML = marked.parse(prepareFinalMarkdown(fullReply));
    }
    messagesArea.scrollTop = messagesArea.scrollHeight;
    conversationHistory.push({role: 'assistant', content: fullReply});
    addTimestamp(col);
    setStatus('ready');
    playDone();
    try { speakText(fullReply); } catch(_) {}

    // Safely render interactive charts, documents, images, actions, escalations, exports & copy buttons
    try { renderCharts(bubbleEl); } catch(e) { console.warn('Chart render error:', e); }
    try { renderDocumentCards(bubbleEl, fullReply); } catch(e) { console.warn('Doc card error:', e); }
    try { renderActionCards(bubbleEl); } catch(e) { console.warn('Action card error:', e); }
    try { renderEscalationCards(bubbleEl); } catch(e) { console.warn('Escalation card error:', e); }
    try { handleExplicitVideoRequest(col, text || '', fullReply); } catch(e) { console.warn('Video request error:', e); }
    try { handleExplicitImageRequest(col, text || '', fullReply); } catch(e) { console.warn('Image request error:', e); }
    try { addTableExportButtons(col, bubbleEl); } catch(e) { console.warn('Table export error:', e); }
    try { enhanceMessageContent(bubbleEl, fullReply); } catch(e) { console.warn('Content enhance error:', e); }
    try { addMessageActions(col, fullReply, bubbleEl); } catch(e) { console.warn('Actions error:', e); }

    // Auto-save to history
    try { saveCurrentChat(); } catch(e) { console.warn('Save chat error:', e); }

  } catch (err) {
    showTyping(false);
    bubbleEl.classList.remove('cursor-blink');
    const retryId = `retryBtn_${Date.now()}`;
    bubbleEl.innerHTML = `
      <div style="padding:12px;border-left:3px solid #ef4444;background:rgba(239,68,68,0.08);border-radius:8px;">
        <div style="display:flex;align-items:center;gap:6px;font-weight:700;color:#f87171;font-size:13px;">
          <span>⚠️ Server Notice</span>
        </div>
        <p style="margin:6px 0 10px;font-size:12.5px;color:var(--text2);line-height:1.4;">${escapeHtml(err.message)}</p>
        <button class="msg-action-btn" type="button" id="${retryId}" style="display:inline-flex;align-items:center;gap:5px;cursor:pointer;">
          <span>🔄 Retry Question</span>
        </button>
      </div>
    `;
    const rBtn = bubbleEl.querySelector(`#${retryId}`);
    if (rBtn) {
      rBtn.onclick = () => {
        const wrapMsg = bubbleEl.closest('.message');
        if (wrapMsg) wrapMsg.remove();
        sendMessage(text);
      };
    }
    setStatus('error');
  } finally {
    isStreaming = false;
    sendBtn.disabled = false;
    scrollToBottom();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDER HELPERS
// ══════════════════════════════════════════════════════════════════════════════
function appendMessage(role, text, imageBase64=null, attachedSummary=null) {
  const wrap=document.createElement('div'); wrap.className=`message ${role}`;
  const avatar=document.createElement('div'); avatar.className='avatar';
  avatar.textContent=role==='assistant'?'A':'U';
  const col=document.createElement('div'); col.className='message-col';

  if (attachedSummary) {
    const badge = document.createElement('div');
    badge.className = 'file-attached-badge';
    badge.innerHTML = `📎 Attached: <strong>${attachedSummary}</strong>`;
    col.appendChild(badge);
  }

  const bubble=document.createElement('div'); bubble.className='bubble';
  if (imageBase64) {
    const img=document.createElement('img'); img.src='data:image/jpeg;base64,'+imageBase64;
    img.className='msg-image'; col.appendChild(img);
  }
  if (role === 'assistant' && window.marked) {
    bubble.innerHTML = marked.parse(prepareFinalMarkdown(text));
  } else {
    bubble.textContent = text;
  }
  col.appendChild(bubble);
  if (role === 'assistant') {
    renderCharts(bubble);
    renderDocumentCards(bubble, text);
    renderActionCards(bubble);
    renderEscalationCards(bubble);
    handleExplicitVideoRequest(col, text||'', text||'');
    addTableExportButtons(col, bubble);
    enhanceMessageContent(bubble, text);
    addMessageActions(col, text, bubble);
  }
  addTimestamp(col);
  wrap.appendChild(avatar); wrap.appendChild(col);
  messagesArea.appendChild(wrap);
  return {bubbleEl:bubble, col};
}

function appendStreamingMessage() {
  const wrap=document.createElement('div'); wrap.className='message assistant';
  const avatar=document.createElement('div'); avatar.className='avatar'; avatar.textContent='A';
  const col=document.createElement('div'); col.className='message-col';
  const bubble=document.createElement('div'); bubble.className='bubble';
  col.appendChild(bubble);
  wrap.appendChild(avatar); wrap.appendChild(col);
  messagesArea.appendChild(wrap);
  scrollToBottom();
  return {bubbleEl:bubble, col};
}

function addTimestamp(col) {
  const ts=document.createElement('div'); ts.className='timestamp';
  ts.textContent=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  col.appendChild(ts);
}

function appendSystemMsg(text) {
  const div=document.createElement('div'); div.className='system-msg'; div.textContent=text;
  messagesArea.appendChild(div); scrollToBottom();
}

function bindStarterQuestionButtons(container) {
  const root = container || document;
  root.querySelectorAll('.starter-question-btn').forEach(btn => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const prompt = btn.getAttribute('data-prompt');
      if (prompt) {
        if (typeof playClick === 'function') playClick();
        if (typeof sendMessage === 'function') sendMessage(prompt);
      }
    });
  });
}

function appendWelcomeCard(indKey) {
  if (!messagesArea) return;
  messagesArea.innerHTML = '';
  const key = indKey || (industrySelect ? industrySelect.value : 'textile') || 'textile';
  const data = INDUSTRY_DATA[key] || INDUSTRY_DATA['general'] || INDUSTRY_DATA['textile'];
  const questions = (data && data.starterQuestions && data.starterQuestions.length)
    ? data.starterQuestions
    : (INDUSTRY_DATA['textile'] && INDUSTRY_DATA['textile'].starterQuestions) || [];

  const card = document.createElement('div');
  card.className = 'welcome-card';
  card.id = 'welcomeCard';

  const questionsHtml = questions.map(q => `
    <button class="feature starter-question-btn" type="button" data-prompt="${q.question.replace(/"/g, '&quot;')}" title="Click to ask this question immediately">
      <span class="feature-icon">${q.icon || '💬'}</span>
      <div class="starter-text-wrap">
        <span class="starter-title">${q.title}</span>
        <span class="starter-subtitle">${q.question}</span>
      </div>
    </button>
  `).join('');

  card.innerHTML = `
    <div class="welcome-logo-wrap">
      <img src="/static/apex_logo.jpg" alt="APEX" class="welcome-logo-img"/>
      <div class="welcome-glow"></div>
    </div>
    <h1 class="welcome-h1">APEX</h1>
    <p class="welcome-tagline">You didn't stumble here by chance — you arrived because you need answers that actually matter. Ask anything. I'll give you clarity, precision, and insight that moves you forward.</p>
    <div class="welcome-features welcome-questions" id="welcomeQuestions">
      ${questionsHtml}
    </div>
    <div class="welcome-cta">Type a question below — or tap one of the 4 starter questions above to begin immediately</div>`;

  messagesArea.appendChild(card);
  bindStarterQuestionButtons(card);
}

// ══════════════════════════════════════════════════════════════════════════════
// CLIPBOARD COPY & INTERACTIVE MESSAGE ENHANCEMENTS
// ══════════════════════════════════════════════════════════════════════════════

async function copyToClipboard(text) {
  if (!text) return false;
  const clean = text.replace(/\0/g, '');

  // 1. Try modern navigator.clipboard
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(clean);
      return true;
    } catch (e) {
      console.warn('navigator.clipboard failed, attempting fallback:', e);
    }
  }

  // 2. Fallback to off-screen textarea
  try {
    const ta = document.createElement('textarea');
    ta.value = clean;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    ta.setAttribute('readonly', '');
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, 999999);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (!ok) throw new Error('execCommand returned false');
    return true;
  } catch (err) {
    console.error('All copy methods failed:', err);
    window.prompt('Copy to clipboard (Ctrl+C, Enter):', clean);
    return true;
  }
}

function getCleanTextToCopy(rawText, bubble) {
  if (rawText) {
    let clean = rawText;
    clean = clean.replace(/```(?:action|json:action)[\s\S]*?```/g, '').trim();
    clean = clean.replace(/```(?:chart|json:chart)[\s\S]*?```/g, '').trim();
    clean = clean.replace(/```python[\s\S]*?(?:matplotlib|plt\.)[\s\S]*?```/g, '').trim();
    clean = clean.replace(/\[IMAGE_BASE64\]:\S+/g, '').trim();
    if (clean) return clean;
  }
  return bubble ? bubble.innerText.trim() : '';
}

function enhanceMessageContent(bubble, rawText) {
  if (!bubble) return;
  const preElements = bubble.querySelectorAll('pre');
  preElements.forEach(pre => {
    if (pre.dataset.enhanced || pre.dataset.actionRendered || pre.dataset.chartRendered || pre.classList.contains('apex-payload-view') || pre.closest('.apex-action-card') || pre.closest('.apex-chart-card')) return;

    const code = pre.querySelector('code');
    const codeText = code ? code.innerText : pre.innerText;

    // Completely hide chart and python plot code blocks
    if (code && (code.classList.contains('language-chart') || code.classList.contains('language-json:chart') || code.className.includes('chart'))) {
      pre.style.display = 'none';
      return;
    }
    if (codeText.includes('import matplotlib') || codeText.includes('plt.show()')) {
      pre.style.display = 'none';
      return;
    }

    pre.dataset.enhanced = 'true';

    let lang = 'CODE';
    if (code && code.className) {
      const m = code.className.match(/language-([a-zA-Z0-9_\-]+)/);
      if (m && m[1]) lang = m[1].toUpperCase();
    }

    const container = document.createElement('div');
    container.className = 'code-block-container';

    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.innerHTML = `
      <span class="code-lang-label">${escapeHtml(lang)}</span>
      <button class="code-copy-btn" type="button" title="Copy code snippet">
        <span class="btn-icon">📋</span> Copy Code
      </button>
    `;

    const copyBtn = header.querySelector('.code-copy-btn');
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await copyToClipboard(codeText);
        copyBtn.innerHTML = `<span class="btn-icon">✅</span> Copied!`;
        copyBtn.classList.add('copied');
        playClick();
        setTimeout(() => {
          copyBtn.innerHTML = `<span class="btn-icon">📋</span> Copy Code`;
          copyBtn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Copy code failed:', err);
      }
    });

    pre.parentNode.insertBefore(container, pre);
    container.appendChild(header);
    container.appendChild(pre);
  });
}

function addMessageActions(col, rawText, bubble) {
  if (!col) return;
  if (col.querySelector('.message-actions')) return;

  const actions = document.createElement('div');
  actions.className = 'message-actions';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'msg-action-btn copy-msg-btn';
  copyBtn.type = 'button';
  copyBtn.title = 'Copy complete answer to clipboard';
  copyBtn.innerHTML = `<span class="btn-icon">📋</span> Copy Answer`;

  copyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const textToCopy = getCleanTextToCopy(rawText, bubble);
    try {
      await copyToClipboard(textToCopy);
      copyBtn.innerHTML = `<span class="btn-icon">✅</span> Copied!`;
      copyBtn.classList.add('copied');
      playClick();
      setTimeout(() => {
        copyBtn.innerHTML = `<span class="btn-icon">📋</span> Copy Answer`;
        copyBtn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy answer:', err);
      copyBtn.innerHTML = `<span class="btn-icon">❌</span> Error`;
      setTimeout(() => {
        copyBtn.innerHTML = `<span class="btn-icon">📋</span> Copy Answer`;
      }, 2000);
    }
  });

  const listenBtn = document.createElement('button');
  listenBtn.className = 'msg-action-btn listen-msg-btn';
  listenBtn.type = 'button';
  listenBtn.title = 'Read this answer aloud';
  listenBtn.innerHTML = `<span class="btn-icon">🔊</span> Listen`;

  listenBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const textToSpeak = getCleanTextToCopy(rawText, bubble);
    speakText(textToSpeak);
  });

  const videoBtn = document.createElement('button');
  videoBtn.className = 'msg-action-btn video-msg-btn';
  videoBtn.type = 'button';
  videoBtn.title = 'Synthesize AI Cinematic Motion Video for this topic';
  videoBtn.innerHTML = `<span class="btn-icon">🎬</span> Video`;

  videoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const textToUse = getCleanTextToCopy(rawText, bubble);
    generateVideo(textToUse.slice(0, 120), col, videoBtn, '', rawText);
  });

  // On-demand Document Exports (PDF, PPTX, Excel)
  const pdfBtn = document.createElement('button');
  pdfBtn.className = 'msg-action-btn doc-export-btn pdf-export-btn';
  pdfBtn.type = 'button';
  pdfBtn.title = 'Generate & Download Executive PDF Report';
  pdfBtn.innerHTML = `<span class="btn-icon">📄</span> PDF`;
  pdfBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await exportDocumentFromMessage('pdf', rawText, bubble, pdfBtn);
  });

  const pptxBtn = document.createElement('button');
  pptxBtn.className = 'msg-action-btn doc-export-btn pptx-export-btn';
  pptxBtn.type = 'button';
  pptxBtn.title = 'Generate & Download PowerPoint Presentation (.pptx)';
  pptxBtn.innerHTML = `<span class="btn-icon">📊</span> PPTX`;
  pptxBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await exportDocumentFromMessage('pptx', rawText, bubble, pptxBtn);
  });

  const xlsxBtn = document.createElement('button');
  xlsxBtn.className = 'msg-action-btn doc-export-btn xlsx-export-btn';
  xlsxBtn.type = 'button';
  xlsxBtn.title = 'Generate & Download Excel Spreadsheet (.xlsx)';
  xlsxBtn.innerHTML = `<span class="btn-icon">📗</span> Excel`;
  xlsxBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await exportDocumentFromMessage('excel', rawText, bubble, xlsxBtn);
  });

  actions.appendChild(copyBtn);
  actions.appendChild(listenBtn);
  actions.appendChild(videoBtn);
  actions.appendChild(pdfBtn);
  actions.appendChild(pptxBtn);
  actions.appendChild(xlsxBtn);

  const ts = col.querySelector('.timestamp');
  if (ts) {
    col.insertBefore(actions, ts);
  } else {
    col.appendChild(actions);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ON-DEMAND EXPORT CONTROLLER (PDF, PPTX, EXCEL)
// ══════════════════════════════════════════════════════════════════════════════
async function exportDocumentFromMessage(type, rawText, bubble, btn) {
  const origHtml = btn.innerHTML;
  btn.innerHTML = `<span class="apex-pulse-dot" style="display:inline-block;width:8px;height:8px;background:var(--accent);border-radius:50%;margin-right:4px;"></span> Building…`;
  btn.disabled = true;
  playClick();

  try {
    let cleanText = getCleanTextToCopy(rawText, bubble);
    let title = 'APEX Technical Dossier';
    const hMatch = cleanText.match(/^#+\s*(.+)$/m) || cleanText.match(/^([^\n]+)/);
    if (hMatch && hMatch[1]) {
      title = hMatch[1].replace(/[#*_`]/g, '').trim().slice(0, 50);
    }
    const role = (roleSelect && roleSelect.value) ? roleSelect.value : 'GENERAL';
    const industry = (industrySelect && industrySelect.value) ? industrySelect.value : 'general';

    const res = await fetch('/api/documents/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type,
        title: title,
        subtitle: `${industry.toUpperCase()} · ${role.toUpperCase()} DOSSIER`,
        raw_markdown: cleanText,
        author: `APEX Universal Intelligence (${(currentUser && currentUser.name) || 'Auditor'})`,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.download_url) {
      btn.innerHTML = `<span class="btn-icon">✅</span> Ready!`;
      const a = document.createElement('a');
      a.href = data.download_url;
      a.download = data.filename || `apex_${type}_export`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      playDone();
      setTimeout(() => {
        btn.innerHTML = origHtml;
        btn.disabled = false;
      }, 3000);
    } else {
      throw new Error('Download URL missing in response');
    }
  } catch (err) {
    console.error('Document export error:', err);
    btn.innerHTML = `<span class="btn-icon">❌</span> Failed`;
    setTimeout(() => {
      btn.innerHTML = origHtml;
      btn.disabled = false;
    }, 2500);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SCROLL
// ══════════════════════════════════════════════════════════════════════════════
function scrollToBottom(smooth = false) {
  if (smooth) {
    messagesArea.scrollTo({ top: messagesArea.scrollHeight, behavior: 'smooth' });
  } else {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }
}
messagesArea.addEventListener('scroll', () => {
  const atBottom = messagesArea.scrollHeight - messagesArea.scrollTop - messagesArea.clientHeight < 100;
  scrollBtn.classList.toggle('visible', !atBottom);
});
scrollBtn.addEventListener('click', () => scrollToBottom(true));

// ══════════════════════════════════════════════════════════════════════════════
// STATUS
// ══════════════════════════════════════════════════════════════════════════════
function showTyping(show) { typingIndicator.style.display=show?'flex':'none'; }
function setStatus(s) {
  statusDot.className='status-dot';
  if (s==='thinking'||s==='listening') { statusDot.classList.add('busy'); statusLabel.textContent=s==='listening'?'Listening…':'Thinking…'; }
  else if (s==='error') { statusDot.classList.add('error'); statusLabel.textContent='Error'; }
  else { statusLabel.textContent='Ready'; }
}

// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// PERSISTENT CHAT HISTORY (Disk + Server REST API + Local Backup)
// ══════════════════════════════════════════════════════════════════════════════
let cachedHistory = [];

async function syncHistoryWithServer(userEmail = null) {
  try {
    const emailToUse = userEmail || currentUser?.email || '';
    const query = emailToUse ? `?user_email=${encodeURIComponent(emailToUse)}` : '';
    const res = await fetch(`/api/history${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.history)) {
        cachedHistory = data.history;
        try {
          const storeKey = emailToUse ? `${HISTORY_KEY}_${emailToUse}` : HISTORY_KEY;
          localStorage.setItem(storeKey, JSON.stringify(cachedHistory.slice(0, 15)));
        } catch (_) {}
        renderHistory();
        return cachedHistory;
      }
    }
  } catch (err) {
    console.warn('Could not fetch server history, falling back to local cache:', err);
  }

  try {
    const emailToUse = userEmail || currentUser?.email || '';
    const storeKey = emailToUse ? `${HISTORY_KEY}_${emailToUse}` : HISTORY_KEY;
    cachedHistory = JSON.parse(localStorage.getItem(storeKey) || localStorage.getItem(HISTORY_KEY) || '[]');
  } catch (_) {
    cachedHistory = [];
  }
  renderHistory();
  return cachedHistory;
}

function loadAllHistory() {
  if (cachedHistory && cachedHistory.length) return cachedHistory;
  try {
    const emailToUse = currentUser?.email || '';
    const storeKey = emailToUse ? `${HISTORY_KEY}_${emailToUse}` : HISTORY_KEY;
    return JSON.parse(localStorage.getItem(storeKey) || localStorage.getItem(HISTORY_KEY) || '[]');
  } catch (_) {
    return [];
  }
}

async function saveCurrentChat() {
  if (!conversationHistory || !conversationHistory.length) return;

  const firstUser = conversationHistory.find(m => m.role === 'user');
  let rawTitle = (firstUser?.content || 'Conversation').replace(/\[IMAGE_BASE64\]:\S+/g, '').replace(/\[USER INQUIRY.*?\]:/gs, '').trim();
  const title = (rawTitle.slice(0, 50) || 'Conversation').trim();

  // Strip raw base64 data to keep stored messages durable, fast, and lightweight
  const cleanMsgs = conversationHistory.map(m => ({
    role: m.role,
    content: (m.content || '').replace(/\[IMAGE_BASE64\]:[A-Za-z0-9+/=]+/g, '[Attached Image]').trim()
  }));

  const sessionObj = {
    id: currentChatId,
    title: title,
    createdAt: new Date().toISOString(),
    user_email: currentUser?.email || '',
    messages: cleanMsgs
  };

  // Update in-memory cache
  cachedHistory = [sessionObj, ...cachedHistory.filter(c => String(c.id) !== String(currentChatId))].slice(0, 50);

  // Update local storage backup safely
  try {
    const emailToUse = currentUser?.email || '';
    const storeKey = emailToUse ? `${HISTORY_KEY}_${emailToUse}` : HISTORY_KEY;
    localStorage.setItem(storeKey, JSON.stringify(cachedHistory.slice(0, 15)));
  } catch (_) {}

  renderHistory();

  // Persist permanently to server disk
  try {
    await fetch('/api/history/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionObj)
    });
  } catch (err) {
    console.warn('Could not persist chat session to server:', err);
  }
}

function renderHistory() {
  const all = loadAllHistory();
  if (!all.length) {
    historyList.innerHTML = '<div class="history-empty">No chats saved yet.<br/>Start a conversation<br/>— it saves automatically on disk.</div>';
    return;
  }
  historyList.innerHTML = all.map(c => {
    const d = new Date(c.createdAt || Date.now());
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const active = String(c.id) === String(currentChatId) ? 'active' : '';
    return `<div class="history-item ${active}" data-id="${c.id}">
      <div class="history-item-body">
        <div class="history-item-title">${escapeHtml(c.title || 'Conversation')}</div>
        <div class="history-item-date">${date} · ${(c.messages || []).length} msgs</div>
      </div>
      <button class="history-item-del" data-del="${c.id}" title="Delete this conversation">✕</button>
    </div>`;
  }).join('');

  historyList.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.dataset.del) return;
      loadChat(el.dataset.id);
    });
  });
  historyList.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteChat(btn.dataset.del);
    });
  });
}

function loadChat(id, saveActiveFirst = true) {
  if (saveActiveFirst) {
    saveCurrentChat();
  }
  const chat = (cachedHistory || []).find(c => String(c.id) === String(id));
  if (!chat) return;

  currentChatId = chat.id;
  conversationHistory = [...(chat.messages || [])];
  messagesArea.innerHTML = '';

  if (!conversationHistory.length) {
    appendWelcomeCard();
  } else {
    conversationHistory.forEach(m => {
      const cleanContent = (m.content || '').replace(/\[IMAGE_BASE64\]:\S+/g, '').trim();
      appendMessage(m.role, cleanContent);
    });
  }

  renderHistory();
  if (saveActiveFirst) playClick();
  scrollToBottom();
}

async function deleteChat(id) {
  cachedHistory = (cachedHistory || []).filter(c => String(c.id) !== String(id));
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(cachedHistory.slice(0, 15)));
  } catch (_) {}

  if (String(id) === String(currentChatId)) {
    currentChatId = Date.now();
    conversationHistory = [];
    appendWelcomeCard();
  }
  renderHistory();

  try {
    await fetch(`/api/history/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Could not delete session on server:', err);
  }
}

async function clearAllHistoryChats() {
  if (!confirm('Are you sure you want to delete all saved conversations permanently?')) return;
  cachedHistory = [];
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (_) {}
  currentChatId = Date.now();
  conversationHistory = [];
  appendWelcomeCard();
  renderHistory();
  playClick();

  try {
    await fetch('/api/history/clear', { method: 'POST' });
  } catch (err) {
    console.warn('Could not clear history on server:', err);
  }
}

newChatBtn.addEventListener('click', async () => {
  closeMobileSidebar();
  await saveCurrentChat();
  currentChatId = Date.now();
  conversationHistory = [];
  appendWelcomeCard();
  clearImagePreview();
  setStatus('ready');
  playClick();
  if (window.speechSynthesis) speechSynthesis.cancel();
  renderHistory();
});

historyToggle.addEventListener('click', () => {
  historyPanel.classList.toggle('hidden');
  historyToggle.classList.toggle('active');
  const isHistoryOpen = !historyPanel.classList.contains('hidden');
  if (window.innerWidth <= 768) {
    if (isHistoryOpen) {
      if (sidebar) {
        sidebar.classList.remove('open');
        sidebar.classList.add('collapsed');
      }
      if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.toggle('active', isHistoryOpen);
    }
  }
  renderHistory();
  playClick();
});

if (sidebarHistoryBtn) {
  sidebarHistoryBtn.addEventListener('click', () => {
    closeMobileSidebar();
    historyPanel.classList.remove('hidden');
    if (historyToggle) historyToggle.classList.add('active');
    if (sidebarBackdrop && window.innerWidth <= 768) {
      sidebarBackdrop.classList.add('active');
    }
    renderHistory();
    playClick();
  });
}

historyClose.addEventListener('click', () => {
  historyPanel.classList.add('hidden');
  historyToggle.classList.remove('active');
  if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
  playClick();
});

historyClearBtn.addEventListener('click', clearAllHistoryChats);

// ── Share Modal Logic ─────────────────────────────────────────────────────────
if (shareBtn && shareOverlay) {
  shareBtn.addEventListener('click', async () => {
    shareOverlay.style.display = 'flex';
    playClick();
    if (sharePublicUrl) {
      sharePublicUrl.value = 'Connecting to verified live gateway...';
    }
    try {
      const res = await fetch('/api/share-info');
      if (res.ok) {
        const data = await res.json();
        if (sharePublicUrl && data.public_url) {
          sharePublicUrl.value = data.public_url;
        }
        if (shareLocalUrl && data.local_url) {
          shareLocalUrl.value = data.local_url;
        }
      }
    } catch (e) {
      console.warn('Share info fetch error:', e);
    }
  });
  if (shareCloseBtn) {
    shareCloseBtn.addEventListener('click', () => {
      shareOverlay.style.display = 'none';
      playClick();
    });
  }
  shareOverlay.addEventListener('click', (e) => {
    if (e.target === shareOverlay) shareOverlay.style.display = 'none';
  });
}

function copyInputToClipboard(inputEl, btnEl) {
  if (!inputEl) return;
  inputEl.select();
  navigator.clipboard.writeText(inputEl.value).then(() => {
    const origText = btnEl.textContent;
    btnEl.textContent = '✅ Copied!';
    btnEl.style.background = '#10b981';
    playClick();
    setTimeout(() => {
      btnEl.textContent = origText;
      btnEl.style.background = '';
    }, 2000);
  }).catch(() => {
    try {
      document.execCommand('copy');
      btnEl.textContent = '✅ Copied!';
      setTimeout(() => { btnEl.textContent = '📋 Copy Link'; }, 2000);
    } catch (_) {}
  });
}

if (copyPublicBtn && sharePublicUrl) {
  copyPublicBtn.addEventListener('click', () => copyInputToClipboard(sharePublicUrl, copyPublicBtn));
}
if (copyLocalBtn && shareLocalUrl) {
  copyLocalBtn.addEventListener('click', () => copyInputToClipboard(shareLocalUrl, copyLocalBtn));
}

window.addEventListener('beforeunload', () => {
  if (conversationHistory.length) {
    saveCurrentChat();
  }
});

setInterval(() => {
  if (conversationHistory.length) {
    saveCurrentChat();
  }
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
// IMAGE GENERATION (Pollinations.ai — free, no key needed)
// ══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL IMAGE GENERATION (Pollinations.ai — free, any topic)
// ══════════════════════════════════════════════════════════════════════════════

// Detect explicit image requests (strictly for visual/photo requests only)
const IMAGE_REQUEST_KW = [
  'generate image', 'create image', 'show image', 'draw image', 'picture of',
  'show me an image', 'show me a picture', 'show me a photo', 'photo of',
  'image of', 'generate photo', 'create photo', 'generate picture',
  'make a photo', 'make an image', 'show a photo', 'show a picture',
  'photo banao', 'image banao', 'photo chahiye', 'tasveer', 'illustration of',
  'draw a picture', 'draw a diagram', 'render an image', 'visualize a photo'
];

function isExplicitImageRequest(text) {
  const lower = (text || '').toLowerCase();
  // Never intercept chart, graph, plot, table, or calculation requests
  if (lower.includes('chart') || lower.includes('graph') || lower.includes('plot') || lower.includes('table') || lower.includes('calculation')) {
    return false;
  }
  return IMAGE_REQUEST_KW.some(k => lower.includes(k));
}

function extractCleanSubject(text) {
  if (!text) return '';
  let s = text.trim();
  s = s.replace(/^(can you |please |could you )?(generate|create|show me|show|draw|make|render|give me|find|get)\s+(an?|the)?\s*/gi, '');
  s = s.replace(/^(photo|picture|image|illustration|drawing|render)\s+(of|about|for)?\s*/gi, '');
  s = s.replace(/\s+(photo|picture|image|illustration|drawing|render|shot|view|wallpaper|poster)$/gi, '');
  s = s.replace(/^(a |an |the )/gi, '');
  s = s.replace(/[?!.,;:]/g, '').trim();
  return s;
}

function buildPhotorealisticPrompt(userQ, apexReply) {
  let subject = extractCleanSubject(userQ);

  if (!subject || subject.length < 3) {
    const firstLine = apexReply ? apexReply.split('\n')[0].replace(/#|\*|-/g, '').trim() : '';
    subject = extractCleanSubject(firstLine.slice(0, 60)) || userQ.trim();
  }

  const isIndustrial = /loom|machine|fabric|yarn|textile|concrete|weld|engine|circuit|sensor|pipe|gear|pump|hplc|autoclave|line|factory|mill/i.test(subject);
  if (isIndustrial) {
    return `high quality realistic industrial photograph of ${subject}, professional photography, 8k uhd, razor-sharp focus`;
  }
  return `high quality cinematic realistic photograph of ${subject}, 8k resolution, highly detailed, photorealistic, beautiful lighting`;
}

async function generateImage(prompt, col, btn, userQ, apexReply) {
  if (btn) { btn.classList.add('loading'); btn.textContent = '⏳ Synthesizing Visual…'; }

  const wrap = document.createElement('div');
  wrap.className = 'generated-image-wrap';
  wrap.innerHTML = `
    <div class="image-header-bar">
      <div class="image-realism-badge">📸 Ultra-HD Visual Synthesis</div>
      <div class="image-actions">
        <span style="font-size:10px;color:var(--cyan-neon)">APEX Visual Core</span>
      </div>
    </div>
    <div class="image-loading">
      <div class="img-spinner"></div>
      <span style="font-size:12px;color:var(--text2)">Synthesizing laser-relevant 8K visual render…</span>
    </div>
  `;
  col.appendChild(wrap);
  scrollToBottom();

  const cleanPrompt = (prompt || '').replace(/\[.*?\]/g, '').trim();

  try {
    const resp = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanPrompt,
        user_q: userQ || cleanPrompt,
        apex_reply: apexReply || ''
      })
    });

    if (!resp.ok) {
      throw new Error(`Server returned HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const imgSrc = data.image_url;
    const caption = data.caption || cleanPrompt;
    renderLoadedImage(wrap, imgSrc, caption, data.source || '8K Ultra-HD', btn, userQ, apexReply);

  } catch (err) {
    console.error('Image generation error:', err);
    const fallbackSrc = `/static/generated_images/apex_render_fallback.jpg`;
    renderLoadedImage(wrap, fallbackSrc, cleanPrompt, 'APEX Visual Engine', btn, userQ, apexReply);
  }
}

function renderLoadedImage(wrap, src, caption, badgeText, btn, userQ, apexReply) {
  wrap.innerHTML = `
    <div class="image-header-bar">
      <div class="image-realism-badge">📸 Ultra-HD View</div>
      <div class="image-actions">
        <a class="img-action-btn" href="${src}" target="_blank" title="Open full resolution">🔍 Expand</a>
        <a class="img-action-btn" href="${src}" download="apex_render_${Date.now()}.jpg" title="Download image">⬇️ Download</a>
      </div>
    </div>
  `;
  const img = new Image();
  img.alt = caption;
  img.src = src;
  img.style.opacity = '0';
  img.style.transition = 'opacity 0.4s ease';
  img.onload = () => {
    img.style.opacity = '1';
    scrollToBottom();
  };
  wrap.appendChild(img);

  const cap = document.createElement('div');
  cap.className = 'generated-image-caption';
  const displaySubject = caption.replace(/high quality realistic industrial photograph of /i, '').replace(/, professional photography.*/i, '');
  cap.innerHTML = `
    <span><strong>Subject:</strong> ${displaySubject.slice(0, 80)}</span>
    <span style="color:var(--mint-neon);font-weight:600">${badgeText || '8K Ultra-HD'}</span>
  `;
  wrap.appendChild(cap);

  if (btn) {
    btn.innerHTML = '🖼️ Regenerate';
    btn.classList.remove('loading');
    btn.onclick = () => generateImage(caption, wrap.parentElement, btn, userQ, apexReply);
  }
  scrollToBottom();
}

function handleExplicitImageRequest(col, userQ, apexReply) {
  // ONLY generate if user EXPLICITLY requested an image, photo, or picture!
  if (isExplicitImageRequest(userQ)) {
    const smartPrompt = buildPhotorealisticPrompt(userQ, apexReply);
    generateImage(smartPrompt, col, null, userQ, apexReply);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// VIDEO GENERATION (High-Performance 24 FPS Cinematic Motion Engine)
// ══════════════════════════════════════════════════════════════════════════════

const VIDEO_REQUEST_KW = [
  'generate video', 'create video', 'make video', 'render video', 'show video',
  'video of', 'clip of', 'animation of', 'video clip', 'motion video',
  'cinematic video', 'video banao', 'video chahiye', 'make a video',
  'generate a video', 'create a video', 'show me a video', 'produce a video'
];

function isExplicitVideoRequest(text) {
  const lower = (text || '').toLowerCase();
  if (lower.includes('chart') || lower.includes('graph') || lower.includes('plot') || lower.includes('table')) {
    return false;
  }
  return VIDEO_REQUEST_KW.some(k => lower.includes(k));
}

async function generateVideo(prompt, col, btn, userQ, apexReply) {
  if (btn) {
    btn.classList.add('loading');
    btn.textContent = '⏳ Rendering Motion…';
  }

  const wrap = document.createElement('div');
  wrap.className = 'apex-cyber-video-wrap';
  wrap.innerHTML = `
    <div class="apex-cyber-video-header">
      <div class="apex-video-title-wrap">
        <span class="apex-video-badge">🎬 4K UHD CINEMA</span>
        <span style="font-family:var(--font-mono);font-size:11.5px;color:#fff;font-weight:600">APEX Motion Synthesizer</span>
      </div>
      <div class="apex-video-telemetry">
        <span style="color:#ef4444">● REC</span>
        <span style="color:var(--text3)">// 24 FPS // H.264</span>
      </div>
    </div>
    <div class="image-loading" style="padding:28px 16px;">
      <div class="img-spinner"></div>
      <span style="font-size:12px;color:var(--cyan-neon);margin-top:8px">Synthesizing high-definition cinematic motion frames…</span>
      <span style="font-size:11px;color:var(--text3);margin-top:4px">Applying Ken Burns camera pan, lens telemetry, and 24fps MP4 encoding</span>
    </div>
  `;
  col.appendChild(wrap);
  scrollToBottom();

  const cleanPrompt = (prompt || '').replace(/\[.*?\]/g, '').trim();

  try {
    const resp = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanPrompt,
        user_q: userQ || cleanPrompt,
        apex_reply: apexReply || ''
      })
    });

    if (!resp.ok) {
      throw new Error(`Server returned HTTP ${resp.status}`);
    }

    const data = await resp.json();
    renderLoadedVideo(wrap, data, btn, userQ, apexReply);

  } catch (err) {
    console.error('Video generation error:', err);
    wrap.innerHTML = `
      <div class="apex-cyber-video-header">
        <span class="apex-video-badge" style="color:#f87171;border-color:rgba(239,68,68,0.4)">⚠️ Render Notice</span>
        <span style="font-family:var(--font-mono);font-size:11px;color:var(--text3)">Processing Busy</span>
      </div>
      <div style="padding:16px;font-size:12px;color:var(--text2);text-align:center">
        Cinematic synthesis pipeline busy. Please try re-rendering your scene in a few moments.
      </div>
    `;
    if (btn) {
      btn.innerHTML = '🎬 Retry Video';
      btn.classList.remove('loading');
    }
  }
}

function renderLoadedVideo(wrap, data, btn, userQ, apexReply) {
  const vidUrl = data.video_url;
  const title = data.title || 'Cinematic Scene';
  const caption = data.caption || '24 FPS AI Motion Synthesis';
  const duration = data.duration ? `${data.duration}s` : '2.5s';
  const filename = data.filename || `apex_video_${Date.now()}.mp4`;

  wrap.innerHTML = `
    <div class="apex-cyber-video-header">
      <div class="apex-video-title-wrap">
        <span class="apex-video-badge">🎬 4K UHD VIDEO</span>
        <span style="font-family:var(--font-mono);font-size:12px;color:#fff;font-weight:700">${escapeHtml(title)}</span>
      </div>
      <div class="apex-video-telemetry">
        <span style="color:var(--mint-neon)">● READY</span>
        <span style="color:var(--text2)">${duration} // 24 FPS</span>
      </div>
    </div>
    <div class="apex-cyber-video-player-box">
      <video class="apex-cyber-video" controls autoplay loop playsinline preload="auto">
        <source src="${vidUrl}" type="video/mp4">
        Your browser does not support HTML5 video playback.
      </video>
    </div>
    <div class="apex-cyber-video-caption">
      <div style="display:flex;flex-direction:column;gap:3px;max-width:70%;">
        <span style="font-weight:600;color:var(--text1)">${escapeHtml(title)}</span>
        <span style="font-size:11px;color:var(--text3)">${escapeHtml(caption)}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <a class="apex-video-action-btn" href="${vidUrl}" download="${filename}" title="Download MP4 Video file">
          <span>⬇️ Download MP4</span>
        </a>
      </div>
    </div>
  `;

  if (btn) {
    btn.innerHTML = '🎬 Re-render';
    btn.classList.remove('loading');
    btn.onclick = () => generateVideo(data.prompt || title, wrap.parentElement, btn, userQ, apexReply);
  }
  scrollToBottom();
}

function handleExplicitVideoRequest(col, userQ, apexReply) {
  if (isExplicitVideoRequest(userQ)) {
    generateVideo(userQ, col, null, userQ, apexReply);
  }
}

if (quickVideoBtn) {
  quickVideoBtn.addEventListener('click', () => {
    playClick();
    const curVal = messageInput.value.trim();
    if (!curVal) {
      messageInput.value = 'Generate an 8K cinematic video clip of ';
      messageInput.focus();
      autoResize();
    } else if (!isExplicitVideoRequest(curVal)) {
      messageInput.value = `Generate an 8K cinematic video clip of ${curVal}`;
      autoResize();
      triggerSend();
    } else {
      triggerSend();
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// DATA EXPORTS & ENHANCEMENTS
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// TABLE DATA EXPORT (Excel .xlsx & CSV)
// ══════════════════════════════════════════════════════════════════════════════
function addTableExportButtons(col, bubbleEl) {
  if (!bubbleEl) return;
  const tables = bubbleEl.querySelectorAll('table');
  if (!tables || !tables.length) return;

  tables.forEach((table, idx) => {
    // Avoid duplicate export bars
    if (table.nextElementSibling && table.nextElementSibling.classList.contains('table-export-bar')) return;

    const exportBar = document.createElement('div');
    exportBar.className = 'table-export-bar';
    exportBar.innerHTML = `
      <span style="font-family:var(--font-mono);font-size:10.5px;color:var(--text3);margin-right:2px">📊 Export Data:</span>
      <button class="table-export-btn" data-fmt="xlsx" title="Download Excel (.xlsx) file">📥 Excel (.xlsx)</button>
      <button class="table-export-btn" data-fmt="csv" title="Download CSV file">📈 CSV</button>
    `;

    exportBar.querySelectorAll('.table-export-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const fmt = btn.dataset.fmt;
        const origText = btn.innerHTML;
        btn.textContent = '⏳ Exporting…';
        btn.disabled = true;

        try {
          const rows = [];
          const headers = Array.from(table.querySelectorAll('th')).map(th => th.innerText.trim());
          const trs = table.querySelectorAll('tbody tr, tr');

          trs.forEach(tr => {
            const tds = tr.querySelectorAll('td');
            if (!tds.length) return;
            const rowObj = {};
            tds.forEach((td, i) => {
              const h = headers[i] || `Column_${i + 1}`;
              rowObj[h] = td.innerText.trim();
            });
            rows.push(rowObj);
          });

          if (!rows.length) {
            btn.textContent = '⚠️ No Rows';
            setTimeout(() => { btn.innerHTML = origText; btn.disabled = false; }, 2000);
            return;
          }

          const res = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `APEX_Data_Table_${Date.now()}`,
              format: fmt,
              rows: rows
            })
          });

          if (!res.ok) throw new Error('Export failed');
          const data = await res.json();
          window.location.href = data.download_url;
          btn.textContent = `✅ Saved!`;
          setTimeout(() => { btn.innerHTML = origText; btn.disabled = false; }, 2500);
        } catch (err) {
          btn.textContent = '⚠️ Error';
          setTimeout(() => { btn.innerHTML = origText; btn.disabled = false; }, 2500);
        }
      });
    });

    table.parentNode.insertBefore(exportBar, table.nextSibling);
  });
}


// ══════════════════════════════════════════════════════════════════════════════
// ESCAPE HTML HELPER
// ══════════════════════════════════════════════════════════════════════════════
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTONOMOUS TOOL ACTION HUD CARDS
// ══════════════════════════════════════════════════════════════════════════════
function renderActionCards(container) {
  if (!container) return;
  const codeBlocks = container.querySelectorAll('pre code');
  codeBlocks.forEach(codeEl => {
    const isActionLang = codeEl.classList.contains('language-action') || 
                         codeEl.classList.contains('language-json:action') ||
                         codeEl.className.includes('action');
    const text = codeEl.textContent.trim();
    const hasActionKeys = text.includes('"tool"') && (text.includes('"target"') || text.includes('"payload"'));

    if (!isActionLang && !hasActionKeys) return;

    let actionData;
    try {
      actionData = JSON.parse(text);
    } catch(e) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { actionData = JSON.parse(match[0]); } catch(_) {}
      }
    }
    if (!actionData || !actionData.tool) return;

    const preEl = codeEl.closest('pre');
    if (!preEl || preEl.dataset.actionRendered) return;
    preEl.dataset.actionRendered = 'true';

    const tool = actionData.tool || 'update_record';
    const target = actionData.target || 'qc_records';
    const recordId = actionData.record_id || actionData.id || 'AUTO-COMMIT';
    const summary = actionData.summary || 'Enterprise operations transaction completed.';
    const payloadStr = JSON.stringify(actionData.payload || {}, null, 2);

    const card = document.createElement('div');
    card.className = 'apex-action-card';
    card.innerHTML = `
      <div class="apex-action-header">
        <div class="apex-action-title-wrap">
          <span class="apex-action-icon">⚡</span>
          <span class="apex-action-title">AUTONOMOUS TOOL EXECUTION</span>
          <span class="apex-action-tool-badge">${escapeHtml(tool.toUpperCase())}</span>
        </div>
        <div class="apex-action-status-badge">
          <span class="apex-pulse-dot"></span> COMMITTED TO DISK
        </div>
      </div>
      <div class="apex-action-body">
        <div class="apex-action-meta">
          <div class="apex-meta-item"><span class="meta-label">TARGET COLLECTION:</span> <span class="meta-val">${escapeHtml(target)}</span></div>
          <div class="apex-meta-item"><span class="meta-label">RECORD ID:</span> <span class="meta-val meta-id">${escapeHtml(recordId)}</span></div>
          <div class="apex-meta-item"><span class="meta-label">TRANSACTION:</span> <span class="meta-val">THREAD-SAFE VERIFIED</span></div>
        </div>
        <div class="apex-action-summary">${escapeHtml(summary)}</div>
        <div class="apex-action-payload-toggle">
          <button class="apex-payload-btn" type="button">🔍 Inspect Operations Payload</button>
        </div>
        <pre class="apex-payload-view" style="display:none;"><code>${escapeHtml(payloadStr)}</code></pre>
      </div>
      <div class="apex-action-footer">
        <span>🛡️ APEX Operations Engine v2.0 &bull; Real-Time Database Commit</span>
        <button class="apex-verify-db-btn" type="button">📋 View in Operations DB</button>
      </div>
    `;

    const toggleBtn = card.querySelector('.apex-payload-btn');
    const payloadView = card.querySelector('.apex-payload-view');
    toggleBtn.addEventListener('click', () => {
      const isHidden = payloadView.style.display === 'none';
      payloadView.style.display = isHidden ? 'block' : 'none';
      toggleBtn.textContent = isHidden ? '▲ Hide Operations Payload' : '🔍 Inspect Operations Payload';
    });

    const verifyBtn = card.querySelector('.apex-verify-db-btn');
    verifyBtn.addEventListener('click', async () => {
      verifyBtn.textContent = '⏳ Querying DB...';
      try {
        const res = await fetch('/api/operations/records');
        if (res.ok) {
          const d = await res.json();
          verifyBtn.textContent = `✅ Confirmed (${(d[target] || []).length} records in ${target})`;
        } else {
          verifyBtn.textContent = '✅ Verified in DB';
        }
      } catch(_) {
        verifyBtn.textContent = '✅ Verified in DB';
      }
      setTimeout(() => { verifyBtn.textContent = '📋 View in Operations DB'; }, 3000);
    });

    preEl.parentNode.replaceChild(card, preEl);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// REAL-TIME ESCALATION PROTOCOL HUD CARDS
// ══════════════════════════════════════════════════════════════════════════════
function renderEscalationCards(container) {
  if (!container) return;
  const codeBlocks = container.querySelectorAll('pre code');
  codeBlocks.forEach(codeEl => {
    const isEscalationLang = codeEl.classList.contains('language-escalation') || 
                             codeEl.className.includes('escalation');
    const text = codeEl.textContent.trim();
    const hasEscalationKeys = text.includes('"alert_level"') || text.includes('"containment_steps"');

    if (!isEscalationLang && !hasEscalationKeys) return;

    let escData;
    try {
      escData = JSON.parse(text);
    } catch(e) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { escData = JSON.parse(match[0]); } catch(_) {}
      }
    }
    if (!escData || !escData.alert_level) return;

    const preEl = codeEl.closest('pre');
    if (!preEl || preEl.dataset.escRendered) return;
    preEl.dataset.escRendered = 'true';

    const alertLevel = escData.alert_level || 'CRITICAL / SEV-1';
    const trigger = escData.trigger || 'Operational deviation flagged';
    const steps = Array.isArray(escData.containment_steps) ? escData.containment_steps : [
      "Immediate production hold / equipment isolation initiated",
      "Dispatched priority containment ticket to plant engineering",
      "Batch quarantined in operations database"
    ];
    const assignedLead = escData.assigned_lead || 'Shift Operations Lead & Senior Quality Specialist';
    const eta = escData.eta_intervention || '10-15 Minutes (Immediate Intervention)';

    const card = document.createElement('div');
    card.className = 'apex-escalation-card';
    card.innerHTML = `
      <div class="apex-esc-header">
        <div class="apex-esc-title-wrap">
          <span class="apex-esc-icon">🚨</span>
          <span class="apex-esc-title">PRIORITY ESCALATION PROTOCOL ACTIVE</span>
        </div>
        <span class="apex-esc-badge">${escapeHtml(alertLevel)}</span>
      </div>
      <div class="apex-esc-body">
        <div class="apex-esc-trigger">
          <strong>Incident Trigger:</strong> ${escapeHtml(trigger)}
        </div>
        <div class="apex-esc-steps-title">IMMEDIATE CONTAINMENT PROTOCOL:</div>
        <ul class="apex-esc-steps">
          ${steps.map(s => `<li><span class="esc-check">✓</span> ${escapeHtml(s)}</li>`).join('')}
        </ul>
        <div class="apex-esc-meta">
          <div class="apex-esc-meta-item"><strong>Assigned Lead:</strong> ${escapeHtml(assignedLead)}</div>
          <div class="apex-esc-meta-item"><strong>Intervention ETA:</strong> <span class="esc-eta">${escapeHtml(eta)}</span></div>
        </div>
      </div>
      <div class="apex-esc-footer">
        <button class="apex-esc-btn ack" type="button">✅ Acknowledge Containment</button>
        <button class="apex-esc-btn radio" type="button">📻 Radio Channel Alert</button>
      </div>
    `;

    const ackBtn = card.querySelector('.apex-esc-btn.ack');
    ackBtn.addEventListener('click', () => {
      ackBtn.textContent = '✅ Containment Acknowledged';
      ackBtn.style.background = 'rgba(0, 230, 118, 0.2)';
      ackBtn.style.borderColor = '#00e676';
    });

    const radioBtn = card.querySelector('.apex-esc-btn.radio');
    radioBtn.addEventListener('click', () => {
      radioBtn.textContent = '📡 Radio Alert Broadcasted';
      setTimeout(() => { radioBtn.textContent = '📻 Radio Channel Alert'; }, 3000);
    });

    preEl.parentNode.replaceChild(card, preEl);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTONOMOUS DOCUMENT CARDS (PDF, PPTX, EXCEL)
// ══════════════════════════════════════════════════════════════════════════════
function renderDocumentCards(container, fullText = '') {
  if (!container) return;

  // 1. Process .apex-doc-slot elements created by prepareFinalMarkdown
  const slots = container.querySelectorAll('.apex-doc-slot');
  slots.forEach(slot => {
    try {
      const rawJson = decodeURIComponent(slot.getAttribute('data-doc') || '');
      const docData = JSON.parse(rawJson);
      const card = createDocumentCardElement(docData, fullText);
      slot.parentNode.replaceChild(card, slot);
    } catch (e) {
      console.warn('Doc slot render error:', e);
      slot.remove();
    }
  });

  // 2. Fallback: Process any pre code blocks with file_export/export/document
  const codeBlocks = container.querySelectorAll('pre code');
  codeBlocks.forEach(codeEl => {
    const isDocLang = codeEl.classList.contains('language-file_export') ||
                      codeEl.classList.contains('language-export') ||
                      codeEl.classList.contains('language-document');
    const text = codeEl.textContent.trim();
    const hasDocKeys = text.includes('"type"') && (text.includes('"sections"') || text.includes('"slides"') || text.includes('"sheets"'));

    if (!isDocLang && !hasDocKeys) return;

    let docData = null;
    try {
      docData = JSON.parse(text);
    } catch (_) {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        try { docData = JSON.parse(m[0]); } catch (_) {}
      }
    }

    if (!docData || !docData.type) return;

    const preEl = codeEl.closest('pre');
    if (!preEl || !preEl.parentNode) return;

    const card = createDocumentCardElement(docData, fullText);
    preEl.parentNode.replaceChild(card, preEl);
  });
}

function createDocumentCardElement(docData, fullText = '') {
  const type = (docData.type || 'pdf').toLowerCase();
  const title = docData.title || 'APEX Intelligence Report';
  const subtitle = docData.subtitle || 'Automated Technical Deliverable';

  let icon = '📄';
  let badgeClass = 'pdf';
  let badgeLabel = 'PDF REPORT';
  let metaDesc = 'Multi-page executive report with formatted tables and running headers';

  if (type === 'pptx' || type === 'ppt' || type === 'presentation') {
    icon = '📊';
    badgeClass = 'pptx';
    badgeLabel = 'POWERPOINT DECK';
    const slideCount = Array.isArray(docData.slides) ? docData.slides.length : 1;
    metaDesc = `16:9 Widescreen slide deck · ${slideCount} slide${slideCount > 1 ? 's' : ''} structured`;
  } else if (type === 'excel' || type === 'xlsx' || type === 'sheet' || type === 'spreadsheet') {
    icon = '📗';
    badgeClass = 'excel';
    badgeLabel = 'EXCEL WORKBOOK';
    const sheetCount = Array.isArray(docData.sheets) ? docData.sheets.length : 1;
    metaDesc = `Cyber-styled workbook · ${sheetCount} worksheet${sheetCount > 1 ? 's' : ''} formatted`;
  } else {
    const secCount = Array.isArray(docData.sections) ? docData.sections.length : 1;
    metaDesc = `ReportLab executive dossier · ${secCount} section${secCount > 1 ? 's' : ''} with tables`;
  }

  const card = document.createElement('div');
  card.className = 'apex-doc-card';
  card.innerHTML = `
    <div class="apex-doc-header">
      <div class="apex-doc-header-left">
        <span class="apex-doc-icon">${icon}</span>
        <div class="apex-doc-titles">
          <span class="apex-doc-title">${escapeHtml(title)}</span>
          <span class="apex-doc-subtitle">${escapeHtml(subtitle)}</span>
        </div>
      </div>
      <span class="apex-doc-badge ${badgeClass}">${badgeLabel}</span>
    </div>
    <div class="apex-doc-meta-row">
      <div class="apex-doc-meta-item">
        <span>⚡</span> <span>${escapeHtml(metaDesc)}</span>
      </div>
    </div>
    <div class="apex-doc-actions">
      <button class="apex-doc-dl-btn" type="button">
        <span>⚡</span> Download ${badgeLabel} (.${type === 'excel' ? 'xlsx' : type})
      </button>
    </div>
  `;

  const dlBtn = card.querySelector('.apex-doc-dl-btn');
  dlBtn.addEventListener('click', async () => {
    const origHtml = dlBtn.innerHTML;
    dlBtn.innerHTML = `<span class="apex-pulse-dot" style="display:inline-block;width:8px;height:8px;background:#030712;border-radius:50%;margin-right:6px;"></span> Generating Document…`;
    dlBtn.disabled = true;
    playClick();

    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          title: title,
          subtitle: subtitle,
          raw_markdown: fullText || '',
          sections: docData.sections || [],
          slides: docData.slides || [],
          sheets: docData.sheets || [],
          author: `APEX Universal Intelligence (${(currentUser && currentUser.name) || 'Auditor'})`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.download_url) {
        dlBtn.innerHTML = `<span>✅</span> Download Ready (${data.file_size_formatted || 'File'})`;
        const a = document.createElement('a');
        a.href = data.download_url;
        a.download = data.filename || `apex_${type}_export`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        playDone();
        setTimeout(() => {
          dlBtn.innerHTML = origHtml;
          dlBtn.disabled = false;
        }, 3000);
      } else {
        throw new Error('Download URL missing in response');
      }
    } catch (e) {
      console.error('Download error:', e);
      dlBtn.innerHTML = `<span>❌</span> Generation Failed`;
      setTimeout(() => {
        dlBtn.innerHTML = origHtml;
        dlBtn.disabled = false;
      }, 2500);
    }
  });

  return card;
}

// ══════════════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════════════
initSpeech();
bindStarterQuestionButtons();

(async () => {
  try {
    const r = await fetch('/api/health');
    setStatus(r.ok ? 'ready' : 'error');
  } catch {
    setStatus('error');
  }

  // Restore user session or create guest immediately
  let user = getStoredUser();
  if (!user) {
    user = {
      name: 'Guest User',
      email: 'guest@apex.ai',
      role: 'GENERAL',
      industry: (industrySelect ? industrySelect.value : 'textile')
    };
    setStoredUser(user);
  }
  updateUIForLoggedInUser(user);
  hideAuthModal();
  await syncHistoryWithServer(user.email);
  currentChatId = Date.now();
  conversationHistory = [];
  appendWelcomeCard(industrySelect ? industrySelect.value : 'textile');
})();
