# Riffwerk – Lehrplan Stufe 1–4 (40 Lektionen)

Zielgruppe: absoluter Anfänger, E-Gitarre mit Verstärker, Rock. Texte Deutsch, Du-Form klein („du“), kurz, ermutigend.
Nummern sind global und fest (Fortschritt hängt daran). Stufe 1 (1–8) existiert schon.

## Dateiformat
`data/course/<stufe>.json`:
```json
{ "stufe": 2, "title": "Akkorde und Rhythmus", "intro": "Ein Satz, worum es in der Stufe geht.",
  "lessons": [ { "n": 9, "title": "…", "intro": ["…"], "tips": ["…"], "diagrams": [], "images": [], "exercise": {} } ] }
```
- `diagrams`: Akkord `{name, frets, fingers}` (6 Zeichen von tiefer E bis hoher e, „x“ = nicht spielen) oder Tonleiter `{type: "scale", name, startFret, notes: [{string, fret, root?: true}]}`.
- `images`: `{src: "images/<datei>.svg", caption, alt}` – nur die unten genannten Dateien.
- `exercise`: `{type:"song", songId}` oder `{type:"events", bpm, beatsPerBar, events}` (4–8 Takte, Liedformat).

## Liedformat-Erweiterung (Techniken)
Note: `{string, fret, tech?, bend?}`. `tech`: `"h"` Hammer-on, `"p"` Pull-off, `"s"` Slide (auf diese Note hin), `"b"` Bending (`bend`: 1 = halber, 2 = ganzer Ton; `fret` ist der gegriffene Bund, erkannt wird fret + bend), `"pm"` Palm Mute. h/p/s brauchen keinen neuen Anschlag. Shuffle: Achtel als Triolen notieren (Schläge x und x + 0.667).

## Stufe 2 · Akkorde und Rhythmus (9–18), Datei 2.json
| n | Titel | Inhalt | Übung |
|---|---|---|---|
| 9 | Der G-Akkord | G 320003 / Finger 320004; Finger steil, jede Saite prüfen | events: G ganze Noten, 8 Takte, 60 bpm |
| 10 | D und A | D xx0232/xx0132, A x02220/x01230 | events: D–A je 1 Takt, 8 Takte, 60 |
| 11 | E-Dur und der Wechsel E–A | E 022100/023100 | events: E–A halbe Noten, 8 Takte, 65 |
| 12 | Die Ein-Minuten-Methode | Akkordwechsel zählen, Finger gemeinsam bewegen; G–C (C x32010/x32010) | events: G–C halbe, 8 Takte, 60 |
| 13 | Viertel-Anschlag und Metronom | nur Abschläge auf jeden Schlag, Metronom in den Einstellungen | events: Em–G–D–C Viertel, 8 Takte, 70 |
| 14 | Achtel: Ab und Auf | Pendel-Hand, Auf auf dem „und“ | events: G–D Achtel, 8 Takte, 70 |
| 15 | Pausen und Stopps | Greifhand lockern = Stopp; Pausen gehören zum Rhythmus | events mit Pausen, A–D, 8 Takte, 75 |
| 16 | Das Lagerfeuer-Muster | Ab, Ab-Auf, Auf-Ab-Auf | events: G–D–Em–C, 8 Takte, 75 |
| 17 | Lied: Lagerfeuer-Rock | alles aus Stufe 2 | song `lagerfeuer-rock` |
| 18 | Lied: Straßenhymne | A–D–E mit Achteln | song `strassenhymne` |

## Stufe 3 · Rock-Techniken (19–30), Datei 3.json
| n | Titel | Inhalt | Bild | Übung |
|---|---|---|---|---|
| 19 | Power-Chords auf der A-Saite | A5 x02xxx, C5 x35xxx, D5 x57xxx; Grundton wechselt Saite | – | events: E5–A5–C5–D5, 8 Takte, 80 |
| 20 | Drei-Ton-Power-Chords | G5 355xxx/134xxx, A5 577xxx/134xxx; Oktave dazu = fetter | – | events: G5–A5, 8 Takte, 80 |
| 21 | Palm Mute | Handkante am Steg, „chugga“-Sound | anschlag.svg, palm-mute.svg | events: E5 Achtel pm, 8 Takte, 90 |
| 22 | Chug-Riffs | Palm Mute + offene Akzente | palm-mute.svg | events: E5 pm-Achtel mit offenen G5/A5, 8 Takte, 95 |
| 23 | Lied: Garagen-Chug | Palm-Mute-Riff | – | song `garagen-chug` |
| 24 | Hammer-on | Ton ohne Anschlag durch Aufschlagen des Fingers | hammer-on.svg | events: G-Saite 0→2 h, D 0→2 h, 8 Takte, 70 |
| 25 | Pull-off | Finger seitlich abziehen | pull-off.svg | events: 2→0 p auf G und D, 8 Takte, 70 |
| 26 | Slides | Finger bleibt gedrückt und rutscht | slide.svg | events: A-Saite 5→7 s, 8 Takte, 70 |
| 27 | Lied: Legato-Riff | h, p, s gemischt | – | song `legato-riff` |
| 28 | Bending | Saite mit 3 Fingern hochschieben bis zum Zielton | bend.svg | events: G-Saite Bund 7 bend 2 (Ziel = Bund 9), 8 Takte, 60 |
| 29 | Vibrato und saubere Pausen | Ton „singen“ lassen, ungespielte Saiten abdämpfen | – | events: lange Noten H-Saite, 8 Takte, 70 |
| 30 | Lied: Vollgas | 3-Ton-Power-Chords + Palm Mute | – | song `vollgas` |

## Stufe 4 · Solo und Blues (31–40), Datei 4.json
| n | Titel | Inhalt | Bild | Übung |
|---|---|---|---|---|
| 31 | Die Rock-Tonleiter | A-Moll-Pentatonik Box 1 ab Bund 5 (Bünde 5/8 auf E,A,D,G,H,e; 5/7 auf A,D,G); scale-Diagramm, Grundton A markiert | – | events: Tonleiter auf und ab, 8 Takte, 70 |
| 32 | Pentatonik-Licks | drei kurze Licks | – | events, 8 Takte, 75 |
| 33 | Bending in der Pentatonik | G-Saite Bund 7 → 9, H-Saite 8 → 10 | bend.svg | events, 8 Takte, 65 |
| 34 | Lied: Erstes Solo | Solo in A-Moll | – | song `erstes-solo` |
| 35 | Der 12-Takt-Blues | A5–D5–E5 Schema (4 A, 2 D, 2 A, 1 E, 1 D, 2 A) | – | events: 12 Takte Power-Chords Viertel, 80 |
| 36 | Shuffle | Boogie A5/A6: Saite 5 Bund 0 + Saite 4 Bund 2 ↔ 4, Triolen-Gefühl | – | events, 8 Takte, 80 |
| 37 | Lied: Blues-Shuffle in A | 12-Takt-Shuffle ×2 | – | song `blues-shuffle` |
| 38 | Der Barré-Griff: F-Dur | F 133211/134211; Zeigefinger als Barré | barre.svg | events: F ganze, 8 Takte, 55 |
| 39 | Hm und verschiebbare Barrés | Hm x24432/x13421, G 355433/134211 | barre.svg | events: G–Hm, 8 Takte, 60 |
| 40 | Lied: Riffwerk-Hymne | Abschluss: Power-Chords, Palm Mute, Pentatonik-Lick | – | song `riffwerk-hymne` |

## Neue Lieder (alle eigene Kompositionen, artist „Riffwerk“, keine bekannten Songs nachbauen)
| id | Titel | bpm | Takte | Stufe/level | Inhalt |
|---|---|---|---|---|---|
| lagerfeuer-rock | Lagerfeuer-Rock | 90 | 16 | 2 | G–D–Em–C, Lagerfeuer-Muster |
| strassenhymne | Straßenhymne | 100 | 16 | 2 | A–D–E, Achtel |
| garagen-chug | Garagen-Chug | 110 | 16 | 3 | E5 pm-Achtel, Akzente G5/A5/C5 offen |
| legato-riff | Legato-Riff | 90 | 16 | 3 | Einzeltöne mit h/p/s auf A/D/G-Saite |
| vollgas | Vollgas | 120 | 24 | 3 | 3-Ton-Power-Chords + pm |
| erstes-solo | Erstes Solo | 80 | 16 | 3 | A-Moll-Pentatonik Box 1, 1 Bending |
| blues-shuffle | Blues-Shuffle in A | 90 | 24 | 3 | 12-Takt ×2, Shuffle-Boogie |
| riffwerk-hymne | Riffwerk-Hymne | 110 | 32 | 3 | Power-Chords, pm, Pentatonik-Lick, Schluss lang |

## Neue Bilder (Stil wie images/greifhand-seite.svg: Hautfarbe #f0c09a/#c98a62, Griffbrett #3a281d, Text #f3eee8, Akzent #e10600, viewBox 340×≈220)
palm-mute.svg, hammer-on.svg, pull-off.svg, slide.svg, bend.svg, barre.svg
