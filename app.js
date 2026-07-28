(() => {
'use strict';

const I18N = {
  ru: {
    intro:       'Хочешь хороший хак, не так ли?',
    choose:      'Как насчёт этого?',
    install:     'Установи в настройках телефона',
    btnSettings: 'Открыть настройки сети',
    btnHelp:     'Помощь',
    status:      'соединение: защищено',
    meta:        'v0.1 · сборка alpha',
    popupText:   'А как на счёт этого?',
    popupBtn:    'Поддержать нас',
  },
  en: {
    intro:       "Want a good hack, don't you?",
    choose:      'How about this?',
    install:     'Set in your network settings',
    btnSettings: 'Open network settings',
    btnHelp:     'Help',
    status:      'connection: secure',
    meta:        'v0.1 · build alpha',
    popupText:   'How about this?',
    popupBtn:    'Support us',
  },
};

const DNS = 'dns.botbothack.com';

function detectLang() {
  const s = localStorage.getItem('lang');
  if (s && I18N[s]) return s;
  const b = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return b.startsWith('ru') ? 'ru' : 'en';
}

let lang = detectLang();
const t = (k) => I18N[lang][k] ?? I18N.en[k] ?? k;

function openSettings() {
  window.location.href = 'intent:#Intent;action=android.settings.WIRELESS_SETTINGS;end';
}

async function copyDns() {
  try {
    await navigator.clipboard.writeText(DNS);
    return true;
  } catch (_) {
    try {
      const ta = document.createElement('textarea');
      ta.value = DNS;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (__) {
      return false;
    }
  }
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function typeEl(el, text, tk, d = 55, j = 35) {
  el.textContent = '';
  for (const c of text) {
    if (tk.off) return false;
    el.textContent += c;
    await wait(d + Math.random() * j);
  }
  return true;
}

async function eraseEl(el, tk, d = 22) {
  while (el.textContent.length) {
    if (tk.off) return false;
    el.textContent = el.textContent.slice(0, -1);
    await wait(d);
  }
  return true;
}

function renderCards(box) {
  box.innerHTML = '';

  const card = document.createElement('article');
  card.className = 'card';

  const h = document.createElement('h3');
  h.className = 'card-title';
  h.innerHTML = `<span class="card-title-name">${DNS}</span>`;
  card.appendChild(h);

  const imgWrap = document.createElement('div');
  imgWrap.className = 'card-image';
  const img = document.createElement('img');
  img.className = 'card-image-base';
  img.src = 'sf2_paid.png';
  img.alt = '';
  imgWrap.appendChild(img);

  const sid = `s${Math.floor(Math.random() * 1e6)}`;
  const seed = Math.floor(Math.random() * 100);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('card-image-smoke');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.innerHTML = `<filter id="${sid}" x="0%" y="0%" width="100%" height="100%">
    <feTurbulence type="turbulence" baseFrequency="0.011" numOctaves="2" seed="${seed}">
      <animate attributeName="baseFrequency" values="0.011;0.0098;0.0115;0.0102;0.011" dur="55s" repeatCount="indefinite"/>
    </feTurbulence>
    <feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   1 0 0 0 0"/>
    <feComponentTransfer><feFuncA type="linear" slope="2.2" intercept="-0.7"/></feComponentTransfer>
  </filter>
  <rect width="100%" height="100%" filter="url(#${sid})"/>`;
  imgWrap.appendChild(svg);
  card.appendChild(imgWrap);

  const inst = document.createElement('p');
  inst.className = 'card-instruction';
  inst.textContent = t('install');
  card.appendChild(inst);

  const pre = document.createElement('pre');
  pre.className = 'card-code';
  const code = document.createElement('code');
  code.textContent = DNS;
  pre.appendChild(code);

  const cp = document.createElement('button');
  cp.type = 'button';
  cp.className = 'code-copy-btn';
  cp.setAttribute('aria-label', 'Copy');
  cp.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
  cp.addEventListener('click', async () => {
    if (await copyDns()) {
      cp.classList.add('copied');
      setTimeout(() => cp.classList.remove('copied'), 1200);
    }
  });
  pre.appendChild(cp);
  card.appendChild(pre);

  const acts = document.createElement('div');
  acts.className = 'card-actions';

  const setBtn = document.createElement('button');
  setBtn.type = 'button';
  setBtn.className = 'action-btn action-btn-primary';
  setBtn.textContent = t('btnSettings');
  setBtn.addEventListener('click', () => {
    copyDns();
    showPopup();
    setTimeout(openSettings, 350);
  });
  acts.appendChild(setBtn);

  const hlpBtn = document.createElement('button');
  hlpBtn.type = 'button';
  hlpBtn.className = 'action-btn action-btn-secondary';
  hlpBtn.textContent = t('btnHelp');
  hlpBtn.addEventListener('click', () => { window.location.href = 'help.html'; });
  acts.appendChild(hlpBtn);

  card.appendChild(acts);
  box.appendChild(card);
}

const flow = [
  { id: 'intro',  type: 'message', key: 'intro',  hold: 3000 },
  { id: 'choose', type: 'choice',  key: 'choose' },
];

let tk = null;
let stepIdx = 0;

async function runStep(s, token) {
  const pr = document.getElementById('promptText');
  const cu = document.getElementById('promptCursor');
  const an = document.getElementById('answers');
  const cd = document.getElementById('cards');
  const st = document.querySelector('.stage');

  an.innerHTML = '';
  cd.innerHTML = '';
  cu.classList.remove('hidden');
  st.classList.toggle('has-cards', s.type === 'choice');

  if (!(await typeEl(pr, t(s.key), token)) || token.off) return null;

  if (s.type === 'message') {
    await wait(s.hold ?? 2500);
    if (token.off) return null;
    await eraseEl(pr, token);
    if (token.off) return null;
    return { next: s.next ?? null };
  }

  if (s.type === 'choice') {
    renderCards(cd);
    return { next: null };
  }
  return null;
}

async function run(token, from = 0) {
  let i = from;
  while (i < flow.length && !token.off) {
    stepIdx = i;
    const r = await runStep(flow[i], token);
    if (token.off || !r) return;
    if (r.next) {
      const idx = flow.findIndex(s => s.id === r.next);
      if (idx === -1) break;
      i = idx;
    } else if (flow[i].type === 'choice') {
      return;
    } else {
      i++;
    }
  }
}

function startFlow(from = 0) {
  if (tk) tk.off = true;
  tk = { off: false };
  document.getElementById('promptText').textContent = '';
  document.getElementById('answers').innerHTML = '';
  document.getElementById('cards').innerHTML = '';
  run(tk, from);
}

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.getElementById('statusText').textContent = t('status');
  document.getElementById('metaText').textContent = t('meta');
}

document.querySelectorAll('.lang-btn').forEach(b => {
  b.addEventListener('click', () => {
    const n = b.dataset.lang;
    if (n === lang) return;
    lang = n;
    localStorage.setItem('lang', lang);
    applyLang();
    startFlow(stepIdx);
  });
});

const _dk = '_d';

function showPopup() {
  if (localStorage.getItem(_dk)) return;
  const o = document.getElementById('supportPopup');
  if (!o) return;
  const tx = document.getElementById('supportPopupText');
  const bt = document.getElementById('supportPopupBtn');
  if (tx) tx.innerHTML = t('popupText') + ' <span class="support-popup-smile">:)</span>';
  if (bt) bt.textContent = t('popupBtn');
  o.classList.add('visible');
  o.setAttribute('aria-hidden', 'false');
}

function hidePopup() {
  const o = document.getElementById('supportPopup');
  if (!o) return;
  o.classList.remove('visible');
  o.setAttribute('aria-hidden', 'true');
  localStorage.setItem(_dk, '1');
}

(function() {
  const x = document.getElementById('supportPopupClose');
  const o = document.getElementById('supportPopup');
  if (!x || !o) return;
  x.addEventListener('click', hidePopup);
  o.addEventListener('click', e => { if (e.target === o) hidePopup(); });
})();

applyLang();
startFlow();

})();
