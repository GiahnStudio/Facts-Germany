import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from multiprocessing import Pool
import promi_videos as pv

OUT = os.environ.get("PV_OUT", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "promi"))

P = {
 "jayz": {"look": {"skin": "dark", "hair": "buzz", "hair_col": (25, 20, 20), "beard": "short", "beard_col": (25, 20, 20), "shirt": (30, 30, 36), "acc": ["chain"]}, "name": "JAY-Z", "ini": "JZ", "col": (120, 90, 230), "flag": "US", "v": 2.8, "rank": 1,
          "cat": {"de": "Rap · Unternehmer", "en": "Rap · Business mogul"},
          "note": {"de": "Reichster Musiker der Welt – das Geld kommt vor allem aus Firmen, nicht aus Musik.",
                   "en": "The richest musician alive – most of it comes from businesses, not music."}},
 "swift": {"look": {"skin": "light", "hair": "long_bangs", "hair_col": (236, 200, 120), "lips": (200, 30, 50), "shirt": (240, 240, 245), "acc": ["studs"]}, "name": "Taylor Swift", "ini": "TS", "col": (230, 90, 150), "flag": "US", "v": 2.0, "rank": 2,
           "cat": {"de": "Pop", "en": "Pop"},
           "note": {"de": "Die reichste Musikerin der Welt.", "en": "The richest female musician on Earth."}},
 "boss": {"look": {"skin": "fair", "hair": "short", "hair_col": (95, 70, 55), "beard": "stubble", "beard_col": (80, 65, 55), "shirt": (60, 95, 150)}, "name": "Bruce Springsteen", "ini": "BS", "col": (70, 140, 220), "flag": "US", "v": 1.2, "rank": 3,
          "cat": {"de": "Rock", "en": "Rock"}},
 "riri": {"look": {"skin": "medium", "hair": "long", "hair_col": (30, 22, 20), "lips": (150, 50, 60), "shirt": (150, 30, 40), "acc": ["hoops"]}, "name": "Rihanna", "ini": "R", "col": (220, 70, 80), "flag": "BB", "v": 1.0, "rank": 4,
          "cat": {"de": "Pop · Fenty Beauty", "en": "Pop · Fenty Beauty"}},
 "bey": {"look": {"skin": "tan", "hair": "wavy", "hair_col": (200, 150, 80), "lips": (170, 80, 70), "shirt": (210, 170, 70), "acc": ["hoops"]}, "name": "Beyoncé", "ini": "B", "col": (230, 160, 50), "flag": "US", "v": 1.0, "rank": 5,
         "cat": {"de": "R&B · Pop", "en": "R&B · Pop"}},
 "dre": {"look": {"skin": "dark", "hair": "bald", "beard": "goatee", "beard_col": (60, 55, 55), "shirt": (28, 28, 32), "glasses": "sun", "acc": ["headphones"]}, "name": "Dr. Dre", "ini": "DD", "col": (60, 180, 150), "flag": "US", "v": 1.0, "rank": 6,
         "cat": {"de": "Hip-Hop · Beats", "en": "Hip-hop · Beats"}},
}
PEOPLE = list(P.values())

def musiker(lang):
    de = lang == "de"
    return {
     "slug": f"01_reichste_musiker_{lang}", "lang": lang, "vmax": 2.8, "people": PEOPLE,
     "brand": "WER HAT MEHR?" if de else "WHO HAS MORE?",
     "source": {"de": "Forbes Billionaires 2026 (März 2026), Schätzungen", "en": "Forbes Billionaires 2026 (March 2026), estimates"},
     "scenes": [
      {"type": "hook", "dur": 2.9, "n": 6, "kicker": "REICHSTE MUSIKER 2026" if de else "RICHEST MUSICIANS 2026",
       "setup": "Nur 6 Musiker auf der Welt sind Milliardäre" if de else "Only 6 musicians on Earth are billionaires",
       "question": "Wer ist die Nummer 1?" if de else "Who is number 1?",
       "tip": "Tipp in die Kommentare" if de else "Guess in the comments"},
      {"type": "tie", "dur": 3.4, "v": 1.0, "ps": [P["dre"], P["bey"], P["riri"]],
       "head": {"de": "#4 – #6", "en": "#4 – #6"}, "sub": {"de": "Gleichstand!", "en": "It's a tie!"},
       "each": {"de": "Je", "en": "Each"}},
      {"type": "rank", "dur": 2.6, "p": P["boss"]},
      {"type": "rank", "dur": 2.9, "p": P["swift"]},
      {"type": "reveal", "dur": 4.3, "reveal_at": 1.1, "p": P["jayz"], "teaser": {"de": "Und die Nr. 1 ist …", "en": "And number 1 is …"}},
      {"type": "board", "dur": 4.2, "head": {"de": "DIE 6 MUSIK-MILLIARDÄRE", "en": "THE 6 MUSIC BILLIONAIRES"},
       "foot": {"de": "JAY-Z hat 40 % mehr als Taylor Swift.", "en": "JAY-Z is worth 40% more than Taylor Swift."}},
      {"type": "cta", "dur": 3.2, "q": {"de": "Wer schafft es als Nächstes auf die Liste?", "en": "Who joins the list next?"},
       "c": {"de": "Schreib's in die Kommentare", "en": "Drop it in the comments"},
       "btn": {"de": "Folgen für mehr Vergleiche", "en": "Follow for more rankings"}},
     ]}

VIDEOS = [musiker("de"), musiker("en")]
def run(i): return pv.render(VIDEOS[i], OUT)
if __name__ == "__main__":
    with Pool(2) as p:
        for r in p.map(run, range(len(VIDEOS))): print(r)
