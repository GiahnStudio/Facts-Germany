# Anleitung für Claude: Kanal "Durchschaut"

Thema: Wie alltägliche Dinge eigentlich funktionieren. KEINE Rechtsberatung, keine Gesundheits- oder Finanztipps.
Ziel: Alle 2 Tage eine neue Folge + 2 Shorts (= jeden Tag ein Short), ohne Zutun von GIAHN.
Hintergrund: GIAHN will vor dem 1. Februar 2027 die Monetarisierung schaffen (danach verdoppeln sich die Anforderungen).

## Veröffentlichungsplan
- Hauptvideo alle 2 Tage um 17:00 (Europe/Berlin), Short 1 am selben Tag um 12:00, Short 2 am Folgetag um 12:00.
- Neue Folge: `date` = Datum des letzten Hauptvideos in `episodes/` + 2 Tage. Felder `date`/`time` in Folge und Shorts setzen.
- Puffer: Liegen schon 3 oder mehr Folgen in der Zukunft (date > heute + 6 Tage), keine neue Folge bauen.

## Neue Folge erstellen
1. Thema aus `TOPICS.md` ("Ideen") wählen, das noch nicht erledigt ist. Bevorzugt Dinge, die jeder täglich sieht und deren Innenleben überrascht.
2. Recherche per Websuche: Hersteller, Fachverbände, Behörden, Fachpresse, seriöse Medien. Keine Foren.
   Jede Zahl und jede Aussage mit Quelle belegen. Nichts behaupten, was nicht belegt ist. Bei Unsicherheit vorsichtig formulieren.
3. Episode-JSON nach Vorlage `episodes/01_pfandautomat.json` schreiben (Dateiname `NN_slug.json`):
   - 4–6 Minuten, ~18–22 Szenen. Aufbau: Hook-Frage → Überblick → Quiz (A/B/C) → große Zahlen → Ablauf Schritt für Schritt (flow) →
     überraschendes Detail / kleine Geschichte → Auflösung → Varianten (split) → typische Probleme → wer zahlt / wer steckt dahinter →
     3× "Stimmt oder Mythos?" → Zukunft → 3 Tipps → Fazit → Outro.
   - Videos werden mit Remotion animiert (`remotion/src`). Szenentypen: title, chips, quiz, bignum (zählt hoch), flow (Icons mit Linien),
     fact, story, split, list, case (Stimmt/Mythos mit Timer + Stempel), outro, sowie Spezialszenen:
     `machine` (animierter Automat, Cues insert_at/scan_at/db_at/press_at/bon_at), `money` (Münzen fliegen zwischen Knoten),
     `ampel` (Induktionsschleife, Cues car_at/loop_at/signal_at/green_at) und `aufzug` (Seilriss + Fangvorrichtung, Cues move_at/cut_at/governor_at/grip_at).
     Für neue Themen gern eine eigene Spezialszene in `remotion/src` bauen (z. B. animierte Ampel), das macht die Folge unterhaltsamer.
   - Soundeffekte/Musik: `python renderer/sfx.py` (liegen in `remotion/public/sfx` und `remotion/public/music`).
   - Icons (`remotion/src/icons.tsx`): lens, machine, bottle, can, coin, barcode, eye, chip, press, crate, recycle, factory, shop, receipt, server, wash,
     calendar, house, drop, flame, camera, smoke, key, warn, person, bell, gavel, door. Neue Icons in `renderer/core.py` ergänzen.
   - `say` = gesprochener Text. ` ... ` = Denkpause. `at`-Werte müssen als Wort im `say` derselben Szene vorkommen
     (bei Wörtern, die mehrfach vorkommen, mehrere Wörter angeben, z. B. "Mythos. Jeder").
   - Kapitel über `"chapter"`, Beschreibung mit `{kapitel}` und Quellenliste.
   - 2 Shorts (25–40 s): 1× Quiz, 1× überraschender Ablauf. Thumbnails A/B.
   - Termine nach dem Veröffentlichungsplan oben.
4. Lokal prüfen: `cd remotion && npm ci`, dann `CHROME=/usr/bin/google-chrome python renderer/build.py episodes/NN_slug.json --preview` (rendert je Szene ein Standbild nach `preview/`). `preview/` nicht committen.
5. Auf Branch `durchschaut` pushen. Die Action rendert alles (ca. 5–10 Min.) und pusht `up/<slug>/`.
6. Ergebnis per `git pull` holen, Frames mit ffmpeg prüfen, Thema in `TOPICS.md` als erledigt eintragen.

## Maskottchen Lupo
Lupo (eine Lupe mit Gesicht, `remotion/src/Lupo.tsx`) moderiert jede Folge. Er spricht mit der Kanalstimme, der Mund läuft
synchron zur Lautstärke. Er reagiert automatisch je Szenentyp (`remotion/src/host.tsx`): winkt im Intro, denkt mit Countdown
beim Quiz und bei "Stimmt oder Mythos?", jubelt bei "Stimmt"/richtiger Antwort, Facepalm bei "Mythos", staunt bei großen Zahlen.
- Die erste Szene beginnt immer mit "Hi, ich bin Lupo …", das Outro endet mit "Bis dann, euer Lupo!".
- Pro Folge 6–8 Sprechblasen mit kurzen, witzigen Kommentaren: `"lupo": {"bubbles": [{"text": "Krass!", "at": "Wort"}]}`.
- Eigene Reaktionen: `"lupo": {"events": [{"mood": "wow", "at": "Wort", "dur": 1.5}]}` (Moods: talk, happy, wave, wow, think, cheer, facepalm, pointLeft).
- Thumbnails zeigen Lupo (`mood`, `icon`, `big`, `chip`, `stamp` im Abschnitt `thumbs`).

Stimme: de-DE-Chirp3-HD-Rasalgethi (Google Cloud Text-to-Speech, Gratis-Kontingent 1 Mio. Zeichen/Monat; Schlüssel als GitHub-Secret GOOGLE_TTS_KEY).
Kanalstimme, nicht ändern. Wortzeiten kommen aus faster-whisper; der Abgleich Skript/Aufnahme steht als `match` in `audio_cache/*.json` (Ziel ≥ 0,85).
Fehlt der Schlüssel, rendert die Action mit einer Ersatzstimme ("Kein GOOGLE_TTS_KEY" im Log) – dann GIAHN Bescheid geben.

## Hochladen auf YouTube (Kanal "Durchschaut", @DurchschautDE)
Läuft über YouTube Studio im eingebauten Browser auf GIAHNs PC (Konto ist dort angemeldet; im Kontowechsler den Kanal "Durchschaut" wählen).
Keine API-Uploads (Videos aus nicht verifizierten API-Projekten bleiben privat).
1. `git pull`, offene Einträge finden: alles aus `up/plan.json` (Hauptvideo + 2 Shorts je Folge), was nicht in `up/uploaded.json` steht
   (Schlüssel `slug:main`, `slug:s1`, `slug:s2`) und dessen Termin noch in der Zukunft liegt (mind. 1 Stunde).
2. studio.youtube.com öffnen, auf den Kanal Durchschaut wechseln (Kanal-ID UCv4sZ_T8SQGK_2-oNxI6QOQ), Seite /videos/upload.
3. `up/ytlib.js` lesen, in der ersten Zeile `COMMIT` durch den aktuellen Commit (`git rev-parse HEAD`) ersetzen und den GANZEN Inhalt
   per javascript_tool einfügen (eval ist durch Trusted Types gesperrt, daher Code direkt einfügen).
4. `window.runQueue([['m',i],['s',i,0],['s',i,1], ...])` (i = Index in window.PLAN) und mit kurzen Aufrufen (< 45 s) `window.R`/`window.LOG` abfragen,
   bis `R === 'done'`. Bei "SCHED FAIL": Screenshot ansehen, Uhrzeit aus der Liste wählen, `window.finish()`.
4b. Einträge mit `"replace": true` in uploaded.json: Die alte, schon eingeplante Version in Studio (Tab Videos bzw. Shorts, gleicher Titel, Status "Geplant")
   über Checkbox → "Weitere Aktionen" → "Endgültig löschen" (Bestätigungshaken setzen) entfernen und neu hochladen.
   WICHTIG: Nach dem Klick auf "Endgültig löschen" auf der Seite bleiben, bis das Banner "Videos werden gelöscht" verschwindet (ca. 60 s),
   sonst wird das Löschen abgebrochen. Danach neu laden und prüfen, dass keine Doppelten mehr da sind. GIAHN hat das Ersetzen genehmigt.
   Nie ein Video löschen, das schon öffentlich ist. Danach `replace` entfernen.
   Upload-Limit (Kanal ist seit 7.11. bestätigt, sollte nicht mehr auftreten): Ohne bestätigte Telefonnummer erlaubt YouTube nur ca. 10 Uploads pro Tag (Meldung "Tägliches Upload-Limit erreicht").
   Dann abbrechen, Rest beim nächsten Lauf; Termine, die bis dahin verstrichen wären, um einen Tag (18:00) verschieben.
5. Erfolgreiche Einträge mit Datum in `up/uploaded.json` eintragen, committen ("[skip ci]"), pushen.
6. Wenn die Telefonnummer bestätigt ist (setThumb meldet nicht mehr "Telefon nicht bestätigt"): bei schon hochgeladenen Videos ohne eigenes
   Thumbnail das thumbnail_A.png über Studio → Inhalte → Video → Thumbnail nachtragen und in uploaded.json `thumb: true` setzen.
7. Nach Veröffentlichung: angepinnten Kommentar (`pin` aus plan.json) setzen, sobald das Video öffentlich ist; in uploaded.json `pinned: true`.
