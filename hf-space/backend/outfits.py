"""
Outfit-Generator.

Stellt aus einer Produktliste komplette Outfits fuer sechs Anlaesse zusammen:

  alltag_elegant, date_night, business_chic, sommerurlaub, dinner, instagram

Jedes Outfit besteht aus Slots:
  - Oberteil  (top)            \\
  - Unterteil (bottom)          }-- ODER ein Kleid (dress)
  - Schuhe    (shoes)
  - Tasche    (bag)
  - Schmuck   (jewelry)
  - optional: Mantel/Blazer (outerwear)

Pro Anlass gibt es ein Gewichtsprofil, das festlegt, welche Stil-Dimensionen
zaehlen. So entstehen z.B. fuer "Business Chic" zurueckhaltend-elegante
Kombinationen, fuer "Date Night" elegant-sexy Looks – nie billig.
"""
from __future__ import annotations

from typing import Dict, List, Optional

# Gewichtsprofile je Anlass (Summe ~1.0)
OCCASIONS: Dict[str, dict] = {
    "alltag_elegant": {
        "label": "Alltag Elegant",
        "emoji": "☕",
        "weights": {"oldmoney": 0.30, "elegant": 0.25, "luxury": 0.20, "everyday": 0.25, "sexy": 0.0},
        "prefer_dress": False,
        "want_outerwear": True,
        "tip": "Setze auf gedeckte Toene und edle Materialien. Ein Feinstrick-Oberteil "
               "zur weiten Hose, dazu Loafer und eine strukturierte Tasche – muehelos teuer.",
    },
    "date_night": {
        "label": "Date Night",
        "emoji": "🥂",
        "weights": {"oldmoney": 0.22, "elegant": 0.26, "luxury": 0.22, "everyday": 0.0, "sexy": 0.30},
        "prefer_dress": True,
        "want_outerwear": False,
        "tip": "Elegant-sexy statt billig: ein figurbetontes Seiden- oder Satinkleid, "
               "feine Sandaletten und dezenter Goldschmuck. Weniger ist mehr.",
    },
    "business_chic": {
        "label": "Business Chic",
        "emoji": "💼",
        "weights": {"oldmoney": 0.30, "elegant": 0.30, "luxury": 0.25, "everyday": 0.15, "sexy": 0.0},
        "prefer_dress": False,
        "want_outerwear": True,
        "tip": "Tailliertes Oberteil, Marlenehose oder Bleistiftrock, ein Blazer in Camel "
               "oder Navy. Pumps oder Loafer – klare Linien, keine Logos.",
    },
    "sommerurlaub": {
        "label": "Sommerurlaub",
        "emoji": "🌿",
        "weights": {"oldmoney": 0.28, "elegant": 0.22, "luxury": 0.20, "everyday": 0.30, "sexy": 0.0},
        "prefer_dress": True,
        "want_outerwear": False,
        "tip": "Leinen und Creme-Toene, ein luftiges Kleid oder Bluse zur weiten Hose, "
               "flache Sandalen oder Espadrilles und eine Bast-/Lederbeuteltasche.",
    },
    "dinner": {
        "label": "Dinner Outfit",
        "emoji": "🍷",
        "weights": {"oldmoney": 0.26, "elegant": 0.30, "luxury": 0.26, "everyday": 0.0, "sexy": 0.18},
        "prefer_dress": True,
        "want_outerwear": True,
        "tip": "Ein schlichtes Etui- oder Wickelkleid in Schwarz oder Navy, dazu Absatz, "
               "eine kleine Clutch und Perlen oder filigraner Goldschmuck.",
    },
    "instagram": {
        "label": "Instagram Look",
        "emoji": "📸",
        "weights": {"oldmoney": 0.30, "elegant": 0.24, "luxury": 0.24, "everyday": 0.05, "sexy": 0.17},
        "prefer_dress": True,
        "want_outerwear": True,
        "tip": "Monochromer Creme- oder Camel-Look fuer maximalen Quiet-Luxury-Effekt. "
               "Ton-in-Ton kombinieren, eine ikonische Tasche als Statement.",
    },
}

SLOT_LABELS = {
    "top": "Oberteil",
    "bottom": "Unterteil",
    "dress": "Kleid",
    "shoes": "Schuhe",
    "bag": "Tasche",
    "jewelry": "Schmuck / Accessoire",
    "outerwear": "Mantel / Blazer",
}


def _fit(product: dict, weights: Dict[str, float]) -> float:
    s = product.get("scores", {})
    return sum(s.get(dim, 0) * w for dim, w in weights.items())


def _by_category(products: List[dict]) -> Dict[str, List[dict]]:
    buckets: Dict[str, List[dict]] = {
        "dress": [], "top": [], "bottom": [], "shoes": [], "bag": [],
        "jewelry": [], "outerwear": [], "other": [],
    }
    for p in products:
        buckets.get(p.get("category", "other"), buckets["other"]).append(p)
    return buckets


def _best(items: List[dict], weights: Dict[str, float], used_links: set) -> Optional[dict]:
    pool = [p for p in items if p.get("link") not in used_links]
    if not pool:
        pool = items  # zur Not wiederverwenden (kleine Shops)
    if not pool:
        return None
    return max(pool, key=lambda p: _fit(p, weights))


def _price(p: Optional[dict]) -> float:
    return float(p["price"]) if p and p.get("price") else 0.0


def build_outfit(key: str, spec: dict, buckets: Dict[str, List[dict]]) -> Optional[dict]:
    weights = spec["weights"]
    used: set = set()
    items: Dict[str, dict] = {}

    has_dress = bool(buckets["dress"])
    has_separates = bool(buckets["top"]) and bool(buckets["bottom"])

    use_dress = False
    if spec["prefer_dress"] and has_dress:
        use_dress = True
    elif has_dress and not has_separates:
        use_dress = True

    if use_dress:
        d = _best(buckets["dress"], weights, used)
        if d:
            items["dress"] = d
            used.add(d["link"])
    else:
        t = _best(buckets["top"], weights, used)
        if t:
            items["top"] = t
            used.add(t["link"])
        b = _best(buckets["bottom"], weights, used)
        if b:
            items["bottom"] = b
            used.add(b["link"])
        # Falls keine Separates vorhanden, doch ein Kleid versuchen
        if not items and has_dress:
            d = _best(buckets["dress"], weights, used)
            if d:
                items["dress"] = d
                used.add(d["link"])

    for slot in ("shoes", "bag", "jewelry"):
        pick = _best(buckets[slot], weights, used)
        if pick:
            items[slot] = pick
            used.add(pick["link"])

    if spec.get("want_outerwear") and buckets["outerwear"]:
        o = _best(buckets["outerwear"], weights, used)
        if o:
            items["outerwear"] = o
            used.add(o["link"])

    if len(items) < 2:
        return None

    total = round(sum(_price(p) for p in items.values()), 2)
    fit_scores = [_fit(p, weights) for p in items.values()]
    match = int(round(sum(fit_scores) / len(fit_scores))) if fit_scores else 0

    return {
        "occasion": key,
        "label": spec["label"],
        "emoji": spec["emoji"],
        "tip": spec["tip"],
        "total_price": total,
        "currency": next((p.get("currency", "EUR") for p in items.values()), "EUR"),
        "match": match,
        "items": [
            {"slot": slot, "slot_label": SLOT_LABELS.get(slot, slot), **prod}
            for slot, prod in items.items()
        ],
    }


def build_all(products: List[dict],
              occasions: Optional[List[str]] = None,
              boost_links: Optional[set] = None) -> List[dict]:
    """Erzeugt Outfits fuer alle (oder ausgewaehlte) Anlaesse.

    boost_links: Set von Produkt-Links (z.B. Favoriten), die bevorzugt
    eingebaut werden -> ihre Scores werden temporaer angehoben.
    """
    if boost_links:
        products = [dict(p) for p in products]
        for p in products:
            if p.get("link") in boost_links:
                sc = dict(p.get("scores", {}))
                for k in sc:
                    sc[k] = min(100, sc[k] + 25)
                p["scores"] = sc

    buckets = _by_category(products)
    keys = occasions or list(OCCASIONS.keys())
    outfits = []
    for key in keys:
        spec = OCCASIONS.get(key)
        if not spec:
            continue
        outfit = build_outfit(key, spec, buckets)
        if outfit:
            outfits.append(outfit)
    return outfits
