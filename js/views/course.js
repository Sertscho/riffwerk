import * as store from '../store.js';

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

export async function render(el, params) {
  let course = [];
  try { course = await (await fetch('data/course.json')).json(); } catch (e) { console.error(e); }
  const lessons = store.get('progress', {}).lessons || {};
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
    const list = h('nav', 'tile-list');
    for (const l of course) {
      const p = lessons[l.n];
      const a = h('a', 'tile');
      a.href = `#/kurs/${l.n}`;
      const done = p?.done || (p?.best ?? 0) >= 80;
      const right = h('span', done ? 'badge hit' : 'badge muted', done ? '✓' : p?.best != null ? `${Math.round(p.best)} %` : '');
      a.append(h('span', 'num', l.n), h('span', 'grow', l.title), right);
      list.append(a);
    }
    page.append(top, list);
    return;
  }

  const top = h('header', 'topbar');
  const back = h('a', 'btn', '‹ Zurück');
  back.href = '#/kurs';
  top.append(back, h('h1', null, `Lektion ${lesson.n}`));
  page.append(top, h('h2', 'lesson-title', lesson.title));
  for (const p of lesson.intro || []) page.append(h('p', 'para', p));
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
    for (const d of lesson.diagrams) wrap.append(diagram(d));
    page.append(wrap);
  }

  const ex = lesson.exercise || {};
  const [href, label] = ex.type === 'tuner' ? ['#/stimmen', 'Gitarre stimmen']
    : ex.type === 'song' ? [`#/spielen/${ex.songId}`, 'Lied spielen']
    : [`#/spielen/lektion-${lesson.n}`, 'Übung starten'];
  const go = h('a', 'btn btn-primary btn-big', label);
  go.href = href;
  page.append(go);
  if (lesson.n < course.length) {
    const nx = h('a', 'btn btn-big', 'Nächste Lektion ›');
    nx.href = `#/kurs/${lesson.n + 1}`;
    page.append(nx);
  }
}
