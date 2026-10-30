import * as store from '../store.js';
import { loadCourse, STUFEN_TITEL } from '../music/course.js';

const h = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

function entry(song, best, onDelete) {
  const row = h('div', 'song-row');
  const a = h('a', 'tile song');
  a.href = `#/spielen/${encodeURIComponent(song.id)}`;
  const info = h('span', 'grow');
  info.append(h('div', 'song-title', song.title), h('div', 'muted small', song.artist || ''));
  const lvl = Math.min(3, Math.max(1, Number(song.level) || 1));
  const dots = h('span', 'dots', '●'.repeat(lvl) + '○'.repeat(3 - lvl));
  dots.setAttribute('aria-label', `Stufe ${lvl} von 3`);
  const sc = h('span', best != null ? 'badge hit' : 'badge muted', best != null ? `${Math.round(best)} %` : '');
  a.append(info, dots, sc);
  row.append(a);
  if (onDelete) {
    const del = h('button', 'btn del', '🗑');
    del.type = 'button';
    del.setAttribute('aria-label', `${song.title} löschen`);
    del.addEventListener('click', onDelete);
    row.append(del);
  }
  return row;
}

export async function render(el) {
  const progress = store.get('progress', {}).songs || {};
  let built = [];
  try { built = await (await fetch('data/songs/index.json')).json(); } catch (e) { console.error(e); }
  const { stufen } = await loadCourse();
  const stufeTitle = (k) => stufen.find((x) => x.stufe === k)?.title || STUFEN_TITEL[k - 1];
  const page = h('div', 'page');
  const top = h('header', 'topbar');
  const back = h('a', 'btn', '‹ Zurück');
  back.href = '#/';
  top.append(back, h('h1', null, 'Lieder'));
  page.append(top);

  // Einträge aus index.json zeigen, auch wenn die Liedatei noch fehlt (Spielansicht meldet das dann)
  for (const k of [...new Set(built.map((s) => s.stufe))].sort((x, y) => x - y)) {
    const name = stufeTitle(k);
    page.append(h('h2', 'section', name ? `Stufe ${k} · ${name}` : `Stufe ${k}`));
    const list = h('div', 'tile-list');
    for (const s of built.filter((x) => x.stufe === k)) list.append(entry(s, progress[s.id]?.best));
    page.append(list);
  }

  page.append(h('h2', 'section', 'Deine Lieder'));
  const l2 = h('div', 'tile-list');
  page.append(l2);
  const draw = () => {
    l2.textContent = '';
    const mine = store.get('importedSongs', []);
    if (!mine.length) {
      const c = h('div', 'card');
      c.append(h('p', null, 'Lade eine Guitar-Pro-Datei, um echte Lieder zu üben'));
      const b = h('a', 'btn btn-primary mt', 'Guitar Pro laden');
      b.href = '#/import';
      c.append(b);
      l2.append(c);
      return;
    }
    for (const s of mine) {
      l2.append(entry(s, progress[s.id]?.best, () => {
        if (!confirm('Lied löschen?')) return;
        store.set('importedSongs', store.get('importedSongs', []).filter((x) => x.id !== s.id));
        draw();
      }));
    }
  };
  draw();
  el.append(page);
}
