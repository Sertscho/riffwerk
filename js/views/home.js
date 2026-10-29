import * as store from '../store.js';

const el_ = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

const ICONS = {
  stimmen: '<path d="M12 3v18M7 8v8M17 8v8M3 11v2M21 11v2"/>',
  kurs: '<path d="M4 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-7"/><path d="M20 5v12h-7"/>',
  lieder: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  import: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  einstellungen: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
};

function icon(name) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('class', 'tile-icon');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = ICONS[name]; // feste Konstante, keine Fremddaten
  return s;
}

export async function render(el) {
  let course = [];
  try { course = await (await fetch('data/course.json')).json(); } catch (e) { console.error(e); }
  const lessons = store.get('progress', {}).lessons || {};
  const done = (n) => !!lessons[n]?.done || (lessons[n]?.best ?? 0) >= 80;
  const total = course.length || 8;
  const count = course.filter((l) => done(l.n)).length;
  const next = course.find((l) => !done(l.n));

  const page = el_('div', 'page');
  const top = el_('header', 'topbar');
  top.append(el_('h1', null, 'Riffwerk'));

  const hero = el_('a', 'card hero');
  if (next) {
    hero.href = `#/kurs/${next.n}`;
    hero.append(el_('div', 'hero-label', 'Weiter lernen'), el_('div', 'hero-title', `Lektion ${next.n}: ${next.title}`));
  } else {
    hero.href = '#/lieder';
    hero.append(el_('div', 'hero-title', 'Alle Lektionen geschafft – spiel ein Lied'));
  }
  const bar = el_('div', 'progress');
  const fill = el_('div', 'progress-fill');
  fill.style.width = `${(count / total) * 100}%`;
  bar.append(fill);
  hero.append(bar, el_('div', 'hero-label', `${count} von ${total} geschafft`));

  const nav = el_('nav', 'tile-list');
  const tiles = [
    ['stimmen', '#/stimmen', 'Stimmen'],
    ['kurs', '#/kurs', `Kurs · ${count} von ${total}`],
    ['lieder', '#/lieder', 'Lieder'],
    ['import', '#/import', 'Guitar Pro laden'],
    ['einstellungen', '#/einstellungen', 'Einstellungen'],
  ];
  for (const [ic, href, label] of tiles) {
    const a = el_('a', 'tile');
    a.href = href;
    a.append(icon(ic), el_('span', null, label));
    nav.append(a);
  }
  page.append(top, hero, nav);
  el.append(page);
}
