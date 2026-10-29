// Töne, Stimmung, Cent-Rechnung (ohne DOM)
export const TUNING = [
  { string: 1, name: 'e', midi: 64, freq: 329.63 },
  { string: 2, name: 'H', midi: 59, freq: 246.94 },
  { string: 3, name: 'G', midi: 55, freq: 196.0 },
  { string: 4, name: 'D', midi: 50, freq: 146.83 },
  { string: 5, name: 'A', midi: 45, freq: 110.0 },
  { string: 6, name: 'E', midi: 40, freq: 82.41 },
];
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H'];

export const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const freqToMidi = (f) => 69 + 12 * Math.log2(f / 440);
export const noteName = (midi) => NAMES[((Math.round(midi) % 12) + 12) % 12];
export const centsOff = (freq, midi) => 1200 * Math.log2(freq / midiToFreq(midi));
export const fretToMidi = (string, fret) => TUNING[string - 1].midi + fret;

export function nearestString(freq) {
  let best = null;
  for (const t of TUNING) {
    const cents = centsOff(freq, t.midi);
    if (!best || Math.abs(cents) < Math.abs(best.cents)) best = { string: t.string, name: t.name, cents };
  }
  return best;
}
