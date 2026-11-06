import glob
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
for f in sorted(glob.glob("voice_test/out/*.mp3")):
    segs, _ = m.transcribe(f, language="de")
    print("###", f, "|", " ".join(s.text.strip() for s in segs), flush=True)
