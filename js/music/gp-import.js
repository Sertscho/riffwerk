// alphaTab-Score → Riffwerk-Lied (ohne DOM). alphaTab wird nur beim Import vom CDN geladen.
import { validateSong } from './song.js';

const ALPHATAB_URL = 'https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.3.1/dist/alphaTab.mjs';
const TICKS_PER_QUARTER = 960; // alphaTab: MidiUtils.QuarterTime

let alphaTabPromise = null;

export async function loadScore(bytes) {
  alphaTabPromise ??= import(ALPHATAB_URL).catch((e) => {
    alphaTabPromise = null;
    throw new Error('Keine Internetverbindung: alphaTab konnte nicht geladen werden.', { cause: e });
  });
  const alphaTab = await alphaTabPromise;
  return alphaTab.importer.ScoreLoader.loadScoreFromBytes(bytes);
}

const staffOf = (track) => track.staves?.[0];
const stringCount = (track) => staffOf(track)?.tuning?.length ?? 0;

export function guitarTracks(score) {
  const list = score.tracks.map((t, index) => ({
    index,
    name: t.name || `Spur ${index + 1}`,
    strings: stringCount(t),
    percussion: !!staffOf(t)?.isPercussion,
  }));
  const pick = list.find((t) => t.strings === 6 && !t.percussion);
  return list.map(({ index, name, strings }) => ({ index, name, strings, suggested: index === pick?.index }));
}

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lied';

export function scoreToSong(score, trackIndex) {
  const track = score.tracks[trackIndex];
  if (!track) throw new Error('Spur nicht gefunden.');
  const staff = staffOf(track);
  if (!staff || staff.isPercussion || stringCount(track) !== 6) throw new Error('Nur 6-saitige Gitarrenspuren');
  const strings = 6;

  const title = (score.title || '').trim() || 'Importiertes Lied';
  const first = score.masterBars[0];
  const num = first?.timeSignatureNumerator || 4;
  const den = first?.timeSignatureDenominator || 4;
  const q = (ticks) => ticks / TICKS_PER_QUARTER;

  // shortcut: Wiederholungen werden nicht ausgeschrieben
  const events = [];
  for (const bar of staff.bars) {
    for (const beat of bar.voices[0]?.beats ?? []) {
      if (beat.isRest) continue;
      const notes = beat.notes
        .filter((n) => !n.isTieDestination && !n.isDead)
        // alphaTab: Saite 1 = tiefste → eigenes Schema: 1 = hohe e
        .map((n) => ({ string: strings - n.string + 1, fret: n.fret }));
      if (!notes.length) continue;
      events.push({
        beat: q(beat.absolutePlaybackStart),
        dur: Math.max(0.25, q(beat.playbackDuration)),
        notes,
      });
    }
  }

  const song = {
    id: `gp-${slug(title)}-${Date.now().toString(36)}`,
    title,
    artist: (score.artist || '').trim() || 'Unbekannt',
    bpm: Math.min(400, Math.max(20, Math.round(score.tempo || 120))),
    beatsPerBar: Math.max(1, Math.round((num * 4) / den)),
    events,
  };
  const errs = validateSong(song);
  if (errs.length) throw new Error('Lied unbrauchbar: ' + errs.join(' '));
  return song;
}
