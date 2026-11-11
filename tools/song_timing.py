#!/usr/bin/env python3
"""Suno word timestamps → song/song.json + cues.json for one episode (sung version).
Usage: python3 tools/song_timing.py episodes/NNN-slug
Needs song/lyrics.json (sections with the same ids as story.js VO: L01…; each with its sung lines),
song/aligned_raw.json ([[word, start_s, end_s], …] from Suno's /api/gen/<id>/aligned_lyrics/v2/, '|' = line break)
and song/clip.json ({"clip": "<id>", "clip_dur": seconds})."""
import json, re, sys, os
ep = sys.argv[1]; S = os.path.join(ep, 'song')
W = json.load(open(os.path.join(S, 'aligned_raw.json'))); L = json.load(open(os.path.join(S, 'lyrics.json'))); clip = json.load(open(os.path.join(S, 'clip.json')))
clean = lambda w: re.sub(r'\[[^\]]*\]?|^[^\[]*\]', '', w.replace('|', ' ')).strip()
words = [(clean(w), a, b) for w, a, b in W]; words = [x for x in words if x[0]]
START = max(0.0, words[0][1] - 0.3)
norm = lambda t: re.sub(r'[^a-z ]', '', t.lower()).split()
i, lines, sections, bad = 0, [], [], []
for s in L['sections']:
    sl = []
    for line in s['lines']:
        n = len(line.split()); seg = words[i:i + n]; i += n
        if not seg: bad.append(f'{line!r}: no words left'); continue
        heard = ' '.join(x[0] for x in seg)
        if norm(heard)[:1] != norm(line)[:1] or norm(heard)[-1:] != norm(line)[-1:]: bad.append(f'{line!r} heard as {heard!r}')
        sl.append({'id': s['id'], 't0': round(seg[0][1] - START, 3), 't1': round(seg[-1][2] - START, 3), 'text': line})
    lines += sl
    if sl: sections.append({'id': s['id'], 't0': sl[0]['t0'], 't1': sl[-1]['t1']})
json.dump({'clip': clip['clip'], 'start': round(START, 3), 'dur': round(clip['clip_dur'] - START, 2), 'sections': sections, 'lines': lines}, open(os.path.join(S, 'song.json'), 'w'), indent=1)
cues = [{'t0': l['t0'], 't1': round(max(l['t1'] + .4, l['t0'] + 1.6), 2), 'text': l['text']} for l in lines]
for k in range(len(cues) - 1): cues[k]['t1'] = min(cues[k]['t1'], round(cues[k + 1]['t0'] - .08, 2))
json.dump(cues, open(os.path.join(ep, 'cues.json'), 'w'), indent=1)
print(f'song.json: start {START:.2f}s, last line ends {lines[-1]["t1"]:.1f}s, {len(lines)} lines, leftover words {len(words) - i}')
if bad: print('CHECK alignment:', *bad, sep='\n  ')
