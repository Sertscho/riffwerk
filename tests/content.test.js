import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rd = p => JSON.parse(fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const songFiles = fs.readdirSync(new URL('../data/songs/', import.meta.url)).filter(f => f.endsWith('.json'));
const course = rd('data/course.json');
const BARS = { 'erster-riff': 16, 'garagen-rock': 24, 'house-of-the-rising-sun': 16 };

function checkPiece(p, label) {
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
    const bars = checkPiece(s, f);
    if (BARS[s.id]) assert.equal(bars, BARS[s.id]);
  });
}

test('alle drei Lieder vorhanden', () => {
  for (const id of Object.keys(BARS)) assert.ok(songFiles.includes(id + '.json'), id);
});

test('Kurs', () => {
  assert.deepEqual(course.map(l => l.n), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const l of course) {
    assert.ok(l.title && l.intro.length >= 2 && l.tips.length >= 2, 'Lektion ' + l.n);
    for (const d of l.diagrams) {
      assert.match(d.frets, /^[x0-9]{6}$/, d.name);
      assert.match(d.fingers, /^[x0-9]{6}$/, d.name);
    }
    const x = l.exercise;
    if (x.type === 'song') assert.ok(songFiles.includes(x.songId + '.json'), 'songId ' + x.songId);
    else if (x.type === 'events') checkPiece(x, 'Übung ' + l.n);
    else assert.equal(x.type, 'tuner');
  }
});

test('Lektionsbilder existieren und haben Text', () => {
  const course = JSON.parse(fs.readFileSync(new URL('../data/course.json', import.meta.url)));
  for (const l of course) for (const im of l.images || []) {
    assert.ok(fs.existsSync(new URL('../' + im.src, import.meta.url)), im.src);
    assert.ok(im.alt && im.caption, `Lektion ${l.n}: alt/caption fehlt`);
  }
});
