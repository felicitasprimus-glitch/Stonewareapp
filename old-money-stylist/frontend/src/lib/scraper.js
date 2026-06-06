// Browser-Scraper – liest Produktdaten direkt im Browser aus.
// Da Browser fremde Shop-Seiten nicht direkt laden dürfen (CORS), nutzen wir
// kostenlose öffentliche CORS-Proxies. Klappt das nicht (Shop blockiert),
// hilft der manuelle Modus.

import { detectCategory, detectColor, scoreProduct } from './scoring.js'

const PROXIES = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
  (u) => u, // direkter Versuch (manche Shops erlauben CORS)
]

const PRICE_RE = /(?:€|EUR|CHF|£|\$)\s?(\d[\d.\s]*[,.]\d{2})|(\d[\d.\s]*[,.]\d{2})\s?(?:€|EUR|CHF)/

function parsePrice(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  let s = String(value)
  const m = PRICE_RE.exec(s)
  if (m) s = m[1] || m[2] || s
  s = s.trim().replace(/ /g, '').replace(/\s/g, '')
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.')
  else if (s.includes(',')) s = s.replace(',', '.')
  s = s.replace(/[^0-9.]/g, '')
  const n = parseFloat(s)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

function absUrl(base, link) {
  if (!link) return null
  try { return new URL(link, base).href } catch { return link }
}

function domain(url) {
  try { return new URL(url).hostname.replace('www.', '') } catch { return '' }
}

function makeProduct(name, priceVal, image, link, baseUrl, currency = 'EUR', rawColor = null) {
  name = (name || '').trim()
  if (!name) return null
  link = absUrl(baseUrl, link) || baseUrl
  image = absUrl(baseUrl, image)
  const color = rawColor || detectColor(name)
  const category = detectCategory(name)
  const s = scoreProduct(name, category, color)
  return {
    name: name.slice(0, 160),
    price: parsePrice(priceVal),
    currency: currency || 'EUR',
    image,
    color: s.color,
    category,
    link,
    source: domain(link),
    scores: s.scores,
    tags: s.tags,
  }
}

// ---- JSON-LD -------------------------------------------------------------
function* iterJsonLd(doc) {
  for (const tag of doc.querySelectorAll('script[type="application/ld+json"]')) {
    const raw = (tag.textContent || '').trim()
    if (!raw) continue
    let data
    try { data = JSON.parse(raw) } catch {
      try { data = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)) } catch { continue }
    }
    if (Array.isArray(data)) yield* data
    else if (data && typeof data === 'object') {
      if (Array.isArray(data['@graph'])) yield* data['@graph']
      else yield data
    }
  }
}

function nodeType(node) {
  let t = node['@type'] || ''
  if (Array.isArray(t)) t = t[0] || ''
  return String(t).toLowerCase()
}

function productFromLd(node, baseUrl) {
  const name = node.name
  let image = node.image
  if (Array.isArray(image)) image = image[0]
  if (image && typeof image === 'object') image = image.url
  const link = node.url || node['@id']
  let priceVal = null
  let currency = 'EUR'
  let offers = node.offers
  if (Array.isArray(offers)) offers = offers[0]
  if (offers && typeof offers === 'object') {
    priceVal = offers.price || offers.lowPrice
    currency = offers.priceCurrency || currency
  }
  return makeProduct(name, priceVal, image, link, baseUrl, currency, node.color)
}

function parseJsonLd(doc, baseUrl) {
  const products = []
  for (const node of iterJsonLd(doc)) {
    if (!node || typeof node !== 'object') continue
    const t = nodeType(node)
    if (t === 'product') {
      const p = productFromLd(node, baseUrl)
      if (p) products.push(p)
    } else if (t === 'itemlist' || t === 'collectionpage') {
      for (const el of node.itemListElement || []) {
        const item = el && el.item
        if (item && typeof item === 'object' && nodeType(item) === 'product') {
          const p = productFromLd(item, baseUrl)
          if (p) products.push(p)
        }
      }
    }
  }
  return products
}

// ---- Open Graph ----------------------------------------------------------
function parseOpenGraph(doc, baseUrl) {
  const meta = (prop) => {
    const el = doc.querySelector(`meta[property="${prop}"]`) || doc.querySelector(`meta[name="${prop}"]`)
    return el ? el.getAttribute('content') : null
  }
  const ogType = (meta('og:type') || '').toLowerCase()
  const name = meta('og:title') || (doc.querySelector('title') || {}).textContent
  const image = meta('og:image')
  const link = meta('og:url') || baseUrl
  const priceVal = meta('product:price:amount') || meta('og:price:amount')
  const currency = meta('product:price:currency') || meta('og:price:currency') || 'EUR'
  if (!name) return []
  if (ogType.includes('product') || priceVal) {
    const p = makeProduct(name, priceVal, image, link, baseUrl, currency)
    return p ? [p] : []
  }
  return []
}

// ---- Heuristik -----------------------------------------------------------
const CARD_SELECTORS = [
  "[data-testid*='product']", '[data-product]', 'li.product', 'article.product',
  '.product-card', '.product-item', '.product-tile', '.product', '.grid-product',
  "[class*='ProductCard']", "[class*='product-card']", "[class*='ProductTile']",
  "[class*='product-grid-item']",
]

function textPrice(el) {
  for (const sub of el.querySelectorAll("[class*='price'], [data-price], .price, [itemprop='price']")) {
    const txt = sub.getAttribute('content') || sub.textContent.trim()
    if (txt && PRICE_RE.test(txt)) return txt
  }
  const m = PRICE_RE.exec(el.textContent)
  return m ? m[0] : null
}

function imgSrc(el) {
  const img = el.querySelector('img')
  if (!img) return null
  for (const attr of ['src', 'data-src', 'data-original', 'data-srcset', 'srcset']) {
    const v = img.getAttribute(attr)
    if (v) return v.split(',')[0].trim().split(' ')[0]
  }
  return null
}

function elName(el) {
  for (const sel of ["[class*='name']", "[class*='title']", 'h2', 'h3', 'h4', 'a[title]']) {
    const sub = el.querySelector(sel)
    if (sub) {
      const txt = sub.getAttribute('title') || sub.textContent.trim()
      if (txt && txt.length > 2) return txt
    }
  }
  const a = el.querySelector('a')
  return a && a.textContent.trim() ? a.textContent.trim() : null
}

function elLink(el) {
  const a = el.querySelector('a[href]')
  return a ? a.getAttribute('href') : null
}

function parseHeuristic(doc, baseUrl, limit = 60) {
  let cards = []
  for (const sel of CARD_SELECTORS) {
    const found = doc.querySelectorAll(sel)
    if (found.length > cards.length) cards = Array.from(found)
    if (cards.length >= 3) break
  }
  const seen = new Set()
  const products = []
  for (const el of cards.slice(0, limit * 2)) {
    const name = elName(el)
    if (!name) continue
    const key = name.toLowerCase().slice(0, 80)
    if (seen.has(key)) continue
    seen.add(key)
    const p = makeProduct(name, textPrice(el), imgSrc(el), elLink(el), baseUrl)
    if (p) products.push(p)
    if (products.length >= limit) break
  }
  return products
}

async function fetchHtml(url) {
  for (const build of PROXIES) {
    try {
      const res = await fetch(build(url), { headers: { Accept: 'text/html' } })
      if (!res.ok) continue
      const text = await res.text()
      if (text && text.length > 500) return text
    } catch { /* nächsten Proxy versuchen */ }
  }
  return null
}

export async function scrape(url) {
  let target = url.trim()
  if (!/^https?:\/\//.test(target)) target = 'https://' + target

  const html = await fetchHtml(target)
  if (!html) {
    return { url: target, source: domain(target), method: 'browser', strategy: 'none',
      count: 0, products: [], blocked: true }
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  let products = parseJsonLd(doc, target)
  let strategy = 'jsonld'
  if (products.length < 2) {
    const og = parseOpenGraph(doc, target)
    if (og.length) { products = products.concat(og); strategy = 'opengraph' }
  }
  if (products.length < 2) {
    const heur = parseHeuristic(doc, target)
    if (heur.length > products.length) { products = heur; strategy = 'heuristic' }
  }

  const deduped = new Map()
  for (const p of products) deduped.set((p.link || '') + '|' + p.name.toLowerCase(), p)
  products = Array.from(deduped.values())

  return { url: target, source: domain(target), method: 'browser', strategy,
    count: products.length, products, blocked: products.length === 0 }
}

export function scoreManual({ link, name, price, image, color, category, currency = 'EUR' }) {
  name = (name || '').trim()
  const cat = category || detectCategory(name)
  const s = scoreProduct(name, cat, color)
  return {
    name: name.slice(0, 160),
    price: price ?? null,
    currency: currency || 'EUR',
    image: image || null,
    color: s.color,
    category: cat,
    link: (link || '').trim(),
    source: 'manuell',
    scores: s.scores,
    tags: [...s.tags, 'manuell'],
  }
}
