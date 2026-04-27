/* =========================================================
   1) i18n — texts in both languages, auto-detected on load.
   To add new step text: add a key to BOTH `ru` and `en`.
========================================================= */
const I18N = {
  ru: {
    intro: 'Хочешь хороший хак, не так ли?',
  },
  en: {
    intro: "Want a good hack, don't you?",
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
   2) Typewriter — types and erases with cancellation tokens,
   so language toggle can interrupt mid-animation cleanly.
========================================================= */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function typeText(el, text, token, { charDelay = 75, jitter = 45 } = {}) {
  el.textContent = '';
  for (const ch of text) {
    if (token.cancelled) return false;
    el.textContent += ch;
    await sleep(charDelay + Math.random() * jitter);
  }
  return true;
}

async function eraseText(el, token, { charDelay = 28 } = {}) {
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
     - 'message'  : type → hold → erase → next
     - 'question' : type → show answer buttons → wait for click → next
   Add steps to the `flow` array; `next` references step `id`s.
========================================================= */
const flow = [
  { id: 'intro', type: 'message', key: 'intro', hold: 3000 },

  // Future example — when you're ready to add the question/answer step,
  // also add corresponding keys to I18N (q1_text, q1_yes, q1_no, ...):
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
  const promptEl = document.getElementById('promptText');
  const cursorEl = document.getElementById('promptCursor');

  cursorEl.classList.remove('hidden');

  const typed = await typeText(promptEl, t(step.key), token);
  if (!typed || token.cancelled) return null;

  if (step.type === 'message') {
    await sleep(step.hold ?? 3000);
    if (token.cancelled) return null;
    await eraseText(promptEl, token);
    if (token.cancelled) return null;
    return { next: step.next ?? null };
  }

  // 'question' branch — to be wired up when answers UI is added.
  // Returns when an answer is clicked.
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

  document.getElementById('promptText').textContent = '';
  runFlow(token);
}


/* =========================================================
   Language switch UI
========================================================= */
function applyLangUI() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
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
