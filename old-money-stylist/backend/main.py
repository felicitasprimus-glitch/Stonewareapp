"""
Old Money Outfit Stylist – FastAPI Backend.

Endpunkte:
  GET  /api/health
  POST /api/scrape            {url}            -> Produkte aus Shop auslesen + bewerten
  POST /api/manual            {link,name,...}  -> Produkt manuell hinzufuegen (+bewerten)
  POST /api/outfits           {products, occasions?, boost_links?}
  GET  /api/store                              -> Favoriten / gespeichert / abgelehnt
  POST /api/store/{bucket}    {product}        -> Produkt ablegen (favorites|saved|rejected)
  DELETE /api/store/{bucket}/{id}              -> entfernen
  POST /api/store/clear       {bucket?}        -> leeren
  POST /api/outfits/favorites {occasions?}     -> bessere Outfits aus Favoriten
"""
from __future__ import annotations

from typing import List, Optional
from urllib.parse import unquote

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import storage
from outfits import OCCASIONS, build_all
from scoring import detect_category, detect_color, score_product
from scraper import scrape

app = FastAPI(title="Old Money Outfit Stylist", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Modelle
# ---------------------------------------------------------------------------
class ScrapeReq(BaseModel):
    url: str


class ManualReq(BaseModel):
    link: str
    name: str
    price: Optional[float] = None
    image: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    currency: str = "EUR"


class OutfitReq(BaseModel):
    products: List[dict]
    occasions: Optional[List[str]] = None
    boost_links: Optional[List[str]] = None


class StoreReq(BaseModel):
    product: dict


class ClearReq(BaseModel):
    bucket: Optional[str] = None


class FavOutfitReq(BaseModel):
    occasions: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Endpunkte
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"ok": True, "occasions": list(OCCASIONS.keys())}


@app.get("/api/occasions")
def occasions():
    return [
        {"key": k, "label": v["label"], "emoji": v["emoji"]}
        for k, v in OCCASIONS.items()
    ]


@app.post("/api/scrape")
async def do_scrape(req: ScrapeReq):
    url = req.url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    try:
        result = await scrape(url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Scraping fehlgeschlagen: {e}")
    return result


@app.post("/api/manual")
def manual(req: ManualReq):
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name fehlt")
    color = req.color or detect_color(name)
    category = req.category or detect_category(name)
    s = score_product(name, category, color)
    product = {
        "name": name[:160],
        "price": req.price,
        "currency": req.currency or "EUR",
        "image": req.image,
        "color": s["color"],
        "category": category,
        "link": req.link.strip(),
        "source": "manuell",
        "scores": s["scores"],
        "tags": s["tags"] + ["manuell"],
    }
    return product


@app.post("/api/outfits")
def make_outfits(req: OutfitReq):
    boost = set(req.boost_links or [])
    outfits = build_all(req.products, req.occasions, boost or None)
    return {"count": len(outfits), "outfits": outfits}


@app.get("/api/store")
def get_store():
    return storage.get_all()


@app.post("/api/store/clear")
def clear_store(req: ClearReq):
    return storage.clear(req.bucket)


@app.post("/api/store/{bucket}")
def add_store(bucket: str, req: StoreReq):
    try:
        return storage.add(bucket, req.product)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/store/{bucket}/{product_id:path}")
def del_store(bucket: str, product_id: str):
    try:
        return storage.remove(bucket, unquote(product_id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/outfits/favorites")
def favorite_outfits(req: FavOutfitReq):
    data = storage.get_all()
    pool = data["favorites"] + data["saved"]
    if not pool:
        return {"count": 0, "outfits": [], "message": "Noch keine Favoriten gespeichert."}
    boost = {p.get("link") for p in data["favorites"]}
    outfits = build_all(pool, req.occasions, boost or None)
    return {"count": len(outfits), "outfits": outfits}
