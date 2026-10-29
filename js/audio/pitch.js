// YIN-Tonhöhenerkennung (ohne DOM)
import { centsOff } from '../music/notes.js';

const THRESHOLD = 0.15, MIN_HZ = 70, MAX_HZ = 1200, MIN_RMS = 0.01;

export function detectPitch(buf, sampleRate) {
  const n = buf.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += buf[i] * buf[i];
  if (Math.sqrt(sum / n) < MIN_RMS) return null;

  const tauMax = Math.min(Math.floor(sampleRate / MIN_HZ), n >> 1);
  const tauMin = Math.max(2, Math.floor(sampleRate / MAX_HZ));
  const w = n - tauMax;
  const d = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let s = 0;
    for (let i = 0; i < w; i++) { const x = buf[i] - buf[i + tau]; s += x * x; }
    d[tau] = s;
  }
  // kumulativ normierte Differenz
  const cm = new Float32Array(tauMax + 1);
  cm[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= tauMax; tau++) { run += d[tau]; cm[tau] = run ? (d[tau] * tau) / run : 1; }

  let tau = -1;
  for (let t = tauMin; t < tauMax; t++) {
    if (cm[t] < THRESHOLD) {
      while (t + 1 < tauMax && cm[t + 1] < cm[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) return null;

  // parabolische Interpolation
  let better = tau;
  if (tau > 1 && tau < tauMax) {
    const a = cm[tau - 1], b = cm[tau], c = cm[tau + 1];
    const den = a - 2 * b + c;
    if (den !== 0) better = tau + (a - c) / (2 * den);
  }
  return { freq: sampleRate / better, clarity: 1 - cm[tau] };
}

export function matchSingle(freq, midi, toleranceCents = 50) {
  if (!freq) return false;
  return [0, 12, -12].some((o) => Math.abs(centsOff(freq, midi + o)) <= toleranceCents);
}
