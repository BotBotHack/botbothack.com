/* =========================================================
   1) i18n — texts in both languages, auto-detected on load.
   To add new step text: add a key to BOTH `ru` and `en`.
========================================================= */
const I18N = {
  ru: {
    intro:         'Хочешь хороший хак, не так ли?',
    choose:        'Сделай выбор',
    all_from_free: 'Всё из GoogleBypass',
    status:        'соединение: защищено',
    meta:          'v0.1 · сборка alpha',
  },
  en: {
    intro:         "Want a good hack, don't you?",
    choose:        'Make your choice',
    all_from_free: 'All from GoogleBypass',
    status:        'connection: secure',
    meta:          'v0.1 · build alpha',
  },
};

function detectLang() {
  const stored = localStorage.getItem('lang');
  if (stored && I18N[stored]) return stored;
  const browser = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return browser.startsWith('ru') ? 'ru' : 'en';
}

let currentLang = detectLang();
const t = (key) => I18N[currentLang][key] ?? I18N.en[key] ?? key;


/* =========================================================
   2) Cards — declarative description of the choice cards.
   Each feature is either { static: '...' } (universal English term,
   not translated) or { key: '...' } (looked up in I18N).
========================================================= */
const CARDS = [
  {
    id: 'free',
    name: 'GoogleBypass',
    tag: 'Free',
    tagClass: 'card-tag-free',
    image: 'sf2.png',
    features: [
      { static: 'Google Bypass' },
      { static: 'Instant Thruster 60X' },
      { static: '3X Perks' },
      { static: '4Th Tier' },
      { static: 'No Ads' },
    ],
  },
  {
    id: 'paid',
    name: 'RatingHack',
    tag: 'Paid',
    tagClass: 'card-tag-paid',
    image: 'sf2.png',
    overlay: 'venok.png',
    features: [
      { key: 'all_from_free' },
      { static: 'Set Damage' },
      { static: 'Skip Finishing' },
      { static: 'Clan Raid System' },
      { static: 'Full Auto mode' },
    ],
  },
];


/* =========================================================
   3) Typewriter — types and erases with cancellation tokens,
   so language toggle can interrupt mid-animation cleanly.
========================================================= */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function typeText(el, text, token, { charDelay = 55, jitter = 35 } = {}) {
  el.textContent = '';
  for (const ch of text) {
    if (token.cancelled) return false;
    el.textContent += ch;
    await sleep(charDelay + Math.random() * jitter);
  }
  return true;
}

async function eraseText(el, token, { charDelay = 22 } = {}) {
  while (el.textContent.length > 0) {
    if (token.cancelled) return false;
    el.textContent = el.textContent.slice(0, -1);
    await sleep(charDelay);
  }
  return true;
}


/* =========================================================
   4) Card rendering
========================================================= */
function renderCards(container) {
  container.innerHTML = '';
  CARDS.forEach((card) => {
    const el = document.createElement('article');
    el.className = 'card';
    el.dataset.cardId = card.id;

    // Title — name | tag (with colored separator and tag class).
    // Spaces between spans are required so the browser can wrap
    // long titles instead of overflowing the card.
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.innerHTML =
      `<span class="card-title-name">${card.name}</span> ` +
      `<span class="card-title-sep">|</span> ` +
      `<span class="${card.tagClass}">${card.tag}</span>`;
    el.appendChild(title);

    // Image (with optional overlay laid on top)
    const imgWrap = document.createElement('div');
    imgWrap.className = 'card-image';
    const baseImg = document.createElement('img');
    baseImg.className = 'card-image-base';
    baseImg.src = card.image;
    baseImg.alt = '';
    imgWrap.appendChild(baseImg);
    if (card.overlay) {
      const overlayImg = document.createElement('img');
      overlayImg.className = 'card-image-overlay';
      overlayImg.src = card.overlay;
      overlayImg.alt = '';
      imgWrap.appendChild(overlayImg);
    }
    el.appendChild(imgWrap);

    // Features list
    const ul = document.createElement('ul');
    ul.className = 'card-features';
    card.features.forEach((f) => {
      const li = document.createElement('li');
      li.textContent = f.key ? t(f.key) : f.static;
      ul.appendChild(li);
    });
    el.appendChild(ul);

    container.appendChild(el);
  });
}


/* =========================================================
   5) Flow engine — declarative steps.
   Step types:
     - 'message' : type → hold → erase → next
     - 'choice'  : type → keep on screen → render cards → freeze
========================================================= */
const flow = [
  { id: 'intro',  type: 'message', key: 'intro',  hold: 3000 },
  { id: 'choose', type: 'choice',  key: 'choose' },
];

let activeToken = null;
let currentStepIndex = 0;

async function runStep(step, token) {
  const promptEl  = document.getElementById('promptText');
  const cursorEl  = document.getElementById('promptCursor');
  const answersEl = document.getElementById('answers');
  const cardsEl   = document.getElementById('cards');
  const stageEl   = document.querySelector('.stage');

  // Reset volatile UI
  answersEl.innerHTML = '';
  cardsEl.innerHTML = '';
  cursorEl.classList.remove('hidden');

  // Stage layout: top-aligned for choice steps, centered otherwise.
  // Class is toggled while prompt is empty, so the position swap is invisible.
  stageEl.classList.toggle('has-cards', step.type === 'choice');

  const typed = await typeText(promptEl, t(step.key), token);
  if (!typed || token.cancelled) return null;

  if (step.type === 'message') {
    await sleep(step.hold ?? 2500);
    if (token.cancelled) return null;
    await eraseText(promptEl, token);
    if (token.cancelled) return null;
    return { next: step.next ?? null };
  }

  if (step.type === 'choice') {
    // Text stays on screen, cards animate in. Step "freezes" — the
    // flow loop sees no `next` and stops advancing on choice steps.
    renderCards(cardsEl);
    return { next: null };
  }

  return null;
}

async function runFlow(token, fromIndex = 0) {
  let i = fromIndex;
  while (i < flow.length && !token.cancelled) {
    currentStepIndex = i;
    const step = flow[i];
    const result = await runStep(step, token);
    if (token.cancelled || !result) return;

    if (result.next) {
      const idx = flow.findIndex(s => s.id === result.next);
      if (idx === -1) break;
      i = idx;
    } else if (step.type === 'choice') {
      // Choice step idles — stop advancing.
      return;
    } else {
      i++;
    }
  }
}

function startFlow(fromIndex = 0) {
  if (activeToken) activeToken.cancelled = true;
  const token = { cancelled: false };
  activeToken = token;

  // Reset volatile UI before starting fresh
  document.getElementById('promptText').textContent = '';
  document.getElementById('answers').innerHTML = '';
  document.getElementById('cards').innerHTML = '';

  runFlow(token, fromIndex);
}


/* =========================================================
   Language switch — restarts from the CURRENT step (not from intro),
   so toggling RU/EN while looking at the cards just re-renders that
   step in the new language instead of replaying intro.
========================================================= */
function applyLangUI() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
  document.getElementById('statusText').textContent = t('status');
  document.getElementById('metaText').textContent = t('meta');
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.lang;
    if (next === currentLang) return;
    currentLang = next;
    localStorage.setItem('lang', currentLang);
    applyLangUI();
    startFlow(currentStepIndex);
  });
});


/* =========================================================
   Boot
========================================================= */
applyLangUI();
startFlow();
