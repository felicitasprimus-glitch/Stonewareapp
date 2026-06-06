"""
Old-Money Stil-Bewertung.

Bewertet jedes Produkt anhand von Heuristiken (Keyword-Matching auf Name,
Kategorie und Farbe) nach fuenf Dimensionen:

  - oldmoney : passt zum Old-Money / Quiet-Luxury Stil
  - elegant  : wirkt elegant
  - luxury   : wirkt hochwertig
  - sexy     : kann elegant-sexy kombiniert werden
  - everyday : alltagstauglich

Alle Werte 0..100. "overall" ist ein gewichteter Gesamtscore.

Die Bewertung laeuft komplett offline (keine externe API noetig).
"""
from __future__ import annotations

import re
from typing import Dict, List

# ---------------------------------------------------------------------------
# Stil-Palette der Nutzerin (Old Money / Quiet Luxury)
# ---------------------------------------------------------------------------
PALETTE = {
    "creme": ["creme", "crème", "cream", "ecru", "ivory", "elfenbein", "off-white", "offwhite"],
    "weiss": ["weiss", "weiß", "white", "blanc", "optic white"],
    "camel": ["camel", "kamel", "tan", "cognac"],
    "beige": ["beige", "sand", "stone", "nude", "taupe", "greige", "khaki hell", "oat"],
    "navy": ["navy", "marine", "marineblau", "dunkelblau", "midnight"],
    "schwarz": ["schwarz", "black", "noir", "nero"],
    "braun": ["braun", "brown", "chocolate", "schoko", "mocha", "espresso", "walnut", "hazel"],
    "gold": ["gold", "golden", "champagne", "champagner", "messing", "brass"],
    "grau": ["grau", "grey", "gray", "anthrazit", "charcoal", "silber", "silver"],
}

# Farben, die explizit NICHT zum Stil passen (billiger / grell wirkend)
OFF_PALETTE = [
    "neon", "pink", "magenta", "knallrot", "lila grell", "türkis", "tuerkis",
    "limette", "lime", "orange grell", "glitzer", "glitter", "leopard print bunt",
]

# ---------------------------------------------------------------------------
# Material- und Stil-Signale
# ---------------------------------------------------------------------------
LUX_MATERIALS = [
    "kaschmir", "cashmere", "seide", "silk", "soie", "wolle", "wool", "merino",
    "leinen", "linen", "leder", "leather", "cuir", "satin", "twill", "tweed",
    "popeline", "poplin", "baumwolle", "cotton", "viskose", "viscose",
    "alpaka", "alpaca", "mohair", "gabardine", "crepe", "krepp",
]
LUX_WORDS = [
    "tailored", "tailoring", "structured", "premium", "luxe", "luxury", "fine",
    "handgefertigt", "handmade", "manufaktur", "edel", "hochwertig", "klassisch",
    "classic", "timeless", "zeitlos", "heritage", "signature", "icon", "gold-tone",
]
ELEGANT_WORDS = [
    "blazer", "mantel", "coat", "trenchcoat", "trench", "kostüm", "kostuem",
    "bluse", "blouse", "hemd", "shirt", "midi", "maxi", "plisse", "plissee",
    "pleated", "wickel", "wrap", "kleid", "dress", "robe", "pumps", "loafer",
    "ballerina", "slingback", "mokassin", "perlen", "pearl", "seidentuch",
    "carre", "carré", "etui", "anzug", "suit", "pencil", "a-linie", "a-line",
    "kaschmirpullover", "rollkragen", "turtleneck", "feinstrick",
]
SEXY_ELEGANT_WORDS = [
    "schulterfrei", "off-shoulder", "off the shoulder", "rückenfrei", "rueckenfrei",
    "open back", "backless", "figurbetont", "bodycon", "fitted", "schlitz", "slit",
    "cut-out", "cutout", "satinkleid", "seidenkleid", "slip dress", "slipdress",
    "korsage", "bustier", "neckholder", "halter", "tief ausgeschnitten", "v-ausschnitt",
    "v-neck", "deep v", "bandeau", "trägerlos", "traegerlos", "strapless",
    "high heels", "stiletto", "sandalette", "absatz", "heeled",
]
# Billig / Party / nicht erwuenscht -> druecken den Score
CHEAP_SIGNALS = [
    "party", "clubwear", "festival", "rave", "pailletten bunt", "neon",
    "fast fashion", "polyester glanz", "billig", "cheap", "y2k", "rave",
    "mesh durchsichtig", "micro mini", "minirock ultra", "logo all over",
    "plüsch", "pluesch fun", "kostüm karneval", "fasching",
]
EVERYDAY_WORDS = [
    "t-shirt", "tshirt", "strick", "knit", "pullover", "sweater", "cardigan",
    "hose", "trousers", "pants", "jeans", "chino", "rock", "skirt", "loafer",
    "ballerina", "sneaker", "flats", "tasche", "bag", "shirt", "top", "basic",
    "everyday", "alltag", "bluse",
]

# ---------------------------------------------------------------------------
# Kategorie-Erkennung -> Outfit-Slot
# ---------------------------------------------------------------------------
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "dress": ["kleid", "dress", "robe", "kostüm", "kostuem", "jumpsuit", "overall", "gown"],
    "top": [
        "top", "bluse", "blouse", "hemd", "shirt", "t-shirt", "tshirt", "pullover",
        "pulli", "sweater", "strickpullover", "rollkragen", "turtleneck", "bustier",
        "korsage", "body", "cami", "tank", "feinstrick", "twinset", "weste oben",
    ],
    "bottom": [
        "hose", "trousers", "pants", "jeans", "chino", "rock", "skirt", "shorts",
        "leggings", "culotte", "marlene", "palazzo", "bermuda", "midirock", "maxirock",
    ],
    "outerwear": [
        "blazer", "mantel", "coat", "trench", "trenchcoat", "jacke", "jacket",
        "cardigan", "cape", "weste", "blouson", "steppjacke", "wollmantel",
    ],
    "shoes": [
        "schuh", "shoe", "pumps", "loafer", "mokassin", "ballerina", "sandale",
        "sandalette", "sneaker", "stiefel", "boots", "slingback", "heel", "absatz",
        "espadrille", "mule", "flats", "ballerinas",
    ],
    "bag": [
        "tasche", "bag", "handtasche", "shopper", "clutch", "schultertasche",
        "umhängetasche", "umhaengetasche", "tote", "crossbody", "beuteltasche",
        "henkeltasche", "pouch", "bucket bag",
    ],
    "jewelry": [
        "kette", "necklace", "ohrring", "earring", "ohrstecker", "creole", "armband",
        "bracelet", "ring", "schmuck", "jewel", "anhänger", "anhaenger", "perlen",
        "pearl", "uhr", "watch", "brosche", "seidentuch", "carre", "carré", "schal",
        "tuch", "guertel", "gürtel", "belt", "sonnenbrille", "sunglasses",
    ],
}

# Reihenfolge bestimmt Prioritaet bei Mehrfach-Treffern
CATEGORY_ORDER = ["dress", "outerwear", "shoes", "bag", "jewelry", "bottom", "top"]


def detect_color(text: str) -> str | None:
    t = text.lower()
    for canonical, variants in PALETTE.items():
        for v in variants:
            if v in t:
                return canonical
    return None


def detect_category(text: str) -> str:
    t = text.lower()
    hits = []
    for cat in CATEGORY_ORDER:
        for kw in CATEGORY_KEYWORDS[cat]:
            if kw in t:
                hits.append(cat)
                break
    if not hits:
        return "other"
    # bottom + top -> nimm spezifischeren Treffer (zuerst gefunden in ORDER)
    return hits[0]


def _count(text: str, words: List[str]) -> int:
    return sum(1 for w in words if w in text)


def _clamp(v: float) -> int:
    return max(0, min(100, int(round(v))))


def score_product(name: str, category: str | None, color: str | None,
                  extra_text: str = "") -> Dict:
    """Bewertet ein Produkt und gibt scores + tags zurueck."""
    text = " ".join([name or "", category or "", color or "", extra_text or ""]).lower()

    color_norm = color if (color in PALETTE) else detect_color(text)
    in_palette = color_norm in PALETTE
    off_palette = any(c in text for c in OFF_PALETTE)

    mat = _count(text, LUX_MATERIALS)
    lux = _count(text, LUX_WORDS)
    eleg = _count(text, ELEGANT_WORDS)
    sexy = _count(text, SEXY_ELEGANT_WORDS)
    every = _count(text, EVERYDAY_WORDS)
    cheap = _count(text, CHEAP_SIGNALS)

    base = 45  # neutraler Startwert

    # --- Luxury -----------------------------------------------------------
    luxury = base + mat * 16 + lux * 12 + (10 if in_palette else 0) - cheap * 22
    if off_palette:
        luxury -= 18

    # --- Elegant ----------------------------------------------------------
    elegant = base + eleg * 12 + mat * 8 + (12 if in_palette else 0) - cheap * 20
    if off_palette:
        elegant -= 15

    # --- Old Money --------------------------------------------------------
    # Quiet Luxury: gedeckte Palette + edle Materialien + klassische Schnitte,
    # KEINE grellen Farben, KEINE Logos/Party.
    oldmoney = base + (18 if in_palette else -10) + mat * 12 + lux * 10 + eleg * 6
    oldmoney -= cheap * 26
    if off_palette:
        oldmoney -= 30
    if "logo" in text or "all over print" in text:
        oldmoney -= 12

    # --- Sexy (elegant) ---------------------------------------------------
    sexy_score = base + sexy * 18 + (8 if in_palette else 0) - cheap * 14
    # figurbetonte Teile in edlen Materialien wirken teuer-sexy
    if sexy and mat:
        sexy_score += 10

    # --- Everyday ---------------------------------------------------------
    everyday = base + every * 12 + (8 if in_palette else 0)
    if sexy > 1:
        everyday -= 10  # sehr gewagte Teile sind weniger alltagstauglich
    if "abendkleid" in text or "gown" in text or "maxikleid abend" in text:
        everyday -= 18

    scores = {
        "oldmoney": _clamp(oldmoney),
        "elegant": _clamp(elegant),
        "luxury": _clamp(luxury),
        "sexy": _clamp(sexy_score),
        "everyday": _clamp(everyday),
    }
    scores["overall"] = _clamp(
        0.34 * scores["oldmoney"]
        + 0.26 * scores["elegant"]
        + 0.24 * scores["luxury"]
        + 0.16 * scores["everyday"]
    )

    tags = []
    if in_palette:
        tags.append(f"Palette: {color_norm}")
    if mat:
        tags.append("edles Material")
    if scores["oldmoney"] >= 70:
        tags.append("Old Money")
    if scores["sexy"] >= 65:
        tags.append("elegant-sexy")
    if cheap or off_palette:
        tags.append("⚠ Stil-Check")

    return {"scores": scores, "tags": tags, "color": color_norm}
