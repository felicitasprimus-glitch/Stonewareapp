# Old Money Outfit Stylist 🤍

Ein webbasiertes Tool, das aus einem **Shop- oder Kategorie-Link** automatisch
elegante **Old-Money-Outfits** zusammenstellt – Quiet Luxury, Ralph-Lauren- und
Massimo-Dutti-Vibes, in Creme, Camel, Navy, Schwarz und Gold.

Sexy darf sein – aber immer hochwertig und stilvoll, nie billig.

---

## ✨ Funktionen

- **Shop auslesen** – Produktname, Preis, Bild, Farbe, Kategorie & Link werden
  automatisch aus der eingegebenen Shop-Seite extrahiert (Playwright + Fallbacks).
- **Stil-Bewertung** – jedes Produkt wird auf 5 Achsen bewertet:
  *Old Money · Elegant · Hochwertig · Sexy-tauglich · Alltagstauglich*.
  Billige Party-Teile (Neon, Glitzer, Logo-all-over) fallen automatisch durch.
- **Komplette Outfits** für 6 Anlässe:
  ☕ Alltag Elegant · 🥂 Date Night · 💼 Business Chic · 🌿 Sommerurlaub ·
  🍷 Dinner · 📸 Instagram Look.
  Jedes Outfit enthält Oberteil/Kleid, Unterteil, Schuhe, Tasche, Schmuck,
  optional Mantel/Blazer, **Styling-Tipp**, **Gesamtpreis** und direkte Produktlinks.
- **Speichern · Ablehnen · Favorisieren** – pro Produkt, lokal gespeichert.
- **Bessere Outfits aus Favoriten** – das Tool bevorzugt deine Lieblingsteile.
- **Manueller Modus** – falls ein Shop das Scraping blockiert, Produkte einfach
  von Hand eintragen (Bewertung erfolgt trotzdem automatisch).
- **PDF-Export** – Outfits als elegante Shoppingliste herunterladen.

---

## 🏗️ Architektur

```
old-money-stylist/
├─ backend/            FastAPI (Python)
│  ├─ main.py          API-Endpunkte
│  ├─ scraper.py       Playwright + httpx/BeautifulSoup Fallback
│  ├─ scoring.py       Old-Money Stil-Bewertung (offline-Heuristik)
│  ├─ outfits.py       Outfit-Generator je Anlass
│  ├─ storage.py       Favoriten in data/store.json
│  └─ requirements.txt
└─ frontend/           React + Vite
   ├─ src/App.jsx      Hauptansicht
   ├─ src/components/  Produkt- & Outfit-Karten
   └─ src/lib/         API-Client + PDF-Export
```

Frontend (Port **5173**) spricht über einen Proxy mit dem Backend (Port **8000**).

---

## 🚀 Installation

Voraussetzungen: **Python 3.10+** und **Node.js 18+**.

### 1. Backend (FastAPI)

```bash
cd old-money-stylist/backend

# virtuelle Umgebung anlegen (empfohlen)
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Abhängigkeiten installieren
pip install -r requirements.txt

# Playwright-Browser installieren (für JS-lastige Shops)
playwright install chromium

# Server starten
uvicorn main:app --reload --port 8000
```

> Hinweis: `playwright install chromium` ist optional. Ohne Playwright nutzt
> das Tool automatisch einen einfacheren HTTP-Scraper – viele Shops funktionieren
> auch damit, und der manuelle Modus geht immer.

### 2. Frontend (React/Vite)

In einem **zweiten Terminal**:

```bash
cd old-money-stylist/frontend
npm install
npm run dev
```

Dann im Browser öffnen: **http://localhost:5173**

---

## 🧭 Bedienung

1. **Entdecken** – Shop- oder Kategorie-Link einfügen → *Outfits finden*.
   Die Produkte erscheinen als Karten mit Bild, Preis und Stil-Bewertung.
2. Produkte mit **★ Favorit**, **⌖ Merken** oder **✕ Ablehnen** sortieren.
3. **✨ Outfits erstellen** → Tab *Outfits* zeigt fertige Looks je Anlass.
4. **⬇ Als PDF exportieren** für die Shoppingliste.
5. Tab **Favoriten** → *Bessere Outfits aus Favoriten* nutzt deine Lieblingsteile.

### Wenn ein Shop blockiert

Manche Shops (z. B. mit aggressivem Bot-Schutz) lassen sich nicht auslesen.
Dann erscheint ein Hinweis – klicke auf **„+ Produkt manuell hinzufügen“** und
trage Name, Preis, Bild-URL und Link ein. Die Stil-Bewertung läuft automatisch.

---

## 🎨 Stilprofil (eingebaut)

- weiblich, 1,80 m, Old Money / Quiet Luxury / französisch-elegant
- Farben: Creme, Weiß, Camel, Beige, Navy, Schwarz, Braun, Gold
- elegant, feminin, hochwertig – sexy nur edel (Seide, Satin, figurbetont, hohe Sandalen)
- **keine** billigen Party-Outfits, kein Neon, keine Logos

Das Stilprofil steckt in `backend/scoring.py` (Paletten & Keywords) und
`backend/outfits.py` (Anlass-Gewichte & Styling-Tipps) – dort lässt es sich
jederzeit feinjustieren.

---

## 🔧 Konfiguration / Anpassung

| Was | Wo |
|-----|-----|
| Farb-Palette & Stil-Keywords | `backend/scoring.py` → `PALETTE`, `LUX_*`, `CHEAP_SIGNALS` |
| Anlässe, Gewichte, Styling-Tipps | `backend/outfits.py` → `OCCASIONS` |
| Scraper-Selektoren | `backend/scraper.py` → `CARD_SELECTORS` |
| UI-Farben | `frontend/src/styles.css` → `:root` |

---

## ⚖️ Hinweis

Bitte nur Shops auslesen, deren Nutzungsbedingungen das erlauben, und das Tool
für den persönlichen Gebrauch verwenden.
