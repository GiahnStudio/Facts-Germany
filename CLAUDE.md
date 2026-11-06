# Anleitung für Claude: Kanal "Durchschaut"

Thema: Wie alltägliche Dinge eigentlich funktionieren. KEINE Rechtsberatung, keine Gesundheits- oder Finanztipps.
Ziel: Jede Woche eine neue Folge + 2 Shorts, ohne Zutun von GIAHN.

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
     `machine` (animierter Automat, Cues insert_at/scan_at/db_at/press_at/bon_at) und `money` (Münzen fliegen zwischen Knoten).
     Für neue Themen gern eine eigene Spezialszene in `remotion/src` bauen (z. B. animierte Ampel), das macht die Folge unterhaltsamer.
   - Soundeffekte/Musik: `python renderer/sfx.py` (liegen in `remotion/public/sfx` und `remotion/public/music`).
   - Icons (`remotion/src/icons.tsx`): lens, machine, bottle, can, coin, barcode, eye, chip, press, crate, recycle, factory, shop, receipt, server, wash,
     calendar, house, drop, flame, camera, smoke, key, warn, person, bell, gavel, door. Neue Icons in `renderer/core.py` ergänzen.
   - `say` = gesprochener Text. ` ... ` = Denkpause. `at`-Werte müssen als Wort im `say` derselben Szene vorkommen
     (bei Wörtern, die mehrfach vorkommen, mehrere Wörter angeben, z. B. "Mythos. Jeder").
   - Kapitel über `"chapter"`, Beschreibung mit `{kapitel}` und Quellenliste.
   - 2 Shorts (25–40 s): 1× Quiz, 1× überraschender Ablauf. Thumbnails A/B.
   - Termine: Hauptvideo freitags, Short 1 am selben Tag, Short 2 am Sonntag.
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

Stimme: de-DE-Seraphina:DragonHDLatestNeural (Azure HD, Gratis-Tarif; Schlüssel als GitHub-Secrets AZURE_SPEECH_KEY / AZURE_SPEECH_REGION). Kanalstimme, nicht ändern.
