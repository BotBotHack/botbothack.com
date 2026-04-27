/* =========================================================
   1) i18n — dictionary + language auto-detect
   To add a new step's text: just add a key to both `ru` and `en`.
========================================================= */
const I18N = {
  ru: {
    intro: 'Хочешь хороший хак, не так ли?',
    status: 'соединение: защищено',
    meta: 'v0.2 · сборка alpha',
  },
  en: {
    intro: "Want a good hack, don't you?",
    status: 'connection: secure',
    meta: 'v0.2 · build alpha',
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
   2) Typewriter — types and erases text with cancellation.
   Each await checks a token so we can stop mid-animation
   when the user toggles language.
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
   3) Flow engine — declarative steps.
   Step types:
     - 'message'  : type text → hold → erase → next
     - 'question' : type text → show answer buttons → wait for click → next
   Add new steps to the `flow` array; reference ids via `next`.
========================================================= */
const flow = [
  { id: 'intro', type: 'message', key: 'intro', hold: 3000 },

  // Examples for later — uncomment and fill in I18N keys to extend:
  //
  // {
  //   id: 'q1',
  //   type: 'question',
  //   key: 'q1_text',
  //   answers: [
  //     { key: 'q1_yes', next: 'q2' },
  //     { key: 'q1_no',  next: 'end' },
  //   ],
  // },
];

let activeToken = null;

async function runStep(step, token) {
  const promptEl  = document.getElementById('promptText');
  const cursorEl  = document.getElementById('promptCursor');
  const answersEl = document.getElementById('answers');

  answersEl.innerHTML = '';
  cursorEl.classList.remove('hidden');

  const typed = await typeText(promptEl, t(step.key), token);
  if (!typed || token.cancelled) return null;

  if (step.type === 'message') {
    await sleep(step.hold ?? 2500);
    if (token.cancelled) return null;
    await eraseText(promptEl, token);
    if (token.cancelled) return null;
    return { next: step.next ?? null };
  }

  if (step.type === 'question') {
    return new Promise((resolve) => {
      step.answers.forEach((ans, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'answer-btn';
        btn.style.animationDelay = `${i * 90}ms`;
        btn.textContent = t(ans.key);
        btn.addEventListener('click', () => {
          if (token.cancelled) return;
          resolve({ next: ans.next ?? null });
        });
        answersEl.appendChild(btn);
      });
    });
  }

  return null;
}

async function runFlow(token) {
  let i = 0;
  while (i < flow.length && !token.cancelled) {
    const step = flow[i];
    const result = await runStep(step, token);
    if (token.cancelled || !result) return;

    if (result.next) {
      const idx = flow.findIndex(s => s.id === result.next);
      if (idx === -1) break;
      i = idx;
    } else {
      i++;
    }
  }
}

function startFlow() {
  if (activeToken) activeToken.cancelled = true;
  const token = { cancelled: false };
  activeToken = token;

  // Reset UI before starting fresh
  document.getElementById('promptText').textContent = '';
  document.getElementById('answers').innerHTML = '';

  runFlow(token);
}


/* =========================================================
   Language switch
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
    startFlow();
  });
});


/* =========================================================
   Boot
========================================================= */
applyLangUI();
startFlow();
