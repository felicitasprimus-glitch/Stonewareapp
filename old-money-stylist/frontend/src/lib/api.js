// Lokale "API" – läuft im Browser. Für das Auslesen von Shops wird zuerst der
// Server (mit echtem Browser/Playwright) versucht; ist keiner erreichbar
// (z.B. wenn die App als reine Datei oder auf GitHub Pages läuft), wird auf
// das Browser-Scraping über CORS-Proxies zurückgegriffen.
import { buildAll } from './outfits.js'
import { scoreManual, scrape as localScrape } from './scraper.js'

async function serverScrape(url) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 45000)
  try {
    const res = await fetch('api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error('no server')
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  async scrape(url) {
    try {
      // Server mit echtem Browser – funktioniert auch bei JS-lastigen Shops
      return await serverScrape(url)
    } catch (e) {
      // Kein Server erreichbar -> Browser-Fallback (eingeschränkt)
      return localScrape(url)
    }
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
