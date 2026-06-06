// Lokale "API" – läuft komplett im Browser, ohne Server.
// Gleiche Schnittstelle wie zuvor, damit App.jsx unverändert bleibt.
import { buildAll } from './outfits.js'
import { scoreManual, scrape } from './scraper.js'

export const api = {
  async scrape(url) {
    return scrape(url)
  },
  async manual(product) {
    return scoreManual(product)
  },
  async outfits(products, occasions, boostLinks) {
    const boost = boostLinks && boostLinks.length ? new Set(boostLinks) : null
    const outfits = buildAll(products, occasions || null, boost)
    return { count: outfits.length, outfits }
  },
}
