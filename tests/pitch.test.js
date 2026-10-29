import test from 'node:test';
import assert from 'node:assert/strict';
import { TUNING, centsOff } from '../js/music/notes.js';
import { detectPitch, matchSingle } from '../js/audio/pitch.js';

const SR = 44100, N = 4096;
const sine = (f, a = 0.5) => Float32Array.from({ length: N }, (_, i) => a * Math.sin(2 * Math.PI * f * i / SR));
const saw = (f) => {
  const b = new Float32Array(N);
  for (let k = 1; k <= 10; k++) for (let i = 0; i < N; i++) b[i] += Math.sin(2 * Math.PI * f * k * i / SR) / k;
  return b.map((x) => x * 0.3);
};

for (const [name, gen] of [['Sinus', sine], ['Sägezahn', saw]]) {
  test(`Leersaiten ${name} ±3 Cent`, () => {
    for (const t of TUNING) {
      const r = detectPitch(gen(t.freq), SR);
      assert.ok(r, `${t.name} nicht erkannt`);
      assert.ok(Math.abs(centsOff(r.freq, t.midi) - centsOff(t.freq, t.midi)) < 3, `${t.name}: ${r.freq}`);
    }
  });
}
test('Stille und leises Rauschen -> null', () => {
  assert.equal(detectPitch(new Float32Array(N), SR), null);
  const noise = Float32Array.from({ length: N }, () => (Math.random() * 2 - 1) * 0.002);
  assert.equal(detectPitch(noise, SR), null);
});
test('matchSingle', () => {
  assert.ok(matchSingle(110, 45));
  assert.ok(matchSingle(220, 45));
  assert.ok(matchSingle(55, 45));
  assert.ok(!matchSingle(110 * 2 ** (1 / 12), 45));
  assert.ok(!matchSingle(null, 45));
});
