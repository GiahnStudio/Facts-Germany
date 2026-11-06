# Anleitung für Claude: Kanal "Darf der das?"

Ziel: Jede Woche eine neue Folge + 2 Shorts, ohne Zutun von GIAHN.

## Neue Folge erstellen
1. Thema aus `TOPICS.md` (Abschnitt "Ideen") wählen, das noch nicht erledigt ist. Suchvolumen-Fragen bevorzugen ("Darf mein …").
2. Recherche per Websuche: Gesetz (Paragraf), mindestens 2 echte Urteile mit Gericht, Datum, Aktenzeichen.
   Jede Aussage und jede Zahl mit seriöser Quelle belegen (Gerichte, Mietervereine, Verbände, Fachportale). Keine Foren.
   Nichts behaupten, was nicht belegt ist. Bei Unsicherheit vorsichtig formulieren ("kann", "in der Regel").
3. Episode-JSON nach Vorlage `episodes/01_vermieter.json` schreiben (Dateiname `NN_slug.json`):
   - 4–6 Minuten, ~18–22 Szenen. Aufbau: Hook-Situation → Quiz (A/B/C) → Grundregel (§) → Auflösung →
     Gründe/Regeln → Ausnahme → 3 "Erlaubt oder verboten?"-Fälle → Urteils-Story → Folgen → Kehrseite → 3 Tipps → Fazit mit Hinweis "keine Rechtsberatung" → Outro.
   - `say` = gesprochener Text (Aktenzeichen nicht vorlesen, "Paragraf" ausschreiben, "StGB" als "Strafgesetzbuch").
     ` ... ` im Text = Denkpause (für Erlaubt/Verboten-Fälle).
   - `at`-Werte müssen als Wort im `say`-Text derselben Szene vorkommen (Animationen laufen synchron zur Stimme).
   - Kapitel über `"chapter"`, Beschreibung mit `{kapitel}`-Platzhalter und Quellenliste.
   - 2 Shorts (25–40 s): 1× Quiz, 1× überraschender Urteilsfall. Thumbnails A/B.
   - Termine: Hauptvideo freitags, Short 1 am selben Tag, Short 2 am Sonntag.
4. Lokal prüfen: `OFFLINE=1 python renderer/build.py episodes/NN_slug.json --preview`, Frames in `preview/` ansehen
   (Texte nicht abgeschnitten, Stempel überdecken nichts). `preview/` nicht committen.
5. Committen und auf Branch `darf-der-das` pushen. Die Action rendert alles (ca. 5–10 Min.) und pusht `up/<slug>/`.
6. Fertiges Video per `git fetch` holen, ein paar Frames mit ffmpeg prüfen, Thema in `TOPICS.md` als erledigt eintragen.

Stimme: de-DE-SeraphinaMultilingualNeural, rate +6 % (Kanalstimme, nicht ändern).
