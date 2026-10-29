// Spielansicht (Highway): Canvas, Warte-/Takt-Modus, Loop, Ergebnis.
import * as store from '../store.js';
import { startInput } from '../audio/mic.js';
import { detectPitch, matchSingle } from '../audio/pitch.js';
import { chromaFromSpectrum, matchChord } from '../audio/chroma.js';
import { validateSong, beatToSec, eventMidis, eventPitchClasses } from '../music/song.js';
import {
  MIN_RMS, pxPerBeat, beatAt, eventTimes, isOnset, inWindow, isMissed,
  loopTap, loopAdvance, percent, stars, improve,
} from '../play/logic.js';

const BUILTIN = ['erster-riff', 'garagen-rock', 'house-of-the-rising-sun'];
const FADE_MS = 450;
const ARMED_MS = 500; // so lange nach einem Anschlag darf ein Treffer zählen
const HEADER = 56;

const h = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const btn = (cls, text, label) => {
  const b = h('button', cls, text);
  b.type = 'button';
  if (label) b.setAttribute('aria-label', label);
  return b;
};

async function loadSong(id) {
  try {
    if (BUILTIN.includes(id)) {
      const r = await fetch(`data/songs/${id}.json`);
      return r.ok ? await r.json() : null;
    }
    const m = /^lektion-(\d+)$/.exec(id);
    if (m) {
      const r = await fetch('data/course.json');
      if (!r.ok) return null;
      const lesson = (await r.json()).find((l) => l.n === Number(m[1]));
      const ex = lesson?.exercise;
      if (ex?.type !== 'events') return null;
      return { id, title: `Lektion ${lesson.n}`, bpm: ex.bpm, beatsPerBar: ex.beatsPerBar, events: ex.events };
    }
    return store.get('importedSongs', []).find((s) => s?.id === id) || null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function notFound(el, text) {
  const page = h('div', 'page');
  const card = h('div', 'card');
  card.append(h('p', null, text));
  const a = h('a', 'btn btn-primary mt', 'Zu den Liedern');
  a.href = '#/lieder';
  card.append(a);
  page.append(card);
  el.append(page);
}

function rr(c, x, y, w, hh, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + hh, r);
  c.arcTo(x + w, y + hh, x, y + hh, r);
  c.arcTo(x, y + hh, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export async function render(el, params) {
  const song = await loadSong(params.id);
  const errs = song ? validateSong(song) : ['nicht gefunden'];
  if (!song || errs.length) {
    notFound(el, song ? `Dieses Lied ist fehlerhaft: ${errs[0]}` : 'Dieses Lied wurde nicht gefunden.');
    return;
  }

  const lessonN = /^lektion-(\d+)$/.exec(song.id)?.[1];
  const backHash = lessonN ? `#/kurs/${lessonN}` : '#/lieder';
  const cs = getComputedStyle(document.documentElement);
  const css = (n) => cs.getPropertyValue(n).trim();
  const col = {
    strings: [1, 2, 3, 4, 5, 6].map((i) => css(`--s${i}`)),
    hit: css('--hit'), miss: css('--miss'), accent: css('--accent'), text: css('--text'), bg: css('--bg'),
  };
  const settings = { latencyMs: 80, metronome: false, ...store.get('settings', {}) };
  const latency = (Number(settings.latencyMs) || 0) / 1000;
  const free = new URLSearchParams(location.search).has('testton');
  const bpb = song.beatsPerBar;
  const ppb = pxPerBeat(song.bpm);

  // ---- Zustand ----
  let mode = 'wait', tempo = 1;
  let input = null, raf = 0, disposed = false;
  let phase = 'start'; // start | run | done
  let paused = false, runState = 'playing';
  let evs = [], t = 0, lastCtx = null, loop = { a: null, b: null }, loopUsed = false;
  let misses = 0, nextClick = 0;
  let streak = 0, wrongStreak = 0, wrongCounted = false, onsetOpen = false, onsetAt = 0, hist = [0, 0, 0];
  let doneShown = false;
  const tempoEff = () => (mode === 'wait' ? 1 : tempo);
  const beatSec = () => beatToSec(1, song.bpm, tempoEff());

  // ---- DOM ----
  const root = h('div', 'play');
  const canvas = h('canvas', 'play-canvas');
  const c2 = canvas.getContext('2d');
  const bar = h('header', 'play-bar');
  bar.hidden = true;
  const pauseBtn = btn('play-btn', '⏸', 'Pause');
  const title = h('span', 'play-title', song.title);
  const modeLbl = h('span', 'play-mode muted small');
  const counter = h('span', 'play-counter');
  const loopA = btn('play-btn play-loop', 'A', 'Loop-Anfang setzen');
  const loopB = btn('play-btn play-loop', 'B', 'Loop-Ende setzen');
  const restartBtn = btn('play-btn', '↻', 'Neustart');
  const closeBtn = btn('play-btn', '✕', 'Schließen');
  bar.append(pauseBtn, title, modeLbl, counter, loopA, loopB, restartBtn, closeBtn);
  const countEl = h('div', 'play-count');

  // Startbildschirm
  const start = h('div', 'play-screen play-start');
  const box = h('div', 'play-box');
  const modeRow = h('div', 'play-chips');
  const modeBtns = [['wait', 'Warte-Modus'], ['beat', 'Takt-Modus']].map(([k, label]) => {
    const b = btn('play-chip', label);
    b.dataset.k = k;
    return b;
  });
  modeRow.append(...modeBtns);
  const tempoRow = h('div', 'play-chips');
  const tempoBtns = [60, 80, 100, 120].map((p) => {
    const b = btn('play-chip', `${p} %`);
    b.dataset.k = p;
    return b;
  });
  tempoRow.append(...tempoBtns);
  const startBtn = btn('btn btn-primary btn-big', 'Mikro starten und los');
  const startErr = h('p', 'play-error');
  startErr.setAttribute('role', 'alert');
  const back = h('a', 'play-back', 'Zurück');
  back.href = backHash;
  box.append(h('h1', null, song.title), h('p', 'muted', song.artist || ''), modeRow, tempoRow, startBtn, startErr, back);
  start.append(box);

  // Pause, Ergebnis, Hochformat
  const pauseScr = h('div', 'play-screen play-pause');
  pauseScr.hidden = true;
  const resumeBtn = btn('btn btn-primary btn-big', 'Weiter');
  const pauseBox = h('div', 'play-box');
  pauseBox.append(h('p', 'play-big', 'Pause'), resumeBtn);
  pauseScr.append(pauseBox);
  const result = h('div', 'play-screen play-result');
  result.hidden = true;
  const orient = h('div', 'play-screen play-orient');
  orient.hidden = true;
  orient.append(h('p', 'play-big', 'Dreh dein Handy quer'), h('p', 'muted', 'Die Spielansicht läuft im Querformat.'));
  root.append(canvas, countEl, bar, start, pauseScr, result, orient);
  el.append(root);

  // ---- Start-Auswahl ----
  function syncChips() {
    modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === mode)));
    tempoBtns.forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.k) === Math.round(tempo * 100)));
      b.disabled = mode === 'wait';
    });
  }
  modeBtns.forEach((b) => b.addEventListener('click', () => { mode = b.dataset.k; syncChips(); }));
  tempoBtns.forEach((b) => b.addEventListener('click', () => { tempo = Number(b.dataset.k) / 100; syncChips(); }));
  syncChips();

  // ---- Ablauf ----
  function setup() {
    const secs = eventTimes(song, tempoEff());
    evs = song.events.map((e, i) => ({
      e, sec: secs[i], status: 'pending', at: 0,
      midis: eventMidis(e), pcs: eventPitchClasses(e), single: e.notes.length === 1,
    }));
    misses = 0;
    loop = { a: null, b: null };
    loopUsed = false;
    t = -(mode === 'wait' ? 2 : 3) * beatSec();
    nextClick = Math.ceil(beatAt(t, song.bpm, tempoEff()) - 1e-6);
    streak = wrongStreak = 0;
    wrongCounted = onsetOpen = false;
    hist = [0, 0, 0];
    lastCtx = null;
    paused = false;
    doneShown = false;
    phase = 'run';
    modeLbl.textContent = mode === 'wait' ? 'Warte-Modus' : `Takt-Modus · ${Math.round(tempo * 100)} %`;
    result.hidden = pauseScr.hidden = true;
    bar.hidden = false;
    syncUi();
  }

  async function begin() {
    startBtn.disabled = true;
    startErr.textContent = '';
    if (!input) {
      try {
        input = await startInput();
      } catch (e) {
        startErr.textContent = e.message || 'Mikrofon konnte nicht gestartet werden.';
        startBtn.disabled = false;
        return;
      }
      if (disposed) { input.stop(); return; }
    }
    start.hidden = true;
    setup();
  }
  startBtn.addEventListener('click', begin);

  function setPaused(p) {
    if (phase !== 'run' || paused === p) return;
    paused = p;
    lastCtx = null;
    nextClick = Math.ceil(beatAt(t, song.bpm, tempoEff()) - 1e-6);
    syncUi();
  }
  pauseBtn.addEventListener('click', () => setPaused(!paused));
  resumeBtn.addEventListener('click', () => setPaused(false));
  restartBtn.addEventListener('click', () => { if (phase !== 'start') setup(); });
  closeBtn.addEventListener('click', () => { location.hash = backHash; });

  function tapLoop(which) {
    if (phase !== 'run') return;
    loop = loopTap(loop, which, Math.max(0, beatAt(t, song.bpm, tempoEff())), bpb);
    if (loop.a != null) loopUsed = true;
    syncUi();
  }
  loopA.addEventListener('click', () => tapLoop('A'));
  loopB.addEventListener('click', () => tapLoop('B'));

  const mq = matchMedia('(orientation: portrait)');
  const onOrient = () => {
    orient.hidden = !mq.matches;
    if (mq.matches) setPaused(true);
    resize();
  };
  const onVis = () => { if (document.hidden) setPaused(true); };

  function syncUi() {
    pauseBtn.textContent = paused ? '▶' : '⏸';
    pauseBtn.setAttribute('aria-label', paused ? 'Fortsetzen' : 'Pause');
    pauseScr.hidden = !(paused && phase === 'run' && !mq.matches);
    loopA.setAttribute('aria-pressed', String(loop.a != null));
    loopB.setAttribute('aria-pressed', String(loop.b != null));
    loopA.title = loop.a != null ? `Takt ${loop.a / bpb + 1}` : '';
    loopB.title = loop.b != null ? `Takt ${loop.b / bpb}` : '';
  }

  // ---- Metronom ----
  function click(delay, accent) {
    const ac = input.ctx;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.value = accent ? 1500 : 1000;
    const at = ac.currentTime + Math.max(0, delay);
    g.gain.setValueAtTime(accent ? 0.5 : 0.28, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.03);
    o.connect(g).connect(ac.destination);
    o.start(at);
    o.stop(at + 0.03);
  }

  // ---- Zeit ----
  const firstPending = () => evs.findIndex((x) => x.status === 'pending');

  function resetFrom(beat) {
    for (const x of evs) if (x.e.beat >= beat) { x.status = 'pending'; x.at = 0; }
    streak = wrongStreak = 0;
  }

  function advance(dt, now) {
    t += dt;
    const te = tempoEff();
    const jumped = loopAdvance(loop, t, song.bpm, te);
    if (jumped !== t) {
      t = jumped;
      resetFrom(loop.a);
      nextClick = Math.ceil(beatAt(t, song.bpm, te) - 1e-6);
    }
    if (mode === 'wait') {
      const p = firstPending();
      if (p >= 0 && t >= evs[p].sec) { t = evs[p].sec; runState = 'waiting'; } else runState = 'playing';
    } else {
      runState = t < 0 ? 'countin' : 'playing';
      const bs = beatSec();
      if (settings.metronome) {
        while (nextClick * bs - t < 0.12) {
          if (nextClick * bs - t > -0.05) click(nextClick * bs - t, nextClick % bpb === 0);
          nextClick++;
        }
      }
      for (const x of evs) {
        if (x.status === 'pending' && isMissed(t - latency, x.sec)) { x.status = 'miss'; x.at = now; }
      }
    }
    if (firstPending() < 0 && t >= evs[evs.length - 1].sec + 0.5 + (mode === 'beat' ? latency : 0)) finish();
  }

  // ---- Erkennung ----
  function detect(now) {
    const { time, spectrum } = input.read();
    let sum = 0;
    for (let i = 0; i < time.length; i++) sum += time[i] * time[i];
    const rms = Math.sqrt(sum / time.length);
    const prev = hist.shift();
    hist.push(rms);
    if (isOnset(rms, prev)) { onsetOpen = true; onsetAt = now; wrongCounted = false; }
    // shortcut: Testton ohne Anschläge
    const armed = free || (onsetOpen && now - onsetAt < ARMED_MS);

    // erwartetes Ereignis
    let idx = -1;
    const p = firstPending();
    if (p >= 0) {
      if (mode === 'wait') {
        if (evs[p].sec - t <= beatSec()) idx = p;
      } else {
        const d = t - latency;
        for (let i = p; i < evs.length && evs[i].sec - d <= 0.15; i++) {
          if (evs[i].status === 'pending' && inWindow(d, evs[i].sec)) { idx = i; break; }
        }
      }
    }
    if (idx < 0 || rms < MIN_RMS || !armed) { streak = wrongStreak = 0; return; }

    const ev = evs[idx];
    let ok = false, wrong = false;
    if (ev.single) {
      const r = detectPitch(time, input.sampleRate);
      if (r && r.clarity >= 0.8) { ok = matchSingle(r.freq, ev.midis[0]); wrong = !ok; }
    } else {
      ok = matchChord(chromaFromSpectrum(spectrum, input.sampleRate, 4096), ev.pcs).hit;
    }
    if (ok) {
      wrongStreak = 0;
      if (++streak >= 2) {
        ev.status = 'hit';
        ev.at = now;
        streak = 0;
        onsetOpen = false;
      }
      return;
    }
    streak = 0;
    if (mode !== 'wait' || free || wrongCounted) return;
    // Fehlversuch: pro Anschlag höchstens einer
    if (ev.single) wrongStreak = wrong ? wrongStreak + 1 : 0;
    else wrongStreak = now - onsetAt >= 350 ? 2 : 0;
    if (wrongStreak >= 2) { misses++; wrongCounted = true; }
  }

  // ---- Ende ----
  function finish() {
    if (doneShown) return;
    doneShown = true;
    phase = 'done';
    bar.hidden = true;
    countEl.textContent = '';
    const hits = evs.filter((x) => x.status === 'hit').length;
    const pct = percent(mode, hits, misses, evs.length);
    result.textContent = '';
    const boxR = h('div', 'play-box');
    const n = stars(pct);
    boxR.append(
      h('h1', null, song.title),
      h('p', 'play-pct', `${Math.round(pct)} %`),
      h('p', 'play-stars', '★'.repeat(n) + '☆'.repeat(3 - n)),
      h('p', 'muted', mode === 'wait' ? `${hits} Treffer, ${misses} Fehlversuche` : `${hits} von ${evs.length} Noten`),
    );
    if (loopUsed) {
      boxR.append(h('p', 'muted', 'Mit Loop gespielt – zählt nicht für den Bestwert.'));
    } else {
      const progress = store.get('progress', {});
      const lessons = { ...(progress.lessons || {}) };
      const songs = { ...(progress.songs || {}) };
      const old = lessonN ? lessons[lessonN] : songs[song.id];
      const r = improve(old?.best, pct);
      if (lessonN) lessons[lessonN] = { best: r.best, done: r.best >= 80 || !!old?.done };
      else songs[song.id] = { best: r.best };
      store.set('progress', { ...progress, lessons, songs });
      if (r.isNew) boxR.append(h('p', 'play-new', 'Neuer Bestwert!'));
    }
    const again = btn('btn btn-primary btn-big', 'Nochmal');
    again.addEventListener('click', setup);
    const exit = h('a', 'btn btn-big', 'Zurück');
    exit.href = backHash;
    boxR.append(again, exit);
    result.append(boxR);
    result.hidden = false;
    pauseScr.hidden = true;
  }

  // ---- Zeichnen ----
  let W = 0, H = 0, dpr = 1, lineX = 0, top = 0, gap = 0;
  function resize() {
    const r = root.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    lineX = W * 0.18;
    top = HEADER + 34;
    gap = Math.max(10, (H - 28 - top) / 5);
  }
  const stringY = (s) => top + (s - 1) * gap;

  function draw(now) {
    c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2.clearRect(0, 0, W, H);
    const cur = beatAt(t, song.bpm, tempoEff());
    const xOf = (b) => lineX + (b - cur) * ppb;
    const y0 = stringY(1) - gap * 0.7, y1 = stringY(6) + gap * 0.7;

    // Taktstriche
    c2.font = '12px -apple-system, system-ui, sans-serif';
    c2.textAlign = 'left';
    c2.textBaseline = 'top';
    c2.lineWidth = 1;
    for (let k = Math.max(0, Math.floor((cur - lineX / ppb) / bpb)); xOf(k * bpb) < W; k++) {
      const x = xOf(k * bpb);
      c2.strokeStyle = 'rgba(243,238,232,0.14)';
      c2.beginPath(); c2.moveTo(x, y0); c2.lineTo(x, y1); c2.stroke();
      c2.fillStyle = 'rgba(243,238,232,0.3)';
      c2.fillText(String(k + 1), x + 4, y0 - 14);
    }
    // Saiten
    c2.lineWidth = 1.5;
    for (let s = 1; s <= 6; s++) {
      c2.strokeStyle = col.strings[s - 1];
      c2.globalAlpha = 0.5;
      c2.beginPath(); c2.moveTo(0, stringY(s)); c2.lineTo(W, stringY(s)); c2.stroke();
    }
    c2.globalAlpha = 1;
    // Spiellinie
    c2.save();
    c2.strokeStyle = col.accent;
    c2.lineWidth = 3;
    c2.shadowColor = col.accent;
    c2.shadowBlur = 10;
    c2.beginPath(); c2.moveTo(lineX, y0 - 6); c2.lineTo(lineX, y1 + 6); c2.stroke();
    c2.restore();

    // Noten
    const rad = Math.min(17, gap * 0.4);
    c2.textAlign = 'center';
    c2.textBaseline = 'middle';
    for (const x of evs) {
      const ex = xOf(x.e.beat);
      const len = x.e.dur * ppb;
      if (ex + len < -rad - 10 || ex > W + rad + 10) continue;
      let a = 1;
      if (x.status !== 'pending') a = 1 - (now - x.at) / FADE_MS;
      if (a <= 0) continue;
      c2.globalAlpha = a;
      const ys = x.e.notes.map((n) => stringY(n.string));
      const yMin = Math.min(...ys), yMax = Math.max(...ys);
      if (x.e.notes.length > 1) {
        c2.strokeStyle = 'rgba(243,238,232,0.55)';
        c2.lineWidth = 2;
        rr(c2, ex - rad - 5, yMin - rad - 5, rad * 2 + 10, yMax - yMin + rad * 2 + 10, rad);
        c2.stroke();
      }
      if (x.e.chord) {
        c2.fillStyle = col.text;
        c2.font = 'bold 15px -apple-system, system-ui, sans-serif';
        c2.fillText(x.e.chord, ex, yMin - rad - 14);
      }
      c2.font = `bold ${Math.round(rad * 1.0)}px -apple-system, system-ui, sans-serif`;
      for (const n of x.e.notes) {
        const y = stringY(n.string);
        const base = x.status === 'hit' ? col.hit : x.status === 'miss' ? col.miss : col.strings[n.string - 1];
        if (x.e.dur > 1) {
          c2.globalAlpha = a * 0.3;
          c2.fillStyle = base;
          rr(c2, ex, y - rad * 0.6, len, rad * 1.2, rad * 0.6);
          c2.fill();
          c2.globalAlpha = a;
        }
        c2.fillStyle = base;
        c2.beginPath(); c2.arc(ex, y, rad, 0, Math.PI * 2); c2.fill();
        c2.fillStyle = col.bg;
        c2.fillText(String(n.fret), ex, y + 1);
      }
    }
    c2.globalAlpha = 1;
  }

  // ---- Schleife ----
  let lastTxt = '';
  function frame() {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    if (phase === 'run' && !paused && input) {
      const ac = input.ctx;
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const cn = ac.currentTime;
      const dt = lastCtx == null ? 0 : Math.min(0.1, Math.max(0, cn - lastCtx));
      lastCtx = cn;
      advance(dt, now);
      if (phase === 'run') detect(now);
    }
    draw(now);

    const hits = evs.filter((x) => x.status === 'hit').length;
    const bad = mode === 'wait' ? misses : evs.filter((x) => x.status === 'miss').length;
    const txt = `✓ ${hits}  ✗ ${bad}`;
    if (txt !== lastTxt) { lastTxt = txt; counter.textContent = txt; }
    const cnt = phase === 'run' && !paused && runState === 'countin' ? String(Math.ceil(-t / beatSec() - 1e-6)) : '';
    if (countEl.textContent !== cnt) countEl.textContent = cnt;
    const idx = firstPending();
    window.__play = {
      index: idx < 0 ? evs.length : idx,
      hits,
      misses: bad,
      state: phase === 'run' ? (paused ? 'paused' : runState) : phase === 'done' ? 'done' : 'start',
    };
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVis);
  mq.addEventListener('change', onOrient);
  setup(); // Vorschau hinter dem Startbildschirm
  phase = 'start';
  bar.hidden = true;
  onOrient();
  syncUi();
  frame();

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    input?.stop();
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVis);
    mq.removeEventListener('change', onOrient);
    delete window.__play;
  };
}
