# Tales in Ink — Moral-Geschichten im Ukiyo-e-Stil

Kanal von GIAHN (Antworten an ihn immer auf **Deutsch**). Die Videos selbst sind auf **Englisch**.
Ein Short pro Tag (9:16, 1080×1920, **61–66 s**, nie unter 61 s: TikTok-Monetarisierung): eine Fabel / Parabel als **gesungener Song (Suno)**, am Ende eine Moral als gedrucktes Schild.
**Seit 11.11.2026 (GIAHNs Entscheidung, ab Folge 007): jede Folge ist ein gesungener Suno-Song, das Bild wird auf den Gesang getimt — siehe Abschnitt „Der Song“.**
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
| `engine/film.js` | **generischer Film-Motor**: Schriftrolle, Kamera-Keyframes, Druck-Blöcke, Hook-Schild oben, Untertitel, Moral-Karte, Loop, Sound-Events. Eine Folge schreibt nur `story.js` (CFG) + `views.js` (Drucke); `main.js` ist 4 Zeilen |
| `episodes/008-the-wind-and-the-sun/` | **Vorlage** für neue Folgen (Song-Format: `song/`, `mix.py` mit Song-Modus, verlängerter Schluss). Neue Folgen starten als Kopie von 008 (007 ist die zweite Song-Folge). 002–006 sind das alte Sprecher-Format. 001 ist der alte Pilot (langes Format, eigener main.js) — nicht mehr als Vorlage nehmen |
| `tools/setup.sh` | einmal pro Sitzung: Bibliothek nach `~/lemo-opuscar`, Pakete, Samples, ffmpeg 7+ |
| `tools/song_timing.py episodes/NNN-slug` | Suno-Wortzeiten → `song/song.json` + `cues.json` |
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
- **TikTok-Format:** 61–66 s (seit 11.11.2026; vorher 35–45 s). Erstes Bild ist schon fertig gedruckt (`PRINT[0] = [0,0,0,0]`), Musik/Geräusch ab Frame 1, erster Satz ab 0.3 s.
- **Hook-Schild oben** (`CFG.HOOK`, 0–3 s, ≤ 2 kurze Zeilen, Spannung/Frage: „His only horse ran away. / Bad luck?“) + kleines Serien-Tag `Tales in Ink · Fable NN`.
- Sprecher kurz und dicht (8–11 Zeilen, Speed 0.85–0.95). Eine Stille (*ma*) von ~0.8 s vor der Wende.
- **Ende = Loop:** Druck wäscht zu Papier, Moral-Karte (`CFG.MORAL`, 1–2 große Zeilen + 1 kleine) + Siegel, Sprecher liest die Moral, dann `CFG.LOOP.cut` (~0.5 s vor Schluss) springt zurück auf das Eröffnungsbild mit Hook-Schild — das Video läuft nahtlos weiter.
- Nie berühmte Drucke kopieren (keine Große Welle, kein Roter Fuji), keine bekannten Figuren/Marken. Kein LemoLab-Abspann.

## Ablauf einer neuen Folge

1. `sh tools/setup.sh` und die ausgegebene `export`-Zeile ausführen. Bei Fehlern Ursache beheben, nicht abbrechen.
2. Geschichte aus `STORIES.md` → „Ideen“ wählen (Abwechslung: nicht zweimal hintereinander dieselbe Quelle/Tierart/Moral). Klassische Stoffe nur gemeinfrei und **in eigenen Worten** nacherzählt; nie Text aus Büchern/Webseiten übernehmen.
3. `cp -r episodes/008-the-wind-and-the-sun episodes/NNN-slug`, alte `voices/`, `song/*` (außer als Muster für lyrics.json), `poster.jpg`, `*.srt`, `cues.json`, `STATUS.md`, `stills/`, `out/` löschen. `mix.py` kennt schon viele Geräusche (hoof, neigh, thud, drip, croak, splash, tap, step, seal, …) und Ambiences (well, sea, earth, autumn, spring, quarry, cicada, rain, high, dusk) — bei Bedarf neue ergänzen.
4. `TREATMENT.md` neu schreiben (3 Strukturen + Wahl, Logline, Shotliste, Beat-Sheet, Cue-Map, Sound-Tabelle) — eigene Bildidee, **nicht** den Stonecutter umfärben. Ein „native move“ des Stils an der emotionalen Spitze (siehe STYLE.md §8).
5. `lines.json`: 10–18 kurze Zeilen, Stimme `bm_george` (Speed 0.8–0.92), Zahlen ausgeschrieben, wörtliche Rede in Anführungszeichen. Letzte Zeile = Moral (steht in `NO_SUB` in story.js). Gesamt ≤ 75 s.
6. Stimme erzeugen (`cd $LIB && .venv/bin/python core/tts/tts.py <ep>/lines.json <ep>/voices`), dann **Zeiten in story.js aus `voices/dur.json` setzen** (Abstand ≥ 0.3 s, Untertitel ≥ max(1.8 s, Dauer + 0.6 s)). `cues.json` aus denselben Zeiten erzeugen (siehe build-Hinweis in 001).
7. `story.js` (CFG: PRINT, CAM-Keyframes, CART/CARTTXT/SEALS (Kanji aus `engine/fonts/Yuji-sub.ttf`, ~400 gängige Zeichen; fehlt eins, ein anderes nehmen), HOOK, MORAL, LOOP, VO, extraEvents) und `views.js`: neue Drucke (meist 4), wiederverwendbare Figuren: `horse` (003), `frog`/`turtle` (002), `traveler` (Bauer, Soldat, Nachbar, auch liegend/fallend per rotate), `cutter`/`lord`/`face` (engine/figures.js). Kamera: mind. 4 verschiedene Bewegungen (Schieben, Push, Tilt, Pull/harter Schnitt). „Alternate impression“ (gleicher Druck, andere Jahreszeit/Farbe, wie 003 Herbst/Frühling) ist erlaubt und spart Zeit.
8. `music/score.py` (Cue-Abschnitt unten neu, Instrument-Rezepte oben behalten) und `mix.py` (Ambience-Typen/Events) anpassen.
9. Probe-Standbilder: `cd $LIB && node core/render/still.mjs <ep> 1 5 10 … --size 1080x1920`, mit `core/render/sheet.py` zu einem Kontaktbogen kacheln und **ansehen** (Read). Prüfen: Figuren groß genug und lesbar, nichts unter den Untertiteln, keine leeren Frames, Text nicht abgeschnitten, Gesichter/Augenbrauen richtig. Fehler in einer Runde beheben.
10. `sh tools/build.sh episodes/NNN-slug`. Danach Kontaktbogen vom fertigen Video (1 Bild / 3 s) ansehen, Lautheit ist −14 LUFS (mux.sh meldet sie), `blackdetect` darf nichts finden.
11. `meta.json` schreiben (Vorlage 001): `title` (≤ 70 Zeichen, mit Emoji + „| A Japanese Fable“ o. ä.), `caption` (Hook-Frage + 1 Satz + Hashtags: immer `#talesinink #moralstories #fable #ukiyoe #shorts` + 2–3 passende), `tiktok_title`, `youtube_tags`.
12. `STORIES.md` aktualisieren, committen (Message mit `[skip ci]`), auf `tales-in-ink` pushen (vorher `git pull --rebase`).

## Der Song (Pflicht seit Folge 007; Referenz: episodes/008-the-wind-and-the-sun)

Der Sprechertext (`lines.json` → Kokoro) wird weiter erzeugt, aber nur als **Uhr für das Bild**: `story.js` wird wie bisher nach `voices/dur.json` getimt.
Der fertige Film läuft auf dem Song: `engine/film.js` streckt jeden Sprecher-Block (L01…) auf den gesungenen Block mit derselben id, sobald `song/song.json` existiert; Untertitel kommen aus den Song-Zeiten.

1. **Songtext** `song/lyrics.json`: pro VO-id (L01…L10) eine `section` mit 1 gesungenen Zeile (höchstens 2), gleiche Reihenfolge und Aussage wie lines.json, gereimt, singbar, keine Anführungszeichen. Tags `[Verse 1]`, `[Verse 2]`, `[Chorus]`, `[Outro]`, am Ende `[End]`. Letzte Section = Moral (bleibt in `NO_SUB`). 10–12 Zeilen.
   Stil (für alle Folgen gleich, nie Künstlernamen): `japanese folk storytelling ballad, shamisen, shakuhachi flute, koto, soft taiko, warm clear male vocal, gentle and wise, crisp diction, 92 bpm, very short song, vocals start immediately`
2. **Suno** im eingebauten Browser auf GIAHNs PC (Skill built-in-browser lesen; GIAHN ist bei suno.com angemeldet): `https://suno.com/create` → Textfeld „Lyrics editor“ (klicken, Strg+A, Entf, tippen), „Styles“, „Song Title (Optional)“ = `Tales NNN - <Titel>`, **einmal** „Create song“ (ergibt 2 Fassungen, kostet Credits).
   Fertig-Abfrage und Wortzeiten per javascript_tool: Token `(document.cookie.match(/(?:^|; )__session=([^;]+)/)||[])[1]`, Header `Authorization: Bearer <token>`;
   `GET https://studio-api.prod.suno.com/api/feed/v2?page=0` (clips mit dem Titel, status `complete`), `GET …/api/gen/<id>/aligned_lyrics/v2/` → `aligned_words` [{word,start_s,end_s}] und `hoot_cer`.
   Fassung wählen: niedrigstes `hoot_cer`. Ein Vorspiel vor dem ersten Wort ist egal (wird abgeschnitten). Wortzeiten kompakt zurückgeben und als `song/aligned_raw.json` speichern (`[[wort mit '|' statt Zeilenumbruch, start, ende], …]`), `song/clip.json` = `{"clip": "<id>", "clip_dur": <Dauer>}`.
3. **WAV holen (ohne Downloads-Ordner, alles in EINEM Tab):** `POST …/api/gen/<id>/convert_wav/`, `GET …/api/gen/<id>/wav_file/` abfragen bis `wav_file_url` da ist, Datei laden und in `window.name` parken (`'SONG:' + btoa(binärstring)`), denselben Tab auf `https://github.com/GiahnStudio/engraved-bestiary/upload/media` navigieren (privates Repo; zweiter Tab oder window.open funktionieren nicht), dort aus `window.name` ein `File` bauen, in `input[type=file]` setzen, `change` auslösen, ~20 s warten, „Commit changes“ klicken. Dateiname `tales-NNN-slug-song.wav`. Im Arbeitsbereich: Repo engraved-bestiary anhängen, `git fetch origin media`, `git show origin/media:tales-NNN-slug-song.wav > <ep>/song/song.wav` (ist hier git-ignoriert). Genaue JS-Schnipsel: AGENTS.md in engraved-bestiary, Abschnitt „The song“, Punkt 5.
4. `python3 tools/song_timing.py episodes/NNN-slug` → `song/song.json` + `cues.json`. CHECK-Zeilen lesen: jede Zeile muss richtig gehört worden sein.
5. **Länge ≥ 61 s:** `node core/render/events.mjs` meldet die Filmdauer. Liegt sie unter 61,5 s, in `story.js` `DUR` und `LOOP.cut` um die fehlenden Sekunden erhöhen (die Moral-Karte steht dann länger, der Song klingt darunter aus); wäre die Karte länger als ~10 s zu sehen, lieber 1–2 Songzeilen mehr schreiben und neu erzeugen.
6. Standbilder **in Song-Zeit** prüfen, dann bauen: `SKIP_TTS=1 sh tools/build.sh episodes/NNN-slug` (überspringt score.py automatisch, wenn `song/song.json` existiert; `mix.py` nimmt den Song statt Stimme + Score, Geräusche leise darunter).
7. Ist der PC/Browser/Suno nicht erreichbar: Folge trotzdem bis einschließlich Bilder vorbereiten, **nicht** mit Sprecherstimme veröffentlichen, in `STATUS.md` der Folge vermerken, was fehlt, und GIAHN melden.

## Einplanen in Metricool

- Vorher `getBrandSettings`: Meldet es „doesn't have any social network connected“ oder fehlt `tiktokData`, ist TikTok in Marke 7942950 **nicht** verbunden (die Meldung ist korrekt — am 07.11. scheiterte deshalb der erste Post mit „TikTok was disconnected“). Dann nichts einplanen, GIAHN bitten, TikTok hier zu verbinden: https://app.metricool.com/brands/connections?blogId=7942950 (angemeldet als ininktales@gmail.com). Liefert getBrandSettings die alte Marke 7714006, ist der Connector mit dem falschen Konto verbunden → nichts einplanen, GIAHN melden.
- Richtige Marke: `blogId` **7942950** (Konto ininktales@gmail.com). TikTok `who.has.more1` nie verwenden.
- **Vorerst nur TikTok** (GIAHNs Entscheidung, Metricool-Gratistarif): `providers` = nur tiktok, nur `tiktokData`. Instagram/YouTube erst einplanen, wenn GIAHN das freigibt und diese Zeile hier geändert ist. Fehlende Netze also NICHT als Problem melden.
- **Metricool-Gratistarif: max. 20 veröffentlichte Posts pro Kalendermonat.** Vor dem Einplanen zählen (veröffentlicht + eingeplant im Monat des Termins). Ist der Monat voll, auf den 1. des Folgemonats ausweichen und GIAHN das einmal kurz sagen.
- Folgen mit `status: "manual"` in plan.json hat GIAHN selbst hochgeladen — nie einplanen.
- Ein Post pro Folge, täglich **18:00 Europe/Berlin**, nächster freier Tag (Plan in `plan.json` + `getScheduledPosts` prüfen; nie zwei Folgen am selben Tag). Die zwei alten „Who has more“-Entwürfe (#whohasmore) nie anfassen.
- `createScheduledPost` mit `media` = Raw-GitHub-URL aus `out/`, `providers` = (später) tiktok, instagram, youtube, `text` = caption,
  `tiktokData` {privacyOption PUBLIC_TO_EVERYONE, title, isAigc true}, `instagramData` {type REEL, showReelOnFeed true, isAiGenerated true},
  `youtubeData` {title, type short, privacy public, madeForKids false, category FILM_ANIMATION, tags, isAiGeneratedContent false}. Kein Thumbnail-Feld.
- Danach `plan.json` ergänzen (`status: "scheduled"`, `metricool_uuid`). Metricool speichert das Video selbst; `out/`-Dateien von Folgen, die schon veröffentlicht sind und älter als 3 Tage, löschen (Repo klein halten).
- Posts mit Status ERROR (`getScheduledPosts`, Tales-in-Ink-Posts) → nichts Neues einplanen, GIAHN die Fehlermeldung schicken.

## Puffer

Ziel: 3 eingeplante Folgen im Voraus. Liegen schon ≥ 3 Folgen mit Datum > heute in `plan.json`, keine neue bauen — nur Status prüfen und kurz melden.
