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
│  ├─ storage.py       optionaler JSON-Speicher (für lokale API-Nutzung)
│  └─ requirements.txt
├─ frontend/           React + Vite
│  ├─ src/App.jsx      Hauptansicht
│  ├─ src/components/  Produkt- & Outfit-Karten
│  └─ src/lib/         API-Client, Browser-Speicher & PDF-Export
├─ Dockerfile          Ein-Container-Deployment (Frontend + Backend)
└─ ../render.yaml      Blueprint für Hosting auf Render
```

Die Web-Oberfläche läuft **komplett im Browser**: Stil-Bewertung, Outfit-Erstellung
und Scraping (über einen CORS-Proxy) sind als JavaScript in `frontend/src/lib/`
nachgebaut. Favoriten liegen im **Browser (localStorage)**. Dadurch braucht die
App **keinen Server** und keine Datenbank. Das Python-Backend ist optional für
eine leistungsfähigere Server-Variante.

---

## 🌐 Kostenlos online stellen über GitHub Pages (empfohlen – ohne Server, ohne Kreditkarte)

Die App gibt es auch als **eine einzige Datei** unter `stylist/index.html`, die
**komplett im Browser** läuft (Bewertung, Outfit-Erstellung, Favoriten, PDF).
Damit brauchst du **keinen Server** und kannst sie gratis auf GitHub Pages hosten.

So aktivierst du deinen Link:

1. Auf GitHub im Repo **`Stonewareapp`** → **Settings** → **Pages**.
2. Unter *„Build and deployment“* → **Deploy from a branch** wählen,
   Branch **`main`**, Ordner **`/ (root)`**, **Save**.
3. Nach ein paar Minuten ist die App erreichbar unter:
   **`https://felicitasprimus-glitch.github.io/Stonewareapp/stylist/`** 🎉

> Voraussetzung: Der Code muss in `main` liegen (Pull Request mergen).
> Favoriten werden im Browser gespeichert (localStorage) und bleiben erhalten.

**Noch einfacher:** Du kannst die Datei `stylist/index.html` auch direkt aus dem
Repo herunterladen und per Doppelklick im Browser öffnen – funktioniert auch
offline (nur das automatische Auslesen von Shops braucht Internet).

> Hinweis zum Auslesen: Im reinen Browser-Modus werden Shop-Seiten über einen
> öffentlichen CORS-Proxy geladen. Das klappt bei vielen Shops, aber nicht bei
> allen. Wenn ein Shop blockiert, nutze einfach den **manuellen Modus**
> (Produkt per Hand eintragen) – Bewertung & Outfits funktionieren voll.

### Datei neu bauen (nach Änderungen)

```bash
cd old-money-stylist/frontend
npm install && npm run build
cp dist/index.html ../../stylist/index.html
```

---

## 🖥️ Alternative: Voll-Server-Version (mit Backend)

Für stärkeres Scraping gibt es zusätzlich eine Server-Variante (FastAPI +
Playwright). Sie liegt im Repo als `Dockerfile` und `../render.yaml` und lässt
sich z.B. auf Render, Railway oder Fly.io betreiben. Für den normalen Gebrauch
ist die kostenlose GitHub-Pages-Variante oben aber völlig ausreichend.

---

## 🚀 Lokal installieren (volle Version mit Auto-Scraping)

Voraussetzungen: **Python 3.10+** und **Node.js 18+**.

### 1. Backend (FastAPI)

```bash
cd old-money-stylist/backend

# virtuelle Umgebung anlegen (empfohlen)
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Abhängigkeiten installieren
pip install -r requirements.txt

# OPTIONAL: Playwright für JS-lastige Shops (besseres Auslesen)
pip install playwright && playwright install chromium

# Server starten
uvicorn main:app --reload --port 8000
```

> Hinweis: Playwright ist optional. Ohne Playwright nutzt das Tool automatisch
> einen einfacheren HTTP-Scraper – viele Shops funktionieren auch damit, und der
> manuelle Modus geht immer.

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

### Produkte aus jedem Shop übernehmen (das Lesezeichen / „Bookmarklet“)

Große Shops (Zara, Massimo Dutti, Mango, Ralph Lauren …) blockieren automatisches
Auslesen grundsätzlich und laden Produkte per JavaScript. **Zuverlässig** geht es
mit dem eingebauten Lesezeichen:

1. In der App die Box **„🤍 Produkte zuverlässig aus jedem Shop übernehmen“** öffnen.
2. Den Button **🤍 In Stylist** in die Lesezeichen-Leiste des Browsers ziehen.
3. Im Shop ein Produkt öffnen, das dir gefällt, und auf das Lesezeichen klicken –
   das Produkt erscheint automatisch im Stylist (gemerkt) und wird bewertet.

Das funktioniert, weil der Code direkt auf der echten Shop-Seite läuft (kein
CORS, kein Bot-Block). Danach **✨ Outfits erstellen** wie gewohnt.

### Wenn gar nichts klappt: manuell

Du kannst jedes Produkt auch von Hand eintragen – klicke auf
**„+ Produkt manuell hinzufügen“** und
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
