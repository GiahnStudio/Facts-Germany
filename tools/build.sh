#!/bin/sh
# Build one episode end to end.  Usage: sh tools/build.sh episodes/NNN-slug   (run tools/setup.sh first)
# Steps: copy engine → voice → events → score → mix → frames → master (−14 LUFS) → upload copy in out/ → srt + poster
set -e
REPO=$(cd "$(dirname "$0")/.." && pwd)
EP=$(cd "$1" && pwd); NAME=$(basename "$EP")
LIB=${LIB:-$HOME/lemo-opuscar}; export LIB PATH="$HOME/bin:$PATH"
cp "$REPO"/engine/*.js "$EP"/; mkdir -p "$EP/fonts"; cp "$REPO"/engine/fonts/* "$EP/fonts/"
cd "$LIB"
[ "${SKIP_TTS:-0}" = 1 ] || .venv/bin/python core/tts/tts.py "$EP/lines.json" "$EP/voices"
node core/render/events.mjs "$EP" --size 1080x1920
[ -f "$EP/song/song.json" ] || .venv/bin/python "$EP/music/score.py"
.venv/bin/python "$EP/mix.py"
node core/render/video.mjs "$EP" --fps 24 --workers 4 --size 1080x1920 --out "$EP/out/video.mp4"
sh core/render/mux.sh "$EP/out/video.mp4" "$EP/mix.wav" "$EP/out/master.mp4" 24 0
ffmpeg -loglevel error -y -i "$EP/out/master.mp4" -c:v libx264 -preset veryfast -crf 24 -pix_fmt yuv420p -movflags +faststart -c:a copy "$REPO/out/$NAME.mp4"
[ -f "$EP/song/song.json" ] && python3 "$REPO/tools/song_timing.py" "$EP" >/dev/null; .venv/bin/python core/render/srt.py "$EP/cues.json" "$EP/$NAME.srt"
ffmpeg -loglevel error -y -ss "${POSTER_T:-2.6}" -i "$EP/out/master.mp4" -frames:v 1 -q:v 2 "$EP/poster.jpg"
ffmpeg -i "$REPO/out/$NAME.mp4" -vf blackdetect=d=0.3 -f null - 2>&1 | grep black_start || echo "no black frames"
echo "upload copy: out/$NAME.mp4 ($(du -h "$REPO/out/$NAME.mp4" | cut -f1))"
