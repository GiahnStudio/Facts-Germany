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
   - Szenentypen: title, chips, quiz, bignum, flow, fact, story, split, list, case, timeline, checks, outro.
   - Icons: lens, bottle, can, coin, barcode, eye, chip, press, crate, recycle, factory, shop, receipt, server, wash,
     calendar, house, drop, flame, camera, smoke, key, warn, person, bell, gavel, door. Neue Icons in `renderer/core.py` ergänzen.
   - `say` = gesprochener Text. ` ... ` = Denkpause. `at`-Werte müssen als Wort im `say` derselben Szene vorkommen
     (bei Wörtern, die mehrfach vorkommen, mehrere Wörter angeben, z. B. "Mythos. Jeder").
   - Kapitel über `"chapter"`, Beschreibung mit `{kapitel}` und Quellenliste.
   - 2 Shorts (25–40 s): 1× Quiz, 1× überraschender Ablauf. Thumbnails A/B.
   - Termine: Hauptvideo freitags, Short 1 am selben Tag, Short 2 am Sonntag.
4. Lokal prüfen: `OFFLINE=1 python renderer/build.py episodes/NN_slug.json --preview` und Frames in `preview/` ansehen. `preview/` nicht committen.
5. Auf Branch `durchschaut` pushen. Die Action rendert alles (ca. 5–10 Min.) und pusht `up/<slug>/`.
6. Ergebnis per `git pull` holen, Frames mit ffmpeg prüfen, Thema in `TOPICS.md` als erledigt eintragen.

Stimme: de-DE-SeraphinaMultilingualNeural, rate +6 % (Kanalstimme, nicht ändern).
