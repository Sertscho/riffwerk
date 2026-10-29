// Hash-Router: jede Route lädt js/views/<name>.js und ruft render(el, params) auf.
// Gibt render eine Funktion zurück, wird sie beim Verlassen der Route aufgerufen.

const ROUTES = [
  [/^\/$/, 'home'],
  [/^\/stimmen$/, 'tuner'],
  [/^\/kurs$/, 'course'],
  [/^\/kurs\/([^/]+)$/, 'course', 'n'],
  [/^\/lieder$/, 'songs'],
  [/^\/spielen\/([^/]+)$/, 'play', 'id'],
  [/^\/import$/, 'import'],
  [/^\/einstellungen$/, 'settings'],
];

const main = document.getElementById('app');
let cleanup = null;
let token = 0;

function resolve() {
  let path;
  try {
    path = decodeURIComponent(location.hash.replace(/^#/, '')) || '/';
  } catch {
    return null;
  }
  for (const [re, view, key] of ROUTES) {
    const m = re.exec(path);
    if (m) return { view, params: key ? { [key]: m[1] } : {} };
  }
  return null;
}

async function route() {
  const my = ++token;
  const r = resolve();
  if (!r) {
    location.hash = '#/';
    return;
  }
  if (typeof cleanup === 'function') {
    try { cleanup(); } catch (err) { console.error(err); }
  }
  cleanup = null;
  main.textContent = '';
  try {
    const mod = await import(`./views/${r.view}.js`);
    const done = await mod.render(main, r.params);
    if (my !== token) {
      if (typeof done === 'function') done();
      return;
    }
    cleanup = typeof done === 'function' ? done : null;
  } catch (err) {
    if (my === token) main.textContent = 'Seite konnte nicht geladen werden.';
    console.error(err);
  }
}

import { ROCKER } from './rocker.js';

// Intro beim Öffnen: Rocker schlägt einmal an, dann Startseite. Tippen überspringt.
function intro() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const d = document.createElement('div');
  d.className = 'splash';
  d.setAttribute('aria-hidden', 'true');
  // feste Konstanten, keine Fremddaten
  d.innerHTML = `<svg viewBox="0 0 220 440" preserveAspectRatio="xMidYMid slice">
    <polygon points="80,0 140,0 210,440 10,440" fill="#e10600" opacity=".3"/>
    <circle class="splash-wave" cx="125" cy="250" r="40" fill="none" stroke="#fff" stroke-width="4"/>
    <g transform="translate(30 140) scale(1.3)">${ROCKER}</g>
  </svg><div class="splash-boom">BRAAANG!</div><div class="splash-flash"></div>`;
  const end = () => d.remove();
  d.addEventListener('click', end);
  d.addEventListener('animationend', (e) => { if (e.target === d) end(); });
  document.body.append(d);
}
intro();

window.addEventListener('hashchange', route);
route();

navigator.serviceWorker?.register('sw.js').catch(console.error);
