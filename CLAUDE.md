# Riffwerk

Gitarren-Lern-PWA, reines HTML/CSS/JS (ES-Module), kein Build, keine npm-Pakete.

## Befehle
- Lokal starten: `python3 -m http.server 8000` → http://localhost:8000
- Tests: `node --test` (findet alle `tests/*.test.js`)
- Test ohne Gitarre: `?testton=110` an die URL hängen (mehrere Töne: `?testton=82.41,123.47,164.81`) – mic.js nimmt dann einen Oszillator statt des Mikrofons.

## Regeln
- Antworten und UI-Texte auf Deutsch.
- Alle Pfade relativ – die App läuft unter `/riffwerk/` auf GitHub Pages.
- Saite 1 = hohe e-Saite, 6 = tiefe E-Saite (wie in Tabs).
- Audio-Logik (pitch.js, chroma.js, notes.js, song.js) bleibt frei von DOM, damit `node --test` sie prüfen kann.
- localStorage-Zugriffe immer in try/catch (über js/store.js).
- Keine urheberrechtlich geschützten Lieder ins Repo.
- Neue/verschobene Dateien in `filemap.md` eintragen; nach jeder Änderung an App-Dateien die Cache-Version in `sw.js` erhöhen.

Details: `docs/SPEC.md`, Aufgaben: `docs/PLAN.md`, Dateien: `filemap.md`.
