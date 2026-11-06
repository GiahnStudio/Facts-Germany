# Darf der das? (YouTube-Kanal 2)

Faceless-Kanal über Alltagsrecht in Deutschland. Jede Folge beantwortet eine Frage
("Darf mein Vermieter…?", "Darf mein Chef…?") mit Gesetz, echten Urteilen und Quellen.

## So läuft es (vollautomatisch)
1. Neue Folge als JSON in `episodes/` anlegen (Vorlage: `episodes/01_vermieter.json`).
2. Pushen. Die GitHub-Action **"Folgen rendern"** erzeugt Stimme (Microsoft Neural, kostenlos),
   Video 16:9, 2 Shorts 9:16 mit Untertiteln, Thumbnails A/B, SRT und trägt alles in `up/plan.json` ein.
3. Ergebnis liegt in `up/<slug>/`, Upload-Daten (Titel, Beschreibung, Tags, Termine) in `up/plan.json`.

Lokal testen ohne Stimme: `OFFLINE=1 python renderer/build.py episodes/01_vermieter.json --preview`

## Ordner
- `renderer/` – Python (Pillow + ffmpeg)
- `episodes/` – Skripte der Folgen
- `up/` – fertige Videos, Thumbnails, Kanal-Grafiken (`up/kanal/`)
- `audio_cache/` – erzeugte Sprachdateien (werden wiederverwendet)
