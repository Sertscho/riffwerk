import { loadScore, guitarTracks, scoreToSong } from '../music/gp-import.js';
import * as store from '../store.js';

export function render(el) {
  el.innerHTML = `
    <header class="topbar"><a class="btn" href="#/">‹ Zurück</a><h1>Guitar Pro laden</h1></header>
    <p class="card import-info"></p>
    <label class="btn btn-big import-pick">Datei wählen
      <input class="import-file" type="file" accept=".gp,.gp3,.gp4,.gp5,.gpx" hidden>
    </label>
    <p class="import-status" role="status"></p>
    <div class="card import-result" hidden>
      <h2 class="import-title"></h2>
      <p class="import-meta"></p>
      <div class="import-tracks"></div>
      <button class="btn btn-big import-save" type="button">Speichern und spielen</button>
    </div>`;
  el.querySelector('.import-info').textContent =
    'Lade eine Guitar-Pro-Datei (.gp, .gp3, .gp4, .gp5, .gpx) – z. B. von einer Tab-Seite. Das Lied bleibt nur auf deinem Handy.';
  const $ = (s) => el.querySelector(s);
  const status = $('.import-status');
  let score = null;
  let chosen = 0;

  $('.import-file').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    $('.import-result').hidden = true;
    status.textContent = 'Lese Datei …';
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      score = await loadScore(bytes);
    } catch (e) {
      score = null;
      status.textContent = /Internet/.test(e.message)
        ? e.message + ' Der erste Import braucht Internet.'
        : 'Die Datei konnte nicht gelesen werden. Ist sie eine Guitar-Pro-Datei?';
      console.error(e);
      return;
    }
    const tracks = guitarTracks(score);
    const usable = tracks.filter((t) => t.strings === 6);
    if (!usable.length) {
      status.textContent = 'Keine Gitarrenspur gefunden (nur 6-saitige Spuren).';
      return;
    }
    status.textContent = '';
    chosen = (tracks.find((t) => t.suggested) ?? usable[0]).index;
    $('.import-title').textContent = score.title || 'Importiertes Lied';
    $('.import-meta').textContent = `${score.artist || 'Unbekannt'} · ${Math.round(score.tempo)} BPM`;
    const box = $('.import-tracks');
    box.textContent = '';
    for (const t of tracks) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn import-track';
      b.disabled = t.strings !== 6;
      b.textContent = t.name + (t.strings !== 6 ? ' (nicht 6-saitig)' : t.suggested ? ' – Vorschlag' : '');
      b.dataset.index = t.index;
      b.setAttribute('aria-pressed', String(t.index === chosen));
      b.addEventListener('click', () => {
        chosen = t.index;
        box.querySelectorAll('.import-track').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      });
      box.append(b);
    }
    $('.import-result').hidden = false;
  });

  $('.import-save').addEventListener('click', () => {
    try {
      const song = scoreToSong(score, chosen);
      store.set('importedSongs', [...store.get('importedSongs', []), song]);
      location.hash = '#/spielen/' + song.id;
    } catch (e) {
      status.textContent = e.message;
    }
  });
}
