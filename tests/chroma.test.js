import test from 'node:test';
import assert from 'node:assert/strict';
import { midiToFreq } from '../js/music/notes.js';
import { chromaFromSpectrum, matchChord } from '../js/audio/chroma.js';

const SR = 44100, N = 4096;
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len;
    for (let i = 0; i < n; i += len) for (let k = 0; k < len / 2; k++) {
      const wr = Math.cos(a * k), wi = Math.sin(a * k);
      const u = i + k, v = i + k + len / 2;
      const xr = re[v] * wr - im[v] * wi, xi = re[v] * wi + im[v] * wr;
      re[v] = re[u] - xr; im[v] = im[u] - xi; re[u] += xr; im[u] += xi;
    }
  }
}
// Akkord aus Sägezähnen (Note-Name -> MIDI), Spektrum in dB
const M = { C: 0, E: 4, G: 7, A: 9, B: 11 };
const midi = (n) => M[n[0]] + 12 * (Number(n[1]) + 1);
function chromaOf(notes) {
  const re = new Float64Array(N), im = new Float64Array(N);
  for (const n of notes) {
    const f = midiToFreq(midi(n));
    for (let k = 1; k <= 10; k++) for (let i = 0; i < N; i++) re[i] += Math.sin(2 * Math.PI * f * k * i / SR) / k;
  }
  for (let i = 0; i < N; i++) re[i] *= 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1))) / notes.length;
  fft(re, im);
  const db = Float32Array.from({ length: N / 2 }, (_, k) => 20 * Math.log10(Math.hypot(re[k], im[k]) / N + 1e-12));
  return chromaFromSpectrum(db, SR, N);
}
const CH = {
  E5: ['E2', 'B2', 'E3'], Em: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'],
  Am: ['A2', 'E3', 'A3', 'C4', 'E4'], C: ['C3', 'E3', 'G3', 'C4', 'E4'],
};
const PC = { E5: [4, 11], Em: [4, 7, 11], Am: [9, 0, 4], C: [0, 4, 7] };
const cr = Object.fromEntries(Object.entries(CH).map(([k, v]) => [k, chromaOf(v)]));

test('Stille -> alles 0, normiert sonst auf 1', () => {
  assert.ok(chromaFromSpectrum(new Float32Array(2048).fill(-140), SR, N).every((x) => x === 0));
  assert.equal(Math.max(...cr.Am), 1);
});
test('jeder Akkord trifft sich selbst', () => {
  for (const k of Object.keys(CH)) assert.ok(matchChord(cr[k], PC[k]).hit, k);
});
test('keine falschen Treffer', () => {
  assert.ok(!matchChord(cr.Am, PC.C).hit, 'Am gegen C');
  assert.ok(!matchChord(cr.C, PC.Em).hit, 'C gegen Em');
  assert.ok(!matchChord(cr.E5, PC.Am).hit, 'E5 gegen Am');
});
