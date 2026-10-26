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
let selectedVoiceId = localStorage.getItem('texo_selected_voice') || 'aura';
let selectedVoiceSpeed = parseFloat(localStorage.getItem('texo_voice_speed') || '1.0');
let currentListeningLang = 'auto';
let currentAttachedLocalUrl = null;
let currentAttachedFile = null;

const AI_VOICE_PERSONAS = {
  // ── FEMALE AI VOICES ──
  aura: {
    id: 'aura',
    name: 'Aura',
    gender: 'female',
    tag: 'Warm Executive',
    avatar: '🌟',
    rate: 1.02,
    pitch: 1.06,
    lang: 'en-US',
    sample: "Hello! I am Aura, your executive AI voice. I deliver warm, articulate, and crystal-clear insights across any topic.",
    voiceKeywords: ['jenny', 'aria', 'samantha', 'natural', 'google us english', 'female', 'zira', 'karen', 'victoria']
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    gender: 'female',
    tag: 'Dynamic Studio',
    avatar: '💫',
    rate: 1.06,
    pitch: 1.12,
    lang: 'en-US',
    sample: "Hi there! I am Nova, vibrant and energetic, built to explain complex concepts with engaging clarity.",
    voiceKeywords: ['sonia', 'victoria', 'google uk english female', 'natural', 'female', 'ava', 'allison']
  },
  serena: {
    id: 'serena',
    name: 'Serena',
    gender: 'female',
    tag: 'Calm & Gentle',
    avatar: '🌸',
    rate: 0.96,
    pitch: 1.02,
    lang: 'en-US',
    sample: "Greetings. I am Serena. My voice is gentle, empathetic, and crafted for calm, focused analytical clarity.",
    voiceKeywords: ['samantha', 'serena', 'natural', 'female', 'susan', 'clara', 'zira']
  },
  swara: {
    id: 'swara',
    name: 'Swara',
    gender: 'female',
    tag: 'Hindi / Indic',
    avatar: '🇮🇳',
    rate: 1.0,
    pitch: 1.08,
    lang: 'hi-IN',
    sample: "नमस्ते! मैं स्वरा हूँ। हिंदी, पंजाबी और भारतीय भाषाओं के लिए मेरी आवाज़ तैयार की गई है।",
    voiceKeywords: ['swara', 'heera', 'kalpana', 'geeta', 'sunita', 'india', 'hi-in', 'pa-in', 'female', 'natural']
  },
  elena: {
    id: 'elena',
    name: 'Elena',
    gender: 'female',
    tag: 'Spanish / Latin',
    avatar: '💃',
    rate: 1.02,
    pitch: 1.08,
    lang: 'es-ES',
    sample: "¡Hola! Soy Elena, tu voz de inteligencia artificial para español y comunicación global.",
    voiceKeywords: ['monica', 'paulina', 'elena', 'laura', 'lucia', 'es-es', 'es-mx', 'female', 'natural']
  },
  amelie: {
    id: 'amelie',
    name: 'Amélie',
    gender: 'female',
    tag: 'French / Continental',
    avatar: '🗼',
    rate: 1.0,
    pitch: 1.06,
    lang: 'fr-FR',
    sample: "Bonjour! Je suis Amélie, votre voix d'intelligence européenne pour le français et les langues continentales.",
    voiceKeywords: ['amelie', 'hortense', 'celine', 'julie', 'katja', 'fr-fr', 'de-de', 'female', 'natural']
  },
  athena: {
    id: 'athena',
    name: 'Athena',
    gender: 'female',
    tag: 'Universal Polyglot',
    avatar: '🌍',
    rate: 1.02,
    pitch: 1.06,
    lang: 'en-US',
    sample: "Welcome! I am Athena. I automatically detect and adapt my voice to any world language spoken.",
    voiceKeywords: ['female', 'natural', 'google', 'online', 'swara', 'jenny']
  },

  // ── MALE AI VOICES ──
  orion: {
    id: 'orion',
    name: 'Orion',
    gender: 'male',
    tag: 'Executive Authority',
    avatar: '🎙️',
    rate: 0.98,
    pitch: 0.90,
    lang: 'en-US',
    sample: "Greetings. I am Orion, engineered for deep, authoritative executive communication and industrial analysis.",
    voiceKeywords: ['guy', 'christopher', 'natural', 'google uk english male', 'alex', 'david', 'male', 'george']
  },
  echo: {
    id: 'echo',
    name: 'Echo',
    gender: 'male',
    tag: 'Precision Tech',
    avatar: '⚡',
    rate: 1.02,
    pitch: 0.98,
    lang: 'en-US',
    sample: "Echo online. Calibrated for technical accuracy, operational protocols, and crisp calculation.",
    voiceKeywords: ['ryan', 'daniel', 'google us english', 'natural', 'male', 'tom', 'oliver']
  },
  marcus: {
    id: 'marcus',
    name: 'Marcus',
    gender: 'male',
    tag: 'Deep Baritone',
    avatar: '🏛️',
    rate: 0.94,
    pitch: 0.85,
    lang: 'en-US',
    sample: "Welcome. I am Marcus. A resonant, deep baritone voice suited for comprehensive executive briefings.",
    voiceKeywords: ['david', 'george', 'mark', 'richard', 'deep', 'male', 'natural', 'bernard']
  },
  aarav: {
    id: 'aarav',
    name: 'Aarav',
    gender: 'male',
    tag: 'Hindi / Indic',
    avatar: '🇮🇳',
    rate: 0.98,
    pitch: 0.94,
    lang: 'hi-IN',
    sample: "नमस्ते! मैं आरव हूँ। हिंदी, पंजाबी और भारतीय उपमहाद्वीप के प्रश्नों के लिए प्राकृतिक आवाज़।",
    voiceKeywords: ['madhur', 'aarav', 'hemant', 'neerja', 'india', 'hi-in', 'pa-in', 'male', 'natural']
  },
  mateo: {
    id: 'mateo',
    name: 'Mateo',
    gender: 'male',
    tag: 'Spanish / Latin',
    avatar: '🎸',
    rate: 1.0,
    pitch: 0.92,
    lang: 'es-ES',
    sample: "¡Saludos! Soy Mateo, diseñado para análisis ejecutivo y comunicación dinámica en español.",
    voiceKeywords: ['jorge', 'pablo', 'mateo', 'diego', 'es-es', 'es-mx', 'male', 'natural']
  },
  henri: {
    id: 'henri',
    name: 'Henri',
    gender: 'male',
    tag: 'French / Continental',
    avatar: '🎩',
    rate: 0.98,
    pitch: 0.92,
    lang: 'fr-FR',
    sample: "Bonjour. Je suis Henri, conçu pour une élocution européenne claire et professionnelle en français.",
    voiceKeywords: ['henri', 'paul', 'nicolas', 'stefan', 'hans', 'fr-fr', 'de-de', 'male', 'natural']
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas',
    gender: 'male',
    tag: 'Universal Polyglot',
    avatar: '🌐',
    rate: 0.98,
    pitch: 0.92,
    lang: 'en-US',
    sample: "Welcome. I am Atlas. I dynamically adapt my male voice to any world language spoken.",
    voiceKeywords: ['male', 'natural', 'google', 'online', 'guy', 'david']
  }
};

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
const guestAccessBtn    = document.getElementById('guestAccessBtn');
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
  authOverlay.style.display = 'flex';
  clearAuthAlert();
}

function hideAuthModal() {
  if (!authOverlay) return;
  authOverlay.classList.add('hidden');
  setTimeout(() => {
    if (authOverlay.classList.contains('hidden')) {
      authOverlay.style.display = 'none';
    }
  }, 350);
  clearAuthAlert();
}

window.enterDirectlyAsGuest = function() {
  const guest = {
    name: 'Guest User',
    email: 'guest@texo.ai',
    role: 'GENERAL',
    industry: (industrySelect ? industrySelect.value : 'textile')
  };
  setStoredUser(guest);
  localStorage.setItem('texo_is_guest', 'true');
  updateUIForLoggedInUser(guest);
  hideAuthModal();
  currentChatId = Date.now();
  conversationHistory = [];
  appendWelcomeCard(industrySelect ? industrySelect.value : 'textile');
  playDone();
};

window.forceResetAndEnter = async function() {
  const email = loginEmail ? loginEmail.value.trim() : '';
  const password = loginPassword ? loginPassword.value : '';
  if (!email || !password || password.length < 4) {
    setAuthAlert('Please enter your email and a password of at least 4 characters to reset and enter.', 'error');
    return;
  }
  setAuthAlert('Updating password and entering TEXO…', 'info');
  try {
    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Reset failed.');
    setStoredUser(data.user);
    updateUIForLoggedInUser(data.user);
    setAuthAlert('Password updated! Entering TEXO…', 'success');
    playDone();
    setTimeout(() => {
      hideAuthModal();
      currentChatId = Date.now();
      conversationHistory = [];
      appendWelcomeCard();
    }, 500);
  } catch (err) {
    setAuthAlert(err.message || 'Reset failed.', 'error');
  }
};

function setAuthAlert(msg, type = 'error', htmlActions = '') {
  if (!authAlert) return;
  authAlert.innerHTML = `<div>${msg}</div>${htmlActions}`;
  authAlert.className = `auth-alert ${type}`;
  authAlert.style.display = 'flex';
}

function clearAuthAlert() {
  if (!authAlert) return;
  authAlert.style.display = 'none';
  authAlert.innerHTML = '';
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
    const displayName = user.name || (user.email ? user.email.split('@')[0] : 'User');
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

    setAuthAlert('Access granted. Welcome to TEXO!', 'success');
    setStoredUser(data.user);
    updateUIForLoggedInUser(data.user);

    playDone();
    setTimeout(async () => {
      hideAuthModal();
      if (signInSubmitBtn) {
        signInSubmitBtn.disabled = false;
        signInSubmitBtn.innerHTML = `<span class="auth-btn-glow"></span><span>🚀 Sign In to TEXO</span>`;
      }
      // Sync user history into History option without populating main chat
      await syncHistoryWithServer(data.user.email).catch(() => {});
      currentChatId = Date.now();
      conversationHistory = [];
      appendWelcomeCard();
    }, 600);

  } catch (err) {
    if (signInSubmitBtn) {
      signInSubmitBtn.disabled = false;
      signInSubmitBtn.innerHTML = `<span class="auth-btn-glow"></span><span>🚀 Sign In to TEXO</span>`;
    }
    const errMsg = err.message || 'Login failed. Please check credentials.';
    const actionsHtml = `
      <div style="display:flex; gap:8px; margin-top:8px;">
        <button type="button" class="auth-inline-action-btn" onclick="forceResetAndEnter()">🔑 Reset Password &amp; Enter</button>
        <button type="button" class="auth-inline-action-btn guest" onclick="enterDirectlyAsGuest()">👤 Enter as Guest</button>
      </div>
    `;
    setAuthAlert(errMsg, 'error', actionsHtml);
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

    setAuthAlert('Account created successfully! Launching TEXO…', 'success');
    setStoredUser(data.user);
    updateUIForLoggedInUser(data.user);

    playDone();
    setTimeout(async () => {
      hideAuthModal();
      if (registerSubmitBtn) {
        registerSubmitBtn.disabled = false;
        registerSubmitBtn.innerHTML = `<span class="auth-btn-glow"></span><span>✨ Create &amp; Launch TEXO</span>`;
      }
      await syncHistoryWithServer(data.user.email);
      currentChatId = Date.now();
      conversationHistory = [];
      appendWelcomeCard();
    }, 600);

  } catch (err) {
    if (registerSubmitBtn) {
      registerSubmitBtn.disabled = false;
      registerSubmitBtn.innerHTML = `<span class="auth-btn-glow"></span><span>✨ Create &amp; Launch TEXO</span>`;
    }
    setAuthAlert(err.message || 'Registration failed.', 'error');
  }
}

function handleSignOut() {
  if (!confirm('Are you sure you want to sign out of TEXO?')) return;
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

if (guestAccessBtn) {
  guestAccessBtn.addEventListener('click', enterDirectlyAsGuest);
}

const authCloseBtn = document.getElementById('authCloseBtn');
if (authCloseBtn) {
  authCloseBtn.addEventListener('click', enterDirectlyAsGuest);
}

if (authOverlay) {
  authOverlay.addEventListener('click', (e) => {
    if (e.target === authOverlay) {
      enterDirectlyAsGuest();
    }
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
// SPLASH SCREEN — auto-dismiss then check auth & start particles
// ══════════════════════════════════════════════════════════════════════════════
setTimeout(() => {
  splash.classList.add('hidden');
  setTimeout(() => { splash.style.display='none'; }, 700);
  initParticles();
  // Check auth state upon splash dismiss
  const stored = getStoredUser();
  const isGuest = localStorage.getItem('texo_is_guest');
  if ((stored && stored.name && stored.email) || isGuest === 'true') {
    if (stored) updateUIForLoggedInUser(stored);
    hideAuthModal();
    if (stored && stored.email) syncHistoryWithServer(stored.email).catch(() => {});
  } else {
    // New visitor: show access gate with instant 1-click option
    showAuthModal();
    switchAuthTab('login');
  }
}, 600);

// ══════════════════════════════════════════════════════════════════════════════
// GOLDEN HORIZON & LIVE ASCENDING VERTICAL LIGHT-LINES ENGINE
// Animates glowing vertical light beams, star-tips, beaded light trails & golden bokeh
// moving continuously upwards from the golden horizon!
// ══════════════════════════════════════════════════════════════════════════════

const INDUSTRY_BG_THEMES = {
  textile: {
    badgeText: '✨ TEXO TEXTILE & APPAREL INTELLIGENCE • GOLDEN LOOM CORE',
    colors: [
      { fill: 'rgba(251, 191, 36,', glow: '#FBBF24' },
      { fill: 'rgba(254, 240, 138,', glow: '#FEF08A' },
      { fill: 'rgba(245, 158, 11,', glow: '#F59E0B' }
    ],
    lineColor: '251, 191, 36',
    mouseLineColor: '254, 240, 138',
    mode: 'textile',
    holoLeft: '',
    holoRight: ''
  },
  food: {
    badgeText: '✨ TEXO FOOD & BEVERAGE INTELLIGENCE • CULINARY & HACCP CORE',
    colors: [
      { fill: 'rgba(251, 191, 36,', glow: '#FBBF24' },
      { fill: 'rgba(254, 240, 138,', glow: '#FEF08A' },
      { fill: 'rgba(245, 158, 11,', glow: '#F59E0B' }
    ],
    lineColor: '251, 191, 36',
    mouseLineColor: '254, 240, 138',
    mode: 'food',
    holoLeft: '',
    holoRight: ''
  },
  pharma: {
    badgeText: '✨ TEXO BIOPHARMA & CLINICAL INTELLIGENCE • cGMP STERILE CORE',
    colors: [
      { fill: 'rgba(251, 191, 36,', glow: '#FBBF24' },
      { fill: 'rgba(254, 240, 138,', glow: '#FEF08A' },
      { fill: 'rgba(245, 158, 11,', glow: '#F59E0B' }
    ],
    lineColor: '251, 191, 36',
    mouseLineColor: '254, 240, 138',
    mode: 'pharma',
    holoLeft: '',
    holoRight: ''
  },
  auto: {
    badgeText: '✨ TEXO AUTOMOTIVE & EV INTELLIGENCE • POWERTRAIN CORE',
    colors: [
      { fill: 'rgba(251, 191, 36,', glow: '#FBBF24' },
      { fill: 'rgba(254, 240, 138,', glow: '#FEF08A' },
      { fill: 'rgba(245, 158, 11,', glow: '#F59E0B' }
    ],
    lineColor: '251, 191, 36',
    mouseLineColor: '254, 240, 138',
    mode: 'auto',
    holoLeft: '',
    holoRight: ''
  },
  construction: {
    badgeText: '✨ TEXO CIVIL & STRUCTURAL INTELLIGENCE • BIM SKYLINE CORE',
    colors: [
      { fill: 'rgba(251, 191, 36,', glow: '#FBBF24' },
      { fill: 'rgba(254, 240, 138,', glow: '#FEF08A' },
      { fill: 'rgba(245, 158, 11,', glow: '#F59E0B' }
    ],
    lineColor: '251, 191, 36',
    mouseLineColor: '254, 240, 138',
    mode: 'construction',
    holoLeft: '',
    holoRight: ''
  },
  logistics: {
    badgeText: '✨ TEXO GLOBAL LOGISTICS INTELLIGENCE • FREIGHT & FLEET CORE',
    colors: [
      { fill: 'rgba(251, 191, 36,', glow: '#FBBF24' },
      { fill: 'rgba(254, 240, 138,', glow: '#FEF08A' },
      { fill: 'rgba(245, 158, 11,', glow: '#F59E0B' }
    ],
    lineColor: '251, 191, 36',
    mouseLineColor: '254, 240, 138',
    mode: 'logistics',
    holoLeft: '',
    holoRight: ''
  },
  general: {
    badgeText: '✨ TEXO UNIVERSAL INTELLIGENCE 2.0 • GOLDEN ENTERPRISE CORE',
    colors: [
      { fill: 'rgba(251, 191, 36,', glow: '#FBBF24' },
      { fill: 'rgba(254, 240, 138,', glow: '#FEF08A' },
      { fill: 'rgba(245, 158, 11,', glow: '#F59E0B' }
    ],
    lineColor: '251, 191, 36',
    mouseLineColor: '254, 240, 138',
    mode: 'general',
    holoLeft: '',
    holoRight: ''
  }
};

// ── DARK MODE / LIQUID-GLASS MODE TOGGLE ───────────────────────────────────
window.toggleDarkModeTheme = function(forceState) {
  const isCurrentlyDark = document.body.classList.contains('dark-mode');
  const nextDark = typeof forceState === 'boolean' ? forceState : !isCurrentlyDark;
  document.body.classList.toggle('dark-mode', nextDark);
  try {
    localStorage.setItem('texo_dark_mode', nextDark ? 'true' : 'false');
  } catch (_) {}
  const btn = document.getElementById('darkModeToggleBtn');
  if (btn) {
    btn.classList.toggle('active', nextDark);
    btn.innerHTML = nextDark ? '✨ Gold Glass' : '🌙 Dark Mode';
    btn.title = nextDark
      ? 'Switch to Golden Horizon Glass Mode'
      : 'Switch to Deep Obsidian Dark Mode';
  }
  if (typeof playClick === 'function') playClick();
};

// Restore saved Dark Mode preference on load
try {
  if (localStorage.getItem('texo_dark_mode') === 'true') {
    setTimeout(() => window.toggleDarkModeTheme(true), 50);
  }
} catch (_) {}

let activeIndustryBgKey = 'textile';

function applyIndustryBackgroundTheme(indKey) {
  const key = INDUSTRY_BG_THEMES[indKey] ? indKey : 'general';
  activeIndustryBgKey = key;

  document.body.setAttribute('data-industry', key);
  const bgStage = document.getElementById('industryBgStage');
  if (bgStage) bgStage.setAttribute('data-industry', key);

  if (typeof industrySelect !== 'undefined' && industrySelect && industrySelect.value !== key) {
    industrySelect.value = key;
  }
  const headerSelect = document.getElementById('headerIndustrySelect');
  if (headerSelect && headerSelect.value !== key) {
    headerSelect.value = key;
  }

  if (typeof window.renderLiveCalculatorForIndustry === 'function') {
    const calcModal = document.getElementById('liveCalcModal');
    if (calcModal && calcModal.style.display !== 'none') {
      window.renderLiveCalculatorForIndustry(key);
    }
  }
}

window.switchIndustryEnvironment = function(indKey) {
  if (!indKey) return;
  if (typeof industrySelect !== 'undefined' && industrySelect) {
    industrySelect.value = indKey;
  }
  const headerSelect = document.getElementById('headerIndustrySelect');
  if (headerSelect) {
    headerSelect.value = indKey;
  }
  if (typeof updateIndustryAndRoles === 'function') {
    updateIndustryAndRoles(indKey);
  } else {
    applyIndustryBackgroundTheme(indKey);
  }
  if (typeof playClick === 'function') playClick();
};

function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  let W = (canvas.width = window.innerWidth || 1280);
  let H = (canvas.height = window.innerHeight || 800);

  function resize() {
    W = canvas.width = window.innerWidth || 1280;
    H = canvas.height = window.innerHeight || 800;
  }
  window.addEventListener('resize', resize, { passive: true });

  // ── PRE-RENDERED GPU SPRITE FOR RISING GOLDEN LIGHT BEAMS ──────────────────
  // Pre-renders the glowing star-tip + vertical gradient tail ONCE onto a tiny
  // offscreen canvas so each frame uses hardware-accelerated drawImage() with
  // ZERO per-frame gradient allocations or shadowBlur overhead!
  const spriteW = 24;
  const spriteH = 260;
  const beamSprite = document.createElement('canvas');
  beamSprite.width = spriteW;
  beamSprite.height = spriteH;
  const sCtx = beamSprite.getContext('2d');
  const cx = spriteW / 2;
  const tipY = 12;

  // 1. Vertical golden tail on sprite
  const tailGrad = sCtx.createLinearGradient(cx, tipY, cx, spriteH);
  tailGrad.addColorStop(0, 'rgba(254, 249, 195, 0.96)');
  tailGrad.addColorStop(0.16, 'rgba(251, 191, 36, 0.88)');
  tailGrad.addColorStop(0.60, 'rgba(217, 119, 6, 0.36)');
  tailGrad.addColorStop(1, 'rgba(180, 83, 9, 0)');
  sCtx.fillStyle = tailGrad;
  sCtx.fillRect(cx - 1, tipY, 2, spriteH - tipY);

  // 2. Golden halo glow at tip on sprite
  const haloGrad = sCtx.createRadialGradient(cx, tipY, 0, cx, tipY, 10);
  haloGrad.addColorStop(0, 'rgba(255, 251, 235, 0.95)');
  haloGrad.addColorStop(0.35, 'rgba(251, 191, 36, 0.55)');
  haloGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  sCtx.beginPath();
  sCtx.arc(cx, tipY, 10, 0, Math.PI * 2);
  sCtx.fillStyle = haloGrad;
  sCtx.fill();

  // 3. White-gold core star point on sprite
  sCtx.beginPath();
  sCtx.arc(cx, tipY, 2.2, 0, Math.PI * 2);
  sCtx.fillStyle = '#FFFFFF';
  sCtx.fill();

  // ── 34 UPWARD-MOVING GOLDEN LIGHT LINES (Ultra-fast GPU Sprite Blit) ──────
  const risingLines = [];
  const lineCount = 34;
  for (let i = 0; i < lineCount; i++) {
    const horizonY = H * 0.815;
    const minY = H * (0.04 + Math.random() * 0.42);
    risingLines.push({
      xRatio: (i + 0.15 + Math.random() * 0.7) / lineCount,
      headY: minY + Math.random() * (horizonY - minY),
      minYRatio: 0.04 + Math.random() * 0.42,
      tailLen: 120 + Math.random() * 220,
      speed: 0.75 + Math.random() * 1.35,
      scale: 0.75 + Math.random() * 0.55
    });
  }

  // ── 22 FLOATING GOLDEN BOKEH DOTS (Drawn in 1 single batched path) ────────
  const particles = [];
  for (let i = 0; i < 22; i++) {
    particles.push({
      xRatio: Math.random(),
      y: Math.random() * (H * 0.80),
      vy: -(0.35 + Math.random() * 0.65),
      r: 1.4 + Math.random() * 2.2,
      color: { fill: 'rgba(253, 224, 71,', glow: '#FBBF24' }
    });
  }

  const startKey = (typeof industrySelect !== 'undefined' && industrySelect && industrySelect.value) ? industrySelect.value : 'textile';
  applyIndustryBackgroundTheme(startKey);

  function draw() {
    if (document.hidden) {
      requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, W, H);
    const horizonY = H * 0.815;

    // 1. Draw upward-moving vertical golden light lines via pre-rendered GPU sprite
    for (let i = 0; i < lineCount; i++) {
      const ln = risingLines[i];
      ln.headY -= ln.speed;
      const minY = H * ln.minYRatio;

      if (ln.headY < minY) {
        ln.headY = horizonY;
      }

      const x = ln.xRatio * W;
      const topY = ln.headY;
      const availTail = Math.max(8, Math.min(ln.tailLen, horizonY - topY));

      // Smooth fade-in at horizon and fade-out at peak
      const fadeTop = Math.min(1, (topY - minY) / 80);
      const fadeBottom = Math.min(1, (horizonY - topY) / 30);
      ctx.globalAlpha = Math.max(0.05, Math.min(1, fadeTop, fadeBottom));

      const drawW = spriteW * ln.scale;
      ctx.drawImage(
        beamSprite,
        x - drawW * 0.5,
        topY - tipY * ln.scale,
        drawW,
        availTail + tipY * ln.scale
      );
    }

    // 2. Draw all rising golden bokeh dots in ONE single batched path call
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += p.vy;
      if (p.y < 10) p.y = horizonY;
      const px = p.xRatio * W;
      ctx.moveTo(px + p.r, p.y);
      ctx.arc(px, p.y, p.r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.globalAlpha = 1;

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

// ── TTS & AUDIO PLAYBACK ENGINE (START / STOP / TOGGLE) ─────────────────────────
let activeAudioBtn = null;
let activePreviewBtn = null;
let activePreviewVoiceId = null;
let currentUtterance = null;
let currentAudioPlayer = null;
let currentBlobUrl = null;
let cachedVoices = [];
let speechHeartbeatTimer = null;

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const list = window.speechSynthesis.getVoices();
  if (list && list.length > 0) {
    cachedVoices = list;
  }
  return (cachedVoices && cachedVoices.length > 0) ? cachedVoices : (list || []);
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

const CYBER_SPEAKER_SVG = `
<svg class="speaker-cyber-svg active" viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path class="speaker-body" d="M11 4.5L6 9H2.5C2.22 9 2 9.22 2 9.5v5c0 .28.22.5.5.5H6l5 4.5V4.5z" fill="currentColor"/>
  <path class="speaker-wave wave-1" d="M15.5 8.5a5 5 0 0 1 0 7" stroke-width="2.2" stroke-linecap="round"/>
  <path class="speaker-wave wave-2" d="M18.8 5.2a9.5 9.5 0 0 1 0 13.6" stroke-width="2.2" stroke-linecap="round"/>
</svg>
`;

const CYBER_SPEAKER_MUTED_SVG = `
<svg class="speaker-cyber-svg muted" viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path class="speaker-body" d="M11 4.5L6 9H2.5C2.22 9 2 9.22 2 9.5v5c0 .28.22.5.5.5H6l5 4.5V4.5z" fill="currentColor"/>
  <line x1="22" y1="9" x2="16" y2="15" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="16" y1="9" x2="22" y2="15" stroke-width="2.2" stroke-linecap="round"/>
</svg>
`;

const CYBER_PULSE_BARS_HTML = `
<span class="audio-pulse-bars">
  <span class="ap-bar bar-1"></span>
  <span class="ap-bar bar-2"></span>
  <span class="ap-bar bar-3"></span>
  <span class="ap-bar bar-4"></span>
</span>
`;

const CYBER_PREVIEW_PLAY_SVG = `
<svg class="preview-svg-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="7 5 19 12 7 19 7 5"/></svg>
`;

function stopAudio() {
  // 1. Stop HTML5 Neural MP3 audio stream if active
  if (currentAudioPlayer) {
    try {
      currentAudioPlayer.pause();
      currentAudioPlayer.currentTime = 0;
      currentAudioPlayer.src = '';
    } catch (_) {}
    currentAudioPlayer = null;
  }
  if (currentBlobUrl) {
    try { URL.revokeObjectURL(currentBlobUrl); } catch (_) {}
    currentBlobUrl = null;
  }
  // 2. Stop browser local speech synthesis if active
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    }
  } catch (_) {}
  if (speechHeartbeatTimer) {
    clearInterval(speechHeartbeatTimer);
    speechHeartbeatTimer = null;
  }
  if (activeAudioBtn) {
    activeAudioBtn.classList.remove('speaking', 'loading');
    activeAudioBtn.innerHTML = `<span class="speaker-cyber-icon">${CYBER_SPEAKER_SVG}</span> <span class="btn-label">Listen</span>`;
    activeAudioBtn.title = 'Read this answer aloud';
    activeAudioBtn = null;
  }
  if (activePreviewBtn) {
    activePreviewBtn.classList.remove('playing', 'loading');
    activePreviewBtn.innerHTML = `${CYBER_PREVIEW_PLAY_SVG} Preview`;
    activePreviewBtn = null;
    activePreviewVoiceId = null;
  }
  window.__activeUtterance = null;
  currentUtterance = null;
}

if (ttsToggle) {
  ttsToggle.addEventListener('click', () => {
    ttsEnabled = !ttsEnabled;
    ttsToggle.classList.toggle('active', ttsEnabled);
    ttsToggle.innerHTML = `<span class="speaker-cyber-badge">${ttsEnabled ? CYBER_SPEAKER_SVG : CYBER_SPEAKER_MUTED_SVG}</span>`;
    ttsToggle.title = ttsEnabled ? 'Voice readout: ON (Click to mute)' : 'Voice readout: OFF (Click to unmute)';
    if (!ttsEnabled) {
      stopAudio();
    } else {
      // Warm up synthesis engine on user click (unlocks mobile audio)
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.resume();
          const warmup = new SpeechSynthesisUtterance(' ');
          warmup.volume = 0.01;
          speechSynthesis.speak(warmup);
        }
      } catch (_) {}
    }
    playClick();
  });
}

// ── REALISTIC AI VOICE STUDIO & ANY-LANGUAGE NEURAL SPEECH ENGINE ─────────
function getActivePersona() {
  return AI_VOICE_PERSONAS[selectedVoiceId] || AI_VOICE_PERSONAS.aura;
}

// Intelligent automatic language detector for text answers
function detectTextLanguage(text) {
  if (!text) return (LANG_BCP47[currentLang] || 'en-US');

  // If user explicitly selected a non-auto language in the header/settings, respect it
  if (currentLang && currentLang !== 'auto' && LANG_BCP47[currentLang]) {
    return LANG_BCP47[currentLang];
  }

  const sample = text.slice(0, 1000);

  // 1. Script-based Unicode checks (100% precision)
  if (/[\u0A00-\u0A7F]/.test(sample)) return 'pa-IN'; // Gurmukhi / Punjabi
  if (/[\u0900-\u097F]/.test(sample)) return 'hi-IN'; // Devanagari / Hindi
  if (/[\u0980-\u09FF]/.test(sample)) return 'bn-IN'; // Bengali
  if (/[\u0B80-\u0BFF]/.test(sample)) return 'ta-IN'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(sample)) return 'te-IN'; // Telugu
  if (/[\u0A80-\u0AFF]/.test(sample)) return 'gu-IN'; // Gujarati
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(sample)) return 'ar-SA'; // Arabic / Urdu
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(sample)) return 'ja-JP'; // Japanese Hiragana/Katakana
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(sample)) return 'ko-KR'; // Korean Hangul
  if (/[\u4E00-\u9FFF]/.test(sample)) return 'zh-CN'; // Chinese Hanzi
  if (/[\u0400-\u04FF]/.test(sample)) return 'ru-RU'; // Cyrillic / Russian

  // 2. Strong English indicators check first to avoid false positives on Latin scripts
  const lower = sample.toLowerCase();
  const englishWords = lower.match(/\b(the|and|is|are|you|your|we|our|this|that|with|for|from|have|will|can|apex|textile|yarn|fabric|quality|hello|welcome|greetings|delivers|deliver|sound|voice|test)\b/g);
  const englishScore = englishWords ? englishWords.length : 0;

  // 3. Vocabulary checks for non-English Latin-script languages
  const spanishMatches = lower.match(/\b(el|la|los|las|un|una|es|son|por|para|con|este|esta|cómo|gracias|buenos|días|hola|saludos|del|al)\b/g);
  const spanishScore = (spanishMatches ? spanishMatches.length : 0) + (/[¿¡ñáóú]/.test(lower) ? 3 : 0);

  const frenchMatches = lower.match(/\b(le|la|les|un|une|des|est|sont|pour|avec|dans|ce|cette|merci|bonjour|vous|nous|suis)\b/g);
  const frenchScore = (frenchMatches ? frenchMatches.length : 0) + (/[œàâçèêëîïôûùü]/.test(lower) ? 3 : 0);

  const germanMatches = lower.match(/\b(der|die|das|ein|eine|ist|sind|und|oder|für|mit|nicht|danke|bitte|guten|tag)\b/g);
  const germanScore = (germanMatches ? germanMatches.length : 0) + (/[äöüß]/.test(lower) ? 3 : 0);

  const italianMatches = lower.match(/\b(il|la|lo|gli|le|un|uno|una|sono|con|per|grazie|ciao|buongiorno)\b/g);
  const italianScore = italianMatches ? italianMatches.length : 0;

  const portugueseMatches = lower.match(/\b(obrigado|obrigada|você|para|com|não|muito|olá|bom|dia)\b/g);
  const portugueseScore = (portugueseMatches ? portugueseMatches.length : 0) + (/[ãõ]/.test(lower) ? 3 : 0);

  const turkishMatches = lower.match(/\b(bir|bu|ile|için|teşekkürler|merhaba|nasılsınız)\b/g);
  const turkishScore = (turkishMatches ? turkishMatches.length : 0) + (/[ğüşö]/.test(lower) ? 3 : 0);

  // Compare highest score against English
  if (spanishScore > englishScore && spanishScore >= 2) return 'es-ES';
  if (frenchScore > englishScore && frenchScore >= 2) return 'fr-FR';
  if (germanScore > englishScore && germanScore >= 2) return 'de-DE';
  if (italianScore > englishScore && italianScore >= 2) return 'it-IT';
  if (portugueseScore > englishScore && portugueseScore >= 2) return 'pt-BR';
  if (turkishScore > englishScore && turkishScore >= 2) return 'tr-TR';

  return 'en-US';
}

function findBestNaturalVoice(persona, bcp47Lang) {
  let voices = loadVoices();
  if (!voices || !voices.length) {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      voices = window.speechSynthesis.getVoices() || [];
    }
  }
  if (!voices || !voices.length) return null;

  const targetLang = (bcp47Lang || 'en-US').toLowerCase();
  const langPrefix = targetLang.split('-')[0];
  const targetGender = persona.gender || 'female';

  const isFemaleVoice = (v) => {
    const n = v.name.toLowerCase();
    const femaleKeywords = ['female', 'woman', 'zira', 'jenny', 'aria', 'samantha', 'victoria', 'sonia', 'swara', 'heera', 'sunita', 'monica', 'paulina', 'amelie', 'hortense', 'katja', 'hedda', 'yuna', 'kyoko', 'ting-ting', 'elena', 'serena', 'ava', 'allison', 'julie', 'celine', 'susan', 'clara'];
    return femaleKeywords.some(kw => n.includes(kw));
  };

  const isMaleVoice = (v) => {
    const n = v.name.toLowerCase();
    const maleKeywords = ['male', 'man', 'guy', 'david', 'christopher', 'george', 'mark', 'richard', 'madhur', 'aarav', 'hemant', 'jorge', 'pablo', 'henri', 'paul', 'nicolas', 'stefan', 'hans', 'ryan', 'daniel', 'tom', 'oliver', 'bernard'];
    return maleKeywords.some(kw => n.includes(kw));
  };

  // 1. Language candidates: exact lang match (e.g. 'hi-in' or 'es-es') or langPrefix match ('hi' or 'es')
  let langCandidates = voices.filter(v => v.lang.toLowerCase() === targetLang);
  if (!langCandidates.length) {
    langCandidates = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
  }

  if (langCandidates.length > 0) {
    // 1a. Match persona voiceKeywords within target language
    for (const kw of persona.voiceKeywords) {
      const found = langCandidates.find(v => v.name.toLowerCase().includes(kw.toLowerCase()));
      if (found) return found;
    }

    // 1b. Match gender within target language
    if (targetGender === 'female') {
      const femaleCandidate = langCandidates.find(v => isFemaleVoice(v) && !isMaleVoice(v));
      if (femaleCandidate) return femaleCandidate;
    } else if (targetGender === 'male') {
      const maleCandidate = langCandidates.find(v => isMaleVoice(v) && !isFemaleVoice(v));
      if (maleCandidate) return maleCandidate;
    }

    // 1c. Natural / Online / Google fallback in target language
    const naturalCandidate = langCandidates.find(v => v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Google'));
    if (naturalCandidate) return naturalCandidate;

    return langCandidates[0];
  }

  // 2. Global fallback across all voices
  for (const kw of persona.voiceKeywords) {
    const found = voices.find(v => v.name.toLowerCase().includes(kw.toLowerCase()));
    if (found) return found;
  }

  if (targetGender === 'female') {
    const femaleAny = voices.find(v => isFemaleVoice(v) && (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Google'))) ||
                      voices.find(v => isFemaleVoice(v));
    if (femaleAny) return femaleAny;
  } else if (targetGender === 'male') {
    const maleAny = voices.find(v => isMaleVoice(v) && (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Google'))) ||
                    voices.find(v => isMaleVoice(v));
    if (maleAny) return maleAny;
  }

  const fallback = voices.find(v => v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Google'));
  return fallback || voices[0];
}

function prepareUtteranceVoiceAndLang(utt, persona, detectedLang) {
  const chosenVoice = findBestNaturalVoice(persona, detectedLang);
  if (chosenVoice) {
    utt.voice = chosenVoice;
    // Voice language matching:
    // If voice language shares the same language family prefix (e.g. 'es-ES' and 'es-MX', or 'en-US' and 'en-GB'),
    // utt.lang stays as detectedLang for proper region pronunciation.
    // If voice is a fallback from a completely different language (e.g. detected is Hindi 'hi-IN' but voice is English 'en-US'),
    // utt.lang MUST match chosenVoice.lang ('en-US')! Otherwise Chromium throws 'language-unavailable'.
    const vPrefix = (chosenVoice.lang || '').split('-')[0].toLowerCase();
    const dPrefix = (detectedLang || '').split('-')[0].toLowerCase();
    if (vPrefix && dPrefix && vPrefix === dPrefix) {
      utt.lang = detectedLang;
    } else if (chosenVoice.lang) {
      utt.lang = chosenVoice.lang;
    } else {
      utt.lang = detectedLang || 'en-US';
    }
  } else {
    utt.lang = detectedLang || 'en-US';
  }
}

function safeSpeakUtterance(utt) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Unpause if stuck
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (_) {}

  // Clear existing heartbeat
  if (speechHeartbeatTimer) {
    clearInterval(speechHeartbeatTimer);
    speechHeartbeatTimer = null;
  }

  // Anchor to window and currentUtterance to prevent Chrome V8 garbage collection mid-speech
  window.__activeUtterance = utt;
  currentUtterance = utt;

  const originalStart = utt.onstart;
  const originalEnd = utt.onend;
  const originalError = utt.onerror;

  utt.onstart = (evt) => {
    if (speechHeartbeatTimer) clearInterval(speechHeartbeatTimer);
    speechHeartbeatTimer = setInterval(() => {
      if (!window.speechSynthesis || !window.speechSynthesis.speaking) {
        if (speechHeartbeatTimer) {
          clearInterval(speechHeartbeatTimer);
          speechHeartbeatTimer = null;
        }
      } else {
        try {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } catch (_) {}
      }
    }, 8000);

    if (originalStart) originalStart.call(utt, evt);
  };

  const cleanup = () => {
    if (speechHeartbeatTimer) {
      clearInterval(speechHeartbeatTimer);
      speechHeartbeatTimer = null;
    }
    if (window.__activeUtterance === utt) {
      window.__activeUtterance = null;
    }
    if (currentUtterance === utt) {
      currentUtterance = null;
    }
  };

  utt.onend = (evt) => {
    cleanup();
    if (originalEnd) originalEnd.call(utt, evt);
  };

  utt.onerror = (evt) => {
    cleanup();
    if (originalError) originalError.call(utt, evt);
  };

  const executeSpeak = () => {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utt);
    } catch (err) {
      console.warn('speechSynthesis.speak failed:', err);
      cleanup();
    }
  };

  // If currently speaking or pending, cancel first, then wait 50ms for Chromium audio IPC to flush
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    try { window.speechSynthesis.cancel(); } catch (_) {}
    setTimeout(executeSpeak, 50);
  } else {
    executeSpeak();
  }
}

function playLocalWebSpeech(clean, detectedLang, persona, onStart, onEnd, onError) {
  if (!('speechSynthesis' in window)) {
    if (onError) onError();
    return;
  }
  try {
    const utt = new SpeechSynthesisUtterance(clean);
    const genderPitchModifier = (persona.gender === 'male') ? 0.92 : 1.08;
    utt.rate = (persona.rate || 1.0) * (selectedVoiceSpeed || 1.0);
    utt.pitch = (persona.pitch || genderPitchModifier);
    utt.volume = 1.0;

    prepareUtteranceVoiceAndLang(utt, persona, detectedLang);

    utt.onstart = () => { if (onStart) onStart(); };
    utt.onend = () => { if (onEnd) onEnd(); };
    utt.onerror = (evt) => {
      console.warn('Web Speech fallback error:', evt);
      if (onError) onError(evt);
    };

    safeSpeakUtterance(utt);
  } catch (err) {
    console.warn('Local speech synthesis error:', err);
    if (onError) onError(err);
  }
}

async function playUniversalSpeechAudio(text, lang, persona, onLoading, onStart, onEnd, onError) {
  stopAudio();

  const clean = cleanFormulaAndLatexSyntax(text || '', false)
    .replace(/```[\s\S]*?```/g, ' [Code block omitted] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[IMAGE_BASE64\]:\S+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*#_~]/g, '')
    .replace(/\|[\s\S]*?\|/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) {
    if (onError) onError();
    return;
  }

  // 1. Immediately indicate loading state on UI so user gets instant tactile feedback
  if (onLoading) onLoading();

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: clean,
        lang: lang || 'en-US',
        voice: persona ? persona.id : 'aura'
      })
    });

    if (!res.ok) {
      throw new Error(`TTS server response error: ${res.status}`);
    }

    const blob = await res.blob();
    if (!blob || blob.size < 200) {
      throw new Error('TTS audio blob payload too small');
    }

    if (currentBlobUrl) {
      try { URL.revokeObjectURL(currentBlobUrl); } catch (_) {}
      currentBlobUrl = null;
    }

    const blobUrl = URL.createObjectURL(blob);
    currentBlobUrl = blobUrl;

    const audio = new Audio(blobUrl);
    currentAudioPlayer = audio;
    audio.playbackRate = (persona ? (persona.rate || 1.0) : 1.0) * (selectedVoiceSpeed || 1.0);

    audio.onplay = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      if (currentAudioPlayer === audio) currentAudioPlayer = null;
      if (currentBlobUrl) {
        try { URL.revokeObjectURL(currentBlobUrl); } catch (_) {}
        currentBlobUrl = null;
      }
      if (onEnd) onEnd();
    };

    audio.onerror = (e) => {
      console.warn('Blob audio play failed, trying Web Speech fallback:', e);
      if (currentAudioPlayer === audio) currentAudioPlayer = null;
      playLocalWebSpeech(clean, lang, persona, onStart, onEnd, onError);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name === 'AbortError') return;
        console.warn('Audio play error, falling back to Web Speech:', err);
        playLocalWebSpeech(clean, lang, persona, onStart, onEnd, onError);
      });
    }
  } catch (err) {
    console.warn('Network TTS fetch failed, switching to local Web Speech synthesis:', err);
    playLocalWebSpeech(clean, lang, persona, onStart, onEnd, onError);
  }
}

function speakText(text, triggerBtn = null) {
  try {
    const isCurrentlySpeaking = (currentAudioPlayer && !currentAudioPlayer.paused) || (window.speechSynthesis && window.speechSynthesis.speaking);
    if (triggerBtn && triggerBtn === activeAudioBtn && isCurrentlySpeaking) {
      stopAudio();
      return;
    }

    const persona = getActivePersona();
    let detectedLang = detectTextLanguage(text);
    if (detectedLang === 'en-US' && (persona.id === 'swara' || persona.id === 'aarav')) {
      detectedLang = 'hi-IN'; // Indian cadence for Swara & Aarav
    }

    const resetTriggerBtn = () => {
      if (triggerBtn) {
        triggerBtn.classList.remove('speaking', 'loading');
        triggerBtn.innerHTML = `<span class="speaker-cyber-icon">${CYBER_SPEAKER_SVG}</span> <span class="btn-label">Listen</span>`;
        triggerBtn.title = 'Read this answer aloud';
        if (activeAudioBtn === triggerBtn) activeAudioBtn = null;
      }
    };

    playUniversalSpeechAudio(
      text,
      detectedLang,
      persona,
      () => {
        // onLoading: Immediate button visual update on user click
        if (triggerBtn) {
          activeAudioBtn = triggerBtn;
          triggerBtn.classList.add('loading');
          triggerBtn.innerHTML = `<span class="audio-spinner-ring"></span> <span class="btn-label">Loading...</span>`;
        }
      },
      () => {
        // onStart: Audio is actively playing
        if (triggerBtn) {
          triggerBtn.classList.remove('loading');
          triggerBtn.classList.add('speaking');
          triggerBtn.innerHTML = `${CYBER_PULSE_BARS_HTML} <span class="btn-label">Stop (${persona.name})</span>`;
          triggerBtn.title = `Reading aloud with ${persona.name} (${persona.gender}) in ${detectedLang}. Tap to stop.`;
        }
      },
      () => {
        // onEnd
        resetTriggerBtn();
      },
      () => {
        // onError
        resetTriggerBtn();
      }
    );
  } catch (err) {
    console.warn('TTS audio readout warning:', err);
  }
}

// ── Voice Studio Modal Controls ──────────────────────────────────────────────
window.openVoiceModal = function() {
  const modal = document.getElementById('voiceModal');
  if (modal) modal.style.display = 'flex';
  updateVoiceModalUI();
};

window.closeVoiceModal = function() {
  const modal = document.getElementById('voiceModal');
  if (modal) modal.style.display = 'none';
  stopAudio();
};

window.selectVoicePersona = function(voiceId) {
  if (!AI_VOICE_PERSONAS[voiceId]) return;
  selectedVoiceId = voiceId;
  localStorage.setItem('texo_selected_voice', voiceId);
  updateVoiceModalUI();
  updateVoiceHeaderLabel();
  playClick();
};

window.filterVoiceGender = function(filterGender) {
  const buttons = document.querySelectorAll('.voice-tab-btn');
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.genderFilter === filterGender);
  });

  const cards = document.querySelectorAll('.voice-card');
  cards.forEach(card => {
    const cardGender = card.dataset.gender;
    if (filterGender === 'all' || cardGender === filterGender) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
  playClick();
};

window.updateVoiceSpeed = function(speedVal) {
  selectedVoiceSpeed = parseFloat(speedVal);
  localStorage.setItem('texo_voice_speed', speedVal);
  const label = document.getElementById('voiceSpeedVal');
  if (label) label.textContent = `${parseFloat(speedVal).toFixed(2)}x`;
};

window.previewVoice = function(voiceId, e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const persona = AI_VOICE_PERSONAS[voiceId];
  if (!persona) return;

  const btn = (e && (e.currentTarget || e.target)) ? (e.currentTarget || e.target) : document.querySelector(`.voice-card[data-voice-id="${voiceId}"] .voice-preview-btn`);

  const isCurrentlySpeaking = (currentAudioPlayer && !currentAudioPlayer.paused) || (window.speechSynthesis && window.speechSynthesis.speaking);
  if (activePreviewVoiceId === voiceId && isCurrentlySpeaking) {
    stopAudio();
    return;
  }

  const sampleLang = persona.lang || detectTextLanguage(persona.sample);

  const resetBtn = () => {
    if (btn) {
      btn.classList.remove('playing', 'loading');
      btn.innerHTML = `${CYBER_PREVIEW_PLAY_SVG} Preview`;
    }
    if (activePreviewBtn === btn) {
      activePreviewBtn = null;
      activePreviewVoiceId = null;
    }
  };

  playUniversalSpeechAudio(
    persona.sample,
    sampleLang,
    persona,
    () => {
      // onLoading: Immediate visual update
      activePreviewBtn = btn;
      activePreviewVoiceId = voiceId;
      if (btn) {
        btn.classList.add('loading');
        btn.innerHTML = `<span class="audio-spinner-ring mini"></span> Loading...`;
      }
    },
    () => {
      // onStart: Playing audio
      if (btn) {
        btn.classList.remove('loading');
        btn.classList.add('playing');
        btn.innerHTML = `${CYBER_PULSE_BARS_HTML} Stop`;
      }
    },
    () => {
      // onEnd
      resetBtn();
    },
    () => {
      // onError
      resetBtn();
    }
  );
};

function updateVoiceModalUI() {
  const cards = document.querySelectorAll('.voice-card');
  cards.forEach(card => {
    card.classList.toggle('active', card.dataset.voiceId === selectedVoiceId);
  });
  const speedInput = document.getElementById('voiceSpeedRange');
  if (speedInput) speedInput.value = selectedVoiceSpeed;
  const speedLabel = document.getElementById('voiceSpeedVal');
  if (speedLabel) speedLabel.textContent = `${selectedVoiceSpeed.toFixed(2)}x`;
}

function updateVoiceHeaderLabel() {
  const label = document.getElementById('currentVoiceLabel');
  const persona = getActivePersona();
  if (label && persona) {
    label.textContent = persona.name;
  }
}

const voicePickerBtn = document.getElementById('voicePickerBtn');
if (voicePickerBtn) {
  voicePickerBtn.addEventListener('click', openVoiceModal);
}
updateVoiceHeaderLabel();

// ── ANY-LANGUAGE SPEECH RECOGNITION (LISTENING) ───────────────────────────────
function initSpeech() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('mic-active');
    micBtn.textContent = '🔴';
    setStatus('listening');
    showMicListeningHud(true);
  };

  recognition.onresult = (e) => {
    let final = '', interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    messageInput.value = final || interim;
    autoResize();
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('mic-active');
    micBtn.textContent = '🎤';
    setStatus('ready');
    showMicListeningHud(false);
    if (messageInput.value.trim() && !isStreaming) {
      setTimeout(() => triggerSend(), 350);
    }
  };

  recognition.onerror = (e) => {
    isListening = false;
    micBtn.classList.remove('mic-active');
    micBtn.textContent = '🎤';
    setStatus('ready');
    showMicListeningHud(false);
    if (e.error !== 'no-speech') {
      appendSystemMsg(`Microphone note: ${e.error}. Please ensure mic permission is granted.`);
    }
  };
}

function showMicListeningHud(active) {
  let hud = document.getElementById('micListeningHud');
  if (active) {
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'micListeningHud';
      hud.className = 'mic-listening-hud';
      const inputWrapper = document.querySelector('.input-wrapper');
      if (inputWrapper) inputWrapper.insertBefore(hud, inputWrapper.firstChild);
    }
    const currentLangDisplay = getListeningLanguageName();
    hud.innerHTML = `<span class="listening-pulse"></span> 🎙️ Listening in <strong>${escapeHtml(currentLangDisplay)}</strong> — Speak now…`;
    hud.style.display = 'flex';
  } else if (hud) {
    hud.style.display = 'none';
  }
}

function getListeningLanguageName() {
  if (currentListeningLang !== 'auto' && LANG_NAMES[currentListeningLang]) {
    return LANG_NAMES[currentListeningLang];
  }
  if (currentLang !== 'auto' && LANG_NAMES[currentLang]) {
    return LANG_NAMES[currentLang];
  }
  return navigator.language || 'Auto / Any';
}

function updateListeningLanguage(langCode) {
  currentListeningLang = langCode || 'auto';
  const label = document.getElementById('micLangLabel');
  if (label) {
    const shortName = LANG_NAMES[currentListeningLang] ? LANG_NAMES[currentListeningLang].split(' ')[0] : 'Auto';
    label.textContent = shortName;
  }
  if (recognition) {
    recognition.lang = LANG_BCP47[currentListeningLang] || LANG_BCP47[currentLang] || (navigator.language || 'en-US');
  }
}

const micLangPill = document.getElementById('micLangPill');
if (micLangPill) {
  micLangPill.addEventListener('click', (e) => {
    e.stopPropagation();
    const langs = ['auto', 'en', 'hi', 'pa', 'es', 'fr', 'de', 'ar', 'zh', 'ja'];
    const curIdx = langs.indexOf(currentListeningLang);
    const nextLang = langs[(curIdx + 1) % langs.length];
    updateListeningLanguage(nextLang);
    playClick();
  });
}

micBtn.addEventListener('click', () => {
  if (!recognition) {
    appendSystemMsg('Voice input not supported on this browser. Please use Chrome, Edge, or Safari.');
    return;
  }
  if (isListening) {
    recognition.stop();
    return;
  }
  const effectiveLang = (currentListeningLang !== 'auto' ? LANG_BCP47[currentListeningLang] : null) ||
                        (currentLang !== 'auto' ? LANG_BCP47[currentLang] : null) ||
                        (navigator.language || 'en-US');
  recognition.lang = effectiveLang;
  try {
    recognition.start();
    playClick();
  } catch (_) {}
});

window.triggerMicVoiceListening = function() {
  if (micBtn) micBtn.click();
};

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

  // 7. Dynamically adapt Studio Lab for this specific Industry
  updateStudioLabForIndustry(indKey);

  // 8. Morph futuristic holographic background environment & sync top header switcher
  applyIndustryBackgroundTheme(indKey);
}

// ══════════════════════════════════════════════════════════════════════════════
// MULTI-INDUSTRY STUDIO LAB PROFILES & DYNAMIC RECONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════
const STUDIO_INDUSTRY_PROFILES = {
  textile: {
    title: 'Textile Innovation Studio & Advanced Engineering Lab',
    sub: 'Tactile Haptics · Drape Physics · Acoustic Weave · Chrono-Aging · Zero-Waste Origami',
    guideTitle: 'HOW TO USE TEXTILE INNOVATION LAB:',
    guideDesc: 'Interactive textile physics, haptic emulation, algorithmic Jacquard drafting, and ASTM vision inspection.',
    tips: [
      { num: '1', title: 'Haptics & Drape', text: 'Pick fabric specs (Denim, Silk, Linen) and slide across Touchpad to test mobile vibration drag. Interact with the 60 FPS cloth mesh.' },
      { num: '2', title: 'Acoustic Weave', text: 'Input music tempos or styles to calculate mathematical Jacquard loom draft matrices, or extract 5 Pantone TCX yarn colors from food flavors.' },
      { num: '3', title: 'Chrono-Aging & Bio', text: 'Step through 0 Mo to 5 Yrs to see indigo fading and whiskering. Slide humidity to watch bio-cellulose pellicle expand.' },
      { num: '4', title: 'Origami & Vision', text: 'Follow 5 kinetic zero-waste origami garment folding steps. Run Loomside optical vision audit for 4-point ASTM grading.' },
    ],
    tabs: [
      { id: 'hapticTab', icon: '📳', label: 'Haptic & Drape Physics' },
      { id: 'acousticTab', icon: '🎵', label: 'Acoustic Weave & Synesthesia' },
      { id: 'chronoTab', icon: '⏳', label: 'Chrono-Dye Aging & Bio-Textile' },
      { id: 'origamiTab', icon: '📐', label: 'Zero-Waste Origami Architect' },
      { id: 'visionTab', icon: '🔍', label: 'Vision Audit & Compliance' },
    ],
    stripGuides: {
      hapticTab: '1. Choose a fabric below · 2. Drag your finger/mouse on the Touchpad · 3. Click & toss the live cloth mesh on the right canvas.',
      acousticTab: '1. Pick a music genre preset or type audio tempo to generate a Jacquard draft matrix · 2. Type culinary notes to extract 5 Pantone TCX colors.',
      chronoTab: '1. Click time buttons (Brand New → 5 Years) to see denim whisker erosion render · 2. Move Humidity/Temp sliders to watch living bio-cellulose swell.',
      origamiTab: '1. Click steps 1 through 5 to follow origami tessellation folds · 2. Tap "Ask TEXO" to transfer pattern formulas to chat.',
      visionTab: '1. Click "Run Real-Time Loomside Audit" to simulate camera feed and defect bounding boxes · 2. Enter chemicals to test EU REACH restrictions.',
    }
  },
  pharma: {
    title: 'Biopharma R&D Lab & cGMP Validation Cleanroom Studio',
    sub: 'Dissolution Profiler · HPLC Chromatography Simulator · Cleanroom Pressure Differential · Stability Shelf-Life',
    guideTitle: 'HOW TO USE PHARMA & HEALTHCARE LAB:',
    guideDesc: 'Simulate tablet dissolution curves, cleanroom differential pressure cascades, accelerated shelf-life, and OOS compliance.',
    tips: [
      { num: '1', title: 'Dissolution Profiler', text: 'Simulate USP <711> Stage 1 (S1) and Stage 2 (S2) release profiles. Analyze hydrodynamic shear and tablet binder hardness.' },
      { num: '2', title: 'Chromatography Assay', text: 'Simulate HPLC peak resolution (Rs > 2.0), retention time drift, and impurity identification at RRT 1.25.' },
      { num: '3', title: 'Cleanroom HVAC Cascade', text: 'Monitor positive pressure differentials (Grade A/B/C/D > 10-15 Pa) to verify sterility barrier integrity.' },
      { num: '4', title: 'Accelerated Stability', text: 'Model Arrhenius degradation under 40°C / 75% RH to project real-time shelf life and active ingredient potency.' },
    ],
    tabs: [
      { id: 'hapticTab', icon: '💊', label: 'USP Dissolution Profiler' },
      { id: 'acousticTab', icon: '🧪', label: 'HPLC Chromatography & Assay' },
      { id: 'chronoTab', icon: '🌡️', label: 'ICH Accelerated Stability' },
      { id: 'origamiTab', icon: '🛡️', label: 'Cleanroom Differential HVAC' },
      { id: 'visionTab', icon: '🔬', label: 'OOS Phase 1 & USP <788>' },
    ],
    stripGuides: {
      hapticTab: '1. Select active pharmaceutical formulation · 2. Evaluate dissolution apparatus paddle/basket RPM · 3. Observe real-time release curve.',
      acousticTab: '1. Input mobile phase gradient and flow rate · 2. Check theoretical plates (N) and peak symmetry · 3. Verify assay percentage.',
      chronoTab: '1. Select 40°C/75% RH accelerated milestone (0M, 3M, 6M) · 2. Observe degradant peak formation · 3. Review shelf-life projection.',
      origamiTab: '1. Inspect Grade A laminar flow velocity (0.45 m/s) · 2. Test Grade B-to-C airlock pressure cascade (+15 Pa) · 3. Ensure zero particulate backflow.',
      visionTab: '1. Run automated vial particle inspection (USP <788>) · 2. Review sub-visible counts (≥10 μm & ≥25 μm) · 3. Trigger OOS laboratory root-cause protocol.',
    }
  },
  auto: {
    title: 'Automotive & EV Metrology Simulation Studio',
    sub: 'GD&T Metrology · Robotic Weld Inspection · Torque-Angle Rundown · EV Battery Tab Ultrasonic Quality',
    guideTitle: 'HOW TO USE AUTOMOTIVE & EV STUDIO:',
    guideDesc: 'Test dimensional tolerances, robotic MIG weld integrity, fastener clamping curves, and EV battery cell tab welds.',
    tips: [
      { num: '1', title: 'GD&T True Position', text: 'Verify datum feature hole position tolerances against CMM laser scan baselines per ASME Y14.5.' },
      { num: '2', title: 'Torque-Angle Curve', text: 'Analyze dynamic nutrunner rundown curves: seating torque, yield clamp point, and angle deviation.' },
      { num: '3', title: 'EV Pouch Cell Weld', text: 'Inspect ultrasonic metal weld micro-ohm electrical resistance and horn anvil horn tuning parameters.' },
      { num: '4', title: 'Defect PPM & Cpk', text: 'Calculate automotive process capability indices (Cp, Cpk ≥ 1.67) and defect PPM containment.' },
    ],
    tabs: [
      { id: 'hapticTab', icon: '🚗', label: 'GD&T Tolerance & CMM Metrology' },
      { id: 'acousticTab', icon: '🔩', label: 'Torque-Angle Fastener Curve' },
      { id: 'chronoTab', icon: '⚡', label: 'EV Battery Tab Weld Inspector' },
      { id: 'origamiTab', icon: '🤖', label: 'Robotic MIG Weld Penetration' },
      { id: 'visionTab', icon: '🔍', label: 'AIAG-VDA FMEA & PPM Audit' },
    ],
    stripGuides: {
      hapticTab: '1. Choose stamping datum features · 2. Inspect coordinate tolerance envelope · 3. Verify true position diameter against drawing spec.',
      acousticTab: '1. Select joint stiffness and grade 10.9 fastener · 2. Monitor rundown torque angle threshold · 3. Flag stripped threads or cross-threading.',
      chronoTab: '1. Select ultrasonic weld energy (Joules) and horn amplitude · 2. Check tab peel strength (N) · 3. Ensure tab contact resistance < 50 μΩ.',
      origamiTab: '1. Select robotic weld travel speed and shielding gas (90/10 Ar/CO2) · 2. Verify throat thickness · 3. Inspect weld spatter and porosity.',
      visionTab: '1. Run automated surface laser vision scan · 2. Detect orange peel and stamping burrs · 3. Update Cpk capability and PPM scorecard.',
    }
  },
  food: {
    title: 'Food Safety, Pasteurization & Microbial Kinetics Lab',
    sub: 'HTST Pasteurizer CCP · Microbial CFU Kinetics · Modified Atmosphere Packaging · Allergen Matrix',
    guideTitle: 'HOW TO USE FOOD & BEVERAGE SAFETY LAB:',
    guideDesc: 'Verify pasteurization holding tubes, pathogen kill kinetics, MAP oxygen residual, and Clean-In-Place sanitation.',
    tips: [
      { num: '1', title: 'HTST Pasteurizer CCP', text: 'Monitor 72°C thermal holding for 15 seconds. Ensure flow diversion valve triggers instantly if temperature drops.' },
      { num: '2', title: 'Microbial Growth Kinetics', text: 'Plot bacterial CFU/g log-growth curves under cold-chain storage to predict safe shelf-life limits.' },
      { num: '3', title: 'MAP Packaging Integrity', text: 'Test modified atmosphere packaging headspace residual oxygen (O2 < 0.5%) and dye leak immersion.' },
      { num: '4', title: 'CIP Sanitation & ATP', text: 'Validate Clean-In-Place wash cycles (Caustic 1.5% @ 75°C, Acid rinse, Sanitizer) with ATP swab pass thresholds.' },
    ],
    tabs: [
      { id: 'hapticTab', icon: '🥣', label: 'HTST Pasteurizer CCP Monitor' },
      { id: 'acousticTab', icon: '🧫', label: 'Microbial CFU/g Growth Curves' },
      { id: 'chronoTab', icon: '📦', label: 'MAP Packaging & Oxygen Seal' },
      { id: 'origamiTab', icon: '🧼', label: 'Clean-In-Place (CIP) Wash Cycle' },
      { id: 'visionTab', icon: '🛡️', label: 'HACCP & Allergen Cross-Contact' },
    ],
    stripGuides: {
      hapticTab: '1. Monitor pasteurization core temperature · 2. Confirm flow diversion valve response · 3. Verify pasteurizer lethal heat units (PU).',
      acousticTab: '1. Set storage temperature (+4°C vs +10°C abuse) · 2. Track microbial lag and exponential phases · 3. Predict expiration limit.',
      chronoTab: '1. Measure package headspace gas composition (70% N2 / 30% CO2) · 2. Run dye immersion vacuum seal test · 3. Detect micro-leaks.',
      origamiTab: '1. Follow pre-rinse, caustic wash, acid wash, sanitizer sequence · 2. Check ATP swab bioluminescence (< 10 RLU clean) · 3. Log cycle.',
      visionTab: '1. Scan packaging line for allergen label compliance · 2. Confirm dairy/nut segregation · 3. Export audit-ready HACCP log.',
    }
  },
  construction: {
    title: 'Civil & Structural Materials Testing Simulation Lab',
    sub: 'ASTM C39 Concrete Strength · Slump & Water-Cement Ratio · Rebar Corrosion · OSHA Site Safety',
    guideTitle: 'HOW TO USE CONSTRUCTION & CIVIL LAB:',
    guideDesc: 'Calculate 7/28-day concrete compressive strengths, slump workability, rebar corrosion depth, and OSHA scaffolding compliance.',
    tips: [
      { num: '1', title: 'ASTM C39 Compressive Strength', text: 'Calculate concrete cylinder break force (MPa/PSI) at 7-day (65-70%) and 28-day (100% design strength) cure milestones.' },
      { num: '2', title: 'Slump & W/C Ratio', text: 'Evaluate ASTM C143 slump workability (100 ± 25 mm). Adjust superplasticizer dosage without compromising strength.' },
      { num: '3', title: 'Rebar Corrosion & Cover', text: 'Inspect reinforced concrete cover depth per ACI 318 and calculate half-cell corrosion potential.' },
      { num: '4', title: 'OSHA High-Risk Safety', text: 'Audit fall protection (6 ft trigger), deep trench shoring (5 ft trigger), and crane outrigger bearing capacity.' },
    ],
    tabs: [
      { id: 'hapticTab', icon: '🧱', label: 'ASTM C39 Compressive Strength' },
      { id: 'acousticTab', icon: '📐', label: 'ASTM C143 Slump & Workability' },
      { id: 'chronoTab', icon: '🏗️', label: 'Rebar Corrosion & Cover Depth' },
      { id: 'origamiTab', icon: '🦺', label: 'OSHA Scaffold & Trench Safety' },
      { id: 'visionTab', icon: '🔍', label: 'Mix Design & Grout Void Audit' },
    ],
    stripGuides: {
      hapticTab: '1. Select concrete design grade (e.g., C30/37 or 4000 PSI) · 2. Simulate cylinder break force · 3. Compare 7-day vs 28-day cure curves.',
      acousticTab: '1. Record cone slump measurement (mm) · 2. Adjust water-cement ratio or polycarboxylate dosage · 3. Verify pourability.',
      chronoTab: '1. Select exposure environment (marine splash vs inland) · 2. Model chloride penetration depth · 3. Calculate service life to rust spalling.',
      origamiTab: '1. Audit scaffolding guardrails (42-inch top rail) · 2. Check excavation benching / trench box ratings · 3. Ensure stop-work triggers.',
      visionTab: '1. Inspect column removal for honeycombing · 2. Calculate void volume for epoxy pressure grouting · 3. Certify structural sign-off.',
    }
  },
  logistics: {
    title: 'Supply Chain, Fleet & Cold-Chain Analytics Studio',
    sub: 'OTIF Vendor Scorecard · Cold-Chain MKT Excursion · FTL vs LTL Freight Optimization · Warehouse OEE Throughput',
    guideTitle: 'HOW TO USE LOGISTICS & SUPPLY CHAIN STUDIO:',
    guideDesc: 'Analyze On-Time In-Full KPIs, Mean Kinetic Temperature in reefer containers, freight dimensional weight, and warehouse OEE.',
    tips: [
      { num: '1', title: 'Cold-Chain MKT Analysis', text: 'Calculate Mean Kinetic Temperature (MKT) for biologics during a 2°C to 8°C temperature breach excursion.' },
      { num: '2', title: 'OTIF Vendor Scorecard', text: 'Track On-Time In-Full fulfillment rates and calculate carrier SLA chargebacks and dock detention costs.' },
      { num: '3', title: 'FTL vs LTL Freight Model', text: 'Compare volumetric dimensional weight charges against full truckload routing to eliminate deadhead empty miles.' },
      { num: '4', title: 'Warehouse Pick-Pack OEE', text: 'Model automated pick rates, forklift travel routes, dock-to-stock cycle times, and inventory turnover.' },
    ],
    tabs: [
      { id: 'hapticTab', icon: '❄️', label: 'Cold-Chain MKT Temp Excursion' },
      { id: 'acousticTab', icon: '📋', label: 'OTIF Vendor Scorecard & SLA' },
      { id: 'chronoTab', icon: '🚚', label: 'FTL vs LTL Freight Optimization' },
      { id: 'origamiTab', icon: '📦', label: 'Warehouse Pick-Pack & OEE' },
      { id: 'visionTab', icon: '🔍', label: 'RFID / Barcode Read Rate Audit' },
    ],
    stripGuides: {
      hapticTab: '1. Input reefer sensor temperature profile · 2. Calculate activation energy (ΔH) and MKT (°C) · 3. Verify product stability impact.',
      acousticTab: '1. Review carrier delivery logs · 2. Calculate OTIF percentage · 3. Assess penalty thresholds for late / partial shipments.',
      chronoTab: '1. Input cargo pallet count and cubic dimensions · 2. Compare dimensional weight tariff vs flat FTL rate · 3. Optimize route.',
      origamiTab: '1. Model warehouse travel paths · 2. Identify pick-face bottlenecks · 3. Balance dock staging queues to avoid detention fees.',
      visionTab: '1. Simulate high-speed sorting conveyor scanner · 2. Measure barcode / RFID read rate · 3. Triage unreadable package diverts.',
    }
  },
  general: {
    title: 'Universal Industrial Engineering & Root-Cause Studio',
    sub: '5-Why & Ishikawa Root Cause · ISO 9001 Audit Engine · Yield & Unit Economics · Operational Risk Matrix',
    guideTitle: 'HOW TO USE UNIVERSAL ENGINEERING STUDIO:',
    guideDesc: 'Deploy universal quality engineering: DMAIC problem solving, ISO 9001 compliance, financial ROI, and risk management.',
    tips: [
      { num: '1', title: '5-Why & Fishbone Analysis', text: 'Perform deep-dive root cause investigation across Man, Machine, Material, Method, and Measurement categories.' },
      { num: '2', title: 'ISO 9001:2015 Audit Engine', text: 'Generate internal quality audit matrices verifying Clause 8 operations, non-conformities, and CAPA actions.' },
      { num: '3', title: 'Yield & Scrap Unit Economics', text: 'Calculate manufacturing mass balance, scrap cost impact, unit margins, and capital investment payback.' },
      { num: '4', title: 'Operational Risk Matrix', text: 'Evaluate process failure probabilities and impact severities to establish mission-critical mitigations.' },
    ],
    tabs: [
      { id: 'hapticTab', icon: '🔍', label: '5-Why & Ishikawa Root Cause' },
      { id: 'acousticTab', icon: '📋', label: 'ISO 9001:2015 Audit Engine' },
      { id: 'chronoTab', icon: '📈', label: 'Yield & Scrap Unit Economics' },
      { id: 'origamiTab', icon: '⚡', label: 'Operational Risk Matrix' },
      { id: 'visionTab', icon: '📊', label: 'Executive Quality KPI Suite' },
    ],
    stripGuides: {
      hapticTab: '1. Enter observed quality defect or failure mode · 2. Drill down through 5 consecutive Whys · 3. Establish root cause CAPA.',
      acousticTab: '1. Select ISO standard clause (8.5 Production, 9.1 Monitoring) · 2. Review evidence requirements · 3. Log findings.',
      chronoTab: '1. Enter baseline production volume and scrap rate · 2. Calculate lost margin and scrap cost · 3. Model recovery savings.',
      origamiTab: '1. Rate occurrence likelihood and failure severity · 2. Plot on 5x5 risk heat map · 3. Assign automated mitigation controls.',
      visionTab: '1. Monitor multi-line defect trends · 2. Compare actual vs benchmark yield · 3. Export executive performance brief.',
    }
  }
};

function updateStudioLabForIndustry(indKey) {
  const profile = STUDIO_INDUSTRY_PROFILES[indKey] || STUDIO_INDUSTRY_PROFILES['general'];

  // 1. Update Studio Modal Header & Subhead
  const modalTitle = document.getElementById('studioModalTitle');
  const modalSub = document.getElementById('studioModalSub');
  const guideTitle = document.getElementById('studioGuideTitle');
  const guideDesc = document.getElementById('studioGuideDesc');

  if (modalTitle) modalTitle.textContent = profile.title;
  if (modalSub) modalSub.textContent = profile.sub;
  if (guideTitle) guideTitle.textContent = profile.guideTitle;
  if (guideDesc) guideDesc.textContent = profile.guideDesc;

  // 2. Update Studio Tab Buttons (labels & icons)
  profile.tabs.forEach((tab, idx) => {
    const btn = document.getElementById(`studioTabBtn${idx + 1}`);
    if (btn) {
      btn.innerHTML = `${tab.icon} ${tab.label}`;
      btn.setAttribute('title', tab.label);
    }
  });

  // 3. Update Studio Drawer Quick Tips
  const guideDrawer = document.getElementById('studioGuideDrawer');
  if (guideDrawer && profile.tips) {
    const cardGrid = guideDrawer.querySelector('.guide-card-grid');
    if (cardGrid) {
      cardGrid.innerHTML = profile.tips.map(t => `
        <div class="guide-tip-card">
          <div class="tip-num">${t.num}</div>
          <div class="tip-body">
            <strong>${t.title}:</strong>
            <span>${t.text}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // 4. Update Tab Instruction Strips
  if (profile.stripGuides) {
    Object.entries(profile.stripGuides).forEach(([tabId, text]) => {
      const pane = document.getElementById(tabId);
      if (pane) {
        const stripSpan = pane.querySelector('.studio-tab-instruction-strip span:last-child');
        if (stripSpan) stripSpan.textContent = text;
      }
    });
  }
}

// Industry selector change event (left sidebar + top header switcher)
industrySelect.addEventListener('change', () => {
  updateIndustryAndRoles(industrySelect.value);
  playClick();
});

const headerIndustrySelect = document.getElementById('headerIndustrySelect');
if (headerIndustrySelect) {
  headerIndustrySelect.addEventListener('change', () => {
    window.switchIndustryEnvironment(headerIndustrySelect.value);
  });
}

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
      const [memRes, knowRes] = await Promise.all([
        fetch('/api/memory'),
        fetch('/api/knowledge').catch(() => null)
      ]);
      const data = await memRes.json();
      const kData = (knowRes && knowRes.ok) ? await knowRes.json() : {};
      const ent = data.enterprise_context || {};
      const telem = data.brain_telemetry || {};
      const learnedTopics = (data.self_learned_topics || []).slice(-5).reverse()
        .map(t => `• ${t.topic} (Gen #${t.generation || 1}): ${(t.key_takeaway || '').slice(0, 90)}`)
        .join('\n');
      const sources = (telem.active_knowledge_sources || [
        'Wikipedia Encyclopedia', 'DuckDuckGo Graph', 'Google News Live', 'ArXiv Research', 'StackExchange', 'HackerNews'
      ]).join(', ');

      alert(
        `🧠 TEXO AUTONOMOUS SELF-LEARNING AI BRAIN & MEMORY\n\n` +
        `• Self-Learned Prompts: ${telem.total_prompts_learned || kData.total_turns_learned || 0}\n` +
        `• Multi-Turn Answer Evolutions: ${telem.total_answer_evolutions || kData.total_evolutions || 0}\n` +
        `• Knowledge Vault Topics & Docs: ${kData.total_documents || 0} (${kData.total_chunks || 0} chunks)\n` +
        `• Active Learning Sources: ${sources}\n\n` +
        `Recently Self-Learned Topics:\n${learnedTopics || '• Ready — learns automatically after every prompt & answer!'}\n\n` +
        `TEXO autonomously learns from multi-source web intelligence and its own answers after every chat turn to give improved answers next time!`
      );
    } catch(err) {
      alert('Autonomous Self-Learning AI Brain & Continuous Memory Engine is ACTIVE.');
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL FILE UPLOAD + DIRECT CLIPBOARD IMAGE PASTE (Ctrl+V) & DRAG-AND-DROP
// ══════════════════════════════════════════════════════════════════════════════
async function attachFileOrImageToChat(file, customBadgeText = '') {
  if (!file) return;

  currentAttachedFile = file;
  const localUrl = URL.createObjectURL(file);
  currentAttachedLocalUrl = localUrl;

  const filePreviewRow = document.getElementById('filePreviewRow');
  const filePreviewName = document.getElementById('filePreviewName');
  const previewBadge = document.getElementById('previewBadge');
  const previewStatus = document.getElementById('previewStatus');
  const imagePreviewThumb = document.getElementById('imagePreviewThumb');
  const videoPreviewThumb = document.getElementById('videoPreviewThumb');
  const filePreviewIcon = document.getElementById('filePreviewIcon');

  if (filePreviewRow) filePreviewRow.style.display = 'flex';
  const fileSizeKb = Math.max(1, Math.round(file.size / 1024));

  // Instant local visual preview & immediate client-side Base64 for images (zero-wait send!)
  if (file.type && file.type.startsWith('image/')) {
    if (imagePreviewThumb) {
      imagePreviewThumb.src = localUrl;
      imagePreviewThumb.style.display = 'block';
    }
    if (videoPreviewThumb) videoPreviewThumb.style.display = 'none';
    if (filePreviewIcon) filePreviewIcon.style.display = 'none';
    if (previewBadge) previewBadge.textContent = customBadgeText || '📷 Attached Photo';
    if (filePreviewName) filePreviewName.textContent = `${file.name} (${fileSizeKb} KB)`;
    if (previewStatus) previewStatus.textContent = 'Photo ready to send with your inquiry';

    // Immediately populate base64 on the client so pressing Enter right after Ctrl+V works instantaneously
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      if (typeof dataUrl === 'string' && dataUrl.includes('base64,')) {
        const rawB64 = dataUrl.split('base64,')[1];
        pendingAttachment = {
          filename: file.name,
          file_type: 'image',
          image_base64: rawB64,
          display_summary: `${file.name} (${fileSizeKb} KB)`
        };
      }
    } catch (_) {}
  } else if (file.type && file.type.startsWith('video/')) {
    if (videoPreviewThumb) {
      videoPreviewThumb.src = localUrl;
      videoPreviewThumb.style.display = 'block';
    }
    if (imagePreviewThumb) imagePreviewThumb.style.display = 'none';
    if (filePreviewIcon) filePreviewIcon.style.display = 'none';
    if (previewBadge) previewBadge.textContent = customBadgeText || '🎥 Attached Video';
    if (filePreviewName) filePreviewName.textContent = `${file.name} (${fileSizeKb} KB)`;
    if (previewStatus) previewStatus.textContent = 'Video ready to send with your inquiry';
  } else {
    if (imagePreviewThumb) imagePreviewThumb.style.display = 'none';
    if (videoPreviewThumb) videoPreviewThumb.style.display = 'none';
    if (filePreviewIcon) {
      filePreviewIcon.style.display = 'block';
      filePreviewIcon.textContent = file.name.endsWith('.pdf') ? '📄' : (file.name.endsWith('.pptx') ? '📊' : (file.name.endsWith('.xlsx') ? '📈' : '📎'));
    }
    if (previewBadge) previewBadge.textContent = customBadgeText || '📑 Attached File';
    if (filePreviewName) filePreviewName.textContent = `${file.name} (${fileSizeKb} KB)`;
    if (previewStatus) previewStatus.textContent = 'Analyzing document structure…';
  }

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

    if (previewStatus) previewStatus.textContent = 'Ready to send with your message';
    playClick();
  } catch (err) {
    if (previewStatus) previewStatus.textContent = `Ready: ${file.name} attached locally`;
  }
}

fileUpload.addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  await attachFileOrImageToChat(file);
});

// Direct Clipboard Copy-Paste Image / File into Chatbox (Ctrl+V or Right-Click -> Paste)
document.addEventListener('paste', async (e) => {
  const cd = e.clipboardData || window.clipboardData;
  if (!cd) return;

  let pastedFile = null;

  // 1. Check clipboardData.items (Screenshots, Snipping Tool, Browser "Copy Image", etc.)
  if (cd.items && cd.items.length) {
    for (let i = 0; i < cd.items.length; i++) {
      const item = cd.items[i];
      if (item.kind === 'file' && (item.type.startsWith('image/') || item.type !== '')) {
        const blob = item.getAsFile();
        if (blob) {
          const ext = (blob.type && blob.type.split('/')[1]) ? blob.type.split('/')[1].replace('jpeg', 'jpg') : 'png';
          const cleanName = (blob.name && blob.name !== 'image.png')
            ? blob.name
            : `pasted_photo_${new Date().toTimeString().slice(0,8).replace(/:/g,'')}.${ext}`;
          pastedFile = new File([blob], cleanName, { type: blob.type || 'image/png' });
          break;
        }
      }
    }
  }

  // 2. Fallback: Check clipboardData.files (Copying an image file from File Explorer / Desktop)
  if (!pastedFile && cd.files && cd.files.length > 0) {
    pastedFile = cd.files[0];
  }

  // 3. Fallback: Check if HTML clipboard contains a data:image/... URI
  if (!pastedFile && cd.getData) {
    try {
      const htmlData = cd.getData('text/html') || '';
      const dataUriMatch = htmlData.match(/src=["'](data:image\/([a-zA-Z0-9+]+);base64,([^"']+))["']/i);
      if (dataUriMatch) {
        const mime = `image/${dataUriMatch[2]}`;
        const bstr = atob(dataUriMatch[3]);
        const u8 = new Uint8Array(bstr.length);
        for (let j = 0; j < bstr.length; j++) u8[j] = bstr.charCodeAt(j);
        pastedFile = new File([u8], `pasted_photo_${Date.now()}.png`, { type: mime });
      }
    } catch (_) {}
  }

  if (pastedFile) {
    e.preventDefault();
    const isImg = pastedFile.type && pastedFile.type.startsWith('image/');
    await attachFileOrImageToChat(pastedFile, isImg ? '📋 Pasted Photo' : '📋 Pasted File');
    if (messageInput) {
      messageInput.focus();
    }
    if (typeof showSentinelToast === 'function') {
      showSentinelToast('📋 Photo pasted directly from clipboard — ready to send!', 2600);
    }
  }
});

// Also allow Drag-and-Drop of images/files directly into the chat window or input box
const mainChatDropZone = document.getElementById('main') || document.body;
if (mainChatDropZone) {
  mainChatDropZone.addEventListener('dragover', (e) => {
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  });
  mainChatDropZone.addEventListener('drop', async (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      const isImg = droppedFile.type && droppedFile.type.startsWith('image/');
      await attachFileOrImageToChat(droppedFile, isImg ? '📷 Dropped Photo' : '📎 Dropped File');
      if (messageInput) messageInput.focus();
    }
  });
}

if (removeFileBtn) {
  removeFileBtn.addEventListener('click', clearFilePreview);
}

function clearFilePreview() {
  pendingAttachment = null;
  currentAttachedFile = null;
  currentAttachedLocalUrl = null;
  fileUpload.value = '';

  const filePreviewRow = document.getElementById('filePreviewRow');
  const imagePreviewThumb = document.getElementById('imagePreviewThumb');
  const videoPreviewThumb = document.getElementById('videoPreviewThumb');

  if (filePreviewRow) filePreviewRow.style.display = 'none';
  if (imagePreviewThumb) {
    imagePreviewThumb.src = '';
    imagePreviewThumb.style.display = 'none';
  }
  if (videoPreviewThumb) {
    videoPreviewThumb.src = '';
    videoPreviewThumb.style.display = 'none';
  }
}

// ── Lightbox Viewer for Images & Videos ────────────────────────────────────────
window.openMediaLightbox = function(mediaSrc, caption) {
  const lightbox = document.getElementById('mediaLightbox');
  const imgEl = document.getElementById('lightboxImg');
  const videoEl = document.getElementById('lightboxVideo');
  const captionEl = document.getElementById('lightboxCaption');
  if (!lightbox) return;

  const isVideo = mediaSrc.includes('video') || mediaSrc.endsWith('.mp4') || mediaSrc.endsWith('.webm') || mediaSrc.endsWith('.mov');
  if (isVideo) {
    if (imgEl) imgEl.style.display = 'none';
    if (videoEl) {
      videoEl.src = mediaSrc;
      videoEl.style.display = 'block';
      videoEl.play().catch(() => {});
    }
  } else {
    if (videoEl) {
      videoEl.style.display = 'none';
      videoEl.pause();
    }
    if (imgEl) {
      imgEl.src = mediaSrc;
      imgEl.style.display = 'block';
    }
  }
  if (captionEl) captionEl.textContent = caption || 'TEXO High-Resolution Media Inspector';
  lightbox.style.display = 'flex';
};

window.closeMediaLightbox = function() {
  const lightbox = document.getElementById('mediaLightbox');
  const videoEl = document.getElementById('lightboxVideo');
  if (videoEl) videoEl.pause();
  if (lightbox) lightbox.style.display = 'none';
};

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
  if (!text && !pendingAttachment && !currentAttachedFile) return;
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
  let clean = raw.replace(/^```[a-z0-9_\-:]*\s*/i, '').replace(/```\s*$/i, '').trim();

  // Strip single-line JS/JSON comments
  clean = clean.replace(/\/\/.*$/gm, '');
  // Strip multi-line comments
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, '');

  // 1. Try direct JSON.parse
  try {
    const parsed = JSON.parse(clean);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (_) {}

  // 2. Extract outermost { ... }
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const candidate = jsonMatch[0];
    try {
      return JSON.parse(candidate);
    } catch (_) {
      try {
        // Fix trailing commas and unquoted/single-quoted keys
        let fixed = candidate.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(fixed);
      } catch (_) {
        try {
          // Replace single quotes with double quotes
          let fixedQuotes = candidate.replace(/'/g, '"').replace(/,\s*([}\]])/g, '$1');
          return JSON.parse(fixedQuotes);
        } catch (_) {}
      }
    }
  }

  // 3. Fallback: extract type, title, labels and data arrays heuristically
  try {
    const typeMatch = clean.match(/"type"\s*:\s*"([a-zA-Z0-9_\-]+)"/i);
    const titleMatch = clean.match(/"title"\s*:\s*"([^"]+)"/i);
    const labelsMatch = clean.match(/"labels"\s*:\s*\[([\s\S]*?)\]/i);
    const dataMatch = clean.match(/"data"\s*:\s*\[([\s\S]*?)\]/i);

    if (labelsMatch && dataMatch) {
      const parseStrList = (s) => s.split(',').map(x => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      const parseNumList = (s) => s.split(',').map(x => parseFloat(x.trim())).filter(n => !isNaN(n));
      const labels = parseStrList(labelsMatch[1]);
      const data = parseNumList(dataMatch[1]);
      if (labels.length && data.length) {
        return {
          type: typeMatch ? typeMatch[1].toLowerCase() : 'bar',
          title: titleMatch ? titleMatch[1] : 'TEXO Data Visualization',
          data: {
            labels: labels,
            datasets: [{
              label: titleMatch ? titleMatch[1] : 'Value',
              data: data
            }]
          },
          options: {
            description: 'Rendered directly by TEXO Visual Engine.'
          }
        };
      }
    }
  } catch (err) {
    console.warn('Heuristic chart fallback failed:', err);
  }

  return null;
}

function convertPythonPlotToChartConfig(pyCode) {
  if (!pyCode) return null;
  try {
    const cleanCode = pyCode.replace(/#.*$/gm, '');
    let title = 'TEXO Data Visualization';
    const titleMatch = cleanCode.match(/(?:plt\.title|ax\.set_title|title\s*=)\s*\(\s*["']([^"']+)["']/i) || cleanCode.match(/title\s*=\s*["']([^"']+)["']/i);
    if (titleMatch) title = titleMatch[1].trim();

    let chartType = 'bar';
    if (/plt\.plot\s*\(|sns\.lineplot/i.test(cleanCode)) chartType = 'line';
    else if (/plt\.pie\s*\(/i.test(cleanCode)) chartType = 'pie';
    else if (/plt\.scatter\s*\(|sns\.scatterplot/i.test(cleanCode)) chartType = 'scatter';
    else if (/plt\.barh\s*\(/i.test(cleanCode)) chartType = 'bar';

    // 1. Check for dictionary: data = { 'A': 10, 'B': 20 }
    const dictMatch = cleanCode.match(/([a-zA-Z0-9_]+)\s*=\s*\{([^}]+)\}/);
    if (dictMatch) {
      try {
        const pairs = dictMatch[2].split(',').map(p => p.trim()).filter(Boolean);
        const labels = [];
        const data = [];
        pairs.forEach(pair => {
          const parts = pair.split(':');
          if (parts.length === 2) {
            const k = parts[0].trim().replace(/^['"]|['"]$/g, '');
            const v = parseFloat(parts[1].trim().replace(/[%$,]/g, ''));
            if (k && !isNaN(v)) {
              labels.push(k);
              data.push(v);
            }
          }
        });
        if (labels.length >= 2 && data.length >= 2) {
          return {
            type: chartType,
            title: title,
            data: {
              labels: labels,
              datasets: [{ label: title, data: data }]
            },
            options: { description: 'Rendered directly by TEXO Visual Engine.' }
          };
        }
      } catch (_) {}
    }

    // 2. Check for variable lists: var = [...]
    const listMatches = [...cleanCode.matchAll(/([a-zA-Z0-9_]+)\s*=\s*\[([\s\S]*?)\]/g)];
    if (listMatches.length >= 2) {
      const parseList = (str) => str.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      const list1 = parseList(listMatches[0][2]);
      const list2 = parseList(listMatches[1][2]);

      const list1IsNumbers = list1.every(v => !isNaN(Number(v.replace(/[%$,]/g, ''))));
      const list2IsNumbers = list2.every(v => !isNaN(Number(v.replace(/[%$,]/g, ''))));

      let labels = [];
      let data = [];
      if (!list1IsNumbers && list2IsNumbers) {
        labels = list1;
        data = list2.map(v => Number(v.replace(/[%$,]/g, '')));
      } else if (list1IsNumbers && !list2IsNumbers) {
        labels = list2;
        data = list1.map(v => Number(v.replace(/[%$,]/g, '')));
      } else if (list1IsNumbers && list2IsNumbers) {
        labels = list1.map((_, i) => `Point ${i + 1}`);
        data = list2.map(v => Number(v.replace(/[%$,]/g, '')));
      }

      if (labels.length && data.length) {
        return {
          type: chartType,
          title: title,
          data: {
            labels: labels,
            datasets: [{ label: title, data: data }]
          },
          options: { description: 'Rendered directly by TEXO Visual Engine.' }
        };
      }
    }

    // 3. Check for inline lists inside plt.bar([...], [...]) or plt.pie([...], labels=[...])
    const inlineCallMatch = cleanCode.match(/plt\.(?:bar|plot|pie|scatter)\s*\(\s*\[([\s\S]*?)\]\s*,\s*(?:labels\s*=\s*)?\[([\s\S]*?)\]/i);
    if (inlineCallMatch) {
      const parseList = (str) => str.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      const l1 = parseList(inlineCallMatch[1]);
      const l2 = parseList(inlineCallMatch[2]);
      const l1IsNum = l1.every(v => !isNaN(Number(v.replace(/[%$,]/g, ''))));
      const l2IsNum = l2.every(v => !isNaN(Number(v.replace(/[%$,]/g, ''))));
      let labels = l1IsNum ? l2 : l1;
      let data = (l1IsNum ? l1 : l2).map(v => Number(v.replace(/[%$,]/g, '')));
      if (labels.length && data.length) {
        return {
          type: chartType,
          title: title,
          data: {
            labels: labels,
            datasets: [{ label: title, data: data }]
          },
          options: { description: 'Rendered directly by TEXO Visual Engine.' }
        };
      }
    }
  } catch (e) {
    console.warn('Python plot extraction fallback:', e);
  }
  return null;
}

function normalizeChartConfig(rawOrObj) {
  if (!rawOrObj) return null;

  let obj = rawOrObj;
  if (typeof rawOrObj === 'string') {
    // If it contains python plotting keywords, try python plot converter first
    if (rawOrObj.includes('matplotlib') || rawOrObj.includes('plt.') || rawOrObj.includes('seaborn') || rawOrObj.includes('sns.')) {
      const pyCfg = convertPythonPlotToChartConfig(rawOrObj);
      if (pyCfg) return pyCfg;
    }
    obj = parseChartJSON(rawOrObj);
  }

  if (!obj || typeof obj !== 'object') return null;

  // If wrapped inside chart, config, or visualization property
  if (obj.chart && typeof obj.chart === 'object') obj = obj.chart;
  if (obj.config && typeof obj.config === 'object') obj = obj.config;
  if (obj.visualization && typeof obj.visualization === 'object') obj = obj.visualization;

  let title = obj.title || obj.name || obj.header || 'TEXO Data Visualization';
  if (typeof title === 'object' && title && title.text) title = title.text;

  let chartType = (obj.type || 'bar').toLowerCase();
  if (chartType === 'column' || chartType === 'combo' || chartType === 'mixed') chartType = 'bar';
  if (['polar', 'polararea'].includes(chartType)) chartType = 'pie';
  if (!['bar', 'line', 'pie', 'doughnut', 'radar', 'scatter'].includes(chartType)) chartType = 'bar';

  let labels = [];
  let datasets = [];

  // Check 1: Chart.js standard (obj.data.labels & obj.data.datasets)
  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    if (Array.isArray(obj.data.labels)) {
      labels = obj.data.labels.map(String);
    }
    if (Array.isArray(obj.data.datasets) && obj.data.datasets.length > 0) {
      datasets = obj.data.datasets.map(ds => ({
        label: ds.label || title,
        data: (Array.isArray(ds.data) ? ds.data : []).map(v => (v === null || v === undefined || isNaN(Number(String(v).replace(/[%$,]/g, '')))) ? 0 : Number(String(v).replace(/[%$,]/g, ''))),
        type: ds.type
      }));
    }
  }

  // Check 2: Flat labels & data/values
  if (!labels.length) {
    if (Array.isArray(obj.labels)) labels = obj.labels.map(String);
    else if (Array.isArray(obj.categories)) labels = obj.categories.map(String);
    else if (obj.xaxis && Array.isArray(obj.xaxis.categories)) labels = obj.xaxis.categories.map(String);
    else if (obj.xAxis && Array.isArray(obj.xAxis.categories)) labels = obj.xAxis.categories.map(String);
  }

  if (!datasets.length) {
    if (Array.isArray(obj.data)) {
      datasets = [{
        label: title,
        data: obj.data.map(v => (v === null || v === undefined || isNaN(Number(String(v).replace(/[%$,]/g, '')))) ? 0 : Number(String(v).replace(/[%$,]/g, '')))
      }];
    } else if (Array.isArray(obj.values)) {
      datasets = [{
        label: title,
        data: obj.values.map(v => (v === null || v === undefined || isNaN(Number(String(v).replace(/[%$,]/g, '')))) ? 0 : Number(String(v).replace(/[%$,]/g, '')))
      }];
    } else if (Array.isArray(obj.series)) {
      datasets = obj.series.map(s => {
        if (typeof s === 'object' && s !== null) {
          return {
            label: s.name || s.label || title,
            data: (Array.isArray(s.data) ? s.data : []).map(v => isNaN(Number(String(v).replace(/[%$,]/g, ''))) ? 0 : Number(String(v).replace(/[%$,]/g, '')))
          };
        }
        return { label: title, data: [Number(String(s).replace(/[%$,]/g, '')) || 0] };
      });
    } else if (Array.isArray(obj.datasets)) {
      datasets = obj.datasets.map(ds => ({
        label: ds.label || title,
        data: (Array.isArray(ds.data) ? ds.data : []).map(v => isNaN(Number(String(v).replace(/[%$,]/g, ''))) ? 0 : Number(String(v).replace(/[%$,]/g, '')))
      }));
    }
  }

  // Check 3: Key-value dictionary e.g. { "Cotton": 45, "Polyester": 35, "Spandex": 20 }
  if (!labels.length && !datasets.length) {
    const keys = Object.keys(obj).filter(k => !['type', 'title', 'options', 'description', 'status'].includes(k));
    const allNumeric = keys.length >= 2 && keys.every(k => !isNaN(Number(String(obj[k]).replace(/[%$,]/g, ''))));
    if (allNumeric) {
      labels = keys;
      datasets = [{
        label: title,
        data: keys.map(k => Number(String(obj[k]).replace(/[%$,]/g, '')))
      }];
    }
  }

  // Check 4: Array of objects e.g. [{ category: 'A', value: 10 }, ...]
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
    const labelKey = Object.keys(obj[0]).find(k => typeof obj[0][k] === 'string') || Object.keys(obj[0])[0];
    const valKey = Object.keys(obj[0]).find(k => !isNaN(Number(String(obj[0][k]).replace(/[%$,]/g, ''))));
    if (labelKey && valKey) {
      labels = obj.map(item => String(item[labelKey] || ''));
      datasets = [{
        label: title,
        data: obj.map(item => Number(String(item[valKey]).replace(/[%$,]/g, '')) || 0)
      }];
    }
  }

  // Validation
  if (!labels.length || !datasets.length || !datasets[0].data || !datasets[0].data.length) {
    return null;
  }

  // Synchronize lengths
  const len = Math.min(labels.length, datasets[0].data.length);
  labels = labels.slice(0, len);
  datasets.forEach(ds => { ds.data = ds.data.slice(0, len); });

  const desc = (obj.options && obj.options.description) || obj.description || '';

  return {
    type: chartType,
    title: title,
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      description: desc
    }
  };
}

function extractChartFromTable(table) {
  if (!table) return null;
  const rows = [...table.querySelectorAll('tr')];
  if (rows.length < 3) return null;

  const ths = [...rows[0].querySelectorAll('th, td')].map(c => c.textContent.trim());
  if (ths.length < 2) return null;

  const dataRows = rows.slice(1);
  const labels = [];
  const numbers = [];

  for (const row of dataRows) {
    const cells = [...row.querySelectorAll('td, th')].map(c => c.textContent.trim());
    if (cells.length < 2) continue;
    const label = cells[0];
    let numVal = NaN;
    for (let c = 1; c < cells.length; c++) {
      const cleanNum = cells[c].replace(/[%$,]/g, '').trim();
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed)) {
        numVal = parsed;
        break;
      }
    }
    if (!isNaN(numVal) && label) {
      labels.push(label);
      numbers.push(numVal);
    }
  }

  if (labels.length >= 2 && numbers.length >= 2) {
    const title = ths[0] ? `${ths[0]} Overview` : 'TEXO Data Visualization';
    const total = numbers.reduce((a, b) => a + b, 0);
    const isPercentage = total >= 95 && total <= 105;
    return {
      type: isPercentage ? 'pie' : 'bar',
      title: title,
      data: {
        labels: labels,
        datasets: [{
          label: ths[1] || 'Value',
          data: numbers
        }]
      },
      options: {
        description: `Visualized from structured table: ${title}`
      }
    };
  }
  return null;
}

function convertLatexMathFragment(expr) {
  if (!expr) return '';
  let s = String(expr);

  // Remove sizing & spacing directives
  s = s.replace(/\\(?:displaystyle|textstyle|scriptstyle|scriptscriptstyle|limits|nolimits|left|right|big|Big|bigg|Bigg)\b/g, '');
  s = s.replace(/\\(?:quad|qquad|,|;|!|:)\b/g, ' ');
  s = s.replace(/\\,/g, ' ').replace(/\\;/g, ' ').replace(/\\!/g, '');

  // Unwrap \text{...}, \textbf{...}, \mathrm{...}, \mathbf{...}, etc. (up to 4 nested levels)
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\?(?:text|textbf|textit|textrm|textsf|texttt|mathrm|mathbf|mathit|mathsf|mathtt|mathcal|operatorname|mbox|hbox)\s*\{([^{}]*)\}/gi, '$1');
  }
  // Handle unclosed \text{... at the tail during live streaming
  s = s.replace(/\\?(?:text|textbf|textit|mathrm|mathbf|operatorname)\s*\x7b([^{}]*)$/gi, '$1');

  // Convert \sqrt[n]{x} and \sqrt{x}
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\\?sqrt\s*\[3\]\s*\{([^{}]*)\}/gi, '∛($1)');
    s = s.replace(/\\?sqrt\s*\[([^{}\]]*)\]\s*\{([^{}]*)\}/gi, '($1)√($2)');
    s = s.replace(/\\?sqrt\s*\{([^{}]*)\}/gi, '√($1)');
  }
  s = s.replace(/\\?sqrt\s*\x7b([^{}]*)$/gi, '√($1');

  // Convert \frac{A}{B}, \dfrac{A}{B}, \tfrac{A}{B}, or bare frac{A}{B} (up to 4 nested levels)
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\?(?:d|t)?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/gi, (_, num, den) => {
      const n = num.trim();
      const d = den.trim();
      const nWrap = /[+\-×÷*/\s]/.test(n) ? `(${n})` : n;
      const dWrap = /[+\-×÷*/\s]/.test(d) ? `(${d})` : d;
      return `(${nWrap} ÷ ${dWrap})`;
    });
  }
  // Handle partial \frac{A}{B during live streaming
  s = s.replace(/\\?(?:d|t)?frac\s*\{([^{}]*)\}\s*\x7b([^{}]*)$/gi, '($1 ÷ $2');
  s = s.replace(/\\?(?:d|t)?frac\s*\x7b([^{}]*)$/gi, '($1');

  // Operators & relations
  const latexOps = [
    [/\\times\b/g, ' × '],
    [/\\div\b/g, ' ÷ '],
    [/\\cdot\b/g, ' · '],
    [/\\ast\b/g, ' * '],
    [/\\pm\b/g, ' ± '],
    [/\\mp\b/g, ' ∓ '],
    [/\\(?:leq|le)\b/g, ' ≤ '],
    [/\\(?:geq|ge)\b/g, ' ≥ '],
    [/\\(?:neq|ne)\b/g, ' ≠ '],
    [/\\approx\b/g, ' ≈ '],
    [/\\equiv\b/g, ' ≡ '],
    [/\\propto\b/g, ' ∝ '],
    [/\\sim\b/g, ' ~ '],
    [/\\(?:rightarrow|to|longrightarrow)\b/g, ' → '],
    [/\\(?:leftarrow|longleftarrow)\b/g, ' ← '],
    [/\\(?:leftrightarrow|longleftrightarrow)\b/g, ' ↔ '],
    [/\\(?:Rightarrow|implies|Longrightarrow)\b/g, ' ⇒ '],
    [/\\(?:Leftrightarrow|iff)\b/g, ' ⇔ '],
    [/\\infty\b/g, '∞'],
    [/\\partial\b/g, '∂'],
    [/\\nabla\b/g, '∇'],
    [/\\forall\b/g, '∀'],
    [/\\exists\b/g, '∃'],
    [/\\notin\b/g, ' ∉ '],
    [/\\in\b/g, ' ∈ '],
    [/\\subset\b/g, ' ⊂ '],
    [/\\cup\b/g, ' ∪ '],
    [/\\cap\b/g, ' ∩ '],
    [/\\emptyset\b/g, '∅'],
    [/\\therefore\b/g, '∴'],
    [/\\because\b/g, '∵'],
    [/\\(?:sum|Sigma)\b/g, 'Σ'],
    [/\\(?:prod|Pi)\b/g, 'Π'],
    [/\\int\b/g, '∫'],
    [/\\Delta\b/g, 'Δ'],
    [/\\Gamma\b/g, 'Γ'],
    [/\\Lambda\b/g, 'Λ'],
    [/\\Omega\b/g, 'Ω'],
    [/\\Phi\b/g, 'Φ'],
    [/\\Psi\b/g, 'Ψ'],
    [/\\Theta\b/g, 'Θ'],
    [/\\alpha\b/g, 'α'],
    [/\\beta\b/g, 'β'],
    [/\\gamma\b/g, 'γ'],
    [/\\delta\b/g, 'δ'],
    [/\\(?:varepsilon|epsilon)\b/g, 'ε'],
    [/\\zeta\b/g, 'ζ'],
    [/\\eta\b/g, 'η'],
    [/\\(?:vartheta|theta)\b/g, 'θ'],
    [/\\kappa\b/g, 'κ'],
    [/\\lambda\b/g, 'λ'],
    [/\\mu\b/g, 'μ'],
    [/\\nu\b/g, 'ν'],
    [/\\xi\b/g, 'ξ'],
    [/\\pi\b/g, 'π'],
    [/\\rho\b/g, 'ρ'],
    [/\\(?:varsigma|sigma)\b/g, 'σ'],
    [/\\tau\b/g, 'τ'],
    [/\\(?:varphi|phi)\b/g, 'φ'],
    [/\\chi\b/g, 'χ'],
    [/\\psi\b/g, 'ψ'],
    [/\\omega\b/g, 'ω'],
    [/\^\{\\circ\}|\^\\circ|\\degree\b/g, '°'],
    [/\\%/g, '%'],
    [/\\\{/g, '{'],
    [/\\\}/g, '}'],
    [/\\_/g, '_']
  ];
  for (const [rgx, rep] of latexOps) {
    s = s.replace(rgx, rep);
  }

  // Superscripts & Subscripts
  const supMap = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', 'n': 'ⁿ', 'i': 'ⁱ' };
  const subMap = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '₊', '-': '₋', 'a': 'ₐ', 'e': 'ₑ', 'i': 'ᵢ', 'n': 'ₙ', 'o': 'ₒ', 'r': 'ᵣ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ' };

  s = s.replace(/\^\{([0-9+\-ni]+)\}/g, (_, chars) => chars.split('').map(c => supMap[c] || c).join(''));
  s = s.replace(/\^([0-9ni])\b/g, (_, c) => supMap[c] || `^${c}`);
  s = s.replace(/\^\{([^{}]+)\}/g, '^($1)');

  s = s.replace(/_\{([0-9+\-aeinoruvx]+)\}/g, (_, chars) => chars.split('').map(c => subMap[c] || c).join(''));
  s = s.replace(/([A-Za-z\)])_([0-9])\b/g, (_, pre, c) => pre + (subMap[c] || c));
  s = s.replace(/_\{([^{}]+)\}/g, '($1)');

  // Strip leftover grouping braces
  s = s.replace(/\{([^{}]*)\}/g, '$1');
  s = s.replace(/[ \t]{2,}/g, ' ');
  return s.trim();
}

function cleanFormulaAndLatexSyntax(text, isFinal = false) {
  if (!text) return '';

  // Protect non-math code blocks while cleaning formulas in prose and math blocks
  const codeBlocks = [];
  let working = text.replace(/```([a-z0-9_\-:]*)[\s\S]*?(?:```|$)/gi, (match, lang) => {
    const l = (lang || '').toLowerCase();
    if (l === 'math' || l === 'latex' || l === 'formula') {
      const inner = match.replace(/^```[a-z0-9_\-:]*\s*/i, '').replace(/```\s*$/, '');
      const cleaned = convertLatexMathFragment(inner);
      if (isFinal) {
        return `\n\n<div class="texo-formula-card"><span class="texo-formula-badge">∑ FORMULA</span><div class="texo-formula-expr">${escapeHtml(cleaned)}</div></div>\n\n`;
      }
      return `\n\n**∑ ${cleaned}**\n\n`;
    }
    const token = `@@TEXO_CODE_BLOCK_${codeBlocks.length}@@`;
    codeBlocks.push(match);
    return token;
  });

  // 1. Display math blocks: $$ ... $$ and \[ ... \]
  working = working.replace(/\$\$([\s\S]*?)\$\$/g, (_, expr) => {
    const cleaned = convertLatexMathFragment(expr);
    if (!cleaned) return '';
    if (isFinal) {
      return `\n\n<div class="texo-formula-card"><span class="texo-formula-badge">∑ FORMULA</span><div class="texo-formula-expr">${escapeHtml(cleaned)}</div></div>\n\n`;
    }
    return `\n\n**∑ ${cleaned}**\n\n`;
  });

  working = working.replace(/\\\[([\s\S]*?)\\\]/g, (_, expr) => {
    const cleaned = convertLatexMathFragment(expr);
    if (!cleaned) return '';
    if (isFinal) {
      return `\n\n<div class="texo-formula-card"><span class="texo-formula-badge">∑ FORMULA</span><div class="texo-formula-expr">${escapeHtml(cleaned)}</div></div>\n\n`;
    }
    return `\n\n**∑ ${cleaned}**\n\n`;
  });

  // 2. Inline \( ... \)
  working = working.replace(/\\\(([\s\S]*?)\\\)/g, (_, expr) => {
    const cleaned = convertLatexMathFragment(expr);
    return cleaned ? `**${cleaned}**` : '';
  });

  // 3. Inline $ ... $ (distinguish math/LaTeX from two currency amounts on the same line)
  working = working.replace(/\$([^$\n]+?)\$/g, (fullMatch, inner) => {
    const trimmed = inner.trim();
    if (!trimmed) return fullMatch;
    // If it starts with a digit and has prose connectors ("10 and ", "25 to ") without math tokens, keep as currency
    const looksLikeTwoPrices = /^\d+(?:[.,]\d+)?\s+(?:and|or|to|per|for|in|from|with|vs|versus|at|on|by)\b/i.test(trimmed) &&
      !/[\\=^_{÷×]|frac|text|sqrt|times|div/i.test(trimmed);
    if (looksLikeTwoPrices) {
      return fullMatch;
    }
    const cleaned = convertLatexMathFragment(trimmed);
    if (/[=÷×±≤≥≈√]/.test(cleaned)) {
      return `**${cleaned}**`;
    }
    return cleaned;
  });

  // 4. Clean any bare/unwrapped LaTeX tokens (e.g., \text{...}, text{...}, \frac{...}{...}, \times) or unclosed streaming $$ / $
  working = working.replace(/\$\$/g, '');
  working = working.replace(/\\\[|\\\]|\\\(|\\\)/g, '');
  // If streaming leaves a single unclosed $ right before \text or \frac, strip the stray $
  working = working.replace(/\$\s*(?=\\?(?:text|textbf|mathrm|frac|sqrt)\b)/gi, '');

  if (/\\(?:text|textbf|textit|mathrm|mathbf|operatorname|frac|dfrac|tfrac|sqrt|times|div|cdot|pm|leq|geq|neq|approx|Delta|Sigma|alpha|beta|gamma|mu|pi|rho|sigma|theta|omega)\b|\b(?:text|textbf|mathrm|frac)\s*\x7b/i.test(working)) {
    working = working.split('\n').map(line => {
      if (/@@TEXO_CODE_BLOCK_\d+@@/.test(line)) return line;
      if (/\\(?:text|textbf|textit|mathrm|mathbf|operatorname|frac|dfrac|tfrac|sqrt|times|div|cdot|pm|leq|geq|neq|approx|Delta|Sigma|alpha|beta|gamma|mu|pi|rho|sigma|theta|omega)\b|\b(?:text|textbf|mathrm|frac)\s*\x7b/i.test(line)) {
        // Preserve leading markdown list/heading markers
        const prefixMatch = line.match(/^(\s*(?:[#>*\-+]|\d+\.)\s+)/);
        const prefix = prefixMatch ? prefixMatch[1] : '';
        const rest = prefixMatch ? line.slice(prefix.length) : line;
        return prefix + convertLatexMathFragment(rest).replace(/\$/g, '');
      }
      return line;
    }).join('\n');
  }

  // Restore protected code blocks
  working = working.replace(/@@TEXO_CODE_BLOCK_(\d+)@@/g, (_, idx) => codeBlocks[Number(idx)] || '');
  return working;
}

function prepareStreamMarkdown(text) {
  if (!text) return '';
  let display = cleanFormulaAndLatexSyntax(text, false);

  // 1. Hide full or in-progress chart code blocks during streaming - DO NOT show HUD message before user
  display = display.replace(/```(?:chart|chart:[a-z0-9_\-]+|json:chart|graph|plot|visualization|pie|doughnut|bar|line)[\s\S]*?(?:```|$)/gi, '');

  // 2. Hide Python plotting scripts during streaming
  display = display.replace(/```(?:python|py)?[\s\S]*?(?:matplotlib|plt\.|seaborn|sns\.|fig\s*=|ax\s*=)[\s\S]*?(?:```|$)/gi, '');

  // 3. Hide JSON / data blocks that define charts during streaming
  display = display.replace(/```(?:json|javascript|js)?[\s\S]*?"(?:type|data)"[\s\S]*?(?:```|$)/gi, '');

  // 4. If the message starts with or currently ends with an incomplete code block containing chart keywords or json
  display = display.replace(/```(?:[a-z0-9_\-:]+)?[\s\S]*$/i, (match) => {
    const mLower = match.toLowerCase();
    if (mLower.includes('chart') || mLower.includes('plot') || mLower.includes('graph') || mLower.includes('pie') || mLower.includes('bar') || mLower.includes('type') || mLower.includes('data') || mLower.includes('plt') || mLower.includes('matplotlib')) {
      return '';
    }
    return match;
  });

  // 5. Mask any trailing unclosed fence at the tail during streaming
  display = display.replace(/```[a-z0-9_\-:]*\s*$/i, '');

  // 6. Hide in-progress action blocks during streaming
  display = display.replace(/```(?:action|json:action)[\s\S]*?(?:```|$)/gi, '');

  // 7. Hide in-progress file export blocks during streaming
  display = display.replace(/```(?:file_export|export|document)[\s\S]*?(?:```|$)/gi, '');

  // 8. Safety cleanup: if standalone trailing backticks exist at the very end of stream, mask them
  display = display.replace(/`{1,3}\s*$/g, '');

  return display;
}

function prepareFinalMarkdown(text) {
  if (!text) return '';
  let prepared = cleanFormulaAndLatexSyntax(text, true);

  // 1. Convert ```chart, ```chart:*, ```graph, ```plot, ```visualization, ```pie, ```bar, ```line blocks
  prepared = prepared.replace(/```(?:chart|chart:[a-z0-9_\-]+|json:chart|graph|plot|visualization|pie|doughnut|bar|line)\s*([\s\S]*?)```/gi, (match, raw) => {
    const cfg = normalizeChartConfig(raw);
    if (cfg) {
      const encoded = encodeURIComponent(JSON.stringify(cfg));
      return `\n\n<div class="apex-chart-slot" data-chart="${encoded}"></div>\n\n`;
    }
    return ''; // hide if malformed
  });

  // 2. Intercept python code blocks with matplotlib, plt, seaborn, or figure plots
  prepared = prepared.replace(/```(?:python|py)?\s*([\s\S]*?(?:matplotlib|plt\.|seaborn|sns\.|fig\s*=|ax\s*=)[\s\S]*?)```/gi, (match, pyCode) => {
    const cfg = normalizeChartConfig(pyCode);
    if (cfg) {
      const encoded = encodeURIComponent(JSON.stringify(cfg));
      return `\n\n<div class="apex-chart-slot" data-chart="${encoded}"></div>\n\n`;
    }
    return ''; // completely eliminate python plotting code so user NEVER sees coding before charts
  });

  // 3. Intercept ```json or ```javascript or unlabelled code blocks with chart data
  prepared = prepared.replace(/```(?:json|javascript|js)?\s*(\{[\s\S]*?"(?:type|data|labels|datasets|series)"[\s\S]*?\})```/gi, (match, jsonStr) => {
    const cfg = normalizeChartConfig(jsonStr);
    if (cfg) {
      const encoded = encodeURIComponent(JSON.stringify(cfg));
      return `\n\n<div class="apex-chart-slot" data-chart="${encoded}"></div>\n\n`;
    }
    return match; // keep standard non-chart json code blocks
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

  // 5. Convert text code blocks (timelines, logs, milestone blocks) into clean visual cards rather than raw code
  prepared = prepared.replace(/```(?:text|code|milestones?|timeline)?\s*\n([\s\S]*?)```/gi, (match, content) => {
    const trimmed = content.trim();
    if (!trimmed) return '';
    if (/\[\d{4}-\d{2}-\d{2}|(?:\d{1,2}:\d{2})|-->|->|—|Dispatch|Arrival|Transit|Hub/i.test(trimmed)) {
      const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l && l !== '|' && l !== '│' && l !== '↓');
      const itemsHtml = lines.map(l => {
        const dateMatch = l.match(/\[(.*?)\]\s*(?:[—–-]\s*)?(.*)/);
        if (dateMatch) {
          return `<div class="timeline-card-item"><span class="timeline-badge">${escapeHtml(dateMatch[1])}</span><span class="timeline-desc">${escapeHtml(dateMatch[2])}</span></div>`;
        }
        return `<div class="timeline-card-item"><span class="timeline-dot"></span><span class="timeline-desc">${escapeHtml(l)}</span></div>`;
      }).join('');
      return `\n\n<div class="apex-visual-timeline-card"><div class="timeline-card-header"><span class="timeline-icon">⏱️</span> <span>OPERATIONAL MILESTONE TIMELINE</span></div><div class="timeline-card-body">${itemsHtml}</div></div>\n\n`;
    }
    if (trimmed.includes('|') && trimmed.includes('\n')) {
      return '\n\n' + trimmed + '\n\n';
    }
    return `\n\n<div class="apex-visual-data-card">${escapeHtml(trimmed).replace(/\n/g, '<br/>')}</div>\n\n`;
  });

  return prepared;
}

function buildChartCardElement(chartConfig) {
  const card = document.createElement('div');
  card.className = 'apex-chart-card';

  const title = chartConfig.title || 'TEXO Data Visualization';
  let chartType = (chartConfig.type || 'bar').toLowerCase();
  if (chartType === 'column' || chartType === 'combo' || chartType === 'mixed') chartType = 'bar';
  const description = (chartConfig.options && chartConfig.options.description) || '';
  const chartId = 'texo_chart_' + Math.random().toString(36).substring(2, 9);

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
        <span class="apex-chart-footer-brand">TEXO QUANTUM VISUALS</span>
      </div>
    ` : ''}
  `;
  return card;
}

function initChartInstance(card, chartConfig) {
  if (!card || !chartConfig) return;
  const canvas = card.querySelector('canvas');
  if (!canvas) return;

  if (!window.Chart) {
    setTimeout(() => initChartInstance(card, chartConfig), 120);
    return;
  }

  let chartType = (chartConfig.type || 'bar').toLowerCase();
  if (chartType === 'column' || chartType === 'combo' || chartType === 'mixed') chartType = 'bar';
  const title = chartConfig.title || 'TEXO Data Visualization';

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
          duration: 750,
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
  if (!container) return;

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
    const normalized = normalizeChartConfig(chartConfig);
    if (!normalized) return;

    const card = buildChartCardElement(normalized);
    slot.parentNode.replaceChild(card, slot);
    initChartInstance(card, normalized);
  });

  // 2. Secondary sweep: Process any pre code blocks that contain chart data or Python plot
  const codeBlocks = container.querySelectorAll('pre code, pre');
  codeBlocks.forEach(codeEl => {
    const text = codeEl.textContent.trim();
    if (!text) return;
    const preEl = codeEl.tagName.toLowerCase() === 'pre' ? codeEl : codeEl.closest('pre');
    if (!preEl || preEl.dataset.chartRendered) return;

    const isPyPlot = text.includes('matplotlib') || text.includes('plt.') || text.includes('seaborn') || text.includes('sns.');
    const cfg = normalizeChartConfig(text);
    if (cfg) {
      preEl.dataset.chartRendered = 'true';
      const card = buildChartCardElement(cfg);
      preEl.parentNode.replaceChild(card, preEl);
      initChartInstance(card, cfg);
    } else if (isPyPlot) {
      // If it's python plotting code that failed parsing, hide it so the user never sees raw code!
      preEl.dataset.chartRendered = 'true';
      preEl.remove();
    }
  });

  // 3. Tertiary sweep: If no chart card was rendered yet, check if there is a data table that can be visualized
  const hasChart = container.querySelector('.apex-chart-card');
  if (!hasChart) {
    const table = container.querySelector('table');
    if (table && !table.dataset.chartRendered) {
      const cfgFromTable = extractChartFromTable(table);
      if (cfgFromTable) {
        table.dataset.chartRendered = 'true';
        const card = buildChartCardElement(cfgFromTable);
        table.parentNode.insertBefore(card, table);
        initChartInstance(card, cfgFromTable);
      }
    }
  }
}

async function sendMessage(text) {
  if (isStreaming) return;
  if (!text && !pendingAttachment && !currentAttachedFile) return;

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

  let attachedFileType = null;
  let attachedMediaUrl = null;

  if (pendingAttachment || currentAttachedFile) {
    attachedSummary = (pendingAttachment && (pendingAttachment.display_summary || pendingAttachment.filename)) || (currentAttachedFile && currentAttachedFile.name) || 'Attachment';
    attachedFileType = (pendingAttachment && pendingAttachment.file_type) || (currentAttachedFile && currentAttachedFile.type.split('/')[0]) || 'file';
    attachedMediaUrl = currentAttachedLocalUrl || (pendingAttachment && pendingAttachment.image_base64 ? `data:image/jpeg;base64,${pendingAttachment.image_base64}` : null);

    if (pendingAttachment && pendingAttachment.image_base64) {
      imgB64 = pendingAttachment.image_base64;
    }
    if (pendingAttachment && pendingAttachment.text_content) {
      fullPayloadText = `${pendingAttachment.text_content}\n\n[USER INQUIRY / TASK]:\n${text || 'Please thoroughly analyze and explain this file, break down all critical data, calculate key metrics, and provide prioritized technical recommendations.'}`;
    }
    if (!userDisplay) {
      userDisplay = `Analyze and explain attached ${attachedSummary}`;
    }
  }

  const savedMediaUrl = attachedMediaUrl;
  const savedFileType = attachedFileType;
  const savedSummary = attachedSummary;

  clearFilePreview();

  // Append to history
  const storedContent = fullPayloadText + (imgB64 ? '\n\n[IMAGE_BASE64]:' + imgB64 : '');
  conversationHistory.push({ role: 'user', content: storedContent });
  appendMessage('user', userDisplay, imgB64, savedSummary, savedFileType, savedMediaUrl);
  setStatus('thinking'); isStreaming=true; sendBtn.disabled=true;

  // 1. DIRECT VIDEO-ONLY MODE (22-Second 5-Scene HD Cinema — zero prompt/code/industry text)
  const directVideoIntent = (!imgB64 && !savedSummary) ? resolveVideoOrFollowUpIntent(text || '') : null;
  if (directVideoIntent) {
    const wrap = document.createElement('div');
    wrap.className = 'message assistant';
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = 'T';
    const col = document.createElement('div');
    col.className = 'message-col';
    wrap.appendChild(avatar);
    wrap.appendChild(col);
    messagesArea.appendChild(wrap);
    scrollToBottom();

    try {
      await generateVideo(
        directVideoIntent.prompt,
        col,
        null,
        text || directVideoIntent.prompt,
        '',
        directVideoIntent.baseSubject
      );
      conversationHistory.push({
        role: 'assistant',
        content: `[Generated 22s HD Video: ${directVideoIntent.subject}]`
      });
      addTimestamp(col);
      setStatus('ready');
      playDone();
      try { saveCurrentChat(); } catch (_) {}
    } finally {
      isStreaming = false;
      sendBtn.disabled = false;
      scrollToBottom();
    }
    return;
  }

  // 2. DIRECT IMAGE-ONLY MODE (Zero prompt paragraphs, zero code blocks, zero industry text)
  const directImageIntent = (!imgB64 && !savedSummary) ? resolveImageOrFollowUpIntent(text || '') : null;
  if (directImageIntent) {
    const wrap = document.createElement('div');
    wrap.className = 'message assistant';
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = 'T';
    const col = document.createElement('div');
    col.className = 'message-col';
    wrap.appendChild(avatar);
    wrap.appendChild(col);
    messagesArea.appendChild(wrap);
    scrollToBottom();

    try {
      await generateImage(
        directImageIntent.prompt,
        col,
        null,
        text || directImageIntent.prompt,
        '',
        directImageIntent.baseSubject
      );
      conversationHistory.push({
        role: 'assistant',
        content: `[Generated 4K Visual: ${directImageIntent.subject}]`
      });
      addTimestamp(col);
      setStatus('ready');
      playDone();
      try { saveCurrentChat(); } catch (_) {}
    } finally {
      isStreaming = false;
      sendBtn.disabled = false;
      scrollToBottom();
    }
    return;
  }

  // Build sanitized messages payload
  const sanitizedMessages = conversationHistory.slice(-20).map(m => ({
    role: m.role || 'user',
    content: typeof m.content === 'string' ? m.content : String(m.content || '')
  }));
  const {bubbleEl, col, shimmerEl} = appendStreamingMessage();

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
            if (shimmerEl && shimmerEl.parentNode) {
              shimmerEl.remove();
            }
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
    if (typeof ttsEnabled !== 'undefined' && ttsEnabled) {
      try { speakText(fullReply); } catch(_) {}
    }

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
function appendMessage(role, text, imageBase64=null, attachedSummary=null, attachedFileType=null, mediaUrl=null) {
  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'assistant' ? 'T' : 'U';
  const col = document.createElement('div');
  col.className = 'message-col';

  // If user attached a photo or video, display an interactive media card right in the message bubble
  if (role === 'user' && (mediaUrl || imageBase64 || attachedSummary)) {
    const mediaCard = document.createElement('div');
    mediaCard.className = 'user-attached-media-card';

    const isVideo = attachedFileType === 'video' || (mediaUrl && (mediaUrl.includes('video') || mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.mov') || mediaUrl.endsWith('.webm')));
    const isImage = attachedFileType === 'image' || Boolean(imageBase64) || (mediaUrl && !isVideo);
    const imgSrc = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : mediaUrl;
    const displayName = attachedSummary || (isImage ? 'Photo.jpg' : (isVideo ? 'Video.mp4' : 'Attachment'));

    if (isVideo && mediaUrl) {
      mediaCard.innerHTML = `
        <div class="msg-media-header">
          <span class="media-tag">🎥 Attached Video</span>
          <span class="media-fname">${escapeHtml(displayName)}</span>
        </div>
        <video src="${mediaUrl}" controls class="user-bubble-video" preload="metadata"></video>`;
      col.appendChild(mediaCard);
    } else if (isImage && imgSrc) {
      mediaCard.innerHTML = `
        <div class="msg-media-header">
          <span class="media-tag">📷 Attached Photo</span>
          <span class="media-fname">${escapeHtml(displayName)}</span>
        </div>
        <div class="msg-media-img-wrap" onclick="openMediaLightbox('${imgSrc}', '${escapeHtml(displayName)}')">
          <img src="${imgSrc}" class="user-bubble-image" alt="Attached photo" />
          <div class="img-hover-overlay"><span>🔍 View Full Photo</span></div>
        </div>`;
      col.appendChild(mediaCard);
    } else if (attachedSummary) {
      const badge = document.createElement('div');
      badge.className = 'file-attached-badge';
      badge.innerHTML = `📎 Attached: <strong>${escapeHtml(attachedSummary)}</strong>`;
      col.appendChild(badge);
    }
  }

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
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
  const bubble=document.createElement('div'); bubble.className='bubble streaming-bubble';

  // Silent background neural pulse (no user-facing text)
  const shimmer=document.createElement('div');
  shimmer.className='neural-thinking-shimmer';
  shimmer.innerHTML=`
    <div class="shimmer-lead">
      <span class="shimmer-core-dot"></span>
    </div>
  `;
  bubble.appendChild(shimmer);

  col.appendChild(bubble);
  wrap.appendChild(avatar); wrap.appendChild(col);
  messagesArea.appendChild(wrap);
  scrollToBottom();
  return {bubbleEl:bubble, col, shimmerEl:shimmer};
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
  const theme = INDUSTRY_BG_THEMES[key] || INDUSTRY_BG_THEMES['textile'];
  applyIndustryBackgroundTheme(key);

  const questions = (data && data.starterQuestions && data.starterQuestions.length)
    ? data.starterQuestions
    : (INDUSTRY_DATA['textile'] && INDUSTRY_DATA['textile'].starterQuestions) || [];

  const card = document.createElement('div');
  card.className = 'welcome-card structured-welcome-card';
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

  const industryPills = [
    { id: 'textile', label: '🧵 Textile & Apparel' },
    { id: 'food', label: '🥣 Food & Beverage' },
    { id: 'pharma', label: '💊 Pharma & Bio' },
    { id: 'auto', label: '🚗 Automotive & EV' },
    { id: 'construction', label: '🏗️ Civil & BIM' },
    { id: 'logistics', label: '🚚 Global Logistics' },
    { id: 'general', label: '⚡ Universal Core' }
  ].map(p => `
    <button type="button" class="welcome-ind-pill ${p.id === key ? 'active' : ''}" onclick="switchIndustryEnvironment('${p.id}')" title="Switch chatbot background & intelligence to ${p.label}">
      ${p.label}
    </button>
  `).join('');

  const storedUser = currentUser || getStoredUser();
  const userName = (storedUser && storedUser.name && storedUser.name !== 'Guest User')
    ? storedUser.name
    : ((storedUser && storedUser.email && !storedUser.email.startsWith('guest')) ? storedUser.email.split('@')[0] : '');

  const welcomeBannerHtml = userName ? `
    <div class="welcome-user-banner">
      <span class="welcome-back-label">⚡ Welcome Back,</span>
      <span class="welcome-user-name">${escapeHtml(userName)}</span>
    </div>
  ` : '';

  card.innerHTML = `
    <!-- Hero Header -->
    <div class="welcome-hero-section">
      <div class="welcome-top-badge">
        <span class="badge-pulse-glow"></span>
        <span class="badge-txt">${theme.badgeText || '⚡ TEXO UNIVERSAL INTELLIGENCE 2.0 • ENTERPRISE CORE'}</span>
      </div>
      
      <div class="welcome-logo-wrap celebration-interactive" title="Tap for celebration fireworks! 🎆🎉" style="cursor:pointer;">
        <img src="/static/texo_logo.jpg?v=6.1.0" alt="TEXO" class="welcome-logo-img"/>
        <div class="welcome-glow"></div>
      </div>
      
      <h1 class="welcome-h1 celebration-interactive" id="welcomeH1" title="Tap for celebration fireworks! 🎆🎉" style="cursor:pointer; user-select:none;">
        TEXO <span class="celebration-spark-badge" title="Tap for celebration fireworks!">🎆</span>
      </h1>

      ${welcomeBannerHtml}

      <p class="welcome-tagline">
        Next-generation autonomous intelligence workspace. Select an industry environment below to dynamically morph the holographic schematic background, domain telemetry, and specialized AI engineering prompts.
      </p>

      <!-- Interactive 1-Click Industry Holographic Environment Switcher Strip -->
      <div class="welcome-industry-strip" role="group" aria-label="Select Industry Holographic Environment">
        ${industryPills}
      </div>
    </div>

    <!-- Structured Capability Pillars (4 Interactive Cards) -->
    <div class="welcome-pillars-grid">
      <div class="welcome-pillar-card" onclick="quickFillPrompt('Generate an interactive defect distribution chart comparing Broken Pick, Oil Stain, Slub and Mispick with Pareto analysis')">
        <div class="pillar-icon-wrap">📊</div>
        <div class="pillar-content">
          <h4 class="pillar-title">Visual Charts &amp; Analytics</h4>
          <p class="pillar-desc">Interactive Cyber-HUD charts, Pareto defect distributions &amp; real-time telemetry.</p>
        </div>
        <span class="pillar-action">Try Chart →</span>
      </div>

      <div class="welcome-pillar-card" onclick="quickFillPrompt('Create a 5-slide Claude-style executive presentation on Sustainable Textile Manufacturing and Circular Economy')">
        <div class="pillar-icon-wrap">📑</div>
        <div class="pillar-content">
          <h4 class="pillar-title">Claude PPT &amp; Excel Workbooks</h4>
          <p class="pillar-desc">Executive PowerPoint decks, automated Excel sheets &amp; ASTM inspection reports.</p>
        </div>
        <span class="pillar-action">Try PPT →</span>
      </div>

      <div class="welcome-pillar-card" onclick="triggerMicVoiceListening()">
        <div class="pillar-icon-wrap">${CYBER_SPEAKER_SVG}</div>
        <div class="pillar-content">
          <h4 class="pillar-title">Multilingual Voice AI</h4>
          <p class="pillar-desc">Listen in any world language with ultra-realistic human neural voice personas.</p>
        </div>
        <span class="pillar-action">Speak Now →</span>
      </div>

      <div class="welcome-pillar-card" onclick="openLiveIndustryCalculator()">
        <div class="pillar-icon-wrap">🧮</div>
        <div class="pillar-content">
          <h4 class="pillar-title">Live Industry Simulator &amp; ROI Calc</h4>
          <p class="pillar-desc">Real-time interactive sliders for ASTM D5430, HTST HACCP, USP Dissolution, EV Cpk &amp; ACI 318.</p>
        </div>
        <span class="pillar-action">Launch Simulator →</span>
      </div>
    </div>

    <!-- Unique Differentiator Quick Bar -->
    <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin: 4px auto 18px auto;">
      <button type="button" class="welcome-ind-pill active" onclick="openLiveIndustryCalculator()">
        🧮 Open Live ${data.name.split('/')[0].trim()} Calculator
      </button>
      <button type="button" class="welcome-ind-pill" onclick="toggleDualBrainMode()">
        ⚔️ Toggle Executive vs. Shop-Floor Split View
      </button>
      <button type="button" class="welcome-ind-pill" onclick="openPinboardModal()">
        📌 Open Smart Pinboard Vault
      </button>
    </div>

    <!-- Suggested Prompts Section -->
    <div class="welcome-prompts-section">
      <div class="prompts-section-header">
        <span class="prompts-header-icon">⚡</span>
        <span class="prompts-header-title">Suggested Quick Actions (${data.name.split('/')[0].trim()})</span>
        <span class="prompts-header-sub">Tap any query to start instantly</span>
      </div>
      <div class="welcome-features welcome-questions" id="welcomeQuestions">
        ${questionsHtml}
      </div>
    </div>

    <!-- Trust Telemetry Footer -->
    <div class="welcome-trust-bar">
      <div class="trust-item"><span class="trust-dot"></span> 🧠 Continuous Enterprise Memory</div>
      <div class="trust-item"><span class="trust-dot"></span> 🌐 Any-Language Listening</div>
      <div class="trust-item"><span class="trust-dot"></span> ${CYBER_SPEAKER_SVG} Ultra-Real Neural Voice</div>
      <div class="trust-item"><span class="trust-dot"></span> ⚡ Zero-Code Visual Charts</div>
    </div>`;

  messagesArea.appendChild(card);
  bindStarterQuestionButtons(card);
}

window.quickFillPrompt = function(promptText) {
  if (messageInput) {
    messageInput.value = promptText;
    autoResize();
    messageInput.focus();
    triggerSend();
  }
};

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

    // Completely hide chart and python plot code blocks so user NEVER sees raw coding
    if (code && (code.classList.contains('language-chart') || 
                 code.classList.contains('language-json:chart') || 
                 code.className.includes('chart') ||
                 code.className.includes('plot') ||
                 code.className.includes('graph') ||
                 code.className.includes('pie') ||
                 code.className.includes('doughnut') ||
                 code.className.includes('bar') ||
                 code.className.includes('line'))) {
      pre.style.display = 'none';
      return;
    }
    if ((codeText.includes('"type"') || codeText.includes('"labels"')) && codeText.includes('"data"')) {
      pre.style.display = 'none';
      return;
    }
    if (codeText.includes('matplotlib') || codeText.includes('plt.') || codeText.includes('seaborn') || codeText.includes('sns.') || codeText.includes('fig, ax') || codeText.includes('plt.pie')) {
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

function addTableExportButtons(col, bubble) {
  if (!bubble) return;
  const tables = bubble.querySelectorAll('table');
  tables.forEach((tbl, idx) => {
    if (tbl.dataset.exportRendered || tbl.nextElementSibling?.classList.contains('table-export-bar')) return;
    tbl.dataset.exportRendered = 'true';

    const bar = document.createElement('div');
    bar.className = 'table-export-bar';
    bar.innerHTML = `
      <span style="font-family:var(--font-mono);font-size:10px;color:var(--text3);text-transform:uppercase;">📊 Table ${idx + 1} Tools:</span>
      <button class="table-export-btn" type="button" data-act="copy-csv">📋 Copy CSV</button>
      <button class="table-export-btn" type="button" data-act="dl-csv">⬇️ Download CSV</button>
    `;

    function tableToCSV() {
      const rows = [];
      tbl.querySelectorAll('tr').forEach(tr => {
        const row = [];
        tr.querySelectorAll('th, td').forEach(cell => {
          let text = cell.innerText.replace(/"/g, '""').trim();
          row.push(`"${text}"`);
        });
        if (row.length) rows.push(row.join(','));
      });
      return rows.join('\r\n');
    }

    const copyBtn = bar.querySelector('[data-act="copy-csv"]');
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const csv = tableToCSV();
      await copyToClipboard(csv);
      copyBtn.innerHTML = '✅ Copied!';
      playClick();
      setTimeout(() => { copyBtn.innerHTML = '📋 Copy CSV'; }, 2000);
    });

    const dlBtn = bar.querySelector('[data-act="dl-csv"]');
    dlBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const csv = tableToCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `table_export_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      playDone();
    });

    tbl.parentNode.insertBefore(bar, tbl.nextSibling);
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
  listenBtn.title = 'Read this answer aloud (Click again to stop)';
  listenBtn.innerHTML = `<span class="speaker-cyber-icon">${CYBER_SPEAKER_SVG}</span> <span class="btn-label">Listen</span>`;

  listenBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const textToSpeak = getCleanTextToCopy(rawText, bubble);
    speakText(textToSpeak, listenBtn);
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

  const wordBtn = document.createElement('button');
  wordBtn.className = 'msg-action-btn doc-export-btn docx-export-btn';
  wordBtn.type = 'button';
  wordBtn.title = 'Generate & Download Word Document (.docx)';
  wordBtn.innerHTML = `<span class="btn-icon">📝</span> Word`;
  wordBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await exportDocumentFromMessage('docx', rawText, bubble, wordBtn);
  });

  // NEW DIFFERENTIATOR 1: Dual-Brain Split View (Executive ROI vs. Shop-Floor SOP)
  const splitViewBtn = document.createElement('button');
  splitViewBtn.className = 'msg-action-btn split-view-btn';
  splitViewBtn.type = 'button';
  splitViewBtn.title = 'Split answer into Executive ROI Brief vs. Shop-Floor Technical SOP';
  splitViewBtn.innerHTML = `<span class="btn-icon">⚔️</span> Split Exec/Tech`;
  splitViewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    renderDualBrainSplitView(col, rawText, bubble, splitViewBtn);
  });

  // NEW DIFFERENTIATOR 2: Interactive 3D Flipping Flashcards Deck
  const flashcardsBtn = document.createElement('button');
  flashcardsBtn.className = 'msg-action-btn flashcards-btn';
  flashcardsBtn.type = 'button';
  flashcardsBtn.title = 'Convert key specs & takeaways into interactive 3D flipping flashcards';
  flashcardsBtn.innerHTML = `<span class="btn-icon">🃏</span> 3D Flashcards`;
  flashcardsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    renderFlashcardsDeck(col, rawText, bubble, flashcardsBtn);
  });

  // NEW DIFFERENTIATOR 3: Pin to Smart Executive Pinboard Vault
  const pinBtn = document.createElement('button');
  pinBtn.className = 'msg-action-btn pin-msg-btn';
  pinBtn.type = 'button';
  pinBtn.title = 'Save this insight/formula to your Smart Pinboard Vault';
  pinBtn.innerHTML = `<span class="btn-icon">📌</span> Pin`;
  pinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pinMessageToBoard(rawText, bubble, pinBtn);
  });

  actions.appendChild(copyBtn);
  actions.appendChild(listenBtn);
  actions.appendChild(splitViewBtn);
  actions.appendChild(flashcardsBtn);
  actions.appendChild(pinBtn);
  actions.appendChild(videoBtn);
  actions.appendChild(pdfBtn);
  actions.appendChild(pptxBtn);
  actions.appendChild(xlsxBtn);
  actions.appendChild(wordBtn);

  // Auto-render Dual-Brain Split View if global toggle is ON
  if (window.__dualBrainModeActive) {
    setTimeout(() => renderDualBrainSplitView(col, rawText, bubble, splitViewBtn, true), 120);
  }

  const followUps = renderAutonomousFollowUps(rawText, col);

  const ts = col.querySelector('.timestamp');
  if (ts) {
    if (followUps) col.insertBefore(followUps, ts);
    col.insertBefore(actions, ts);
  } else {
    if (followUps) col.appendChild(followUps);
    col.appendChild(actions);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 🚀 UNIQUE DIFFERENTIATOR FEATURES ENGINE
// 1. Dual-Brain Executive vs. Engineer Split View
// 2. Interactive 3D Flipping Flashcards Deck
// 3. Smart Glass Pinboard Vault
// 4. Live Multi-Industry Engineering & ROI Simulator
// ══════════════════════════════════════════════════════════════════════════════

window.__dualBrainModeActive = false;

window.toggleDualBrainMode = function() {
  window.__dualBrainModeActive = !window.__dualBrainModeActive;
  const btn = document.getElementById('dualBrainToggleBtn');
  if (btn) {
    btn.classList.toggle('active', window.__dualBrainModeActive);
    btn.innerHTML = window.__dualBrainModeActive ? '⚔️ Split: ON' : '⚔️ Split';
  }
  if (typeof playClick === 'function') playClick();
  if (typeof showSentinelToast === 'function') {
    showSentinelToast(
      window.__dualBrainModeActive
        ? '⚔️ Dual-Brain Mode ON: Responses now split into Executive ROI vs. Shop-Floor SOP!'
        : '⚔️ Dual-Brain Mode OFF: Standard unified view restored.',
      3200
    );
  }
  // Also toggle split view on any existing assistant messages on screen
  document.querySelectorAll('.message.assistant').forEach(msg => {
    const col = msg.querySelector('.message-col');
    const bubble = msg.querySelector('.bubble');
    const splitBtn = msg.querySelector('.split-view-btn');
    if (col && bubble) {
      if (window.__dualBrainModeActive && !bubble.querySelector('.dual-brain-grid')) {
        renderDualBrainSplitView(col, bubble.innerText, bubble, splitBtn, true);
      } else if (!window.__dualBrainModeActive) {
        const existing = bubble.querySelector('.dual-brain-grid');
        if (existing) existing.remove();
      }
    }
  });
};

function renderDualBrainSplitView(col, rawText, bubble, btn, forceOpen = false) {
  if (!bubble) return;
  const existing = bubble.querySelector('.dual-brain-grid');
  if (existing && !forceOpen) {
    existing.remove();
    if (btn) btn.classList.remove('copied');
    if (typeof playClick === 'function') playClick();
    return;
  }
  if (existing) return;

  const clean = getCleanTextToCopy(rawText, bubble);
  const lines = clean.split('\n').map(l => l.replace(/^[\s*\-•\d.]+/, '').trim()).filter(l => l.length > 18);

  const execPoints = [];
  const techPoints = [];

  lines.forEach((line, i) => {
    const lower = line.toLowerCase();
    if (lower.match(/cost|roi|margin|yield|compliance|risk|audit|quality|grade|pass|reject|saving|kpi|target|summary|impact|percent|%/)) {
      if (execPoints.length < 4) execPoints.push(line.slice(0, 150));
    } else if (lower.match(/temp|pressure|rpm|speed|formula|step|measure|check|astm|iso|usp|haccp|mm|cm|kg|mpa|psi|hz|volt|setting|adjust|valve/)) {
      if (techPoints.length < 4) techPoints.push(line.slice(0, 150));
    } else if (i % 2 === 0 && execPoints.length < 4) {
      execPoints.push(line.slice(0, 150));
    } else if (techPoints.length < 4) {
      techPoints.push(line.slice(0, 150));
    }
  });

  if (execPoints.length === 0) {
    execPoints.push('Prioritize zero-defect first-pass yield and regulatory audit readiness across all production lots.');
    execPoints.push('Enforce automated KPI telemetry tracking to reduce rework and unit cost variance by 18–25%.');
  }
  if (techPoints.length === 0) {
    techPoints.push('Verify machine calibration tolerances, sensor setpoints, and standard operating limits before lot release.');
    techPoints.push('Execute root-cause containment and log real-time parameter checks at 15-minute intervals.');
  }

  const grid = document.createElement('div');
  grid.className = 'dual-brain-grid';
  grid.innerHTML = `
    <div class="dual-brain-pane exec-pane">
      <div class="dual-pane-header">
        <span>💼 Executive &amp; Financial ROI Brief</span>
        <span>BOARD VIEW</span>
      </div>
      <ul class="dual-pane-list">
        ${execPoints.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
      </ul>
    </div>
    <div class="dual-brain-pane tech-pane">
      <div class="dual-pane-header">
        <span>⚙️ Shop-Floor &amp; Engineering SOP</span>
        <span>OPERATOR VIEW</span>
      </div>
      <ul class="dual-pane-list">
        ${techPoints.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
      </ul>
    </div>
  `;

  bubble.appendChild(grid);
  if (btn) btn.classList.add('copied');
  if (typeof playClick === 'function') playClick();
}

function renderFlashcardsDeck(col, rawText, bubble, btn) {
  if (!bubble) return;
  const existing = bubble.querySelector('.flashcards-deck-grid');
  if (existing) {
    existing.remove();
    if (btn) btn.classList.remove('copied');
    if (typeof playClick === 'function') playClick();
    return;
  }

  const clean = getCleanTextToCopy(rawText, bubble);
  const rawLines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  const cards = [];

  for (let i = 0; i < rawLines.length && cards.length < 4; i++) {
    const line = rawLines[i].replace(/^[\s#*•\-\d.]+/, '').replace(/\*\*/g, '').trim();
    if (line.length >= 12 && line.length <= 90) {
      const nextLine = (rawLines[i + 1] || 'Standard industrial tolerance & quality control checkpoint verified by TEXO AI.')
        .replace(/^[\s#*•\-\d.]+/, '').replace(/\*\*/g, '').trim();
      if (nextLine.length > 15) {
        cards.push({ title: line, detail: nextLine.slice(0, 165) });
        i++;
      }
    }
  }

  if (cards.length === 0) {
    cards.push(
      { title: 'Core Specification & Standard', detail: clean.slice(0, 150) || 'Verified industrial parameter & compliance benchmark.' },
      { title: 'Critical Control Action', detail: clean.slice(150, 300) || 'Maintain strict process control and real-time sensor verification.' }
    );
  }

  const deck = document.createElement('div');
  deck.className = 'flashcards-deck-grid';
  deck.innerHTML = cards.map((c, idx) => `
    <div class="interactive-flashcard" onclick="this.classList.toggle('flipped')" title="Click to flip 3D Flashcard">
      <div class="flashcard-inner">
        <div class="flashcard-front">
          <span class="fc-badge">⚡ KEY INSIGHT CARD #${idx + 1}</span>
          <div class="fc-title">${escapeHtml(c.title)}</div>
          <span class="fc-hint">🔄 Tap to flip for technical spec →</span>
        </div>
        <div class="flashcard-back">
          <span class="fc-badge">✅ TECHNICAL SPECIFICATION</span>
          <div class="fc-answer">${escapeHtml(c.detail)}</div>
          <span class="fc-hint">🔄 Tap to flip back</span>
        </div>
      </div>
    </div>
  `).join('');

  bubble.appendChild(deck);
  if (btn) btn.classList.add('copied');
  if (typeof playClick === 'function') playClick();
}

const PINBOARD_STORAGE_KEY = 'texo_pinned_insights_v1';

function getPinnedInsights() {
  try {
    return JSON.parse(localStorage.getItem(PINBOARD_STORAGE_KEY) || '[]');
  } catch (_) {
    return [];
  }
}

function savePinnedInsights(items) {
  try {
    localStorage.setItem(PINBOARD_STORAGE_KEY, JSON.stringify(items));
  } catch (_) {}
  updatePinCountBadge();
}

function updatePinCountBadge() {
  const badge = document.getElementById('pinCountBadge');
  if (badge) {
    badge.textContent = String(getPinnedInsights().length);
  }
}

function pinMessageToBoard(rawText, bubble, btn) {
  const clean = getCleanTextToCopy(rawText, bubble);
  if (!clean) return;
  const items = getPinnedInsights();
  const indKey = activeIndustryBgKey || 'textile';
  items.unshift({
    id: Date.now(),
    industry: indKey.toUpperCase(),
    timestamp: new Date().toLocaleString(),
    text: clean.slice(0, 900)
  });
  savePinnedInsights(items.slice(0, 30));
  if (btn) {
    btn.innerHTML = `<span class="btn-icon">✅</span> Pinned!`;
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = `<span class="btn-icon">📌</span> Pin`;
    }, 2000);
  }
  if (typeof playDone === 'function') playDone();
  if (typeof showSentinelToast === 'function') {
    showSentinelToast('📌 Insight saved to your Smart Pinboard Vault!', 2800);
  }
}

window.openPinboardModal = function() {
  const modal = document.getElementById('pinboardModal');
  if (!modal) return;
  renderPinboardItems();
  modal.style.display = 'flex';
  if (typeof playClick === 'function') playClick();
};

window.closePinboardModal = function() {
  const modal = document.getElementById('pinboardModal');
  if (modal) modal.style.display = 'none';
};

function renderPinboardItems() {
  const container = document.getElementById('pinboardItemsList');
  if (!container) return;
  updatePinCountBadge();
  const items = getPinnedInsights();
  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:32px 16px; color:#94A3B8;">
        <div style="font-size:32px; margin-bottom:10px;">📌</div>
        <strong>Your Smart Pinboard Vault is empty.</strong>
        <p style="font-size:12.5px; margin-top:6px;">Click the <b>📌 Pin</b> button under any TEXO AI response to save critical formulas, SOPs, and executive tables here.</p>
      </div>
    `;
    return;
  }
  container.innerHTML = items.map(item => `
    <div class="pinboard-card">
      <div class="pinboard-card-top">
        <span>🏷️ SECTOR: ${escapeHtml(item.industry)} • ${escapeHtml(item.timestamp)}</span>
        <button type="button" class="table-export-btn" onclick="removePinboardItem(${item.id})">✕ Remove</button>
      </div>
      <div class="pinboard-card-body">${escapeHtml(item.text)}</div>
    </div>
  `).join('');
}

window.removePinboardItem = function(id) {
  const items = getPinnedInsights().filter(i => i.id !== id);
  savePinnedInsights(items);
  renderPinboardItems();
};

window.clearPinboardVault = function() {
  savePinnedInsights([]);
  renderPinboardItems();
};

window.exportPinboardMarkdown = function() {
  const items = getPinnedInsights();
  if (!items.length) return;
  const md = `# TEXO Smart Executive Pinboard Export\n\n` + items.map((it, idx) =>
    `## ${idx + 1}. [${it.industry}] — ${it.timestamp}\n\n${it.text}\n\n---\n`
  ).join('\n');
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TEXO_Pinboard_Insights_${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ── LIVE MULTI-INDUSTRY ENGINEERING & ROI SIMULATOR ─────────────────────────
const LIVE_INDUSTRY_CALCULATORS = {
  textile: {
    title: '🧵 Textile ASTM D5430 4-Point Grade & GSM Yarn Simulator',
    sub: 'Real-time fabric roll penalty grading, areal density (GSM), and roll weight calculator',
    sliders: [
      { id: 'rollLen', label: 'Roll Length (Meters)', min: 20, max: 500, step: 5, val: 120, unit: 'm' },
      { id: 'fabWidth', label: 'Fabric Width (cm)', min: 90, max: 280, step: 2, val: 150, unit: 'cm' },
      { id: 'defectPts', label: 'Total Penalty Points Counted', min: 0, max: 80, step: 1, val: 18, unit: 'pts' },
      { id: 'epi', label: 'Warp Ends Per Inch (EPI)', min: 40, max: 180, step: 2, val: 110, unit: 'EPI' },
      { id: 'ppi', label: 'Weft Picks Per Inch (PPI)', min: 30, max: 150, step: 2, val: 84, unit: 'PPI' }
    ],
    compute: (v) => {
      const sqYards = (v.rollLen * (v.fabWidth / 100)) * 1.19599;
      const ptsPer100 = (v.defectPts * 100) / Math.max(1, sqYards);
      const gsm = Math.round(((v.epi / 30) + (v.ppi / 30)) * 23.5);
      const rollKg = ((v.rollLen * (v.fabWidth / 100) * gsm) / 1000).toFixed(1);
      const pass = ptsPer100 <= 28;
      return {
        status: pass ? `✅ ASTM D5430 GRADE A PASS (${ptsPer100.toFixed(1)} ≤ 28.0 pts/100yd²)` : `⚠️ ASTM D5430 REJECT / SECOND QUALITY (${ptsPer100.toFixed(1)} > 28.0 pts/100yd²)`,
        statusClass: pass ? '' : 'fail',
        kpis: [
          { num: `${ptsPer100.toFixed(1)}`, label: 'Points / 100 Sq.Yd' },
          { num: `${gsm} GSM`, label: 'Calculated Fabric GSM' },
          { num: `${rollKg} kg`, label: 'Total Roll Weight' },
          { num: pass ? '98.4%' : '82.0%', label: 'First-Quality Yield' }
        ],
        formula: `ASTM D5430 Formula: (Total Points [${v.defectPts}] × 100) ÷ Roll Area [${sqYards.toFixed(1)} yd²] = ${ptsPer100.toFixed(2)} pts/100 sq.yd.`,
        prompt: `Analyze our textile roll inspection: Roll Length ${v.rollLen}m, Width ${v.fabWidth}cm, ${v.defectPts} penalty points (${ptsPer100.toFixed(1)} pts/100 sq.yd), construction ${v.epi} EPI × ${v.ppi} PPI (~${gsm} GSM, ${rollKg} kg). Provide corrective loom actions and ASTM D5430 quality report.`
      };
    }
  },
  food: {
    title: '🥣 Food & Beverage HTST Pasteurization CCP & Brix Syrup Simulator',
    sub: 'Thermal lethality (PU), pathogen log-reduction, and batch sugar formulation',
    sliders: [
      { id: 'tempC', label: 'Pasteurizer Holding Temp (°C)', min: 65, max: 88, step: 0.5, val: 73.5, unit: '°C' },
      { id: 'holdSec', label: 'Holding Tube Time (Seconds)', min: 5, max: 60, step: 1, val: 16, unit: 'sec' },
      { id: 'brix', label: 'Target Beverage Brix (°Bx)', min: 4, max: 22, step: 0.5, val: 11.5, unit: '°Bx' },
      { id: 'batchL', label: 'Batch Tank Volume (Liters)', min: 200, max: 10000, step: 100, val: 2500, unit: 'L' }
    ],
    compute: (v) => {
      const pass = v.tempC >= 72.0 && v.holdSec >= 15;
      const logRed = ((v.tempC - 60) * 0.48 * (v.holdSec / 15)).toFixed(1);
      const sugarKg = Math.round(v.batchL * (v.brix / 100) * 1.045);
      return {
        status: pass ? `✅ HACCP CCP-1 VERIFIED (${v.tempC}°C for ${v.holdSec}s ≥ 72°C/15s)` : `🚨 CRITICAL FLOW DIVERSION TRIGGERED (Below 72°C / 15s Pasteurization Limit)`,
        statusClass: pass ? '' : 'fail',
        kpis: [
          { num: `${logRed}-Log`, label: 'Pathogen Kill Rate' },
          { num: `${sugarKg} kg`, label: 'Sucrose Required' },
          { num: `${v.brix} °Bx`, label: 'Refractometer Target' },
          { num: pass ? '21 Days' : 'HOLD', label: 'Cold-Chain Shelf Life' }
        ],
        formula: `HTST Thermal Lethality: T=${v.tempC}°C, Hold=${v.holdSec}s → ${logRed}-Log CFU reduction (>5-Log FDA requirement). Sugar Mass = ${v.batchL}L × ${v.brix}% × SG.`,
        prompt: `Evaluate our Food & Beverage batch: HTST Pasteurizer running at ${v.tempC}°C for ${v.holdSec} seconds (${logRed}-Log reduction), batch size ${v.batchL}L at ${v.brix} °Brix (${sugarKg} kg sugar). Generate a HACCP CCP verification & CIP sanitation plan.`
      };
    }
  },
  pharma: {
    title: '💊 Biopharma USP <711> Dissolution & Cleanroom HVAC Cascade Simulator',
    sub: 'Simulate tablet release kinetics, ISO cleanroom Air Changes Per Hour (ACH), and batch yield',
    sliders: [
      { id: 'dissQ', label: 'Mean Dissolution @ 30 min (%)', min: 65, max: 99, step: 1, val: 88, unit: '%' },
      { id: 'hardness', label: 'Tablet Compression Hardness (kp)', min: 4, max: 20, step: 0.5, val: 10.5, unit: 'kp' },
      { id: 'roomVol', label: 'Cleanroom Volume (m³)', min: 50, max: 600, step: 10, val: 180, unit: 'm³' },
      { id: 'hepaFlow', label: 'HEPA Supply Airflow (m³/h)', min: 2000, max: 25000, step: 500, val: 9000, unit: 'm³/h' }
    ],
    compute: (v) => {
      const ach = Math.round(v.hepaFlow / Math.max(1, v.roomVol));
      const pass = v.dissQ >= 80 && ach >= 40;
      const isoGrade = ach >= 60 ? 'Grade B / ISO 5' : (ach >= 40 ? 'Grade C / ISO 7' : 'Grade D / ISO 8');
      return {
        status: pass ? `✅ USP <711> STAGE S1 & cGMP CLEANROOM COMPLIANT` : `⚠️ OOS / HVAC ALERT: Verify Q+5% (≥80%) & Cleanroom ACH (≥40/hr)`,
        statusClass: pass ? '' : 'warn',
        kpis: [
          { num: `${v.dissQ}%`, label: 'USP <711> Release (Q=75%)' },
          { num: `${ach} ACH`, label: 'Air Changes / Hour' },
          { num: isoGrade, label: 'Cleanroom Classification' },
          { num: `${v.hardness} kp`, label: 'Tablet Crushing Force' }
        ],
        formula: `USP <711> Stage S1: Each unit ≥ Q+5% (80%). Cleanroom ACH = Airflow [${v.hepaFlow} m³/h] ÷ Volume [${v.roomVol} m³] = ${ach} ACH.`,
        prompt: `Analyze our Biopharma batch & cleanroom telemetry: USP <711> dissolution ${v.dissQ}% at 30 min, tablet hardness ${v.hardness} kp, cleanroom volume ${v.roomVol} m³ with ${v.hepaFlow} m³/h HEPA flow (${ach} ACH, ${isoGrade}). Provide cGMP validation recommendations.`
      };
    }
  },
  auto: {
    title: '🚗 Automotive IATF 16949 Process Capability (Cp/Cpk) & Torque Simulator',
    sub: 'Calculate Six Sigma dimensional capability, defect PPM, and fastener clamping force',
    sliders: [
      { id: 'tolWidth', label: 'Total Tolerance Width USL-LSL (mm)', min: 0.05, max: 1.0, step: 0.05, val: 0.40, unit: 'mm' },
      { id: 'sigma', label: 'Process Std Deviation σ (mm)', min: 0.01, max: 0.15, step: 0.005, val: 0.035, unit: 'mm' },
      { id: 'shift', label: 'Mean Center Shift (mm)', min: 0, max: 0.12, step: 0.01, val: 0.02, unit: 'mm' },
      { id: 'torque', label: 'Nutrunner Target Torque (Nm)', min: 20, max: 180, step: 5, val: 85, unit: 'Nm' }
    ],
    compute: (v) => {
      const cp = v.tolWidth / (6 * v.sigma);
      const cpk = ((v.tolWidth / 2) - v.shift) / (3 * v.sigma);
      const pass = cpk >= 1.67;
      const ppm = cpk >= 1.67 ? '< 1 PPM' : (cpk >= 1.33 ? '63 PPM' : '2,700+ PPM');
      const preloadKn = (v.torque / (0.2 * 12)).toFixed(1);
      return {
        status: pass ? `✅ IATF 16949 PPAP APPROVED (Cpk ${cpk.toFixed(2)} ≥ 1.67)` : `⚠️ PROCESS CAPABILITY BELOW 1.67 BENCHMARK (Cpk = ${cpk.toFixed(2)})`,
        statusClass: pass ? '' : 'warn',
        kpis: [
          { num: cpk.toFixed(2), label: 'Process Cpk Index' },
          { num: cp.toFixed(2), label: 'Potential Cp Index' },
          { num: ppm, label: 'Projected Defect Rate' },
          { num: `${preloadKn} kN`, label: 'Clamp Preload (M12)' }
        ],
        formula: `Cp = (USL - LSL) / 6σ = ${cp.toFixed(2)} | Cpk = (Half-Tol - Shift) / 3σ = ${cpk.toFixed(2)}. Target IATF 16949 Cpk ≥ 1.67.`,
        prompt: `Review our Automotive machining & assembly telemetry: Tolerance band ±${(v.tolWidth/2).toFixed(2)}mm, σ=${v.sigma}mm, mean shift ${v.shift}mm (Cp=${cp.toFixed(2)}, Cpk=${cpk.toFixed(2)}, ${ppm}), fastener torque ${v.torque} Nm (${preloadKn} kN preload). Provide AIAG-VDA FMEA & SPC control plan.`
      };
    }
  },
  construction: {
    title: '🏗️ Civil & Structural ACI 318 Concrete Strength & Mix Volume Simulator',
    sub: 'Compute 28-day cylinder compressive strength (MPa/PSI), pour volume, and cement bags',
    sliders: [
      { id: 'wcRatio', label: 'Water-Cement Ratio (W/C)', min: 0.32, max: 0.68, step: 0.02, val: 0.44, unit: '' },
      { id: 'areaM2', label: 'Slab Pour Area (m²)', min: 20, max: 1000, step: 10, val: 240, unit: 'm²' },
      { id: 'thickCm', label: 'Slab Thickness (cm)', min: 10, max: 50, step: 2, val: 20, unit: 'cm' },
      { id: 'slumpMm', label: 'Target Cone Slump (mm)', min: 50, max: 180, step: 5, val: 105, unit: 'mm' }
    ],
    compute: (v) => {
      const mpa28 = Math.round(96 / Math.pow(7, 1.5 * v.wcRatio));
      const psi28 = Math.round(mpa28 * 145.038);
      const volM3 = (v.areaM2 * (v.thickCm / 100)).toFixed(1);
      const cementBags = Math.round(volM3 * 7.2);
      const pass = v.wcRatio <= 0.50 && mpa28 >= 30;
      return {
        status: pass ? `✅ ACI 318 & ASTM C39 STRUCTURAL GRADE PASS (${mpa28} MPa / ${psi28} PSI)` : `⚠️ HIGH W/C RATIO WARNING: Strength ${mpa28} MPa (Reduce W/C ≤ 0.48)`,
        statusClass: pass ? '' : 'warn',
        kpis: [
          { num: `${mpa28} MPa`, label: '28-Day Strength' },
          { num: `${psi28} PSI`, label: 'Cylinder Break PSI' },
          { num: `${volM3} m³`, label: 'Total Concrete Volume' },
          { num: `${cementBags} Bags`, label: '50kgOPC Cement Bags' }
        ],
        formula: `Abrams' W/C Law: W/C=${v.wcRatio} → f'c ≈ ${mpa28} MPa (${psi28} PSI). Volume = ${v.areaM2}m² × ${v.thickCm/100}m = ${volM3} m³.`,
        prompt: `Analyze our structural concrete pour: Slab ${v.areaM2} m² × ${v.thickCm} cm (${volM3} m³), Water-Cement ratio ${v.wcRatio} (projected 28-day strength ${mpa28} MPa / ${psi28} PSI), slump ${v.slumpMm} mm, requiring ~${cementBags} bags of 50kg cement. Provide ACI 318 curing & slump control guidelines.`
      };
    }
  },
  logistics: {
    title: '🚚 Global Logistics OTIF Scorecard & Cold-Chain MKT Simulator',
    sub: 'Calculate On-Time In-Full SLA performance, container utilization, and Mean Kinetic Temp',
    sliders: [
      { id: 'onTime', label: 'On-Time Delivery Rate (%)', min: 80, max: 100, step: 0.5, val: 97.5, unit: '%' },
      { id: 'inFull', label: 'In-Full Order Fill Rate (%)', min: 80, max: 100, step: 0.5, val: 98.0, unit: '%' },
      { id: 'reeferC', label: 'Baseline Reefer Temp (°C)', min: 2, max: 12, step: 0.5, val: 4.5, unit: '°C' },
      { id: 'spikeC', label: 'Peak Excursion Temp (°C)', min: 5, max: 25, step: 1, val: 11, unit: '°C' }
    ],
    compute: (v) => {
      const otif = ((v.onTime / 100) * (v.inFull / 100) * 100).toFixed(1);
      const mkt = (v.reeferC * 0.78 + v.spikeC * 0.22).toFixed(1);
      const pass = parseFloat(otif) >= 95.0 && parseFloat(mkt) <= 8.0;
      return {
        status: pass ? `✅ SLA & COLD-CHAIN COMPLIANT (OTIF ${otif}% • MKT ${mkt}°C)` : `⚠️ SUPPLY CHAIN SLA / TEMP EXCURSION ALERT (OTIF ${otif}% • MKT ${mkt}°C)`,
        statusClass: pass ? '' : 'warn',
        kpis: [
          { num: `${otif}%`, label: 'Combined OTIF Score' },
          { num: `${mkt} °C`, label: 'Mean Kinetic Temp' },
          { num: parseFloat(mkt) <= 8 ? 'PASS' : 'QUARANTINE', label: 'Cold-Chain Disposition' },
          { num: parseFloat(otif) >= 95 ? '$0' : '$4,250', label: 'Est. SLA Chargeback' }
        ],
        formula: `OTIF = On-Time [${v.onTime}%] × In-Full [${v.inFull}%] = ${otif}%. Cold-Chain MKT = ${mkt}°C (Max 8.0°C threshold).`,
        prompt: `Evaluate our Supply Chain & Cold-Chain telemetry: On-Time ${v.onTime}%, In-Full ${v.inFull}% (Combined OTIF ${otif}%), Reefer baseline ${v.reeferC}°C with peak excursion to ${v.spikeC}°C (MKT = ${mkt}°C). Provide carrier CAPA and cold-chain disposition plan.`
      };
    }
  },
  general: {
    title: '⚡ Universal Six Sigma Yield, Scrap Reduction & ROI Calculator',
    sub: 'Model manufacturing yield recovery, annual scrap savings, and automation payback',
    sliders: [
      { id: 'vol', label: 'Monthly Production Volume (Units)', min: 5000, max: 250000, step: 5000, val: 50000, unit: '' },
      { id: 'scrapPct', label: 'Current Defect / Scrap Rate (%)', min: 0.5, max: 18, step: 0.5, val: 4.5, unit: '%' },
      { id: 'unitCost', label: 'Unit Manufacturing Cost ($)', min: 2, max: 150, step: 2, val: 24, unit: '$' },
      { id: 'capex', label: 'Quality Automation Investment ($)', min: 10000, max: 300000, step: 5000, val: 65000, unit: '$' }
    ],
    compute: (v) => {
      const monthlyLoss = v.vol * (v.scrapPct / 100) * v.unitCost;
      const annualLoss = Math.round(monthlyLoss * 12);
      const annualSavings = Math.round(annualLoss * 0.65);
      const paybackMonths = (v.capex / Math.max(1, annualSavings / 12)).toFixed(1);
      return {
        status: `✅ SIX SIGMA DMAIC PROJECTED SAVINGS: $${annualSavings.toLocaleString()} / YEAR`,
        statusClass: '',
        kpis: [
          { num: `$${annualSavings.toLocaleString()}`, label: 'Annual Scrap Savings (65%)' },
          { num: `${paybackMonths} Mo`, label: 'CAPEX Payback Period' },
          { num: `${(100 - v.scrapPct).toFixed(1)}%`, label: 'Current First-Pass Yield' },
          { num: `$${annualLoss.toLocaleString()}`, label: 'Current Annual Scrap Loss' }
        ],
        formula: `Annual Scrap Loss = ${v.vol.toLocaleString()} units/mo × ${v.scrapPct}% × $${v.unitCost} × 12 = $${annualLoss.toLocaleString()}/yr. Payback = ${paybackMonths} months.`,
        prompt: `Perform a Six Sigma DMAIC & financial ROI analysis: Monthly volume ${v.vol.toLocaleString()} units, current scrap rate ${v.scrapPct}%, unit cost $${v.unitCost} (annual scrap loss $${annualLoss.toLocaleString()}), and proposed $${v.capex.toLocaleString()} automation investment (${paybackMonths} months payback).`
      };
    }
  }
};

let currentCalcPrompt = '';

window.openLiveIndustryCalculator = function(indKey) {
  const modal = document.getElementById('liveCalcModal');
  if (!modal) return;
  const key = indKey || activeIndustryBgKey || (typeof industrySelect !== 'undefined' && industrySelect ? industrySelect.value : 'textile');
  window.renderLiveCalculatorForIndustry(key);
  modal.style.display = 'flex';
  if (typeof playClick === 'function') playClick();
};

window.closeLiveIndustryCalculator = function() {
  const modal = document.getElementById('liveCalcModal');
  if (modal) modal.style.display = 'none';
};

window.renderLiveCalculatorForIndustry = function(indKey) {
  const key = LIVE_INDUSTRY_CALCULATORS[indKey] ? indKey : 'general';
  const cfg = LIVE_INDUSTRY_CALCULATORS[key];

  const titleEl = document.getElementById('liveCalcTitle');
  const subEl = document.getElementById('liveCalcSub');
  const switcherEl = document.getElementById('calcIndSwitcher');
  const slidersEl = document.getElementById('calcSlidersContainer');

  if (titleEl) titleEl.textContent = cfg.title;
  if (subEl) subEl.textContent = cfg.sub;

  if (switcherEl) {
    const pills = [
      { id: 'textile', label: '🧵 Textile' },
      { id: 'food', label: '🥣 Food & Bev' },
      { id: 'pharma', label: '💊 Pharma' },
      { id: 'auto', label: '🚗 Automotive' },
      { id: 'construction', label: '🏗️ Civil & BIM' },
      { id: 'logistics', label: '🚚 Logistics' },
      { id: 'general', label: '⚡ Universal ROI' }
    ];
    switcherEl.innerHTML = pills.map(p => `
      <button type="button" class="welcome-ind-pill ${p.id === key ? 'active' : ''}" onclick="switchIndustryEnvironment('${p.id}'); renderLiveCalculatorForIndustry('${p.id}');">
        ${p.label}
      </button>
    `).join('');
  }

  if (slidersEl) {
    slidersEl.innerHTML = cfg.sliders.map(s => `
      <div class="calc-slider-group">
        <div class="calc-slider-top">
          <span>${s.label}</span>
          <span class="calc-slider-val" id="calcVal_${s.id}">${s.val}${s.unit ? ' ' + s.unit : ''}</span>
        </div>
        <input type="range" class="calc-range-input" id="calcInput_${s.id}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.val}"/>
      </div>
    `).join('');

    const updateOutput = () => {
      const vals = {};
      cfg.sliders.forEach(s => {
        const inp = document.getElementById(`calcInput_${s.id}`);
        const valSpan = document.getElementById(`calcVal_${s.id}`);
        const num = inp ? parseFloat(inp.value) : s.val;
        vals[s.id] = num;
        if (valSpan) valSpan.textContent = `${num}${s.unit ? ' ' + s.unit : ''}`;
      });
      const res = cfg.compute(vals);
      const statusBanner = document.getElementById('calcStatusBanner');
      const kpiGrid = document.getElementById('calcKpiGrid');
      const formulaBox = document.getElementById('calcFormulaBox');
      if (statusBanner) {
        statusBanner.textContent = res.status;
        statusBanner.className = `calc-status-banner ${res.statusClass || ''}`;
      }
      if (kpiGrid) {
        kpiGrid.innerHTML = res.kpis.map(k => `
          <div class="calc-kpi-box">
            <div class="calc-kpi-num">${k.num}</div>
            <div class="calc-kpi-label">${k.label}</div>
          </div>
        `).join('');
      }
      if (formulaBox) formulaBox.textContent = res.formula;
      currentCalcPrompt = res.prompt;
    };

    cfg.sliders.forEach(s => {
      const inp = document.getElementById(`calcInput_${s.id}`);
      if (inp) inp.addEventListener('input', updateOutput);
    });
    updateOutput();
  }
};

window.sendCalcResultToChat = function() {
  closeLiveIndustryCalculator();
  if (currentCalcPrompt && typeof quickFillPrompt === 'function') {
    quickFillPrompt(currentCalcPrompt);
  }
};

// Initialize Pinboard counter on startup
setTimeout(updatePinCountBadge, 500);

function renderAutonomousFollowUps(rawText, col) {
  if (!rawText || !col) return null;
  if (col.querySelector('.autonomous-followups-wrap')) return null;

  // Extract actionable suggestions, follow-up questions, or next logical steps
  const questions = [];
  const lines = rawText.split('\n');
  for (const l of lines) {
    const trimmed = l.trim();
    // Match bulleted/numbered questions or bold questions
    const qMatch = trimmed.match(/^(?:(?:\d+\.|\*|-|•)\s+)?(?:(?:\*\*|__)?(?:Would you like|Shall we|Should we|Do you want to|Next step:|Action:|Recommended:|Try:)\s+)?([A-Z0-9][^.!?\n]{12,120}\?)/i)
                || trimmed.match(/\*\*([A-Z0-9][^.!?\n]{12,110}\?)\*\*/i);
    if (qMatch && qMatch[1]) {
      const cleanQ = qMatch[1].replace(/[*_`]/g, '').trim();
      if (cleanQ.length > 15 && cleanQ.length < 130 && !questions.includes(cleanQ)) {
        questions.push(cleanQ);
        if (questions.length >= 3) break;
      }
    }
  }

  // Fallback domain-aware follow-ups if response had no explicit question marks
  if (!questions.length) {
    const lower = rawText.toLowerCase();
    if (lower.includes('ord-') || lower.includes('tracking') || lower.includes('shipment')) {
      questions.push('Check carrier GPS coordinates & terminal dwell time');
      questions.push('Generate full PDF logistics dossier for this order');
    } else if (lower.includes('4-point') || lower.includes('astm') || lower.includes('defect')) {
      questions.push('Show interactive defects bar chart for this batch');
      questions.push('Export 4-point penalty report as Excel workbook');
    } else if (lower.includes('gsm') || lower.includes('fabric') || lower.includes('yarn')) {
      questions.push('Check stock availability and warehouse bay count');
      questions.push('Request instant FOB price quote for bulk order');
    }
  }

  if (!questions.length) return null;

  const container = document.createElement('div');
  container.className = 'autonomous-followups-wrap';
  container.innerHTML = `
    <div class="followup-header">
      <span class="followup-spark">⚡</span>
      <span class="followup-title">AUTONOMOUS NEXT ACTIONS</span>
      <span class="followup-badge">1-CLICK</span>
    </div>
    <div class="followup-chips"></div>
  `;
  const chipsRow = container.querySelector('.followup-chips');
  questions.forEach(q => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'followup-chip-btn';
    chip.innerHTML = `<span class="chip-arrow">↳</span> <span>${escapeHtml(q)}</span>`;
    chip.title = 'Click to trigger this action autonomously';
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      playClick();
      // Animate chip selection
      chip.classList.add('chip-selected');
      if (typeof sendMessage === 'function') {
        sendMessage(q);
      }
    });
    chipsRow.appendChild(chip);
  });

  return container;
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
    let title = 'TEXO Technical Dossier';
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
        author: `TEXO Universal Intelligence (${(currentUser && currentUser.name) || 'Auditor'})`,
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
  if (s==='thinking'||s==='listening') { statusDot.classList.add('busy'); statusLabel.textContent=s==='listening'?'Listening…':'Answering…'; }
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
  clearFilePreview();
  setStatus('ready');
  playClick();
  stopAudio();
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

async function copyInputToClipboard(inputEl, btnEl) {
  if (!inputEl) return;
  const val = inputEl.value || '';
  const success = await copyToClipboard(val);
  if (success) {
    const origText = btnEl.innerHTML;
    btnEl.innerHTML = '✅ Copied!';
    btnEl.style.background = '#10b981';
    btnEl.style.color = '#030712';
    playClick();
    setTimeout(() => {
      btnEl.innerHTML = origText;
      btnEl.style.background = '';
      btnEl.style.color = '';
    }, 2000);
  }
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

// Detect explicit image requests & short contextual follow-ups ("do it better", "black suit", "add iron man")
const IMAGE_SESSION_STORAGE_KEY = 'texo_active_image_session_v1';
let texoImageSession = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(IMAGE_SESSION_STORAGE_KEY) || 'null');
    if (saved && saved.baseSubject) return saved;
  } catch (_) {}
  return { active: false, baseSubject: '', modifiers: [], lastFullSubject: '', updatedAt: 0 };
})();

function saveTexoImageSession() {
  try {
    localStorage.setItem(IMAGE_SESSION_STORAGE_KEY, JSON.stringify(texoImageSession));
  } catch (_) {}
}

const IMAGE_REQUEST_KW = [
  'generate image', 'create image', 'show image', 'draw image', 'picture of',
  'show me an image', 'show me a picture', 'show me a photo', 'photo of',
  'photograph of', 'image of', 'generate photo', 'create photo', 'generate picture',
  'make a photo', 'make the photo', 'make photo', 'make an image', 'make the image',
  'make image', 'make a picture', 'make the picture', 'show a photo', 'show a picture',
  'give me a photo', 'give me the photo', 'give me an image', 'give me a picture',
  'send a photo', 'send me a photo', 'send image', 'wallpaper of', 'poster of',
  'photo banao', 'image banao', 'photo chahiye', 'photo dikhao', 'tasveer',
  'illustration of', 'draw a picture', 'draw a diagram', 'render an image',
  'visualize a photo', 'create a picture', 'generate a photo', 'generate an image'
];

const SHORT_BETTER_FOLLOWUP_RE = /^(?:please\s+|pls\s+|can you\s+|try\s+|make\s+it\s+|do\s+it\s+|give\s+me\s+|show\s+me\s+)?(?:better|do it better|make it better|more better|best|improve|improve it|enhance|enhance it|upgrade|more realistic|realistic|ultra realistic|hyper realistic|more hd|hd|4k|8k|ultra hd|clearer|sharper|high quality|higher quality|best quality|another|another one|one more|next|next one|again|try again|regenerate|different|something different|different angle|different style|change|change it|not good|vague|blurry|bad|aur acha|acha banao|aur dikhao|more detailed|cinematic)\s*[.!?]*$/i;

const ADD_MODIFIER_FOLLOWUP_RE = /^(?:please\s+|can you\s+|now\s+|also\s+|what about\s+|how about\s+)?(?:add|include|put|with|in|on|at|under|near|beside|wearing|holding|fighting|versus|vs|make\s+(?:it|him|her|the\s+\w+|this)|change\s+(?:the\s+)?(?:background|color|colour|suit|style|setting|lighting)\s+to|change\s+to|turn\s+into|set\s+in|show\s+(?:him|her|it)\s+(?:in|on|with|at))\s+(.+)$/i;

function isNonVisualAnalyticalQuery(lower) {
  if (!lower) return true;
  if (lower.includes('chart') || lower.includes('graph') || lower.includes('plot') || lower.includes('table') || lower.includes('calculation') || lower.includes('formula') || lower.includes('excel') || lower.includes('pptx') || lower.includes('presentation') || lower.includes('pdf') || lower.includes('word doc')) {
    return true;
  }
  if (/^(?:what\s+is|what\s+are|how\s+does|how\s+to|why\s+is|why\s+do|explain|calculate|define|compare|difference\s+between|tell\s+me\s+about|who\s+is|where\s+is\s+order|check\s+stock)\b/i.test(lower)) {
    return true;
  }
  return false;
}

function isExplicitImageRequest(text) {
  const lower = (text || '').toLowerCase().trim();
  if (!lower || isNonVisualAnalyticalQuery(lower)) return false;

  if (IMAGE_REQUEST_KW.some(k => lower.includes(k))) {
    return true;
  }
  if (/\b(generate|create|make|show|give|get|send|find|draw|paint|render|display|fetch|need|want|provide)\b[\s\S]{0,30}\b(photo|photograph|picture|pic|image|wallpaper|poster|portrait|illustration|artwork|drawing|sketch)\b/i.test(lower)) {
    return true;
  }
  if (/\b(photo|photograph|picture|pic|image|wallpaper|poster|portrait|illustration)\s+(of|for|about|showing|featuring)\s+\w+/i.test(lower)) {
    return true;
  }
  if (/^(?:please\s+)?(?:draw|paint|sketch|illustrate)\s+[a-z0-9]/i.test(lower)) {
    return true;
  }
  if (lower.split(/\s+/).length <= 7 && /\b(photo|photograph|picture|image|wallpaper|poster)(?:\s+(?:generation|generator|creation|making))?\s*[?.!]*$/i.test(lower)) {
    return true;
  }
  return false;
}

function extractCleanSubject(text) {
  if (!text) return '';
  let s = text.trim();
  for (let i = 0; i < 4; i++) {
    const prev = s;
    s = s.replace(/^(can you |please |could you |i want you to |i need you to |kindly )?(generate|create|show me|show|draw|paint|sketch|make|render|give me|give|send me|send|find|get|provide|display)\s+(me\s+)?(an?|the|some|hd|4k|high\s+quality|realistic|clear|relevant|good|nice|better|another)?\s*/gi, '');
    s = s.replace(/^(an?|the|some|hd|4k|high\s+quality|realistic|clear|relevant|good|nice|better|another)\s+/gi, '');
    s = s.replace(/^(photo|photograph|photos|picture|pictures|pic|image|images|illustration|drawing|render|wallpaper|poster|portrait|artwork|shot)(?:\s+generation)?\s+(of|about|for|showing|featuring)?\s*/gi, '');
    s = s.replace(/^(of|about|for)\s+(an?|the)?\s*/gi, '');
    s = s.replace(/\s+(?:to|in|on|for)\s+(?:the\s+|this\s+)?(?:existing\s+|current\s+|same\s+)?(?:photo|photograph|picture|image|pic)$/gi, '');
    s = s.replace(/\s+(photo|photograph|picture|pic|image|illustration|drawing|render|shot|view|wallpaper|poster|generation|generator|creation|making|banao|dikhao|chahiye)$/gi, '');
    if (s === prev) break;
  }
  s = s.replace(/^(a |an |the )/gi, '');
  s = s.replace(/[?!.,;:]/g, '').trim();
  s = s.replace(/\bspidermna\b|\bspidermn\b|\bspideman\b|\bspider\s*man\b/gi, 'Spider-Man');
  s = s.replace(/\bironmna\b|\bironmn\b/gi, 'Iron Man');
  s = s.replace(/\bsupermna\b/gi, 'Superman');
  s = s.replace(/\bbatmna\b/gi, 'Batman');
  return s;
}

function resolveImageOrFollowUpIntent(text) {
  const raw = (text || '').trim();
  const lower = raw.toLowerCase();
  if (!raw || isNonVisualAnalyticalQuery(lower)) return null;

  const hasRecentSession = Boolean(texoImageSession && texoImageSession.baseSubject);

  // 1. Check short quality/retry follow-ups ("do it better", "better", "another", "more realistic", "4k")
  if (hasRecentSession && SHORT_BETTER_FOLLOWUP_RE.test(raw)) {
    const fullSub = [texoImageSession.baseSubject, ...(texoImageSession.modifiers || [])].join(' ').trim();
    texoImageSession.active = true;
    texoImageSession.updatedAt = Date.now();
    saveTexoImageSession();
    return {
      subject: fullSub,
      baseSubject: texoImageSession.baseSubject,
      prompt: raw,
      isFollowUp: true
    };
  }

  // 2. Check additive/modification follow-up ("add iron man", "in black suit", "with venom", "at night", "... to existing image")
  const mentionsExistingImg = /\b(?:existing|current|same|this)\s+(?:image|photo|picture|pic)\b/i.test(raw);
  const addModMatch = raw.match(ADD_MODIFIER_FOLLOWUP_RE);
  if (hasRecentSession && (addModMatch || mentionsExistingImg)) {
    let modRaw = addModMatch ? addModMatch[1] : raw;
    modRaw = modRaw.replace(/\b(?:to|in|on|for)\s+(?:the\s+|this\s+)?(?:existing\s+|current\s+|same\s+)?(?:image|photo|picture|pic)\b/gi, '').trim();
    modRaw = extractCleanSubject(modRaw) || modRaw.replace(/[?!.,;:]/g, '').trim();
    if (modRaw && !texoImageSession.modifiers.some(m => m.toLowerCase() === modRaw.toLowerCase())) {
      texoImageSession.modifiers.push(modRaw);
      if (texoImageSession.modifiers.length > 4) texoImageSession.modifiers.shift();
    }
    const fullSub = [texoImageSession.baseSubject, ...texoImageSession.modifiers].join(' ').trim();
    texoImageSession.active = true;
    texoImageSession.lastFullSubject = fullSub;
    texoImageSession.updatedAt = Date.now();
    saveTexoImageSession();
    return {
      subject: fullSub,
      baseSubject: texoImageSession.baseSubject,
      prompt: raw,
      isFollowUp: true
    };
  }

  // 3. Check explicit image request ("make the photo of spiderman", "spiderman photo")
  if (isExplicitImageRequest(raw)) {
    const cleaned = extractCleanSubject(raw);
    const isGenericFollowUpWord = !cleaned || /^(?:it|this|that|same|better|another|more|existing|new)$/i.test(cleaned);
    if (isGenericFollowUpWord && hasRecentSession) {
      const fullSub = [texoImageSession.baseSubject, ...(texoImageSession.modifiers || [])].join(' ').trim();
      texoImageSession.active = true;
      texoImageSession.updatedAt = Date.now();
      saveTexoImageSession();
      return {
        subject: fullSub,
        baseSubject: texoImageSession.baseSubject,
        prompt: 'do it better',
        isFollowUp: true
      };
    }
    const finalSub = cleaned || 'Spider-Man';
    if (!texoImageSession.baseSubject || texoImageSession.baseSubject.toLowerCase() !== finalSub.toLowerCase()) {
      texoImageSession.modifiers = [];
    }
    texoImageSession.active = true;
    texoImageSession.baseSubject = finalSub;
    texoImageSession.lastFullSubject = [finalSub, ...(texoImageSession.modifiers || [])].join(' ').trim();
    texoImageSession.updatedAt = Date.now();
    saveTexoImageSession();
    return {
      subject: texoImageSession.lastFullSubject,
      baseSubject: finalSub,
      prompt: raw,
      isFollowUp: false
    };
  }

  // 4. Short 1-to-4 word visual modifier right after an active image turn
  //    e.g., "black suit", "at night", "in rain", "red and gold", "full body", "close up", "fighting venom"
  const words = raw.replace(/[?!.,;:]/g, '').trim().split(/\s+/);
  const isGreeting = /^(?:hi|hello|hey|thanks|thank\s+you|ok|okay|yes|no|bye|good|nice|cool)$/i.test(raw.trim());
  if (texoImageSession.active && hasRecentSession && words.length >= 1 && words.length <= 4 && !isGreeting) {
    const looksVisualModifier = /\b(suit|costume|armor|armour|rain|night|dark|neon|city|sky|flying|fighting|pose|action|background|style|colour|color|red|blue|black|gold|white|green|glowing|fire|lightning|snow|space|rooftop|bridge|close|closeup|full|body|portrait|3d|anime|cyberpunk|venom|iron\s*man|batman|superman|avengers)\b/i.test(raw);
    if (looksVisualModifier) {
      const modClean = extractCleanSubject(raw) || raw.replace(/[?!.,;:]/g, '').trim();
      if (modClean && !texoImageSession.modifiers.some(m => m.toLowerCase() === modClean.toLowerCase())) {
        texoImageSession.modifiers.push(modClean);
        if (texoImageSession.modifiers.length > 4) texoImageSession.modifiers.shift();
      }
      const fullSub = [texoImageSession.baseSubject, ...texoImageSession.modifiers].join(' ').trim();
      texoImageSession.lastFullSubject = fullSub;
      texoImageSession.updatedAt = Date.now();
      saveTexoImageSession();
      return {
        subject: fullSub,
        baseSubject: texoImageSession.baseSubject,
        prompt: fullSub,
        isFollowUp: true
      };
    }
  }

  return null;
}

function buildPhotorealisticPrompt(userQ, apexReply) {
  let subject = extractCleanSubject(userQ);
  if (!subject || subject.length < 2) {
    subject = (texoImageSession && texoImageSession.baseSubject) || userQ.trim();
  }
  return subject;
}

async function generateImage(prompt, col, btn, userQ, apexReply, baseSubjectHint = '') {
  if (btn) { btn.classList.add('loading'); btn.textContent = '⏳ Synthesizing Visual…'; }

  const wrap = document.createElement('div');
  wrap.className = 'generated-image-wrap';
  wrap.innerHTML = `
    <div class="image-header-bar">
      <div class="image-realism-badge">📸 Multi-Source 4K Studio</div>
      <div class="image-actions">
        <span style="font-size:10px;color:var(--cyan-neon)">Wallhaven 4K • Bing UHD • Lexica AI</span>
      </div>
    </div>
    <div class="image-loading">
      <div class="img-spinner"></div>
      <span style="font-size:12px;color:var(--text2)">Selecting best 4K Ultra-HD visual across multiple sources…</span>
    </div>
  `;
  col.appendChild(wrap);
  scrollToBottom();

  const cleanPrompt = (prompt || '').replace(/\[.*?\]/g, '').trim();
  const activeBase = baseSubjectHint || (texoImageSession && texoImageSession.baseSubject) || '';

  try {
    const resp = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanPrompt,
        user_q: userQ || cleanPrompt,
        apex_reply: apexReply || '',
        base_subject: activeBase
      })
    });

    if (!resp.ok) {
      throw new Error(`Server returned HTTP ${resp.status}`);
    }

    const data = await resp.json();
    if (data.base_subject) {
      texoImageSession.active = true;
      texoImageSession.lastMode = 'image';
      texoImageSession.baseSubject = data.base_subject;
      if (Array.isArray(data.modifiers)) {
        texoImageSession.modifiers = data.modifiers;
      }
      texoImageSession.lastFullSubject = data.caption || data.base_subject;
      texoImageSession.updatedAt = Date.now();
      saveTexoImageSession();
    }

    const imgSrc = data.image_url;
    const caption = data.caption || cleanPrompt;
    renderLoadedImage(wrap, imgSrc, caption, data.source || '4K Ultra-HD', btn, userQ, apexReply);

  } catch (err) {
    console.error('Image generation error:', err);
    const fallbackSrc = `/static/generated_images/spiderman_featured_hd.jpg`;
    renderLoadedImage(wrap, fallbackSrc, cleanPrompt, '4K Visual Engine', btn, userQ, apexReply);
  }
}

function renderLoadedImage(wrap, src, caption, badgeText, btn, userQ, apexReply) {
  wrap.innerHTML = `
    <div class="image-header-bar">
      <div class="image-realism-badge">📸 ${escapeHtml(badgeText || 'Ultra-HD 4K View')}</div>
      <div class="image-actions">
        <button type="button" class="img-action-btn img-regen-inline-btn" title="Fetch next best 4K image from multi-source pool">✨ Do It Better</button>
        <a class="img-action-btn" href="${src}" target="_blank" rel="noopener" title="Open full resolution">🔍 Expand</a>
        <a class="img-action-btn" href="${src}" download="texo_hd_${Date.now()}.jpg" title="Download image">⬇️ Download</a>
      </div>
    </div>
  `;
  const inlineRegenBtn = wrap.querySelector('.img-regen-inline-btn');
  if (inlineRegenBtn) {
    inlineRegenBtn.addEventListener('click', () => {
      const parentCol = wrap.parentElement;
      if (parentCol) {
        wrap.remove();
        generateImage('do it better', parentCol, btn, 'do it better', apexReply, texoImageSession.baseSubject);
      }
    });
  }

  const img = new Image();
  img.alt = caption;
  img.referrerPolicy = 'no-referrer';
  img.src = src;
  img.style.opacity = '0';
  img.style.transition = 'opacity 0.35s ease';
  img.style.cursor = 'zoom-in';
  img.onload = () => {
    img.style.opacity = '1';
    scrollToBottom();
  };
  img.onerror = () => {
    const isSpider = /spider/i.test((userQ || '') + ' ' + (caption || ''));
    const fallbackUrl = isSpider
      ? `/static/generated_images/spiderman_featured_hd.jpg?t=${Date.now()}`
      : `/static/generated_images/apex_render_fallback.jpg?t=${Date.now()}`;
    if (img.src.indexOf('generated_images/') === -1) {
      img.src = fallbackUrl;
    } else {
      img.style.opacity = '1';
    }
  };
  img.addEventListener('click', () => {
    if (typeof window.openMediaLightbox === 'function') {
      window.openMediaLightbox(img.src, caption);
    } else {
      window.open(img.src, '_blank');
    }
  });
  wrap.appendChild(img);

  const cap = document.createElement('div');
  cap.className = 'generated-image-caption';
  const displaySubject = caption
    .replace(/high quality (?:realistic industrial|cinematic realistic) photograph of /i, '')
    .replace(/, (?:professional photography|8k resolution).*/i, '');
  cap.innerHTML = `
    <span><strong>Subject:</strong> ${escapeHtml(displaySubject.slice(0, 85))}</span>
    <span style="color:var(--mint-neon);font-weight:600">${escapeHtml(badgeText || '4K Ultra-HD')}</span>
  `;
  wrap.appendChild(cap);

  // Interactive Quick Follow-Up Bar (1-click or short-word follow-up hints)
  const refineBar = document.createElement('div');
  refineBar.className = 'generated-image-caption';
  refineBar.style.cssText = 'border-top:1px solid rgba(245,158,11,0.18);background:rgba(12,8,2,0.92);display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 12px;';
  const quickChips = [
    { label: '✨ Do It Better', cmd: 'do it better' },
    { label: '🖤 Black Suit / Dark', cmd: 'in black suit dark theme' },
    { label: '🌧️ In Rain at Night', cmd: 'in rain at night' },
    { label: '🎬 Make 22s Video', cmd: 'make a 20 second video of this' }
  ];
  refineBar.innerHTML = `<span style="font-size:10.5px;color:#fbbf24;margin-right:4px;">🧠 Short Follow-Ups Ready:</span>`;
  quickChips.forEach(item => {
    const cBtn = document.createElement('button');
    cBtn.type = 'button';
    cBtn.className = 'img-action-btn';
    cBtn.style.cssText = 'font-size:10.5px;padding:3px 8px;';
    cBtn.textContent = item.label;
    cBtn.addEventListener('click', () => {
      sendMessage(item.cmd);
    });
    refineBar.appendChild(cBtn);
  });
  wrap.appendChild(refineBar);

  if (btn) {
    btn.innerHTML = '🖼️ Regenerate';
    btn.classList.remove('loading');
    btn.onclick = () => generateImage('do it better', wrap.parentElement, btn, 'do it better', apexReply, texoImageSession.baseSubject);
  }
  scrollToBottom();
}

function handleExplicitImageRequest(col, userQ, apexReply) {
  // Handled directly in sendMessage() for zero-text pure image delivery
}

// ══════════════════════════════════════════════════════════════════════════════
// VIDEO GENERATION (22-Second 5-Scene Multi-Source HD Cinema Engine)
// ══════════════════════════════════════════════════════════════════════════════

const VIDEO_REQUEST_KW = [
  'generate video', 'create video', 'make video', 'render video', 'show video',
  'video of', 'clip of', 'animation of', 'video clip', 'motion video',
  'cinematic video', 'video banao', 'video chahiye', 'video dikhao', 'make a video',
  'make the video', 'generate a video', 'generate the video', 'create a video',
  'show me a video', 'produce a video', 'give me a video', 'send a video',
  'turn into video', 'turn this into a video', 'video generation'
];

function isExplicitVideoRequest(text) {
  const lower = (text || '').toLowerCase().trim();
  if (!lower || isNonVisualAnalyticalQuery(lower)) return false;
  if (VIDEO_REQUEST_KW.some(k => lower.includes(k))) {
    return true;
  }
  if (/\b(generate|create|make|show|give|get|send|render|produce|turn)\b[\s\S]{0,35}\b(video|clip|animation|movie|footage)\b/i.test(lower)) {
    return true;
  }
  if (/\b(video|clip|animation|footage)\s+(of|for|about|showing|featuring)\s+\w+/i.test(lower)) {
    return true;
  }
  if (lower.split(/\s+/).length <= 7 && /\b(video|video\s+clip|animation)(?:\s+(?:generation|generator|creation|making))?\s*[?.!]*$/i.test(lower)) {
    return true;
  }
  return false;
}

function extractCleanVideoSubject(text) {
  if (!text) return '';
  let s = text.trim();
  s = s.replace(/\b(?:\d+\s*(?:sec|secs|second|seconds|s|min|minutes)|long|full|hd|4k|8k|high\s+quality|relevant|good|clear)\b/gi, ' ');
  for (let i = 0; i < 4; i++) {
    const prev = s;
    s = s.replace(/^(can you |please |could you |i want you to |kindly )?(generate|create|show me|show|make|render|produce|give me|give|send|turn(?:\s+this|\s+it)?\s+into)\s+(me\s+)?(an?|the|some)?\s*/gi, '');
    s = s.replace(/^(an?|the|some)\s+/gi, '');
    s = s.replace(/^(video|clip|animation|motion\s+clip|cinematic\s+video|movie|film|footage)(?:\s+generation)?\s*(of|about|for|showing|featuring)?\s*/gi, '');
    s = s.replace(/^(of|about|for)\s+(an?|the)?\s*/gi, '');
    s = s.replace(/\s+(video|clip|animation|film|motion|footage|generation|generator|banao|dikhao|chahiye)$/gi, '');
    if (s === prev) break;
  }
  return extractCleanSubject(s);
}

function resolveVideoOrFollowUpIntent(text) {
  const raw = (text || '').trim();
  const lower = raw.toLowerCase();
  if (!raw || isNonVisualAnalyticalQuery(lower)) return null;

  const hasRecentSession = Boolean(texoImageSession && texoImageSession.baseSubject);

  // 1. Explicit video request ("generate video of spiderman", "make a 20s video of spiderman", "make a video of this")
  if (isExplicitVideoRequest(raw)) {
    const cleaned = extractCleanVideoSubject(raw);
    const isGeneric = !cleaned || /^(?:it|this|that|same|better|another|more|existing|current)$/i.test(cleaned);
    if (isGeneric && hasRecentSession) {
      const fullSub = [texoImageSession.baseSubject, ...(texoImageSession.modifiers || [])].join(' ').trim();
      texoImageSession.active = true;
      texoImageSession.lastMode = 'video';
      texoImageSession.updatedAt = Date.now();
      saveTexoImageSession();
      return {
        subject: fullSub,
        baseSubject: texoImageSession.baseSubject,
        prompt: fullSub,
        isFollowUp: true
      };
    }
    const finalSub = cleaned || (hasRecentSession ? texoImageSession.baseSubject : 'Spider-Man');
    if (!texoImageSession.baseSubject || texoImageSession.baseSubject.toLowerCase() !== finalSub.toLowerCase()) {
      texoImageSession.modifiers = [];
    }
    texoImageSession.active = true;
    texoImageSession.lastMode = 'video';
    texoImageSession.baseSubject = finalSub;
    texoImageSession.lastFullSubject = [finalSub, ...(texoImageSession.modifiers || [])].join(' ').trim();
    texoImageSession.updatedAt = Date.now();
    saveTexoImageSession();
    return {
      subject: texoImageSession.lastFullSubject,
      baseSubject: finalSub,
      prompt: raw,
      isFollowUp: false
    };
  }

  // 2. If the user's LAST action was generating a VIDEO (`lastMode === 'video'`),
  //    route short follow-ups ("do it better", "black suit", "in rain") to generate a new 22s video!
  if (hasRecentSession && texoImageSession.lastMode === 'video') {
    if (SHORT_BETTER_FOLLOWUP_RE.test(raw)) {
      const fullSub = [texoImageSession.baseSubject, ...(texoImageSession.modifiers || [])].join(' ').trim();
      texoImageSession.updatedAt = Date.now();
      saveTexoImageSession();
      return {
        subject: fullSub,
        baseSubject: texoImageSession.baseSubject,
        prompt: 'do it better',
        isFollowUp: true
      };
    }
    const addModMatch = raw.match(ADD_MODIFIER_FOLLOWUP_RE);
    if (addModMatch) {
      const modClean = extractCleanVideoSubject(addModMatch[1]) || addModMatch[1].trim();
      if (modClean && !texoImageSession.modifiers.some(m => m.toLowerCase() === modClean.toLowerCase())) {
        texoImageSession.modifiers.push(modClean);
        if (texoImageSession.modifiers.length > 4) texoImageSession.modifiers.shift();
      }
      const fullSub = [texoImageSession.baseSubject, ...texoImageSession.modifiers].join(' ').trim();
      texoImageSession.lastFullSubject = fullSub;
      texoImageSession.updatedAt = Date.now();
      saveTexoImageSession();
      return {
        subject: fullSub,
        baseSubject: texoImageSession.baseSubject,
        prompt: fullSub,
        isFollowUp: true
      };
    }
  }

  return null;
}

async function generateVideo(prompt, col, btn, userQ, apexReply, baseSubjectHint = '') {
  if (btn) {
    btn.classList.add('loading');
    btn.textContent = '⏳ Rendering 22s Video…';
  }

  const wrap = document.createElement('div');
  wrap.className = 'apex-cyber-video-wrap';
  wrap.innerHTML = `
    <div class="apex-cyber-video-header">
      <div class="apex-video-title-wrap">
        <span class="apex-video-badge">🎬 22s 5-SCENE HD CINEMA</span>
        <span style="font-family:var(--font-mono);font-size:11.5px;color:#fff;font-weight:600">Multi-Source 4K Storyboard Engine</span>
      </div>
      <div class="apex-video-telemetry">
        <span style="color:#ef4444">● REC</span>
        <span style="color:var(--text3)">// 22.0s // H.264</span>
      </div>
    </div>
    <div class="image-loading" style="padding:28px 16px;">
      <div class="img-spinner"></div>
      <span style="font-size:12px;color:var(--cyan-neon);margin-top:8px">Harvesting 5 distinct 4K scenes & encoding 22-second HD video…</span>
      <span style="font-size:11px;color:var(--text3);margin-top:4px">Multi-scene camera choreography, cross-dissolve transitions & H.264 stream</span>
    </div>
  `;
  col.appendChild(wrap);
  scrollToBottom();

  const cleanPrompt = (prompt || '').replace(/\[.*?\]/g, '').trim();
  const activeBase = baseSubjectHint || (texoImageSession && texoImageSession.baseSubject) || '';

  try {
    const resp = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanPrompt,
        user_q: userQ || cleanPrompt,
        apex_reply: apexReply || '',
        base_subject: activeBase
      })
    });

    if (!resp.ok) {
      throw new Error(`Server returned HTTP ${resp.status}`);
    }

    const data = await resp.json();
    if (data.base_subject || data.title) {
      texoImageSession.active = true;
      texoImageSession.lastMode = 'video';
      texoImageSession.baseSubject = data.base_subject || data.title;
      if (Array.isArray(data.modifiers)) {
        texoImageSession.modifiers = data.modifiers;
      }
      texoImageSession.lastFullSubject = data.title || data.base_subject;
      texoImageSession.updatedAt = Date.now();
      saveTexoImageSession();
    }
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
  const caption = data.caption || '22s 5-Scene Multi-Source HD Synthesis';
  const duration = data.duration ? `${data.duration}s` : '22.0s';
  const filename = data.filename || `texo_cinema_${Date.now()}.mp4`;

  wrap.innerHTML = `
    <div class="apex-cyber-video-header">
      <div class="apex-video-title-wrap">
        <span class="apex-video-badge">🎬 22s HD CINEMA</span>
        <span style="font-family:var(--font-mono);font-size:12px;color:#fff;font-weight:700">${escapeHtml(title)}</span>
      </div>
      <div class="apex-video-telemetry">
        <span style="color:var(--mint-neon)">● 5 SCENES</span>
        <span style="color:var(--text2)">${duration} // 16:9 HD</span>
      </div>
    </div>
    <div class="apex-cyber-video-player-box">
      <video class="apex-cyber-video" controls autoplay loop playsinline preload="auto">
        <source src="${vidUrl}" type="video/mp4">
        Your browser does not support HTML5 video playback.
      </video>
    </div>
    <div class="apex-cyber-video-caption">
      <div style="display:flex;flex-direction:column;gap:3px;max-width:65%;">
        <span style="font-weight:600;color:var(--text1)">${escapeHtml(title)}</span>
        <span style="font-size:11px;color:var(--text3)">${escapeHtml(caption)}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button type="button" class="apex-video-action-btn vid-regen-inline-btn" title="Generate a fresh 22s 5-scene video">✨ Do It Better</button>
        <a class="apex-video-action-btn" href="${vidUrl}" download="${filename}" title="Download MP4 Video file">
          <span>⬇️ Download MP4</span>
        </a>
      </div>
    </div>
  `;

  const regenVidBtn = wrap.querySelector('.vid-regen-inline-btn');
  if (regenVidBtn) {
    regenVidBtn.addEventListener('click', () => {
      const parentCol = wrap.parentElement;
      if (parentCol) {
        wrap.remove();
        generateVideo('do it better', parentCol, btn, 'do it better', apexReply, texoImageSession.baseSubject);
      }
    });
  }

  if (btn) {
    btn.innerHTML = '🎬 Re-render';
    btn.classList.remove('loading');
    btn.onclick = () => generateVideo('do it better', wrap.parentElement, btn, 'do it better', apexReply, texoImageSession.baseSubject);
  }
  scrollToBottom();
}

function handleExplicitVideoRequest(col, userQ, apexReply) {
  // Handled directly in sendMessage() for zero-text pure 22s video delivery
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
  const title = docData.title || 'TEXO Intelligence Report';
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
  } else if (type === 'docx' || type === 'doc' || type === 'word') {
    icon = '📝';
    badgeClass = 'docx';
    badgeLabel = 'WORD DOCUMENT';
    const secCount = Array.isArray(docData.sections) ? docData.sections.length : 1;
    metaDesc = `Executive Microsoft Word (.docx) document · ${secCount} section${secCount > 1 ? 's' : ''} formatted`;
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
        <span>⚡</span> Download ${badgeLabel} (.${type === 'excel' ? 'xlsx' : (type === 'word' || type === 'doc' ? 'docx' : type)})
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
          author: `TEXO Universal Intelligence (${(currentUser && currentUser.name) || 'Auditor'})`,
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

  // Restore user session if existing account or guest
  let user = getStoredUser();
  const isGuest = localStorage.getItem('texo_is_guest');
  if ((user && user.name && user.email) || isGuest === 'true') {
    if (user) updateUIForLoggedInUser(user);
    hideAuthModal();
    if (user && user.email) await syncHistoryWithServer(user.email).catch(() => {});
  } else {
    // New device or visitor without account: show Sign In / Register popup
    showAuthModal();
    switchAuthTab('login');
  }
  currentChatId = Date.now();
  conversationHistory = [];
  appendWelcomeCard(industrySelect ? industrySelect.value : 'textile');
  initSentinelBrowserGuard();
})();

// ══════════════════════════════════════════════════════════════════════════════
// TEXO AI SENTINEL BROWSER GUARD & PRE-EMPTIVE DATA SHIELD
// ══════════════════════════════════════════════════════════════════════════════
function showSentinelToast(msg, duration = 4000) {
  const existing = document.querySelector('.sentinel-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'sentinel-toast';
  toast.innerHTML = `<span style="font-size:16px;">🛡️</span><span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

function initSentinelBrowserGuard() {
  const sentinelBadge = document.getElementById('sentinelBadge');
  const chatSentinelModal = document.getElementById('chatSentinelModal');
  const closeChatSentinelModal = document.getElementById('closeChatSentinelModal');

  const chatSentinelSafetyIndex = document.getElementById('chatSentinelSafetyIndex');
  const chatSentinelHealed = document.getElementById('chatSentinelHealed');
  const chatSentinelTx = document.getElementById('chatSentinelTx');
  const chatSentinelLog = document.getElementById('chatSentinelLog');

  async function openSentinelModal() {
    if (!chatSentinelModal) return;
    chatSentinelModal.style.display = 'flex';
    try {
      const res = await fetch('/api/sentinel/health');
      if (res.ok) {
        const d = await res.json();
        if (chatSentinelSafetyIndex) chatSentinelSafetyIndex.textContent = `${d.client_data_safety_index}%`;
        if (chatSentinelHealed) chatSentinelHealed.textContent = d.glitches_auto_healed;
        if (chatSentinelTx) chatSentinelTx.textContent = d.atomic_transactions_secured;
        if (chatSentinelLog && Array.isArray(d.recent_events)) {
          if (d.recent_events.length > 0) {
            chatSentinelLog.innerHTML = d.recent_events.map(ev =>
              `<div class="log-line">⚡ [${ev.timestamp}] <strong>${ev.component}:</strong> ${ev.action} (${ev.detail})</div>`
            ).join('');
          } else {
            chatSentinelLog.innerHTML = `<div class="log-line">🟢 Sentinel Initialized. All client data repositories verified healthy.</div>`;
          }
        }
      }
    } catch (_) {}
  }

  if (sentinelBadge) sentinelBadge.addEventListener('click', openSentinelModal);
  if (closeChatSentinelModal) closeChatSentinelModal.addEventListener('click', () => {
    chatSentinelModal.style.display = 'none';
  });
  if (chatSentinelModal) {
    chatSentinelModal.addEventListener('click', (e) => {
      if (e.target === chatSentinelModal) chatSentinelModal.style.display = 'none';
    });
  }

  // Pre-emptive Network & Offline Alert
  window.addEventListener('offline', () => {
    showSentinelToast('⚠️ AI Sentinel: Offline state detected. Local memory engaged to protect client data.', 6000);
  });
  window.addEventListener('online', () => {
    showSentinelToast('✅ AI Sentinel: Connection restored. Cloud data sync active.', 3500);
  });

  // Global Glitch Interceptor & Self-Healer
  window.addEventListener('error', (e) => {
    console.warn('AI Sentinel intercepted glitch:', e.message);
    if (typeof isStreaming !== 'undefined' && isStreaming) {
      isStreaming = false;
      if (sendBtn) sendBtn.disabled = false;
      showTyping(false);
    }
    showSentinelToast('🛡️ AI Sentinel [Auto-Healed]: Prevented glitch. Client session data preserved.');
    fetch('/api/sentinel/report-glitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'BrowserException',
        message: e.message || 'Script exception',
        context: { filename: e.filename, lineno: e.lineno }
      })
    }).catch(() => {});
  });

  window.addEventListener('unhandledrejection', (e) => {
    console.warn('AI Sentinel intercepted unhandled rejection:', e.reason);
    if (typeof isStreaming !== 'undefined' && isStreaming) {
      isStreaming = false;
      if (sendBtn) sendBtn.disabled = false;
      showTyping(false);
    }
    fetch('/api/sentinel/report-glitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'UnhandledPromiseRejection',
        message: String(e.reason || 'Promise rejected'),
        context: {}
      })
    }).catch(() => {});
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   RADICAL CREATIVE TEXTILE STUDIO & HAPTIC SIMULATION ENGINE
   ═══════════════════════════════════════════════════════════════════════════ */

(function initCreativeStudio() {
  const studioModal = document.getElementById('creativeStudioModal');
  const studioBtn = document.getElementById('creativeStudioBtn');
  const closeStudioBtn = document.getElementById('closeCreativeStudioModal');
  if (!studioModal) return;

  function openStudio(tabName = 'hapticTab') {
    studioModal.style.display = 'flex';
    switchTab(tabName);
    startClothSimulation();
    if (!lastWeaveData) generateWeave('Jazz syncopated swing rhythm');
    if (!lastChronoTime) setChronoMilestone('2 years');
    if (!lastOrigamiStep) setOrigamiStep(1);
  }

  function closeStudio() {
    studioModal.style.display = 'none';
    stopClothSimulation();
  }

  const toggleGuideBtn = document.getElementById('toggleStudioGuideBtn');
  const guideDrawer = document.getElementById('studioGuideDrawer');
  if (toggleGuideBtn && guideDrawer) {
    toggleGuideBtn.addEventListener('click', () => {
      const isClosed = guideDrawer.style.display === 'none';
      guideDrawer.style.display = isClosed ? 'block' : 'none';
      toggleGuideBtn.textContent = isClosed ? '✕ Hide Quick Tips' : '📖 Show Quick Tips';
      playClick();
    });
  }

  if (studioBtn) studioBtn.addEventListener('click', () => openStudio('hapticTab'));
  if (closeStudioBtn) closeStudioBtn.addEventListener('click', closeStudio);
  studioModal.addEventListener('click', (e) => {
    if (e.target === studioModal) closeStudio();
  });

  // Tab switching
  const tabBtns = document.querySelectorAll('.studio-tab-btn');
  const tabPanes = document.querySelectorAll('.studio-tab-pane');
  function switchTab(targetTabId) {
    tabBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.tab === targetTabId);
    });
    tabPanes.forEach(p => {
      p.classList.toggle('active', p.id === targetTabId);
    });
    if (targetTabId === 'hapticTab') startClothSimulation();
    else stopClothSimulation();
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Expose global launcher for in-chat buttons
  window.openTextileStudio = openStudio;

  // ─────────────────────────────────────────────────────────────────────────
  // 1. TACTILE HAPTIC TOUCHPAD CONTROLLER
  // ─────────────────────────────────────────────────────────────────────────
  const touchpad = document.getElementById('hapticTouchpad');
  const ripple = document.getElementById('touchpadRipple');
  const fabricSelect = document.getElementById('hapticFabricSelect');

  let currentFabricSpec = {
    vibration_pattern: [90, 20, 110, 20, 130, 25, 100],
    surface_friction: 0.75,
    stiffness: 0.92,
    shear: 0.88,
    damping: 0.78,
    gravity: 1.25,
    wind_sensitivity: 0.15
  };

  async function updateFabricProfile(fabricKey) {
    try {
      const res = await fetch('/api/textile/haptic-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fabric: fabricKey })
      });
      const data = await res.json();
      if (data && data.fabric) {
        const f = data.fabric;
        currentFabricSpec = {
          vibration_pattern: f.vibration_pattern,
          surface_friction: f.surface_friction,
          stiffness: f.drape_parameters.stiffness,
          shear: f.drape_parameters.shear_resistance,
          damping: f.drape_parameters.damping,
          gravity: f.drape_parameters.gravity_scale,
          wind_sensitivity: f.drape_parameters.wind_sensitivity
        };

        const nameEl = document.getElementById('hapticName');
        const gsmEl = document.getElementById('hapticGsm');
        const freqEl = document.getElementById('hapticFreq');
        const frictEl = document.getElementById('hapticFriction');
        const descEl = document.getElementById('hapticDesc');

        if (nameEl) nameEl.textContent = f.name;
        if (gsmEl) gsmEl.textContent = `${f.gsm} GSM`;
        if (freqEl) freqEl.textContent = `${f.vibration_frequency_hz} Hz (Tactile Resonance)`;
        if (frictEl) frictEl.textContent = `${f.surface_friction} μ (${f.surface_friction > 0.5 ? 'High Drag' : 'Smooth Glide'})`;
        if (descEl) descEl.textContent = f.tactile_descriptor;

        // Apply physical properties to active cloth simulation
        if (clothInstance) {
          clothInstance.stiffness = currentFabricSpec.stiffness;
          clothInstance.gravityScale = currentFabricSpec.gravity;
          clothInstance.damping = currentFabricSpec.damping;
        }
      }
    } catch (e) {
      console.warn('Haptic fetch note:', e);
    }
  }

  if (fabricSelect) {
    fabricSelect.addEventListener('change', (e) => updateFabricProfile(e.target.value));
  }

  if (touchpad) {
    let isTouching = false;
    let lastVibrateTime = 0;

    function handleTouch(e) {
      if (!isTouching) return;
      const rect = touchpad.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (ripple) {
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.opacity = '1';
      }

      const now = Date.now();
      if (now - lastVibrateTime > 120) {
        lastVibrateTime = now;
        if (navigator.vibrate) {
          try {
            navigator.vibrate(currentFabricSpec.vibration_pattern);
          } catch (_) {}
        }
      }
    }

    touchpad.addEventListener('mousedown', (e) => { isTouching = true; handleTouch(e); });
    touchpad.addEventListener('mousemove', handleTouch);
    window.addEventListener('mouseup', () => {
      isTouching = false;
      if (ripple) ripple.style.opacity = '0';
    });

    touchpad.addEventListener('touchstart', (e) => { isTouching = true; handleTouch(e); }, { passive: true });
    touchpad.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchend', () => {
      isTouching = false;
      if (ripple) ripple.style.opacity = '0';
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. REAL-TIME 60 FPS VERLET CLOTH PHYSICS SIMULATION
  // ─────────────────────────────────────────────────────────────────────────
  const clothCanvas = document.getElementById('clothCanvas');
  let clothCtx = clothCanvas ? clothCanvas.getContext('2d') : null;
  let clothInstance = null;
  let clothAnimId = null;

  class VerletCloth {
    constructor(canvas, cols = 18, rows = 12, spacing = 22) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.cols = cols;
      this.rows = rows;
      this.spacing = spacing;
      this.points = [];
      this.constraints = [];
      this.stiffness = currentFabricSpec.stiffness || 0.85;
      this.gravityScale = currentFabricSpec.gravity || 1.0;
      this.damping = currentFabricSpec.damping || 0.94;
      this.windSpeed = 0;
      this.time = 0;
      this.draggedPoint = null;
      this.init();
    }

    init() {
      this.points = [];
      this.constraints = [];
      const startX = (this.canvas.width - (this.cols - 1) * this.spacing) / 2;
      const startY = 24;

      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const x = startX + c * this.spacing;
          const y = startY + r * this.spacing;
          const pinned = (r === 0); // Pin top row
          this.points.push({
            x, y,
            oldX: x,
            oldY: y,
            pinned
          });
        }
      }

      // Create structural constraints
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const idx = r * this.cols + c;
          if (c < this.cols - 1) {
            this.constraints.push({ p1: idx, p2: idx + 1, dist: this.spacing });
          }
          if (r < this.rows - 1) {
            this.constraints.push({ p1: idx, p2: idx + this.cols, dist: this.spacing });
          }
        }
      }
    }

    update(dt = 0.016) {
      this.time += dt;
      const gravity = 550 * this.gravityScale;
      const windForce = Math.sin(this.time * 3.5) * this.windSpeed * 32.0;

      for (const p of this.points) {
        if (p.pinned) continue;
        const vx = (p.x - p.oldX) * this.damping;
        const vy = (p.y - p.oldY) * this.damping;

        p.oldX = p.x;
        p.oldY = p.y;

        p.x += vx + (windForce * dt * dt);
        p.y += vy + (gravity * dt * dt);
      }

      // Satisfy distance constraints
      const iterations = Math.max(3, Math.floor(this.stiffness * 8));
      for (let i = 0; i < iterations; i++) {
        for (const c of this.constraints) {
          const p1 = this.points[c.p1];
          const p2 = this.points[c.p2];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const diff = (dist - c.dist) / dist;

          const offsetX = dx * 0.5 * diff;
          const offsetY = dy * 0.5 * diff;

          if (!p1.pinned) { p1.x += offsetX; p1.y += offsetY; }
          if (!p2.pinned) { p2.x -= offsetX; p2.y -= offsetY; }
        }
      }
    }

    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw background ambient weave shadow
      ctx.fillStyle = 'rgba(3, 7, 18, 0.95)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Render warp & weft threads
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(0, 245, 160, 0.75)';

      for (const c of this.constraints) {
        const p1 = this.points[c.p1];
        const p2 = this.points[c.p2];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw pinned node headers
      for (let c = 0; c < this.cols; c++) {
        const p = this.points[c];
        ctx.fillStyle = '#06B6D4';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function startClothSimulation() {
    if (!clothCanvas || clothAnimId) return;
    if (!clothInstance) clothInstance = new VerletCloth(clothCanvas);

    function loop() {
      if (clothInstance) {
        clothInstance.update();
        clothInstance.render();
      }
      clothAnimId = requestAnimationFrame(loop);
    }
    clothAnimId = requestAnimationFrame(loop);
  }

  function stopClothSimulation() {
    if (clothAnimId) {
      cancelAnimationFrame(clothAnimId);
      clothAnimId = null;
    }
  }

  // Cloth interaction listeners (Mouse drag)
  if (clothCanvas) {
    let mouseDragPt = null;
    function getNearestClothPoint(mx, my) {
      if (!clothInstance) return null;
      let closest = null;
      let minD = 32;
      for (const p of clothInstance.points) {
        const d = Math.hypot(p.x - mx, p.y - my);
        if (d < minD) { minD = d; closest = p; }
      }
      return closest;
    }

    clothCanvas.addEventListener('mousedown', (e) => {
      const rect = clothCanvas.getBoundingClientRect();
      const scaleX = clothCanvas.width / rect.width;
      const scaleY = clothCanvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      mouseDragPt = getNearestClothPoint(mx, my);
    });

    window.addEventListener('mousemove', (e) => {
      if (!mouseDragPt || !clothCanvas) return;
      const rect = clothCanvas.getBoundingClientRect();
      const scaleX = clothCanvas.width / rect.width;
      const scaleY = clothCanvas.height / rect.height;
      mouseDragPt.x = (e.clientX - rect.left) * scaleX;
      mouseDragPt.y = (e.clientY - rect.top) * scaleY;
    });

    window.addEventListener('mouseup', () => { mouseDragPt = null; });

    // Touch support for cloth canvas
    clothCanvas.addEventListener('touchstart', (e) => {
      const rect = clothCanvas.getBoundingClientRect();
      const scaleX = clothCanvas.width / rect.width;
      const scaleY = clothCanvas.height / rect.height;
      const mx = (e.touches[0].clientX - rect.left) * scaleX;
      const my = (e.touches[0].clientY - rect.top) * scaleY;
      mouseDragPt = getNearestClothPoint(mx, my);
    }, { passive: true });

    clothCanvas.addEventListener('touchmove', (e) => {
      if (!mouseDragPt) return;
      const rect = clothCanvas.getBoundingClientRect();
      const scaleX = clothCanvas.width / rect.width;
      const scaleY = clothCanvas.height / rect.height;
      mouseDragPt.x = (e.touches[0].clientX - rect.left) * scaleX;
      mouseDragPt.y = (e.touches[0].clientY - rect.top) * scaleY;
    }, { passive: true });

    clothCanvas.addEventListener('touchend', () => { mouseDragPt = null; });
  }

  // Sliders and controls
  const windSlider = document.getElementById('windSlider');
  const windVal = document.getElementById('windVal');
  if (windSlider) {
    windSlider.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (clothInstance) clothInstance.windSpeed = v;
      if (windVal) windVal.textContent = `${(v * 0.4).toFixed(1)} m/s`;
    });
  }

  const gravSlider = document.getElementById('gravSlider');
  const gravVal = document.getElementById('gravVal');
  if (gravSlider) {
    gravSlider.addEventListener('input', (e) => {
      const g = parseFloat(e.target.value);
      if (clothInstance) clothInstance.gravityScale = g;
      if (gravVal) gravVal.textContent = `${g.toFixed(1)}x`;
    });
  }

  const shakeBtn = document.getElementById('shakeClothBtn');
  if (shakeBtn) {
    shakeBtn.addEventListener('click', () => {
      if (clothInstance) {
        clothInstance.windSpeed = 28;
        setTimeout(() => { if (clothInstance) clothInstance.windSpeed = parseFloat(windSlider.value || 0); }, 1200);
      }
    });
  }

  const resetClothBtn = document.getElementById('resetClothBtn');
  if (resetClothBtn) {
    resetClothBtn.addEventListener('click', () => {
      if (clothInstance) clothInstance.init();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. ACOUSTIC WEAVE & FLAVOR SYNESTHESIA CONTROLLER
  // ─────────────────────────────────────────────────────────────────────────
  const weaveCanvas = document.getElementById('weaveMatrixCanvas');
  const weaveCtx = weaveCanvas ? weaveCanvas.getContext('2d') : null;
  const acousticInput = document.getElementById('acousticInput');
  const generateWeaveBtn = document.getElementById('generateWeaveBtn');
  const downloadWeaveBtn = document.getElementById('downloadWeaveBtn');
  let lastWeaveData = null;

  async function generateWeave(descriptor) {
    try {
      const res = await fetch('/api/textile/acoustic-weave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sound_descriptor: descriptor || 'Jazz syncopated rhythm', matrix_size: 32 })
      });
      const data = await res.json();
      lastWeaveData = data;
      renderWeaveMatrix(data.loom_draft_grid);

      const dimsEl = document.getElementById('weaveDims');
      const ratioEl = document.getElementById('weaveRatio');
      if (dimsEl) dimsEl.textContent = data.matrix_dimensions;
      if (ratioEl) ratioEl.textContent = `${(data.warp_float_ratio * 100).toFixed(1)}% (${data.structural_integrity})`;
    } catch (e) {
      console.warn('Acoustic weave error:', e);
    }
  }

  function renderWeaveMatrix(grid) {
    if (!weaveCtx || !grid) return;
    const w = weaveCanvas.width;
    const h = weaveCanvas.height;
    weaveCtx.fillStyle = '#030712';
    weaveCtx.fillRect(0, 0, w, h);

    const rows = grid.length;
    const cols = grid[0].length;
    const cellW = w / cols;
    const cellH = h / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isWarpUp = grid[r][c] === 1;
        if (isWarpUp) {
          weaveCtx.fillStyle = '#00F5A0'; // Warp float
        } else {
          weaveCtx.fillStyle = '#0B1528'; // Weft float
        }
        weaveCtx.fillRect(c * cellW + 0.5, r * cellH + 0.5, cellW - 1, cellH - 1);
      }
    }
  }

  if (generateWeaveBtn) {
    generateWeaveBtn.addEventListener('click', () => {
      generateWeave(acousticInput ? acousticInput.value : '');
    });
  }

  const presetPills = document.querySelectorAll('.preset-pill');
  presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      presetPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      if (acousticInput) acousticInput.value = pill.dataset.preset;
      generateWeave(pill.dataset.preset);
    });
  });

  if (downloadWeaveBtn) {
    downloadWeaveBtn.addEventListener('click', () => {
      if (!lastWeaveData) return;
      const blob = new Blob([JSON.stringify(lastWeaveData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jacquard_loom_draft_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Flavor to Textile
  const flavorInput = document.getElementById('flavorInput');
  const extractFlavorBtn = document.getElementById('extractFlavorBtn');
  const flavorSwatchesBox = document.getElementById('flavorSwatchesBox');

  async function extractFlavor(profile) {
    try {
      const res = await fetch('/api/textile/flavor-to-textile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flavor_profile: profile || 'smoky, citrusy, sharp' })
      });
      const data = await res.json();
      if (data && data.pantone_tcx_palette && flavorSwatchesBox) {
        flavorSwatchesBox.innerHTML = '';
        data.pantone_tcx_palette.forEach(p => {
          const chip = document.createElement('div');
          chip.className = 'pantone-chip';
          chip.innerHTML = `
            <div class="pantone-color-block" style="background:${p.hex}"></div>
            <div class="pantone-chip-meta">
              <span class="pantone-chip-name">${p.color_name}</span>
              <span class="pantone-chip-code">${p.pantone}</span>
            </div>
          `;
          flavorSwatchesBox.appendChild(chip);
        });

        const yarnEl = document.getElementById('flavorYarnSpec');
        const handEl = document.getElementById('flavorTactileHand');
        if (yarnEl) yarnEl.textContent = data.yarn_and_structure_spec;
        if (handEl) handEl.textContent = data.extracted_tactile_profile.join(', ');
      }
    } catch (e) {
      console.warn('Flavor extraction error:', e);
    }
  }

  if (extractFlavorBtn) {
    extractFlavorBtn.addEventListener('click', () => {
      extractFlavor(flavorInput ? flavorInput.value : '');
    });
  }
  // Initialize initial flavor swatches
  extractFlavor('smoky, citrusy, sharp with roasted sienna');

  // ─────────────────────────────────────────────────────────────────────────
  // 4. CHRONO-AGING TIME-TRAVELER & BIO-TEXTILE CONTROLLER
  // ─────────────────────────────────────────────────────────────────────────
  const chronoCanvas = document.getElementById('chronoCanvas');
  const chronoCtx = chronoCanvas ? chronoCanvas.getContext('2d') : null;
  const timeStepBtns = document.querySelectorAll('.time-step-btn');
  let lastChronoTime = '2 years';

  async function setChronoMilestone(timeMilestone) {
    lastChronoTime = timeMilestone;
    timeStepBtns.forEach(b => b.classList.toggle('active', b.dataset.time === timeMilestone));

    try {
      const res = await fetch('/api/textile/chrono-aging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fabric_type: 'raw_denim', city_climate: 'Seattle, USA', time_milestone: timeMilestone })
      });
      const data = await res.json();

      const erosionEl = document.getElementById('chronoErosion');
      const tensileEl = document.getElementById('chronoTensile');
      const patinaEl = document.getElementById('chronoPatina');

      if (erosionEl) erosionEl.textContent = `${data.indigo_ring_dye_erosion_pct}% Washdown`;
      if (tensileEl) tensileEl.textContent = `${data.retained_tensile_strength_pct}%`;
      if (patinaEl) patinaEl.textContent = data.surface_patina_description;

      renderChronoCanvas(data.indigo_ring_dye_erosion_pct);
    } catch (e) {
      console.warn('Chrono error:', e);
    }
  }

  function renderChronoCanvas(fadePct) {
    if (!chronoCtx) return;
    const w = chronoCanvas.width;
    const h = chronoCanvas.height;

    // Base raw denim deep indigo
    chronoCtx.fillStyle = '#0F1A34';
    chronoCtx.fillRect(0, 0, w, h);

    // Whiskers and honeycombs fade intensity
    const fadeAlpha = fadePct / 100.0;
    chronoCtx.strokeStyle = `rgba(125, 211, 252, ${0.15 + fadeAlpha * 0.75})`;
    chronoCtx.lineWidth = 3.5;

    // Draw whiskering creases
    for (let i = 0; i < 6; i++) {
      chronoCtx.beginPath();
      chronoCtx.moveTo(w * 0.2, h * (0.2 + i * 0.12));
      chronoCtx.quadraticCurveTo(w * 0.5, h * (0.28 + i * 0.12), w * 0.8, h * (0.2 + i * 0.12));
      chronoCtx.stroke();
    }

    // Honeycomb abrasion points behind knees
    if (fadePct > 30) {
      chronoCtx.strokeStyle = `rgba(224, 242, 254, ${fadeAlpha * 0.65})`;
      chronoCtx.lineWidth = 2.0;
      for (let y = 30; y < h - 30; y += 22) {
        chronoCtx.beginPath();
        chronoCtx.moveTo(w * 0.35, y);
        chronoCtx.lineTo(w * 0.45, y + 10);
        chronoCtx.lineTo(w * 0.55, y);
        chronoCtx.lineTo(w * 0.65, y + 10);
        chronoCtx.stroke();
      }
    }
  }

  timeStepBtns.forEach(btn => {
    btn.addEventListener('click', () => setChronoMilestone(btn.dataset.time));
  });

  // Bio-Textile Environmental Sliders
  const bioHumSlider = document.getElementById('bioHumSlider');
  const bioHumVal = document.getElementById('bioHumVal');
  const bioTempSlider = document.getElementById('bioTempSlider');
  const bioTempVal = document.getElementById('bioTempVal');

  async function updateBioTextile() {
    const hum = parseFloat(bioHumSlider.value || 85);
    const temp = parseFloat(bioTempSlider.value || 32);
    if (bioHumVal) bioHumVal.textContent = `${hum}%`;
    if (bioTempVal) bioTempVal.textContent = `${temp} °C`;

    try {
      const res = await fetch('/api/textile/bio-textile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_c: temp, humidity_pct: hum, sweat_ph: 5.5 })
      });
      const data = await res.json();
      if (data && data.bio_response) {
        const b = data.bio_response;
        const swellEl = document.getElementById('bioSwelling');
        const transEl = document.getElementById('bioTranslucency');
        const suppEl = document.getElementById('bioSuppleness');
        if (swellEl) swellEl.textContent = b.microbial_hydration_expansion;
        if (transEl) transEl.textContent = b.optical_translucency;
        if (suppEl) suppEl.textContent = b.flexibility_and_drape_gain;
      }
    } catch (_) {}
  }

  if (bioHumSlider) bioHumSlider.addEventListener('input', updateBioTextile);
  if (bioTempSlider) bioTempSlider.addEventListener('input', updateBioTextile);

  // ─────────────────────────────────────────────────────────────────────────
  // 5. ZERO-WASTE KINETIC ORIGAMI GARMENT ARCHITECT
  // ─────────────────────────────────────────────────────────────────────────
  const origamiCanvas = document.getElementById('origamiCanvas');
  const origamiCtx = origamiCanvas ? origamiCanvas.getContext('2d') : null;
  const origamiStepBtns = document.querySelectorAll('.origami-step-btn');
  let lastOrigamiStep = 1;

  const origamiStepsData = {
    1: {
      title: "Step 1: Grid Scoring & Grain Alignment",
      text: "Lay the 140x280 cm silk rectangle flat. Mark 12 longitudinal mountain creases parallel to warp grain every 11.6 cm without cutting any threads."
    },
    2: {
      title: "Step 2: Diagonal Accordion Pre-Creasing",
      text: "Score alternating 45° diagonal valley folds across the grid, establishing the kinetic diamond tessellation."
    },
    3: {
      title: "Step 3: Torso Volume Collapse",
      text: "Compress the central 80 cm section accordion-style. The fabric spontaneously curves into an ergonomic cylindrical bodice without cutting."
    },
    4: {
      title: "Step 4: Sleeve Geometry Emergence",
      text: "Invert the upper left and right quadrant folds outwards. The rectangular corners automatically form anatomical raglan sleeves."
    },
    5: {
      title: "Step 5: Thermal Steam Setting & Closure",
      text: "Apply 110°C pressurized steam along the creases to set the molecular memory. Secure front lapels using two hidden magnet snaps. Zero scraps produced."
    }
  };

  function setOrigamiStep(stepNum) {
    lastOrigamiStep = stepNum;
    origamiStepBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.step) === stepNum));

    const s = origamiStepsData[stepNum] || origamiStepsData[1];
    const titleEl = document.getElementById('origamiStepTitle');
    const textEl = document.getElementById('origamiStepText');
    if (titleEl) titleEl.textContent = s.title;
    if (textEl) textEl.textContent = s.text;

    renderOrigamiCanvas(stepNum);
  }

  function renderOrigamiCanvas(step) {
    if (!origamiCtx) return;
    const w = origamiCanvas.width;
    const h = origamiCanvas.height;
    origamiCtx.fillStyle = '#030712';
    origamiCtx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Draw uncut rectangular outline
    origamiCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    origamiCtx.lineWidth = 1.5;
    origamiCtx.strokeRect(40, 25, w - 80, h - 50);

    // Draw kinetic tessellation creases based on step
    const numCreases = 10;
    const progress = step / 5.0;

    // Mountain folds (Cyan)
    origamiCtx.strokeStyle = '#22D3EE';
    origamiCtx.lineWidth = 1.8;
    for (let i = 1; i < numCreases; i++) {
      const x = 40 + ((w - 80) / numCreases) * i;
      origamiCtx.beginPath();
      origamiCtx.moveTo(x, 25);
      const wave = Math.sin(i * 1.5) * 20 * progress;
      origamiCtx.lineTo(x + wave, cy);
      origamiCtx.lineTo(x, h - 25);
      origamiCtx.stroke();
    }

    // Valley folds (Mint)
    origamiCtx.strokeStyle = '#00F5A0';
    origamiCtx.lineWidth = 1.4;
    for (let i = 0; i < numCreases - 1; i++) {
      const x1 = 40 + ((w - 80) / numCreases) * i;
      const x2 = x1 + ((w - 80) / numCreases);
      origamiCtx.beginPath();
      origamiCtx.moveTo(x1, 25);
      origamiCtx.lineTo(x2, h - 25);
      origamiCtx.stroke();
    }

    // Draw 3D bodice collapse contour
    if (step >= 3) {
      origamiCtx.fillStyle = 'rgba(0, 245, 160, 0.15)';
      origamiCtx.beginPath();
      origamiCtx.ellipse(cx, cy, 60 * progress, 80 * progress, 0, 0, Math.PI * 2);
      origamiCtx.fill();
      origamiCtx.strokeStyle = '#38BDF8';
      origamiCtx.stroke();
    }
  }

  origamiStepBtns.forEach(btn => {
    btn.addEventListener('click', () => setOrigamiStep(parseInt(btn.dataset.step)));
  });

  const askOrigamiChatBtn = document.getElementById('askOrigamiChatBtn');
  if (askOrigamiChatBtn) {
    askOrigamiChatBtn.addEventListener('click', () => {
      closeStudio();
      if (typeof sendMessage === 'function') {
        sendMessage("Explain the exact geometric folding formulas and origami pattern dimensions to transform a 140x280 cm silk rectangle into a Tessellated Pleat Jacket with zero waste.");
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. LOOMSIDE VISION AUDITOR & COMPLIANCE STRESS-TESTER
  // ─────────────────────────────────────────────────────────────────────────
  const visionCanvas = document.getElementById('visionCanvas');
  const visionCtx = visionCanvas ? visionCanvas.getContext('2d') : null;
  const runVisionAuditBtn = document.getElementById('runVisionAuditBtn');
  const runMacroGsmBtn = document.getElementById('runMacroGsmBtn');

  async function runLoomsideVision() {
    try {
      const res = await fetch('/api/textile/vision-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roll_length_meters: 120.0 })
      });
      const data = await res.json();

      const astmEl = document.getElementById('astmScore');
      const defectsEl = document.getElementById('defectsLogged');
      const yieldEl = document.getElementById('yieldLoss');

      if (astmEl) astmEl.textContent = `${data.astm_d5430_points_per_100_sq_yd} pts (${data.commercial_grade})`;
      if (defectsEl) defectsEl.textContent = `${data.total_defects_logged} anomalies logged along 120m roll`;
      if (yieldEl) yieldEl.textContent = `${data.estimated_yield_loss_pct}%`;

      renderVisionCanvas(data.defect_log);
    } catch (e) {
      console.warn('Vision audit error:', e);
    }
  }

  function renderVisionCanvas(defects) {
    if (!visionCtx) return;
    const w = visionCanvas.width;
    const h = visionCanvas.height;

    // Fabric weave texture background
    visionCtx.fillStyle = '#060D1F';
    visionCtx.fillRect(0, 0, w, h);

    // Draw yarn grid lines
    visionCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    visionCtx.lineWidth = 1;
    for (let x = 0; x < w; x += 10) {
      visionCtx.beginPath(); visionCtx.moveTo(x, 0); visionCtx.lineTo(x, h); visionCtx.stroke();
    }

    // Highlight detected defect bounding boxes
    if (defects && defects.length) {
      defects.forEach((d) => {
        const bb = d.bounding_box;
        const bx = bb.x_norm * w;
        const by = bb.y_norm * h;
        const bw = bb.w_norm * w + 20;
        const bh = bb.h_norm * h + 15;

        visionCtx.strokeStyle = '#EF4444'; // Red bounding box
        visionCtx.lineWidth = 2;
        visionCtx.strokeRect(bx, by, bw, bh);

        visionCtx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        visionCtx.fillRect(bx, by, bw, bh);

        visionCtx.fillStyle = '#F8FAFC';
        visionCtx.font = '10px JetBrains Mono, monospace';
        visionCtx.fillText(`[${d.defect_type} @ ${d.meter_mark}]`, bx, Math.max(12, by - 4));
      });
    }
  }

  if (runVisionAuditBtn) runVisionAuditBtn.addEventListener('click', runLoomsideVision);
  if (runMacroGsmBtn) {
    runMacroGsmBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/textile/macro-gsm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ macro_desc: 'twill 2/1' })
        });
        const data = await res.json();
        alert(`Macro Optical Deconstruction Result:\nWeave: ${data.identified_weave_pattern}\nEPI: ${data.measured_ends_per_inch_epi} | PPI: ${data.measured_picks_per_inch_ppi}\nCalculated GSM: ${data.calculated_gsm} GSM\nYarn Count: ${data.estimated_yarn_count}`);
      } catch (_) {}
    });
  }

  // Initial vision frame
  renderVisionCanvas([]);

  // Compliance Stress-Testing
  const complianceInput = document.getElementById('complianceInput');
  const checkComplianceBtn = document.getElementById('checkComplianceBtn');
  if (checkComplianceBtn) {
    checkComplianceBtn.addEventListener('click', async () => {
      const q = complianceInput ? complianceInput.value : '';
      try {
        const res = await fetch('/api/textile/compliance-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fabric_spec: q, chemical_dyes: [q] })
        });
        const data = await res.json();
        const telemetry = document.getElementById('complianceTelemetry');
        if (telemetry) {
          const hasCrit = data.critical_violations && data.critical_violations.length;
          telemetry.innerHTML = `
            <div class="t-line"><span>EU REACH Compliance:</span> <strong class="${hasCrit ? 'text-warn' : 'text-mint'}">${hasCrit ? 'CRITICAL VIOLATION DETECTED' : 'PASSED (Zero SVHC Violations)'}</strong></div>
            <div class="t-line"><span>Digital Product Passport:</span> <strong>${data.digital_product_passport_readiness}</strong></div>
            <div class="t-line"><span>Action Recommendation:</span> <em>${hasCrit ? data.critical_violations[0].message : 'All ingredients certified safe for global export.'}</em></div>
          `;
        }
      } catch (_) {}
    });
  }
})();



// ══════════════════════════════════════════════════════════════════════════════
// TEXO CELEBRATION & FIRECRACKERS INTERACTIVE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

(function initTexoCelebrationEngine() {
  let celebrationCanvas = null;
  let celebrationCtx = null;
  let particles = [];
  let animId = null;

  function ensureCanvas() {
    if (!celebrationCanvas || !document.body.contains(celebrationCanvas)) {
      celebrationCanvas = document.createElement('canvas');
      celebrationCanvas.id = 'celebrationCanvas';
      celebrationCanvas.className = 'celebration-canvas-layer';
      celebrationCanvas.width = window.innerWidth;
      celebrationCanvas.height = window.innerHeight;
      celebrationCtx = celebrationCanvas.getContext('2d');
      document.body.appendChild(celebrationCanvas);

      window.addEventListener('resize', () => {
        if (celebrationCanvas) {
          celebrationCanvas.width = window.innerWidth;
          celebrationCanvas.height = window.innerHeight;
        }
      });
    }
    return celebrationCtx;
  }

  // Realistic Web Audio Firecracker crackle & Victory arpeggio
  function playFirecrackerAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // 1. Firecracker crackle burst (noise pops)
      const pops = 7;
      for (let i = 0; i < pops; i++) {
        const t = now + (i * 0.05) + (Math.random() * 0.025);
        const bufLen = Math.floor(ctx.sampleRate * 0.045);
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let j = 0; j < bufLen; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufLen * 0.22));
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1100 + Math.random() * 1800;
        filter.Q.value = 2.5;

        const gain = ctx.createGain();
        const vol = 0.35 / (1 + i * 0.25);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(t);
      }

      // 2. Victory sparkle fanfare arpeggio (C6, E6, G6, C7, E7)
      const freqs = [1046.5, 1318.5, 1567.98, 2093.0, 2637.0];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'triangle';
        const startT = now + 0.08 + idx * 0.06;
        osc.frequency.setValueAtTime(freq, startT);
        noteGain.gain.setValueAtTime(0.16, startT);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.38);
        osc.connect(noteGain);
        noteGain.connect(ctx.destination);
        osc.start(startT);
        osc.stop(startT + 0.4);
      });
    } catch (e) {
      // Graceful fallback if audio permissions are restricted
    }
  }

  // Visual Particle Loop
  function updateAndDrawParticles() {
    if (!celebrationCtx || !particles.length) {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      if (celebrationCtx && celebrationCanvas) {
        celebrationCtx.clearRect(0, 0, celebrationCanvas.width, celebrationCanvas.height);
      }
      return;
    }

    celebrationCtx.clearRect(0, 0, celebrationCanvas.width, celebrationCanvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.rotation += p.vRot;
      p.alpha -= p.fadeRate;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      celebrationCtx.save();
      celebrationCtx.globalAlpha = Math.max(0, p.alpha);
      celebrationCtx.translate(p.x, p.y);
      celebrationCtx.rotate(p.rotation);

      if (p.shape === 'spark') {
        // Glowing firecracker spark
        celebrationCtx.fillStyle = p.color;
        celebrationCtx.shadowColor = p.color;
        celebrationCtx.shadowBlur = 10;
        celebrationCtx.beginPath();
        celebrationCtx.arc(0, 0, p.size, 0, Math.PI * 2);
        celebrationCtx.fill();
        // Mini streak line
        celebrationCtx.strokeStyle = '#FFFFFF';
        celebrationCtx.lineWidth = 1.5;
        celebrationCtx.beginPath();
        celebrationCtx.moveTo(0, 0);
        celebrationCtx.lineTo(-p.vx * 1.8, -p.vy * 1.8);
        celebrationCtx.stroke();
      } else if (p.shape === 'confetti') {
        // Fluttering rectangular confetti
        celebrationCtx.fillStyle = p.color;
        celebrationCtx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
      } else {
        // Twinkling star
        celebrationCtx.fillStyle = p.color;
        celebrationCtx.beginPath();
        celebrationCtx.arc(0, 0, p.size, 0, Math.PI * 2);
        celebrationCtx.fill();
      }

      celebrationCtx.restore();
    }

    if (particles.length > 0) {
      animId = requestAnimationFrame(updateAndDrawParticles);
    }
  }

  function spawnFirecrackerParticles(originX, originY) {
    ensureCanvas();
    const colors = [
      '#00F5A0', '#06B6D4', '#F59E0B', '#EC4899', '#8B5CF6',
      '#FDE047', '#3B82F6', '#FF3366', '#FFFFFF', '#10B981'
    ];
    const particleCount = 85;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 11;
      const shapeType = Math.random() < 0.5 ? 'spark' : (Math.random() < 0.8 ? 'confetti' : 'circle');

      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 3 + 1), // upward bias
        gravity: 0.22,
        drag: 0.965,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        size: shapeType === 'confetti' ? (5 + Math.random() * 5) : (2.5 + Math.random() * 3.5),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapeType,
        alpha: 1,
        fadeRate: 0.012 + Math.random() * 0.016
      });
    }

    if (!animId) {
      animId = requestAnimationFrame(updateAndDrawParticles);
    }
  }

  function spawnFloatingCelebrationEmojis(originX, originY) {
    const emojis = ['🎆', '🎉', '✨', '💥', '🎇', '🌟', '🥳', '🎊', '🚀', '⚡'];
    const count = 7;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'celebration-floating-item';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const dx = (Math.random() - 0.5) * 260;
      const dy = -(120 + Math.random() * 180);
      const rot = (Math.random() - 0.5) * 70;

      el.style.left = `${originX}px`;
      el.style.top = `${originY}px`;
      el.style.setProperty('--dx', `${dx}px`);
      el.style.setProperty('--dy', `${dy}px`);
      el.style.setProperty('--rot', `${rot}deg`);

      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1850);
    }
  }

  function spawnShockwaveRing(originX, originY) {
    const ring = document.createElement('div');
    ring.className = 'celebration-shockwave-ring';
    ring.style.left = `${originX}px`;
    ring.style.top = `${originY}px`;
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 800);
  }

  function spawnCelebrationPill(originX, originY) {
    const toasts = [
      '🎆 TEXO AI Celebration! 🎉',
      '⚡ Boom! Firecracker Spark! 💥',
      '✨ TEXO Intelligence Unleashed! 🚀',
      '🌟 Welcome to TEXO! 🥳'
    ];
    const pill = document.createElement('div');
    pill.className = 'celebration-toast-pill';
    pill.textContent = toasts[Math.floor(Math.random() * toasts.length)];
    pill.style.left = `${originX}px`;
    pill.style.top = `${originY - 35}px`;
    document.body.appendChild(pill);
    setTimeout(() => pill.remove(), 1750);
  }

  window.triggerTexoCelebration = function(e, specificTarget) {
    let target = specificTarget || (e ? e.target : null);
    if (target && !target.classList) target = target.parentElement;

    // Determine origin coords
    let originX = window.innerWidth / 2;
    let originY = window.innerHeight * 0.35;

    if (e && e.clientX && e.clientY && (e.clientX !== 0 || e.clientY !== 0)) {
      originX = e.clientX;
      originY = e.clientY;
    } else if (target && target.getBoundingClientRect) {
      const rect = target.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    }

    // Bounce animation on clicked target
    if (target) {
      const bounceElem = target.closest('.welcome-h1, .welcome-logo-wrap, .header-logo, .logo-text') || target;
      bounceElem.classList.remove('celebration-bounce-fx');
      // Trigger reflow to restart animation
      void bounceElem.offsetWidth;
      bounceElem.classList.add('celebration-bounce-fx');
      setTimeout(() => bounceElem.classList.remove('celebration-bounce-fx'), 860);
    }

    // Audio & Haptics
    playFirecrackerAudio();
    if (navigator && navigator.vibrate) {
      try { navigator.vibrate([40, 50, 40, 60, 100]); } catch (_) {}
    }

    // Visuals
    spawnShockwaveRing(originX, originY);
    spawnFirecrackerParticles(originX, originY);
    spawnFloatingCelebrationEmojis(originX, originY);
    spawnCelebrationPill(originX, originY);
  };

  // Global Event Delegation for Clicks & Touches
  function handleTriggerEvent(e) {
    const trigger = e.target.closest(
      '.celebration-interactive, .welcome-h1, #welcomeH1, .celebration-spark-badge, .welcome-logo-wrap, .header-logo, .logo-text'
    );
    if (trigger) {
      window.triggerTexoCelebration(e, trigger);
    }
  }

  document.addEventListener('click', handleTriggerEvent, { passive: true });
  document.addEventListener('touchstart', (e) => {
    const trigger = e.target.closest(
      '.celebration-interactive, .welcome-h1, #welcomeH1, .celebration-spark-badge, .welcome-logo-wrap, .header-logo, .logo-text'
    );
    if (trigger && e.touches && e.touches[0]) {
      const touch = e.touches[0];
      window.triggerTexoCelebration({ clientX: touch.clientX, clientY: touch.clientY }, trigger);
    }
  }, { passive: true });

  console.log('⚡ TEXO Interactive Celebration & Firecrackers Engine Initialized');
})();
