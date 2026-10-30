import * as store from '../store.js';
import { loadCourse } from '../music/course.js';

const NS = 'http://www.w3.org/2000/svg';
const h = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const s = (tag, attrs, text) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text != null) e.textContent = text;
  return e;
};

// frets/fingers: 6 Zeichen, Index 0 = Saite 6 (tiefe E); 'x' = nicht spielen
function diagram(d) {
  const svg = s('svg', { viewBox: '0 0 200 190', class: 'chord', role: 'img', 'aria-label': `Griffbild ${d.name}` });
  const X = (i) => 30 + i * 28;
  const frets = [...d.frets];
  const nums = frets.filter((c) => /\d/.test(c) && c !== '0').map(Number);
  const start = nums.length && Math.min(...nums) > 2 ? Math.min(...nums) : 1;
  svg.append(s('text', { x: 100, y: 16, class: 'chord-name', 'text-anchor': 'middle' }, d.name));
  for (let r = 0; r <= 5; r++) {
    svg.append(s('line', { x1: X(0), x2: X(5), y1: 50 + r * 24, y2: 50 + r * 24, class: r === 0 && start === 1 ? 'nut' : 'fret' }));
  }
  if (start > 1) svg.append(s('text', { x: 4, y: 66, class: 'chord-fret' }, `${start}.`));
  frets.forEach((c, i) => {
    svg.append(s('line', { x1: X(i), x2: X(i), y1: 50, y2: 170, stroke: `var(--s${6 - i})`, class: 'string' }));
    if (c === 'x') svg.append(s('text', { x: X(i), y: 42, class: 'chord-mark', 'text-anchor': 'middle' }, 'x'));
    else if (c === '0') svg.append(s('text', { x: X(i), y: 42, class: 'chord-mark', 'text-anchor': 'middle' }, 'o'));
    else {
      const cy = 50 + (Number(c) - start + 0.5) * 24;
      svg.append(s('circle', { cx: X(i), cy, r: 10, class: 'dot' }));
      const f = d.fingers?.[i];
      if (f && /\d/.test(f)) svg.append(s('text', { x: X(i), y: cy + 5, class: 'dot-text', 'text-anchor': 'middle' }, f));
    }
  });
  return svg;
}

// Tonleiter: notes [{string, fret, root?}], string 6 = tiefe E links; Grundton rot mit weißem Rand
function scaleDiagram(d) {
  const notes = d.notes || [];
  const start = Math.max(1, d.startFret || 1);
  const rows = Math.max(5, ...notes.map((n) => n.fret - start + 1));
  const bottom = 50 + rows * 24;
  const svg = s('svg', { viewBox: `0 0 200 ${bottom + 20}`, class: 'chord', role: 'img', 'aria-label': `Tonleiter ${d.name}` });
  const X = (str) => 30 + (6 - str) * 28;
  svg.append(s('text', { x: 100, y: 16, class: 'chord-name', 'text-anchor': 'middle' }, d.name));
  for (let r = 0; r <= rows; r++) {
    svg.append(s('line', { x1: X(6), x2: X(1), y1: 50 + r * 24, y2: 50 + r * 24, class: r === 0 && start === 1 ? 'nut' : 'fret' }));
  }
  for (let r = 0; r < rows; r++) {
    svg.append(s('text', { x: 4, y: 50 + r * 24 + 17, class: 'chord-fret' }, String(start + r)));
  }
  for (let str = 1; str <= 6; str++) {
    svg.append(s('line', { x1: X(str), x2: X(str), y1: 50, y2: bottom, stroke: `var(--s${str})`, class: 'string' }));
  }
  for (const n of notes) {
    const cy = n.fret === 0 ? 38 : 50 + (n.fret - start + 0.5) * 24;
    svg.append(s('circle', { cx: X(n.string), cy, r: 10, class: n.root ? 'dot-root' : 'dot-note' }));
  }
  return svg;
}

export async function render(el, params) {
  const { stufen, lessons: course } = await loadCourse();
  const prog = store.get('progress', {}).lessons || {};
  const page = h('div', 'page');
  el.append(page);

  const lesson = params.n === undefined ? null : course.find((l) => String(l.n) === params.n);
  if (params.n !== undefined && !lesson) {
    location.hash = '#/kurs';
    return;
  }

  if (!lesson) {
    const top = h('header', 'topbar');
    const back = h('a', 'btn', '‹ Zurück');
    back.href = '#/';
    top.append(back, h('h1', null, 'Kurs'));
    const isDone = (l) => !!prog[l.n]?.done || (prog[l.n]?.best ?? 0) >= 80;
    page.append(top);
    stufen.forEach((st, k) => {
      const count = st.lessons.filter(isDone).length;
      const prev = stufen[k - 1];
      // Empfehlung, keine Sperre: ab 6 geschafften Lektionen der vorigen Stufe "offen"
      const open = !prev || prev.lessons.filter(isDone).length >= 6;
      page.append(h('h2', 'section', `Stufe ${st.stufe} · ${st.title}`));
      if (st.intro) page.append(h('p', 'para', st.intro));
      page.append(h('p', 'muted small', `${count} von ${st.lessons.length} geschafft`));
      if (!open) page.append(h('p', 'muted small', `🔒 Empfohlen nach Stufe ${prev.stufe}`));
      const list = h('nav', 'tile-list');
      for (const l of st.lessons) {
        const p = prog[l.n];
        const a = h('a', 'tile');
        a.href = `#/kurs/${l.n}`;
        const done = isDone(l);
        const right = h('span', done ? 'badge hit' : 'badge muted', done ? '✓' : p?.best != null ? `${Math.round(p.best)} %` : '');
        a.append(h('span', 'num', l.n), h('span', 'grow', l.title), right);
        list.append(a);
      }
      page.append(list);
    });
    return;
  }

  const top = h('header', 'topbar');
  const back = h('a', 'btn', '‹ Zurück');
  back.href = '#/kurs';
  top.append(back, h('h1', null, `Lektion ${lesson.n}`));
  page.append(top, h('h2', 'lesson-title', lesson.title));
  for (const p of lesson.intro || []) page.append(h('p', 'para', p));
  for (const im of lesson.images || []) {
    const fig = h('figure', 'lesson-img');
    const img = h('img');
    img.src = im.src;
    img.alt = im.alt;
    img.loading = 'lazy';
    fig.append(img, h('figcaption', null, im.caption));
    page.append(fig);
  }
  if (lesson.tips?.length) {
    const card = h('div', 'card');
    card.append(h('strong', null, 'Tipps'));
    const ul = h('ul', 'tips');
    for (const t of lesson.tips) ul.append(h('li', null, t));
    card.append(ul);
    page.append(card);
  }
  if (lesson.diagrams?.length) {
    const wrap = h('div', 'chords');
    for (const d of lesson.diagrams) wrap.append(d.type === 'scale' ? scaleDiagram(d) : diagram(d));
    page.append(wrap);
  }

  const ex = lesson.exercise || {};
  const [href, label] = ex.type === 'tuner' ? ['#/stimmen', 'Gitarre stimmen']
    : ex.type === 'song' ? [`#/spielen/${ex.songId}`, 'Lied spielen']
    : [`#/spielen/lektion-${lesson.n}`, 'Übung starten'];
  const go = h('a', 'btn btn-primary btn-big', label);
  go.href = href;
  page.append(go);
  if (course.some((l) => l.n === lesson.n + 1)) {
    const nx = h('a', 'btn btn-big', 'Nächste Lektion ›');
    nx.href = `#/kurs/${lesson.n + 1}`;
    page.append(nx);
  }
}
