# Riffwerk – Spezifikation

Gitarre lernen im Guitar-Hero-Stil, kostenlos, als Web-App (PWA) fürs iPhone.
Nutzer: ein absoluter Anfänger mit E-Gitarre und Verstärker, spielt Rock.

## Ziele (MVP)
1. **Stimmgerät**: Standardstimmung (E2 82.41, A2 110.00, D3 146.83, G3 196.00, H/B3 246.94, E4 329.63 Hz). Saite wird automatisch erkannt, Anzeige in Cent mit Nadel und Wort („zu tief“, „passt“, „zu hoch“). „Passt“ bei ±5 Cent.
2. **Spielansicht (Highway)**: Querformat. 6 waagerechte Saiten (oben hohe e-Saite, unten tiefe E-Saite, wie in Tabs). Noten fliegen von rechts auf eine senkrechte Spiellinie links zu und zeigen die Bundzahl. Akkorde als Block mit Akkordname.
   - **Warte-Modus** (Standard für Anfänger): Das Band hält an der Note an, bis der richtige Ton erkannt wird.
   - **Takt-Modus**: läuft im Tempo; Tempo-Regler 60/80/100/120 %; Treffer/Fehler werden gezählt.
   - Abschnitt wiederholen (Loop A–B), Pause, Neustart. Metronom-Klick optional.
   - Latenz-Ausgleich (Einstellung in ms, Standard 80) und Trefferfenster ±150 ms.
3. **Tonerkennung**: Einzeltöne per YIN-Tonhöhenerkennung (Treffer, wenn der gespielte MIDI-Ton stimmt; Oktavfehler ±12 zählen als Treffer, weil verzerrte Gitarren oft die Oktave liefern). Akkorde per Chroma (Tonklassen aus der FFT): Treffer, wenn ≥ 2/3 der erwarteten Tonklassen deutlich vorhanden sind. Rauschschwelle, damit Stille kein Ton ist.
4. **Kurs** für absolute Anfänger, 8 Lektionen, je kurzer Text + Griffbild + Übung im Highway:
   1. Gitarre & Verstärker: Saitennamen, sauberer Klang (wenig Verzerrung zum Üben), Stimmen
   2. Leere Saiten: E, A, D anschlagen
   3. Erste Bünde auf der tiefen E-Saite (Bund 0, 3, 5, 7)
   4. Power-Chord E5 und A5
   5. Power-Chords verschieben: G5, D5 (→ Lied „Garagen-Rock“)
   6. Erste offene Akkorde: Em, Am
   7. Akkordwechsel: C, D, E, F-Mini (→ „House of the Rising Sun“)
   8. Anschlagmuster: Ab-Ab-Auf-Auf-Ab
   Fortschritt: Lektion gilt als geschafft ab 80 % Treffern.
5. **Lieder**: 3 eingebaute Übungslieder:
   - „Erster Riff“ (eigene Komposition, nur tiefe E-Saite, Bund 0–7, 90 BPM)
   - „Garagen-Rock“ (eigene Komposition, Power-Chords E5–G5–A5–D5, 100 BPM)
   - „House of the Rising Sun“ (traditionelles Volkslied, gemeinfrei; Arpeggio Am–C–D–F–Am–C–E, 6/8, 75 BPM). Nicht die Fassung der Animals nachbauen, sondern das Volkslied-Schema.
   Keine urheberrechtlich geschützten Lieder im Repo.
6. **Guitar-Pro-Import**: Datei (.gp, .gp3–.gp5, .gpx) wählen → alphaTab liest sie → Spur auswählen → wird ins eigene Liedformat umgewandelt und lokal gespeichert. So kann der Nutzer echte Rocklieder privat lernen.
7. **PWA**: Homescreen-Symbol, Vollbild, offline nutzbar (Service Worker), dunkles Design.

## Nicht-Ziele
Konten/Login, Server, Videos, Songkatalog, Linkshänder-Modus, andere Stimmungen, Android-Feinschliff, Bass.

## Stack
- Reines HTML/CSS/JavaScript (ES-Module), **kein Build-Schritt**, keine npm-Laufzeitabhängigkeiten.
- alphaTab **1.3.1** nur für den Import, per `<script>`/Import von `https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.3.1/dist/alphaTab.mjs` (wird erst beim Import geladen).
- Web Audio API: `getUserMedia` (echoCancellation, noiseSuppression, autoGainControl **aus**), `AnalyserNode` (fftSize 4096).
- Tests: `node --test tests/` (eingebauter Node-Testrunner, keine Pakete).
- Hosting: GitHub Pages, Repo `Sertscho/riffwerk` (öffentlich), Branch `main`, Ordner `/`. URL: https://sertscho.github.io/riffwerk/
- Alle Pfade relativ (die App liegt unter `/riffwerk/`).

## Architektur
```
index.html            Hülle, lädt js/app.js
js/app.js             Hash-Router: #/ #/stimmen #/kurs #/kurs/<n> #/lieder #/spielen/<id> #/import #/einstellungen
js/audio/mic.js       Mikrofon starten/stoppen, liefert Zeitsignal + Spektrum pro Frame
js/audio/pitch.js     YIN: (Float32Array, sampleRate) → {freq, clarity} | null  (reine Funktion)
js/audio/chroma.js    Spektrum → 12 Tonklassen; matchChord(chroma, erwarteteTonklassen) (reine Funktionen)
js/music/notes.js     Frequenz↔MIDI↔Notenname, Cent-Abweichung, (saite,bund)→MIDI, Stimmung
js/music/song.js      Liedformat laden/prüfen, Schlag→Sekunden, Ereignis-Suche nach Zeit
js/music/gp-import.js alphaTab-Score → Liedformat
js/store.js           localStorage: Fortschritt, Einstellungen, importierte Lieder (try/catch)
js/views/*.js         home, tuner, course, songs, play, import, settings – je export render(el, params)
css/style.css         Design-Tokens + Komponenten
data/songs/*.json     eingebaute Lieder
data/course.json      Lektionen
sw.js, manifest.webmanifest, icons/
tests/*.test.js
```

## Liedformat (JSON)
```json
{
  "id": "garagen-rock", "title": "Garagen-Rock", "artist": "Riffwerk",
  "bpm": 100, "beatsPerBar": 4,
  "events": [
    { "beat": 0, "dur": 1, "notes": [{ "string": 6, "fret": 0 }, { "string": 5, "fret": 2 }], "chord": "E5" }
  ]
}
```
`string`: 1 = hohe e-Saite … 6 = tiefe E-Saite. `beat`: Startzeit in Vierteln ab 0. `chord` optional. Ein Ereignis mit mehreren Noten wird per Chroma geprüft, sonst per YIN.

## Design
Dunkel, Rock/Verstärker-Gefühl, eigenständig (nicht Simply kopieren).
- Farben: Hintergrund `#121014`, Fläche `#1d1a20`, Text `#f3eee8`, gedämpft `#9b938c`, Akzent Amber `#ff9f1c`, Treffer `#3ddc84`, Fehler `#ff4d4d`.
- Saitenfarben (1→6): `#ff5c8a #ffb020 #ffe04d #4dd6a3 #4db8ff #b48cff`.
- Schrift: Systemschrift (`-apple-system, system-ui`), Zahlen tabellarisch. Große Ziele (min. 48 px), Safe-Area-Ränder.
- Start: Begrüßung, „Weiter lernen“-Karte (nächste Lektion), drei Kacheln: Stimmen, Kurs, Lieder.
- Spielansicht im Querformat; im Hochformat Hinweis „Handy drehen“.
- Mikrofon-Freigabe: erst nach Tipp auf „Mikro starten“ anfragen (iOS verlangt Nutzergeste), verständliche Meldung bei Ablehnung.

## Definition of Done (MVP)
- `node --test tests/` grün (Tonhöhe auf Sinus/Sägezahn ±3 Cent für alle 6 Leersaiten, Akkord-Match, Liedzeiten, GP-Umwandlung an Testdaten).
- Playwright mit Fake-Mikrofon (WAV-Dateien): Stimmgerät erkennt jede Leersaite; Highway im Warte-Modus springt nach dem richtigen Ton weiter.
- Alle Seiten auf 375×812 und 812×375 ohne Fehler in der Konsole und ohne waagerechtes Scrollen.
- Live auf GitHub Pages, Link in Repo-Beschreibung und Homepage-Feld.
