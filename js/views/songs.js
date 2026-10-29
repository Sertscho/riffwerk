import * as store from '../store.js';

const BUILTIN = ['erster-riff', 'garagen-rock', 'house-of-the-rising-sun'];
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
  const built = [];
  for (const id of BUILTIN) {
    try { built.push(await (await fetch(`data/songs/${id}.json`)).json()); } catch (e) { console.error(e); }
  }
  const page = h('div', 'page');
  const top = h('header', 'topbar');
  const back = h('a', 'btn', '‹ Zurück');
  back.href = '#/';
  top.append(back, h('h1', null, 'Lieder'));
  page.append(top);

  page.append(h('h2', 'section', 'Übungslieder'));
  const l1 = h('div', 'tile-list');
  for (const s of built) l1.append(entry(s, progress[s.id]?.best));
  page.append(l1);

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
