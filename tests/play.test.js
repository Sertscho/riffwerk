import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pxPerBeat, beatAt, eventTimes, isOnset, inWindow, isMissed, barStart, barEnd,
  loopTap, loopAdvance, percent, stars, improve,
} from '../js/play/logic.js';

test('Abstand pro Schlag', () => {
  assert.equal(pxPerBeat(100), 110);
  assert.equal(pxPerBeat(140), 110);
  assert.equal(pxPerBeat(150), 70);
});

test('Zeiten', () => {
  assert.equal(beatAt(1, 120), 2);
  assert.equal(beatAt(1, 120, 0.5), 1);
  assert.deepEqual(eventTimes({ bpm: 60, events: [{ beat: 0 }, { beat: 2 }] }, 0.5), [0, 4]);
});

test('Anschlag', () => {
  assert.equal(isOnset(0.05, 0.01), true);
  assert.equal(isOnset(0.05, 0.05), false);
  assert.equal(isOnset(0.005, 0), false);
});

test('Trefferfenster ±150 ms', () => {
  assert.equal(inWindow(1.14, 1), true);
  assert.equal(inWindow(0.86, 1), true);
  assert.equal(inWindow(1.16, 1), false);
  assert.equal(isMissed(1.16, 1), true);
  assert.equal(isMissed(1.14, 1), false);
});

test('Taktgrenzen', () => {
  assert.equal(barStart(5.5, 4), 4);
  assert.equal(barEnd(5.5, 4), 8);
  assert.equal(barEnd(4, 4), 8);
  assert.equal(barStart(-2, 4), 0);
});

test('Loop setzen, Sprung, löschen', () => {
  let l = { a: null, b: null };
  l = loopTap(l, 'A', 5.5, 4);
  assert.deepEqual(l, { a: 4, b: null });
  assert.equal(loopAdvance(l, 100, 60), 100); // ohne B kein Sprung
  l = loopTap(l, 'B', 9, 4);
  assert.deepEqual(l, { a: 4, b: 12 });
  assert.equal(loopAdvance(l, 11.9, 60), 11.9);
  assert.equal(loopAdvance(l, 12, 60), 4);
  assert.deepEqual(loopTap(l, 'A', 1, 4), { a: null, b: null });
});

test('Loop: B vor A und B allein', () => {
  assert.deepEqual(loopTap({ a: null, b: null }, 'B', 5, 4), { a: 0, b: 8 });
  assert.deepEqual(loopTap({ a: 8, b: null }, 'B', 1, 4), { a: 8, b: 12 });
  assert.deepEqual(loopTap({ a: 0, b: 4 }, 'B', 0, 4), { a: null, b: null });
});

test('Punkte und Sterne', () => {
  assert.equal(percent('wait', 8, 2, 10), 80);
  assert.equal(percent('beat', 8, 99, 10), 80);
  assert.equal(percent('wait', 0, 0, 10), 0);
  assert.deepEqual([49, 50, 69, 70, 89, 90].map(stars), [0, 1, 1, 2, 2, 3]);
});

test('Bestwert nur verbessern', () => {
  assert.deepEqual(improve(undefined, 60.4), { best: 60, isNew: true });
  assert.deepEqual(improve(80, 70), { best: 80, isNew: false });
  assert.deepEqual(improve(80, 90), { best: 90, isNew: true });
  assert.deepEqual(improve(undefined, 0), { best: 0, isNew: false });
});
