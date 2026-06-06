"""
Produkt-Scraper.

Strategie (robust, mit mehreren Fallbacks):

1. HTML laden
   a) bevorzugt mit Playwright (rendert JavaScript-lastige Shops)
   b) faellt automatisch auf httpx zurueck, falls Playwright nicht
      installiert ist oder fehlschlaegt

2. Produkte extrahieren – in dieser Reihenfolge:
   a) JSON-LD strukturierte Daten (schema.org Product / ItemList)  -> am genauesten
   b) Open-Graph / Microdata (typisch fuer einzelne Produktseiten)
   c) Heuristik ueber das Produkt-Grid (CSS-Selektoren + Bild/Preis-Muster)

Wenn Scraping blockiert wird, kann die Nutzerin Produkte manuell ueber
die API (/api/manual) hinzufuegen.
"""
from __future__ import annotations

import json
import re
from typing import List, Optional
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from scoring import detect_category, detect_color, score_product

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

PRICE_RE = re.compile(
    r"(?:€|EUR|CHF|£|\$)\s?(\d[\d.\s]*[,.]\d{2})|(\d[\d.\s]*[,.]\d{2})\s?(?:€|EUR|CHF)"
)


# ---------------------------------------------------------------------------
# HTML laden
# ---------------------------------------------------------------------------
async def fetch_html(url: str) -> tuple[str, str]:
    """Gibt (html, method) zurueck. method = 'playwright' | 'httpx'."""
    html = await _fetch_playwright(url)
    if html:
        return html, "playwright"
    html = await _fetch_httpx(url)
    return html, "httpx"


async def _fetch_playwright(url: str) -> Optional[str]:
    try:
        from playwright.async_api import async_playwright
    except Exception:
        return None
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            ctx = await browser.new_context(user_agent=USER_AGENT, locale="de-DE")
            page = await ctx.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            try:
                await page.wait_for_timeout(2000)
                # ein wenig scrollen, um Lazy-Loading auszuloesen
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight/2)")
                await page.wait_for_timeout(1200)
            except Exception:
                pass
            html = await page.content()
            await browser.close()
            return html
    except Exception:
        return None


async def _fetch_httpx(url: str) -> str:
    headers = {"User-Agent": USER_AGENT, "Accept-Language": "de-DE,de;q=0.9,en;q=0.6"}
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=25) as c:
        r = await c.get(url)
        r.raise_for_status()
        return r.text


# ---------------------------------------------------------------------------
# Hilfsfunktionen
# ---------------------------------------------------------------------------
def _parse_price(value) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value)
    m = PRICE_RE.search(s)
    if m:
        s = m.group(1) or m.group(2) or s
    s = s.strip().replace("\xa0", "").replace(" ", "")
    # deutsche Notation 1.299,00 -> 1299.00
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")
    elif "," in s:
        s = s.replace(",", ".")
    s = re.sub(r"[^0-9.]", "", s)
    try:
        return round(float(s), 2) if s else None
    except ValueError:
        return None


def _abs_url(base: str, link: Optional[str]) -> Optional[str]:
    if not link:
        return None
    return urljoin(base, link)


def _domain(url: str) -> str:
    try:
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return ""


def _make_product(name, price, image, link, base_url, currency="EUR", raw_color=None):
    name = (name or "").strip()
    if not name:
        return None
    link = _abs_url(base_url, link) or base_url
    image = _abs_url(base_url, image)
    color = raw_color or detect_color(name)
    category = detect_category(name)
    s = score_product(name, category, color)
    return {
        "name": name[:160],
        "price": _parse_price(price),
        "currency": currency or "EUR",
        "image": image,
        "color": s["color"],
        "category": category,
        "link": link,
        "source": _domain(link),
        "scores": s["scores"],
        "tags": s["tags"],
    }


# ---------------------------------------------------------------------------
# Strategie A: JSON-LD
# ---------------------------------------------------------------------------
def _iter_jsonld(soup: BeautifulSoup):
    for tag in soup.find_all("script", type="application/ld+json"):
        raw = tag.string or tag.get_text() or ""
        if not raw.strip():
            continue
        try:
            data = json.loads(raw)
        except Exception:
            # manche Shops haengen mehrere Objekte aneinander
            try:
                data = json.loads(raw[raw.index("{"): raw.rindex("}") + 1])
            except Exception:
                continue
        if isinstance(data, list):
            yield from data
        elif isinstance(data, dict):
            if "@graph" in data and isinstance(data["@graph"], list):
                yield from data["@graph"]
            else:
                yield data


def _node_type(node) -> str:
    t = node.get("@type", "")
    if isinstance(t, list):
        t = t[0] if t else ""
    return str(t).lower()


def _product_from_jsonld(node, base_url) -> Optional[dict]:
    name = node.get("name")
    image = node.get("image")
    if isinstance(image, list):
        image = image[0] if image else None
    if isinstance(image, dict):
        image = image.get("url")
    link = node.get("url") or node.get("@id")
    price = None
    currency = "EUR"
    offers = node.get("offers")
    if isinstance(offers, list):
        offers = offers[0] if offers else None
    if isinstance(offers, dict):
        price = offers.get("price") or offers.get("lowPrice")
        currency = offers.get("priceCurrency", currency)
    color = node.get("color")
    return _make_product(name, price, image, link, base_url, currency, color)


def parse_jsonld(soup: BeautifulSoup, base_url: str) -> List[dict]:
    products = []
    for node in _iter_jsonld(soup):
        if not isinstance(node, dict):
            continue
        ntype = _node_type(node)
        if ntype == "product":
            p = _product_from_jsonld(node, base_url)
            if p:
                products.append(p)
        elif ntype in ("itemlist", "collectionpage"):
            for el in node.get("itemListElement", []) or []:
                item = el.get("item") if isinstance(el, dict) else None
                if isinstance(item, dict) and _node_type(item) == "product":
                    p = _product_from_jsonld(item, base_url)
                    if p:
                        products.append(p)
    return products


# ---------------------------------------------------------------------------
# Strategie B: Open Graph (Einzel-Produktseite)
# ---------------------------------------------------------------------------
def parse_opengraph(soup: BeautifulSoup, base_url: str) -> List[dict]:
    def meta(prop):
        el = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        return el.get("content") if el else None

    og_type = (meta("og:type") or "").lower()
    name = meta("og:title") or (soup.title.string if soup.title else None)
    image = meta("og:image")
    link = meta("og:url") or base_url
    price = meta("product:price:amount") or meta("og:price:amount")
    currency = meta("product:price:currency") or meta("og:price:currency") or "EUR"
    if not name:
        return []
    if "product" in og_type or price:
        p = _make_product(name, price, image, link, base_url, currency)
        return [p] if p else []
    return []


# ---------------------------------------------------------------------------
# Strategie C: Heuristik ueber Produkt-Grid
# ---------------------------------------------------------------------------
CARD_SELECTORS = [
    "[data-testid*='product']", "[data-product]", "li.product", "article.product",
    ".product-card", ".product-item", ".product-tile", ".product", ".grid-product",
    ".o-product", ".m-product", ".c-product", "[class*='ProductCard']",
    "[class*='product-card']", "[class*='ProductTile']", "[class*='product-grid-item']",
]


def _text_price(el) -> Optional[str]:
    for sub in el.select("[class*='price'], [data-price], .price, [itemprop='price']"):
        txt = sub.get("content") or sub.get_text(" ", strip=True)
        if txt and PRICE_RE.search(txt):
            return txt
    m = PRICE_RE.search(el.get_text(" ", strip=True))
    return m.group(0) if m else None


def _img_src(el) -> Optional[str]:
    img = el.find("img")
    if not img:
        return None
    for attr in ("src", "data-src", "data-original", "data-srcset", "srcset"):
        v = img.get(attr)
        if v:
            return v.split(",")[0].strip().split(" ")[0]
    return None


def _name(el) -> Optional[str]:
    for sel in ["[class*='name']", "[class*='title']", "h2", "h3", "h4", "a[title]"]:
        sub = el.select_one(sel)
        if sub:
            txt = sub.get("title") or sub.get_text(" ", strip=True)
            if txt and len(txt) > 2:
                return txt
    a = el.find("a")
    if a and a.get_text(strip=True):
        return a.get_text(" ", strip=True)
    return None


def _link(el) -> Optional[str]:
    a = el.find("a", href=True)
    return a["href"] if a else None


def parse_heuristic(soup: BeautifulSoup, base_url: str, limit: int = 60) -> List[dict]:
    seen = set()
    products = []
    cards = []
    for sel in CARD_SELECTORS:
        found = soup.select(sel)
        if len(found) > len(cards):
            cards = found
        if len(cards) >= 3:
            break
    for el in cards[: limit * 2]:
        name = _name(el)
        if not name:
            continue
        key = name.lower()[:80]
        if key in seen:
            continue
        seen.add(key)
        p = _make_product(name, _text_price(el), _img_src(el), _link(el), base_url)
        if p:
            products.append(p)
        if len(products) >= limit:
            break
    return products


# ---------------------------------------------------------------------------
# Orchestrierung
# ---------------------------------------------------------------------------
async def scrape(url: str) -> dict:
    html, method = await fetch_html(url)
    soup = BeautifulSoup(html, "lxml")

    products: List[dict] = []
    used = "jsonld"
    products = parse_jsonld(soup, url)
    if len(products) < 2:
        og = parse_opengraph(soup, url)
        if og:
            products = products + og if products else og
            used = "opengraph"
    if len(products) < 2:
        heur = parse_heuristic(soup, url)
        if len(heur) > len(products):
            products = heur
            used = "heuristic"

    # Dubletten nach link/name entfernen
    deduped = {}
    for p in products:
        k = (p["link"] or "") + "|" + p["name"].lower()
        if k not in deduped:
            deduped[k] = p
    products = list(deduped.values())

    return {
        "url": url,
        "source": _domain(url),
        "method": method,
        "strategy": used,
        "count": len(products),
        "products": products,
        "blocked": len(products) == 0,
    }
