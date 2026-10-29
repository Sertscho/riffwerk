// Spektrum -> 12 Tonklassen, Akkord-Vergleich (ohne DOM)
const MIN_HZ = 70, MAX_HZ = 1500;

export function chromaFromSpectrum(dbSpectrum, sampleRate, fftSize, minDb = -100) {
  const chroma = new Float32Array(12);
  const binHz = sampleRate / fftSize;
  // Nur Spektrumspitzen, Frequenz parabolisch verfeinert: bei tiefen Tönen ist ein Bin
  // breiter als ein Halbton, sonst würde Energie in Nachbar-Tonklassen auslaufen.
  for (let k = Math.max(1, Math.ceil(MIN_HZ / binHz)); k < dbSpectrum.length - 1 && k * binHz <= MAX_HZ; k++) {
    const db = dbSpectrum[k];
    if (!(db > minDb) || db < dbSpectrum[k - 1] || db <= dbSpectrum[k + 1]) continue;
    const a = dbSpectrum[k - 1], c = dbSpectrum[k + 1];
    const den = a - 2 * db + c;
    const off = den ? (0.5 * (a - c)) / den : 0;
    const pc = ((Math.round(69 + 12 * Math.log2(((k + off) * binHz) / 440)) % 12) + 12) % 12;
    chroma[pc] += Math.pow(10, db / 10);
  }
  const max = Math.max(...chroma);
  if (max > 0) for (let i = 0; i < 12; i++) chroma[i] /= max;
  return chroma;
}

export function matchChord(chroma, pitchClasses, threshold = 0.35, minShare = 0.7) {
  const need = Math.ceil((pitchClasses.length * 2) / 3);
  const present = pitchClasses.filter((pc) => chroma[pc] >= threshold).length;
  let total = 0, exp = 0;
  for (let i = 0; i < 12; i++) total += chroma[i];
  for (const pc of pitchClasses) exp += chroma[pc];
  const score = pitchClasses.length ? present / pitchClasses.length : 0;
  return { hit: present >= need && total > 0 && exp / total >= minShare, score };
}
