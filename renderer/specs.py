import sys
sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
from data_videos import *

yr = lambda x: str(min(int(x), 2027))
VIDEOS = [
 {"slug": "01_briefporto", "source": "Deutsche Post, Bundesnetzagentur (Okt. 2026), Presseberichte", "scenes": [
   {"type": "hook", "dur": 2.8, "kicker": "BRIEFPORTO", "setup": "2012 kostete ein Brief", "known": "0,55 €", "question": "Ab Januar 2027 kostet er"},
   {"type": "line", "dur": 9.0, "title": "STANDARDBRIEF IN DEUTSCHLAND", "series": [(2010,0.55),(2013,0.58),(2014,0.60),(2015,0.62),(2016,0.70),(2019.5,0.80),(2022,0.85),(2025,0.95),(2027,1.15)],
    "xrange": (2010, 2027.9), "vmax": 1.3, "grid": [0.25,0.5,0.75,1.0,1.25], "ticks": [2010,2015,2020,2025], "label_idx": [8], "xlabel": yr},
   {"type": "stat", "dur": 4.4, "pre": "Seit 2012:", "big": "+109 %", "lines": ["Mehr als doppelt so teuer.", "Der Maxibrief springt sogar von 2,90 € auf 5,00 €."]},
   {"type": "cta", "dur": 3.5, "q": "Wann hast du zuletzt einen Brief verschickt?"}]},
 {"slug": "02_deutschlandticket", "source": "Bayerisches Verkehrsministerium (30.09.2026), Presseberichte", "scenes": [
   {"type": "hook", "dur": 2.8, "kicker": "DEUTSCHLANDTICKET", "setup": "Gestartet ist es 2023 für", "known": "49 €", "question": "Ab Januar 2027 kostet es"},
   {"type": "line", "dur": 8.0, "title": "PREIS PRO MONAT", "series": [(2023.33,49.0),(2025,58.0),(2026,63.0),(2027,66.8)],
    "xrange": (2023.2, 2027.9), "vmax": 80, "grid": [20,40,60,80], "ticks": [2024,2025,2026,2027], "label_idx": [3], "xlabel": yr},
   {"type": "stat", "dur": 4.4, "pre": "In knapp 4 Jahren:", "big": "+36 %", "lines": ["Pro Jahr 801,60 € statt 588 €.", "Das sind 213,60 € mehr."]},
   {"type": "cta", "dur": 3.5, "q": "Lohnt sich das Ticket für dich noch?"}]},
 {"slug": "03_mindestlohn", "source": "Mindestlohngesetz / Mindestlohnkommission, finanz-tools.de", "scenes": [
   {"type": "hook", "dur": 2.8, "kicker": "MINDESTLOHN", "setup": "2015 gab es pro Stunde", "known": "8,50 €", "question": "Ab Januar 2027 sind es"},
   {"type": "line", "dur": 9.0, "title": "BRUTTO PRO STUNDE", "series": [(2015,8.5),(2017,8.84),(2019,9.19),(2020,9.35),(2021,9.5),(2021.5,9.6),(2022,9.82),(2022.5,10.45),(2022.75,12.0),(2024,12.41),(2025,12.82),(2026,13.9),(2027,14.6)],
    "xrange": (2015, 2027.9), "vmax": 16, "grid": [4,8,12,16], "ticks": [2015,2018,2021,2024,2027], "label_idx": [12], "xlabel": yr},
   {"type": "stat", "dur": 4.6, "pre": "Seit 2015:", "big": "+72 %", "col": GREEN, "lines": ["Vollzeit (40 Std.): ca. 2.531 € brutto im Monat.", "2015 waren es ca. 1.473 €."]},
   {"type": "cta", "dur": 3.5, "q": "Reicht der Mindestlohn zum Leben in deiner Stadt?"}]},
 {"slug": "04_wiesn_mass", "source": "oktoberfest.de (Bierpreise 2026), Mindestlohngesetz, Presseberichte (1980)", "scenes": [
   {"type": "hook", "dur": 2.8, "kicker": "OKTOBERFEST", "setup": "Eine Wiesn-Maß kostete 1980", "known": "ca. 1,40 €", "question": "Heute arbeitest du dafür"},
   {"type": "bars", "dur": 5.2, "title": "OKTOBERFEST 2026", "head": "1 Maß vs. 1 Stunde Mindestlohn", "bars": [
     {"label": "Maß im teuersten Zelt", "v": 15.90, "col": ACC},
     {"label": "Maß im günstigsten Zelt", "v": 14.80, "col": (255, 160, 60)},
     {"label": "Mindestlohn pro Stunde", "v": 13.90, "col": (110, 170, 255)}]},
   {"type": "stat", "dur": 4.8, "pre": "Für eine Maß arbeitest du bis zu", "big": "69 Min.", "size": 200, "col": ACC,
    "lines": ["zum Mindestlohn, brutto, vor Abzügen.", "Die Maß kostet heute bis zu 11-mal so viel wie 1980."]},
   {"type": "cta", "dur": 3.5, "q": "Was zahlst du bei dir für ein Bier?"}]},
 {"slug": "05_ab_januar_2027", "source": "Bundesnetzagentur, Deutsche Post, Bayer. Verkehrsministerium, Mindestlohnkommission", "scenes": [
   {"type": "hook", "dur": 2.8, "kicker": "AB 1. JANUAR 2027", "setup": "Dein Mindestlohn steigt um", "known": "+5 %", "question": "Und das steigt mit"},
   {"type": "list", "dur": 6.4, "per": 1.4, "title": "AB 1. JANUAR 2027", "head": "Das wird teurer", "items": [
     {"name": "Deutschlandticket", "old": "63,00 €", "new": "66,80 €", "pct": "+6 %"},
     {"name": "Standardbrief", "old": "0,95 €", "new": "1,15 €", "pct": "+21 %"},
     {"name": "Maxibrief", "old": "2,90 €", "new": "5,00 €", "pct": "+72 %"}]},
   {"type": "stat", "dur": 4.6, "pre": "Das Porto steigt", "big": "4×", "col": RED,
    "lines": ["so stark wie der Mindestlohn.", "+21 % beim Brief vs. +5 % beim Lohn."]},
   {"type": "cta", "dur": 3.5, "q": "Was wird für dich 2027 am teuersten?"}]},
]
def run(i): return render(VIDEOS[i])
