// Spielansicht: Rechnungen ohne DOM (Zeit, Fenster, Loop, Punkte)
import { beatToSec } from '../music/song.js';

export const WINDOW_SEC = 0.15;
export const MIN_RMS = 0.01;

export const pxPerBeat = (bpm) => (bpm > 140 ? 70 : 110);
export const beatAt = (sec, bpm, tempo = 1) => (sec * bpm * tempo) / 60;
export const eventTimes = (song, tempo = 1) => song.events.map((e) => beatToSec(e.beat, song.bpm, tempo));

// Anschlag: laut genug und deutlich lauter als vor 3 Frames
export const isOnset = (rms, prevRms, factor = 1.4) => rms > MIN_RMS && rms > factor * prevRms;

// Hammer-on, Pull-off und Slide klingen ohne neuen Anschlag: nur solche Ereignisse brauchen keinen Onset,
// sonst bliebe Legato im Warte-Modus unerkannt (die Hand schlägt die Saite nicht an).
export const needsOnset = (event) => !event.notes.every((n) => n.tech === 'h' || n.tech === 'p' || n.tech === 's');

// Takt-Modus: liegt die (um die Latenz verschobene) Erkennungszeit im Trefferfenster?
export const inWindow = (detectSec, evSec, win = WINDOW_SEC) => Math.abs(detectSec - evSec) <= win;
export const isMissed = (detectSec, evSec, win = WINDOW_SEC) => detectSec - evSec > win;

export const barStart = (beat, bpb) => Math.max(0, Math.floor(beat / bpb) * bpb);
export const barEnd = (beat, bpb) => (Math.floor(beat / bpb) + 1) * bpb;

// Loop-Knopf: ist schon ein Loop gesetzt, löscht jeder Tipp ihn; A setzt den Takt-Anfang, B das Takt-Ende
export function loopTap(loop, which, beat, bpb) {
  if (loop.a != null && loop.b != null) return { a: null, b: null };
  let { a, b } = loop;
  if (which === 'A') {
    a = barStart(beat, bpb);
    if (b != null && b <= a) b = null;
  } else {
    b = barEnd(beat, bpb);
    if (a == null) a = 0;
    if (b <= a) b = barEnd(a, bpb);
  }
  return { a, b };
}

// Zeit nach dem Loop-Sprung: am Ende B zurück auf Anfang A
export function loopAdvance(loop, sec, bpm, tempo = 1) {
  if (loop.a == null || loop.b == null || beatAt(sec, bpm, tempo) < loop.b) return sec;
  return beatToSec(loop.a, bpm, tempo);
}

// Warte-Modus: Treffer / (Treffer + Fehlversuche); Takt-Modus: Treffer / Ereignisse
export function percent(mode, hits, misses, total) {
  const d = mode === 'wait' ? hits + misses : total;
  return d > 0 ? (hits / d) * 100 : 0;
}
export const stars = (pct) => (pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0);

// Bestwert nur verbessern, nie verschlechtern
export function improve(oldBest, pct) {
  const p = Math.round(pct);
  const old = Number.isFinite(oldBest) ? oldBest : 0;
  return { best: Math.max(old, p), isNew: p > old };
}
