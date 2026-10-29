# Riffwerk – Plan

Status: [ ] offen · [x] abgenommen. Stufen: Light = Haiku, Medium = Sonnet, Careful = Sonnet (gründlich).

## 1. Gerüst — Light — keine Abhängigkeit  [x]
Ordner und Dateien laut SPEC „Architektur“ anlegen: index.html (Viewport mit viewport-fit=cover, Theme-Farbe, Manifest-Link, apple-mobile-web-app-capable), css/style.css mit allen Design-Tokens aus SPEC „Design“, js/app.js mit Hash-Router und Platzhalter-Views, store.js, manifest.webmanifest, sw.js (Cache-first für App-Dateien), einfaches Gitarrenkopf-Symbol als SVG + PNG 192/512, .claude/launch.json (`python3 -m http.server 8000`). Prüfen: Server starten, alle Routen öffnen, keine Konsolenfehler.

## 2. Musik- und Audio-Kern — Medium — nach 1  [x]
notes.js, song.js, pitch.js (YIN, Schwelle 0.15, Bereich 70–1200 Hz), chroma.js, mic.js. Tests in tests/ mit erzeugten Signalen (Sinus + Sägezahn mit Obertönen, 44.1 kHz) für alle 6 Leersaiten (±3 Cent), Stille → null, Akkord-Match für E5, Em, Am, C positiv und gegenseitig negativ. Prüfen: `node --test`. mic.js unterstützt `?testton=` (siehe SPEC).

## 3. Inhalte: Lieder + Kurs — Medium — nach 1  [x]
data/songs/erster-riff.json, garagen-rock.json, house-of-the-rising-sun.json und data/course.json (8 Lektionen laut SPEC, je Text, Griffbild-Daten {string,fret,finger}, Übung = Liste von Ereignissen oder Lied-ID). Musikalisch sinnvoll, für Anfänger spielbar, ca. 16–32 Takte pro Lied. Test: alle Dateien erfüllen das Liedformat (Validator aus song.js oder eigener Test).

## 4. Stimmgerät-Ansicht — Medium — nach 2  [ ]
views/tuner.js: „Mikro starten“-Knopf, große Notenanzeige, Nadel −50…+50 Cent, Wortanzeige, 6 Saiten-Chips (erkannte leuchtet), Glättung über ~5 Frames. Prüfen: im Browser mit `?testton=110` usw.

## 5. Spielansicht (Highway) — Careful — nach 2, 3  [ ]
views/play.js mit Canvas (devicePixelRatio beachten), Warte- und Takt-Modus, Tempo, Loop A–B, Metronom, Latenz-Ausgleich, Trefferfenster, Ergebnis-Bildschirm (Treffer %, Sterne), Fortschritt speichern. Gleichmäßige 60 fps per requestAnimationFrame, Zeit aus AudioContext.currentTime. Querformat-Hinweis. Prüfen: mit `?testton=` springt der Warte-Modus weiter.

## 6. Kurs-, Lieder-, Start-, Einstellungs-Ansichten — Medium — nach 3  [ ]
home.js, course.js (Lektionsliste mit Häkchen, Lektionsseite mit SVG-Griffbild), songs.js (eingebaute + importierte Lieder), settings.js (Latenz, Metronom, Fortschritt zurücksetzen).

## 7. Guitar-Pro-Import — Medium — nach 2  [ ]
gp-import.js + views/import.js: Datei wählen, alphaTab 1.3.1 dynamisch laden, Spur wählen (Gitarrenspuren vorauswählen), Umwandlung (Tempo, Takte, Noten mit Saite/Bund; alphaTab-Saitennummern umrechnen), speichern. Test mit einer selbst erzeugten kleinen GP-Datei oder alphaTex.

## 8. Gesamttest — Orchestrator im Browser-Bereich — nach 4–7  [ ]
Alle Routen bei 375×812 und 812×375, Konsolenfehler, waagerechtes Scrollen, Stimmgerät + Highway mit `?testton=`. Screenshots.

## 9. Veröffentlichen — Light — nach 8 und Abnahme  [ ]
Repo Sertscho/riffwerk (öffentlich) anlegen, pushen, GitHub Pages (main, /) aktivieren, Beschreibung „🎸 https://sertscho.github.io/riffwerk/ – Gitarre lernen im Guitar-Hero-Stil“ und Homepage-Feld setzen, Live-URL prüfen.

Parallel möglich: 2 ∥ 3 · danach 4 ∥ 5 ∥ 6 ∥ 7.
