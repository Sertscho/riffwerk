import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateSong } from '../js/music/song.js';

const rd = p => JSON.parse(fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const songFiles = fs.readdirSync(new URL('../data/songs/', import.meta.url)).filter(f => f.endsWith('.json') && f !== 'index.json');
const index = rd('data/songs/index.json');
const RANGES = { 1: [1, 8], 2: [9, 18], 3: [19, 30], 4: [31, 40] };
// nur vorhandene Stufendateien (die späteren Stufen kommen nach und nach)
const stufen = [1, 2, 3, 4].filter(k => fs.existsSync(new URL(`../data/course/${k}.json`, import.meta.url))).map(k => rd(`data/course/${k}.json`));
const course = stufen.flatMap(s => s.lessons).sort((a, b) => a.n - b.n);
const BARS = { 'erster-riff': 16, 'garagen-rock': 24, 'house-of-the-rising-sun': 16 };

function checkPiece(p, label) {
  assert.deepEqual(validateSong({ id: 'x', title: 'x', ...p }), [], label + ' validateSong');
  assert.ok(p.bpm >= 20 && p.bpm <= 400, label + ' bpm');
  assert.ok(Number.isInteger(p.beatsPerBar) && p.beatsPerBar >= 1, label + ' beatsPerBar');
  assert.ok(p.events.length > 0, label + ' events');
  let prev = -Infinity, end = 0;
  const free = {}; // Saite -> Ende des letzten Tons
  for (const e of p.events) {
    assert.ok(e.beat >= prev, label + ' aufsteigend bei ' + e.beat);
    prev = e.beat;
    assert.ok(e.dur > 0, label + ' dur bei ' + e.beat);
    assert.ok(e.notes.length > 0, label + ' notes bei ' + e.beat);
    for (const n of e.notes) {
      assert.ok(Number.isInteger(n.string) && n.string >= 1 && n.string <= 6, label + ' string bei ' + e.beat);
      assert.ok(Number.isInteger(n.fret) && n.fret >= 0 && n.fret <= 24, label + ' fret bei ' + e.beat);
      assert.ok(e.beat >= (free[n.string] ?? 0) - 1e-9, label + ' Überlappung Saite ' + n.string + ' bei ' + e.beat);
      free[n.string] = e.beat + e.dur;
    }
    end = Math.max(end, e.beat + e.dur);
  }
  const bars = end / p.beatsPerBar;
  assert.equal(bars, Math.round(bars), label + ' ganze Taktzahl (' + bars + ')');
  return bars;
}

for (const f of songFiles) {
  test('Lied ' + f, () => {
    const s = rd('data/songs/' + f);
    assert.equal(s.id + '.json', f);
    for (const k of ['title', 'artist']) assert.ok(s[k], k);
    assert.ok([1, 2, 3].includes(s.level));
    assert.deepEqual(validateSong(s), []);
    const bars = checkPiece(s, f);
    if (BARS[s.id]) assert.equal(bars, BARS[s.id]);
  });
}

test('alle drei Lieder vorhanden', () => {
  for (const id of Object.keys(BARS)) assert.ok(songFiles.includes(id + '.json'), id);
});

test('Lieder-Index', () => {
  assert.equal(index.length, 11);
  assert.equal(new Set(index.map(s => s.id)).size, index.length);
  for (const s of index) {
    assert.ok(s.title && s.artist && [1, 2, 3, 4].includes(s.stufe) && [1, 2, 3].includes(s.level), s.id);
    if (songFiles.includes(s.id + '.json')) {
      const song = rd(`data/songs/${s.id}.json`);
      assert.deepEqual(validateSong(song), [], s.id);
      assert.equal(song.title, s.title);
    }
  }
  for (const f of songFiles) assert.ok(index.some(s => s.id + '.json' === f), f + ' fehlt im Index');
});

test('Kurs: Stufen und Nummern', () => {
  assert.ok(stufen.length >= 1);
  stufen.forEach(s => {
    const [lo, hi] = RANGES[s.stufe];
    assert.ok(s.title && s.intro, 'Stufe ' + s.stufe);
    assert.deepEqual(s.lessons.map(l => l.n), Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), 'Stufe ' + s.stufe);
  });
  assert.deepEqual(course.map(l => l.n), course.map((_, i) => i + 1));
});

test('Kurs: Lektionen', () => {
  for (const l of course) {
    assert.ok(l.title && l.intro.length >= 2 && l.tips.length >= 2, 'Lektion ' + l.n);
    for (const d of l.diagrams) {
      if (d.type === 'scale') {
        assert.ok(d.name && Number.isInteger(d.startFret) && d.startFret >= 1 && d.notes.length > 0, d.name);
        for (const n of d.notes) {
          assert.ok(Number.isInteger(n.string) && n.string >= 1 && n.string <= 6, d.name + ' string');
          assert.ok(Number.isInteger(n.fret) && n.fret >= 0, d.name + ' fret');
        }
      } else {
        assert.match(d.frets, /^[x0-9]{6}$/, d.name);
        assert.match(d.fingers, /^[x0-9]{6}$/, d.name);
      }
    }
    const x = l.exercise;
    if (x.type === 'song') assert.ok(index.some(s => s.id === x.songId), 'songId ' + x.songId);
    else if (x.type === 'events') checkPiece(x, 'Übung ' + l.n);
    else assert.equal(x.type, 'tuner');
  }
});

test('Lektionsbilder existieren und haben Text', () => {
  for (const l of course) for (const im of l.images || []) {
    assert.ok(fs.existsSync(new URL('../' + im.src, import.meta.url)), im.src);
    assert.ok(im.alt && im.caption, `Lektion ${l.n}: alt/caption fehlt`);
  }
});
