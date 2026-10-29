import { startInput } from '../audio/mic.js';
import { detectPitch } from '../audio/pitch.js';
import { TUNING, nearestString, centsOff } from '../music/notes.js';

const NS = 'http://www.w3.org/2000/svg';
const CX = 140, CY = 140, R = 120;
const median = (a) => [...a].sort((x, y) => x - y)[a.length >> 1];
const pt = (cents, r) => {
  const a = Math.PI * (1 - (cents + 50) / 100); // -50 links, +50 rechts
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
};
const arc = (c1, c2) => {
  const [x1, y1] = pt(c1, R), [x2, y2] = pt(c2, R);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}A${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};
const h = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const svg = (tag, attrs) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

export async function render(el) {
  let input = null, raf = 0, stopped = false;
  let locked = null; // gesperrte Saite (1..6) oder null
  const freqs = [];
  const done = new Set(); // Saiten mit ✓
  let lastValid = 0, okSince = 0, okString = 0;

  const page = h('div', 'page tuner');
  const top = h('header', 'topbar');
  const back = h('a', 'btn', '‹ Zurück');
  back.href = '#/';
  top.append(back, h('h1', '', 'Stimmen'));

  const start = h('div', 'tuner-start');
  const hint = h('p', 'muted center', 'Verstärker auf sauberen Klang, Handy nah an den Lautsprecher.');
  const err = h('p', 'tuner-err center');
  err.hidden = true;
  const btn = h('button', 'btn btn-primary btn-big', 'Mikro starten');
  btn.type = 'button';
  start.append(hint, err, btn);

  const live = h('div', 'tuner-live');
  live.hidden = true;
  const note = h('div', 'tuner-note', '–');
  const sub = h('p', 'tuner-sub muted', 'Spiel eine Saite an');
  const gauge = svg('svg', { class: 'tuner-gauge', viewBox: '0 0 280 150', role: 'img', 'aria-label': 'Stimm-Nadel' });
  const track = svg('path', { class: 'tuner-track', d: arc(-50, 50) });
  const ok = svg('path', { class: 'tuner-ok', d: arc(-5, 5) });
  const needle = svg('line', { class: 'tuner-needle', x1: CX, y1: CY, x2: pt(0, R - 14)[0], y2: pt(0, R - 14)[1] });
  gauge.append(track, ok, needle, svg('circle', { class: 'tuner-hub', cx: CX, cy: CY, r: 7 }));
  const word = h('p', 'tuner-word', '');
  const chips = h('div', 'tuner-chips');
  const chipEls = {};
  for (const t of [...TUNING].reverse()) {
    const c = h('button', 'tuner-chip', t.name);
    c.type = 'button';
    c.addEventListener('click', () => {
      locked = locked === t.string ? null : t.string;
      freqs.length = 0;
      paintChips(0);
    });
    chipEls[t.string] = c;
    chips.append(c);
  }
  live.append(note, sub, gauge, word, chips);
  page.append(top, start, live);
  el.append(page);

  function paintChips(active) {
    for (const t of TUNING) {
      const c = chipEls[t.string];
      c.textContent = t.name + (done.has(t.string) ? ' ✓' : '');
      c.classList.toggle('active', t.string === active);
      c.classList.toggle('locked', t.string === locked);
      c.setAttribute('aria-pressed', t.string === locked);
    }
  }

  function setNeedle(cents) {
    const c = Math.max(-50, Math.min(50, cents));
    needle.style.transform = `rotate(${(c * 90) / 50}deg)`;
  }

  function idle() {
    note.textContent = '–';
    note.className = 'tuner-note';
    sub.textContent = 'Spiel eine Saite an';
    word.textContent = '';
    setNeedle(0);
    needle.classList.add('neutral');
    paintChips(0);
    okSince = 0;
    el.dataset.note = '';
    el.dataset.cents = '';
  }

  function frame(now) {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    const { time } = input.read();
    const p = detectPitch(time, input.sampleRate);
    if (p && p.clarity >= 0.85) {
      freqs.push(p.freq);
      if (freqs.length > 5) freqs.shift();
      lastValid = now;
    }
    if (!freqs.length || now - lastValid > 1000) {
      freqs.length = 0;
      idle();
      return;
    }
    const f = median(freqs);
    const s = locked || nearestString(f).string;
    const t = TUNING[s - 1];
    const cents = centsOff(f, t.midi);
    const r = Math.round(cents);
    note.textContent = t.name;
    sub.textContent = `${Math.round(f)} Hz · ${t.name}-Saite`;
    setNeedle(cents);
    needle.classList.remove('neutral');
    const good = Math.abs(cents) <= 5;
    note.className = 'tuner-note' + (good ? ' good' : '');
    word.className = 'tuner-word ' + (good ? 'good' : 'off');
    word.textContent = (r > 0 ? '+' : '') + r + ' Cent · ' +
      (good ? 'Passt' : cents < 0 ? 'Zu tief – Wirbel fester drehen' : 'Zu hoch – Wirbel lockern');
    if (good) {
      if (okString !== s || !okSince) { okString = s; okSince = now; }
      if (now - okSince > 1500) done.add(s);
    } else okSince = 0;
    paintChips(s);
    el.dataset.note = t.name;
    el.dataset.cents = String(r);
  }

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    err.hidden = true;
    try {
      input = await startInput();
    } catch (e) {
      err.textContent = e.message;
      err.hidden = false;
      btn.textContent = 'Nochmal versuchen';
      btn.disabled = false;
      return;
    }
    if (stopped) { input.stop(); return; }
    start.hidden = true;
    live.hidden = false;
    idle();
    raf = requestAnimationFrame(frame);
  });

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    input?.stop();
  };
}
