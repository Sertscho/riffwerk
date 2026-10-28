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

window.addEventListener('hashchange', route);
route();

navigator.serviceWorker?.register('sw.js').catch(console.error);
