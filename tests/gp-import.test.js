import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreToSong, guitarTracks } from '../js/music/gp-import.js';

const Q = 960;
const note = (string, fret, extra = {}) => ({ string, fret, isTieDestination: false, isDead: false, ...extra });
const beat = (startQ, durQ, notes, isRest = false) => ({ absolutePlaybackStart: startQ * Q, playbackDuration: durQ * Q, notes, isRest });
const staff = (tuning, beats, isPercussion = false) => ({ tuning, isPercussion, bars: [{ voices: [{ beats }] }] });
const E = [64, 59, 55, 50, 45, 40]; // alphaTab: hoch → tief, Note.string 1 = tiefste

const score = (st) => ({
  title: 'Test Lied', artist: '', tempo: 120.4,
  masterBars: [{ timeSignatureNumerator: 4, timeSignatureDenominator: 4 }],
  tracks: [{ name: 'Gitarre', staves: [st] }],
});

test('scoreToSong wandelt Beats, Saiten, Pausen und Bindungen um', () => {
  const s = scoreToSong(score(staff(E, [
    beat(0, 1, [note(1, 3)]),                       // tiefe E, Bund 3
    beat(1, 1, [note(2, 2), note(6, 0)]),           // A-Saite + hohe e
    beat(2, 1, [], true),                           // Pause
    beat(3, 1, [note(1, 3, { isTieDestination: true })]), // Bindung
    beat(4, 0.1, [note(3, 0)]),                     // zu kurz → 0.25
  ])), 0);
  assert.match(s.id, /^gp-test-lied-/);
  assert.equal(s.artist, 'Unbekannt');
  assert.equal(s.bpm, 120);
  assert.equal(s.beatsPerBar, 4);
  assert.deepEqual(s.events.map((e) => e.beat), [0, 1, 4]);
  assert.deepEqual(s.events[0].notes, [{ string: 6, fret: 3 }]);
  assert.deepEqual(s.events[1].notes, [{ string: 5, fret: 2 }, { string: 1, fret: 0 }]);
  assert.equal(s.events[2].dur, 0.25);
});

test('Taktart 6/8 ergibt 3 Schläge', () => {
  const sc = score(staff(E, [beat(0, 1, [note(1, 0)])]));
  sc.masterBars[0] = { timeSignatureNumerator: 6, timeSignatureDenominator: 8 };
  assert.equal(scoreToSong(sc, 0).beatsPerBar, 3);
});

test('4-saitige Spur wird abgelehnt', () => {
  const sc = score(staff([43, 38, 33, 28], [beat(0, 1, [note(1, 0)])]));
  assert.throws(() => scoreToSong(sc, 0), /6-saitige/);
  assert.equal(guitarTracks(sc)[0].suggested, false);
});

test('guitarTracks schlägt erste 6-saitige Spur ohne Schlagzeug vor', () => {
  const sc = score(staff(E, []));
  sc.tracks.unshift({ name: 'Drums', staves: [staff(E, [], true)] });
  assert.deepEqual(guitarTracks(sc).map((t) => t.suggested), [false, true]);
});
