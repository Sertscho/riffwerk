// Liedformat prüfen und Zeiten rechnen (ohne DOM)
import { fretToMidi } from './notes.js';

export const TECHS = ['h', 'p', 's', 'b', 'pm'];

export function validateSong(obj) {
  const err = [];
  if (!obj || typeof obj !== 'object') return ['Lied ist kein Objekt.'];
  if (typeof obj.id !== 'string' || !obj.id) err.push('id fehlt oder ist kein Text.');
  if (typeof obj.title !== 'string' || !obj.title) err.push('title fehlt oder ist kein Text.');
  if (!(typeof obj.bpm === 'number' && obj.bpm >= 20 && obj.bpm <= 400)) err.push('bpm muss zwischen 20 und 400 liegen.');
  if (!Number.isInteger(obj.beatsPerBar) || obj.beatsPerBar < 1) err.push('beatsPerBar muss eine ganze Zahl ab 1 sein.');
  if (!Array.isArray(obj.events) || obj.events.length === 0) {
    err.push('events darf nicht leer sein.');
    return err;
  }
  let last = -Infinity;
  obj.events.forEach((e, i) => {
    const n = `Ereignis ${i + 1}`;
    if (!e || typeof e.beat !== 'number' || !isFinite(e.beat)) err.push(`${n}: beat fehlt.`);
    else {
      if (e.beat < last) err.push(`${n}: beat ist nicht aufsteigend.`);
      last = e.beat;
    }
    if (!(typeof e?.dur === 'number' && e.dur > 0)) err.push(`${n}: dur muss größer als 0 sein.`);
    if (!Array.isArray(e?.notes) || e.notes.length === 0) err.push(`${n}: notes darf nicht leer sein.`);
    else e.notes.forEach((x, j) => {
      if (!Number.isInteger(x?.string) || x.string < 1 || x.string > 6) err.push(`${n}, Note ${j + 1}: string muss 1 bis 6 sein.`);
      if (!Number.isInteger(x?.fret) || x.fret < 0 || x.fret > 24) err.push(`${n}, Note ${j + 1}: fret muss 0 bis 24 sein.`);
      if (x?.tech !== undefined && !TECHS.includes(x.tech)) err.push(`${n}, Note ${j + 1}: tech muss h, p, s, b oder pm sein.`);
      if (x?.bend !== undefined && (x.tech !== 'b' || ![1, 2].includes(x.bend))) err.push(`${n}, Note ${j + 1}: bend (1 oder 2) nur bei tech "b".`);
    });
  });
  return err;
}

export const beatToSec = (beat, bpm, tempo = 1) => (beat * 60) / (bpm * tempo);
export const eventMidis = (event) => event.notes.map((n) => fretToMidi(n.string, n.fret) + (n.bend || 0));
export const eventPitchClasses = (event) =>
  [...new Set(eventMidis(event).map((m) => m % 12))].sort((a, b) => a - b);
export const songDurationBeats = (song) => Math.max(0, ...song.events.map((e) => e.beat + e.dur));
