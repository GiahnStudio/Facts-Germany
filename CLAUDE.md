# Tales in Ink — Moral-Geschichten im Ukiyo-e-Stil

Kanal von GIAHN (Antworten an ihn immer auf **Deutsch**). Die Videos selbst sind auf **Englisch**.
Ein Short pro Tag (9:16, 1080×1920, 45–75 s): eine Fabel / Parabel, am Ende eine Moral als gedrucktes Schild.
Plattformen: TikTok, Instagram (Reel), YouTube (Short) — alle über **Metricool**, Konto **ininktales@gmail.com**.
Die `blogId` nie raten: per `getBrandSettings` die Marke nehmen, in der der Tales-in-Ink-TikTok verbunden ist
(nie die alte Marke 7714006 „Who has more?“ von giahnstudio@gmail.com). Zeitzone: die der Marke (Berliner Zeit).

Dieser Branch (`tales-in-ink` im Repo GiahnStudio/Facts-Germany) ist ein eigener, verwaister Branch. Klonen immer nur ihn:
`git clone --depth 1 --branch tales-in-ink --single-branch https://github.com/GiahnStudio/facts-germany tii`

## Aufbau

| Pfad | Inhalt |
|---|---|
| `engine/` | geteilter Holzschnitt-Motor (aus der Lemo-Opuscar-Bibliothek, MIT): `print.js` (Papier, Blöcke, Bokashi, Siegel, Kartuschen), `nature.js` (Berg, Kiefer, Fels, Regen, Gänse), `traveler.js` (Wanderer-Figur, auch als Träger), `figures.js` (kniender Handwerker `cutter`, sitzender Fürst `lord`, Sänfte `palanquin`, das Gesicht `face` für Sonne/Wolke/Berg) + `fonts/` |
| `episodes/NNN-slug/` | eine Folge: `story.js` (Zeitleiste), `views.js` (die Drucke), `main.js` (Kamera, Schriftrolle, Untertitel, Titel, Moral, Sound-Events), `index.html`, `lines.json` (Sprecher), `cues.json` (Untertitel), `music/score.py`, `mix.py`, `TREATMENT.md`, `CREDITS`, `meta.json` |
| `episodes/001-the-stonecutter/` | **Referenzfolge** (vom Pilot, von GIAHN abgenommen). Neue Folgen starten als Kopie davon |
| `tools/setup.sh` | einmal pro Sitzung: Bibliothek nach `~/lemo-opuscar`, Pakete, Samples, ffmpeg 7+ |
| `tools/build.sh episodes/NNN-slug` | baut die Folge komplett → `out/NNN-slug.mp4` (Upload-Kopie, ~15 MB) |
| `out/` | Upload-Kopien, öffentlich über `https://raw.githubusercontent.com/GiahnStudio/facts-germany/tales-in-ink/out/NNN-slug.mp4` |
| `STORIES.md` | Geschichten-Ideen und Erledigt-Liste |
| `plan.json` | Veröffentlichungsplan: `[{ep, date, time, status, metricool_uuid}]` |

## Stil — fest (aus `~/lemo-opuscar/styles/ukiyoe/STYLE.md`, vor jeder Folge lesen)

- Jede Einstellung ist ein **ganzer Holzschnitt**: Washi-Papier, doppelter Tusche-Rand, flache Farbblöcke (leicht versetzt), schwarze Konturen, Bokashi-Himmel, rotes Siegel, senkrechte Titel-Kartusche (Kanji, `CART`/`SEALS` in main.js).
- Szenenwechsel = **Schriftrolle schiebt von rechts nach links**; neue Drucke werden **Block für Block gedruckt** (Hyōshigi-Klapper pro Block).
- Figuren 8 fps, Regen/Wasser 12 fps, Kamera flüssig. Kein 3D, keine Perspektive, keine Überblendungen.
- Musik nur aus der Palette: Shamisen (`pluck.py`), Shakuhachi, Taiko, Shime, Hyōshigi, Glocke. Mindestens eine echte Stille (*ma*) vor der Wende.
- Untertitel = cremefarbene Kartusche bei y≈1470 (oberhalb der Shorts/TikTok-Einblendungen), Schrift Shippori Mincho. Wichtige Handlung **nicht** zwischen y 1380 und 1880 legen.
- Erste 2 Sekunden: Hook (Geräusch + Bewegung + erster Satz ab ~0.9 s). Titel-Schild auf dem ersten Druck.
- Ende: Druck wäscht zurück zu Papier, Moral-Kartusche („THE MORAL“, 2 Zeilen groß + 1 Zeile klein) + Siegel, Sprecher liest die Moral.
- Nie berühmte Drucke kopieren (keine Große Welle, kein Roter Fuji), keine bekannten Figuren/Marken. Kein LemoLab-Abspann.

## Ablauf einer neuen Folge

1. `sh tools/setup.sh` und die ausgegebene `export`-Zeile ausführen. Bei Fehlern Ursache beheben, nicht abbrechen.
2. Geschichte aus `STORIES.md` → „Ideen“ wählen (Abwechslung: nicht zweimal hintereinander dieselbe Quelle/Tierart/Moral). Klassische Stoffe nur gemeinfrei und **in eigenen Worten** nacherzählt; nie Text aus Büchern/Webseiten übernehmen.
3. `cp -r episodes/001-the-stonecutter episodes/NNN-slug`, alte `voices/`, `poster.jpg`, `*.srt` löschen.
4. `TREATMENT.md` neu schreiben (3 Strukturen + Wahl, Logline, Shotliste, Beat-Sheet, Cue-Map, Sound-Tabelle) — eigene Bildidee, **nicht** den Stonecutter umfärben. Ein „native move“ des Stils an der emotionalen Spitze (siehe STYLE.md §8).
5. `lines.json`: 10–18 kurze Zeilen, Stimme `bm_george` (Speed 0.8–0.92), Zahlen ausgeschrieben, wörtliche Rede in Anführungszeichen. Letzte Zeile = Moral (steht in `NO_SUB` in story.js). Gesamt ≤ 75 s.
6. Stimme erzeugen (`cd $LIB && .venv/bin/python core/tts/tts.py <ep>/lines.json <ep>/voices`), dann **Zeiten in story.js aus `voices/dur.json` setzen** (Abstand ≥ 0.3 s, Untertitel ≥ max(1.8 s, Dauer + 0.6 s)). `cues.json` aus denselben Zeiten erzeugen (siehe build-Hinweis in 001).
7. `views.js`: neue Drucke (meist 4–6), wiederverwendbare Teile aus `engine/` nutzen, neue Figuren/Requisiten in `views.js` oder `figures.js` (dann auch nach `engine/figures.js` kopieren, abwärtskompatibel!). `main.js`: Titel, Kartuschen (`CART`, `SEALS`, `T.cart`), Kamera-Fahrten, Moral-Text, Events anpassen. Kamera: mind. 4 verschiedene Bewegungen (Schieben, Push, Tilt, Pull/harter Schnitt).
8. `music/score.py` (Cue-Abschnitt unten neu, Instrument-Rezepte oben behalten) und `mix.py` (Ambience-Typen/Events) anpassen.
9. Probe-Standbilder: `cd $LIB && node core/render/still.mjs <ep> 1 5 10 … --size 1080x1920`, mit `core/render/sheet.py` zu einem Kontaktbogen kacheln und **ansehen** (Read). Prüfen: Figuren groß genug und lesbar, nichts unter den Untertiteln, keine leeren Frames, Text nicht abgeschnitten, Gesichter/Augenbrauen richtig. Fehler in einer Runde beheben.
10. `sh tools/build.sh episodes/NNN-slug`. Danach Kontaktbogen vom fertigen Video (1 Bild / 3 s) ansehen, Lautheit ist −14 LUFS (mux.sh meldet sie), `blackdetect` darf nichts finden.
11. `meta.json` schreiben (Vorlage 001): `title` (≤ 70 Zeichen, mit Emoji + „| A Japanese Fable“ o. ä.), `caption` (Hook-Frage + 1 Satz + Hashtags: immer `#talesinink #moralstories #fable #ukiyoe #shorts` + 2–3 passende), `tiktok_title`, `youtube_tags`.
12. `STORIES.md` aktualisieren, committen (Message mit `[skip ci]`), auf `tales-in-ink` pushen (vorher `git pull --rebase`).

## Einplanen in Metricool

- Vorher `getBrandSettings`: Meldet es „doesn't have any social network connected“ oder fehlt `tiktokData`, ist TikTok in Marke 7942950 **nicht** verbunden (die Meldung ist korrekt — am 07.11. scheiterte deshalb der erste Post mit „TikTok was disconnected“). Dann nichts einplanen, GIAHN bitten, TikTok hier zu verbinden: https://app.metricool.com/brands/connections?blogId=7942950 (angemeldet als ininktales@gmail.com). Liefert getBrandSettings die alte Marke 7714006, ist der Connector mit dem falschen Konto verbunden → nichts einplanen, GIAHN melden.
- Richtige Marke: `blogId` **7942950** (Konto ininktales@gmail.com). TikTok `who.has.more1` nie verwenden.
- **Vorerst nur TikTok** (GIAHNs Entscheidung, Metricool-Gratistarif): `providers` = nur tiktok, nur `tiktokData`. Instagram/YouTube erst einplanen, wenn GIAHN das freigibt und diese Zeile hier geändert ist. Fehlende Netze also NICHT als Problem melden.
- Ein Post pro Folge, täglich **18:00 Europe/Madrid**, nächster freier Tag (Plan in `plan.json` + `getScheduledPosts` prüfen; nie zwei Folgen am selben Tag). Die zwei alten „Who has more“-Entwürfe (#whohasmore) nie anfassen.
- `createScheduledPost` mit `media` = Raw-GitHub-URL aus `out/`, `providers` = (später) tiktok, instagram, youtube, `text` = caption,
  `tiktokData` {privacyOption PUBLIC_TO_EVERYONE, title, isAigc true}, `instagramData` {type REEL, showReelOnFeed true, isAiGenerated true},
  `youtubeData` {title, type short, privacy public, madeForKids false, category FILM_ANIMATION, tags, isAiGeneratedContent false}. Kein Thumbnail-Feld.
- Danach `plan.json` ergänzen (`status: "scheduled"`, `metricool_uuid`). Metricool speichert das Video selbst; `out/`-Dateien von Folgen, die schon veröffentlicht sind und älter als 3 Tage, löschen (Repo klein halten).
- Posts mit Status ERROR (`getScheduledPosts`, Tales-in-Ink-Posts) → nichts Neues einplanen, GIAHN die Fehlermeldung schicken.

## Puffer

Ziel: 3 eingeplante Folgen im Voraus. Liegen schon ≥ 3 Folgen mit Datum > heute in `plan.json`, keine neue bauen — nur Status prüfen und kurz melden.
