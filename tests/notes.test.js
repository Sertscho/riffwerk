import test from 'node:test';
import assert from 'node:assert/strict';
import { TUNING, midiToFreq, freqToMidi, noteName, centsOff, fretToMidi, nearestString } from '../js/music/notes.js';

test('Umrechnung und Namen', () => {
  assert.equal(midiToFreq(69), 440);
  assert.ok(Math.abs(freqToMidi(82.41) - 40) < 0.01);
  assert.equal(noteName(59), 'H');
  assert.equal(noteName(61), 'C#');
  assert.ok(Math.abs(centsOff(440 * 2 ** (10 / 1200), 69) - 10) < 1e-6);
  assert.equal(fretToMidi(6, 5), 45);
  assert.equal(fretToMidi(1, 0), 64);
});
test('Stimmung stimmt mit midi überein', () => {
  for (const t of TUNING) assert.ok(Math.abs(centsOff(t.freq, t.midi)) < 1);
});
test('nearestString', () => {
  const r = nearestString(111);
  assert.equal(r.string, 5);
  assert.equal(r.name, 'A');
  assert.ok(r.cents > 0 && r.cents < 20);
  assert.equal(nearestString(82.41).string, 6);
});
