(() => {
'use strict';

const DNS_VALUE = 'dns.botbothack.com';

function detectLang() {
  const stored = localStorage.getItem('lang');
  if (stored === 'ru' || stored === 'en') return stored;
  const browser = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return browser.startsWith('ru') ? 'ru' : 'en';
}

let currentLang = detectLang();

function applyLang() {
  document.documentElement.lang = currentLang;

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });

  document.querySelectorAll('[data-ru]').forEach(el => {
    el.textContent = currentLang === 'ru' ? el.dataset.ru : el.dataset.en;
  });
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.lang;
    if (next === currentLang) return;
    currentLang = next;
    localStorage.setItem('lang', currentLang);
    applyLang();
  });
});

async function copyDnsValue() {
  try {
    await navigator.clipboard.writeText(DNS_VALUE);
    return true;
  } catch (err) {
    try {
      const ta = document.createElement('textarea');
      ta.value = DNS_VALUE;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (err2) {
      return false;
    }
  }
}

document.querySelectorAll('.code-copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const ok = await copyDnsValue();
    if (ok) {
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1200);
    }
  });
});

applyLang();

})();
