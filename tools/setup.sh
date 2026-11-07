#!/bin/sh
# One-time setup in a fresh session (5–10 min): Lemo-Opuscar library + packages + samples + ffmpeg 7+.
# Usage: sh tools/setup.sh      → prints the export lines to use afterwards
set -e
LIB=${LIB:-$HOME/lemo-opuscar}
if [ ! -f "$LIB/AGENTS.md" ]; then git clone --quiet --depth 1 https://github.com/lemomo-ai/lemo-opuscar.git "$LIB"; fi
cd "$LIB"
LEMO_OPUSCAR_HOME="$LIB" sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice music | tail -3
for lib in vcsl vsco2ce freepats; do
  [ -d "core/audio/instruments/$lib" ] || ls core/audio/instruments 2>/dev/null | grep -q "^$lib" || sh tools/fetch.sh instruments $lib >/dev/null 2>&1 || echo "! could not fetch instruments $lib"
done
# ffmpeg 7+ (the system one may be 6.x, which mux.sh rejects)
if ! ffmpeg -version 2>/dev/null | head -1 | grep -Eq 'version n?([7-9]|[1-9][0-9])\.'; then
  [ -x "$HOME/ffv/bin/python" ] || python3 -m venv "$HOME/ffv"
  "$HOME/ffv/bin/pip" install -q imageio-ffmpeg
  F=$(ls "$HOME"/ffv/lib/python3*/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux* | head -1); chmod +x "$F"
  mkdir -p "$HOME/bin"; ln -sf "$F" "$HOME/bin/ffmpeg"
fi
echo "export LIB=$LIB PATH=$HOME/bin:\$PATH"
