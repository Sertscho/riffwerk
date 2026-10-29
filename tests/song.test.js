import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSong, beatToSec, eventMidis, eventPitchClasses, songDurationBeats } from '../js/music/song.js';

const ok = () => ({ id: 'x', title: 'X', bpm: 100, beatsPerBar: 4, events: [
  { beat: 0, dur: 1, notes: [{ string: 6, fret: 0 }, { string: 5, fret: 2 }] },
  { beat: 1, dur: 2, notes: [{ string: 4, fret: 5 }] }] });

test('gültiges Lied', () => assert.deepEqual(validateSong(ok()), []));
test('kaputte Lieder', () => {
  const bad = [
    (s) => { s.id = 1; }, (s) => { delete s.title; }, (s) => { s.bpm = 10; }, (s) => { s.bpm = 500; },
    (s) => { s.beatsPerBar = 2.5; }, (s) => { s.beatsPerBar = 0; }, (s) => { s.events = []; },
    (s) => { s.events[1].beat = -1; }, (s) => { s.events[0].dur = 0; },
    (s) => { s.events[0].notes[0].string = 7; }, (s) => { s.events[0].notes[0].fret = 25; },
    (s) => { s.events[0].notes[0].fret = 1.5; }, (s) => { s.events[0].notes = []; },
  ];
  for (const f of bad) { const s = ok(); f(s); assert.ok(validateSong(s).length > 0, String(f)); }
  assert.ok(validateSong(null).length > 0);
});
test('Zeiten und Töne', () => {
  assert.equal(beatToSec(4, 120), 2);
  assert.equal(beatToSec(4, 120, 0.5), 4);
  const e = ok().events[0];
  assert.deepEqual(eventMidis(e), [40, 47]);
  assert.deepEqual(eventPitchClasses({ notes: [{ string: 6, fret: 0 }, { string: 4, fret: 2 }, { string: 6, fret: 12 }] }), [4]);
  assert.equal(songDurationBeats(ok()), 3);
});
