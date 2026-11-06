"""Hörproben mit Chatterbox Multilingual (MIT) für Lupo."""
import os, time, json
import torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

torch.set_num_threads(os.cpu_count() or 4)
OUT = "voice_test/out"
os.makedirs(OUT, exist_ok=True)
t0 = time.time()
model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
load = time.time() - t0

TEXT = ("Hi, ich bin Lupo, und ich durchschaue für dich die Dinge aus deinem Alltag. "
        "Heute: der Pfandautomat. Du steckst eine Flasche rein, es rattert kurz, und ein paar Sekunden später weiß er: 25 Cent. "
        "Aber woher eigentlich?")
REF = os.environ.get("REF")  # optionale deutsche Referenzstimme
variants = [
    ("A_standard", dict(exaggeration=0.5, cfg_weight=0.5)),
    ("B_weniger_akzent", dict(exaggeration=0.5, cfg_weight=0.0)),
    ("C_lebendig", dict(exaggeration=0.8, cfg_weight=0.3)),
    ("D_sehr_lebendig", dict(exaggeration=1.1, cfg_weight=0.3)),
]
report = {"load_s": round(load, 1), "threads": torch.get_num_threads(), "runs": []}
for name, kw in variants:
    s = time.time()
    if REF:
        kw["audio_prompt_path"] = REF
    wav = model.generate(TEXT, language_id="de", **kw)
    secs = time.time() - s
    dur = wav.shape[-1] / model.sr
    ta.save(f"{OUT}/{name}.wav", wav, model.sr)
    os.system(f"ffmpeg -y -loglevel error -i {OUT}/{name}.wav -b:a 128k {OUT}/{name}.mp3 && rm {OUT}/{name}.wav")
    report["runs"].append({"name": name, "audio_s": round(dur, 1), "compute_s": round(secs, 1), "x_realtime": round(secs / dur, 2)})
    print(report["runs"][-1], flush=True)
json.dump(report, open(f"{OUT}/report.json", "w"), indent=1)
print(report)
