# 008 The Wind and the Sun — IN ARBEIT (gesungene Suno-Fassung, Test für das neue Format)

Stand 11.11.2026: Bilder (story.js, views.js), Sprecher-Uhr (lines.json, voices/dur.json) und Songtext (song/lyrics.json) sind fertig.
Der Song ist in GIAHNs Suno-Konto bereits erzeugt (Titel „Fable 07 - The Wind and the Sun“, zwei Fassungen) — NICHT neu erzeugen:
- b716c6f9-27b6-4b82-bcbf-444f26c70e99 (80 s, erstes Wort bei 11,1 s, letztes bei 65,9 s, hoot_cer 0,140) ← bevorzugt
- 116b62b2-b0ba-4c70-b0fe-c92c7c735323 (86 s, erstes Wort bei 15,3 s, hoot_cer 0,148)
Es fehlt noch (braucht den Browser in der Claude-App auf GIAHNs PC):
1. Wort-Zeitstempel (GET /api/gen/<id>/aligned_lyrics/v2/) → song/aligned_raw.json; song/clip.json = {"clip": "<id>", "clip_dur": 80}
2. WAV → song/song.wav (Weg „window.name → GitHub-Upload“, siehe AGENTS.md im Repo GiahnStudio/engraved-bestiary, Abschnitt „The song“, Punkt 5; Zielzweig hier: tales-in-ink, Ordner episodes/008-the-wind-and-the-sun/song/)
3. `python3 tools/song_timing.py episodes/008-the-wind-and-the-sun` (schreibt song/song.json und cues.json), Standbilder in Song-Zeit prüfen
4. Bauen wie tools/build.sh, aber music/score.py überspringen (mix.py dieser Folge hat den Song-Modus); meta.json und TREATMENT.md schreiben
Der Film wird mit diesem Song ca. 58 s lang (länger als die üblichen 35–45 s). NICHT einplanen, bevor GIAHN die Fassung gesehen hat.
