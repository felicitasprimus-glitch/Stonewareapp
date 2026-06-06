// Outfit-Generator – Browser-Version (Port von backend/outfits.py).

export const OCCASIONS = {
  alltag_elegant: {
    label: 'Alltag Elegant', emoji: '☕',
    weights: { oldmoney: 0.30, elegant: 0.25, luxury: 0.20, everyday: 0.25, sexy: 0.0 },
    prefer_dress: false, want_outerwear: true,
    tip: 'Setze auf gedeckte Töne und edle Materialien. Ein Feinstrick-Oberteil '
      + 'zur weiten Hose, dazu Loafer und eine strukturierte Tasche – mühelos teuer.',
  },
  date_night: {
    label: 'Date Night', emoji: '🥂',
    weights: { oldmoney: 0.22, elegant: 0.26, luxury: 0.22, everyday: 0.0, sexy: 0.30 },
    prefer_dress: true, want_outerwear: false,
    tip: 'Elegant-sexy statt billig: ein figurbetontes Seiden- oder Satinkleid, '
      + 'feine Sandaletten und dezenter Goldschmuck. Weniger ist mehr.',
  },
  business_chic: {
    label: 'Business Chic', emoji: '💼',
    weights: { oldmoney: 0.30, elegant: 0.30, luxury: 0.25, everyday: 0.15, sexy: 0.0 },
    prefer_dress: false, want_outerwear: true,
    tip: 'Tailliertes Oberteil, Marlenehose oder Bleistiftrock, ein Blazer in Camel '
      + 'oder Navy. Pumps oder Loafer – klare Linien, keine Logos.',
  },
  sommerurlaub: {
    label: 'Sommerurlaub', emoji: '🌿',
    weights: { oldmoney: 0.28, elegant: 0.22, luxury: 0.20, everyday: 0.30, sexy: 0.0 },
    prefer_dress: true, want_outerwear: false,
    tip: 'Leinen und Creme-Töne, ein luftiges Kleid oder Bluse zur weiten Hose, '
      + 'flache Sandalen oder Espadrilles und eine Bast-/Lederbeuteltasche.',
  },
  dinner: {
    label: 'Dinner Outfit', emoji: '🍷',
    weights: { oldmoney: 0.26, elegant: 0.30, luxury: 0.26, everyday: 0.0, sexy: 0.18 },
    prefer_dress: true, want_outerwear: true,
    tip: 'Ein schlichtes Etui- oder Wickelkleid in Schwarz oder Navy, dazu Absatz, '
      + 'eine kleine Clutch und Perlen oder filigraner Goldschmuck.',
  },
  instagram: {
    label: 'Instagram Look', emoji: '📸',
    weights: { oldmoney: 0.30, elegant: 0.24, luxury: 0.24, everyday: 0.05, sexy: 0.17 },
    prefer_dress: true, want_outerwear: true,
    tip: 'Monochromer Creme- oder Camel-Look für maximalen Quiet-Luxury-Effekt. '
      + 'Ton-in-Ton kombinieren, eine ikonische Tasche als Statement.',
  },
}

const SLOT_LABELS = {
  top: 'Oberteil', bottom: 'Unterteil', dress: 'Kleid', shoes: 'Schuhe',
  bag: 'Tasche', jewelry: 'Schmuck / Accessoire', outerwear: 'Mantel / Blazer',
}

const fit = (p, weights) => {
  const s = p.scores || {}
  return Object.entries(weights).reduce((sum, [dim, w]) => sum + (s[dim] || 0) * w, 0)
}

function byCategory(products) {
  const buckets = { dress: [], top: [], bottom: [], shoes: [], bag: [], jewelry: [], outerwear: [], other: [] }
  for (const p of products) (buckets[p.category] || buckets.other).push(p)
  return buckets
}

function best(items, weights, used) {
  let pool = items.filter((p) => !used.has(p.link))
  if (!pool.length) pool = items
  if (!pool.length) return null
  return pool.reduce((a, b) => (fit(b, weights) > fit(a, weights) ? b : a))
}

const price = (p) => (p && p.price ? Number(p.price) : 0)

function buildOutfit(key, spec, buckets) {
  const weights = spec.weights
  const used = new Set()
  const items = {}
  const hasDress = buckets.dress.length > 0
  const hasSeparates = buckets.top.length > 0 && buckets.bottom.length > 0

  let useDress = false
  if (spec.prefer_dress && hasDress) useDress = true
  else if (hasDress && !hasSeparates) useDress = true

  if (useDress) {
    const d = best(buckets.dress, weights, used)
    if (d) { items.dress = d; used.add(d.link) }
  } else {
    const t = best(buckets.top, weights, used)
    if (t) { items.top = t; used.add(t.link) }
    const b = best(buckets.bottom, weights, used)
    if (b) { items.bottom = b; used.add(b.link) }
    if (!Object.keys(items).length && hasDress) {
      const d = best(buckets.dress, weights, used)
      if (d) { items.dress = d; used.add(d.link) }
    }
  }

  for (const slot of ['shoes', 'bag', 'jewelry']) {
    const pick = best(buckets[slot], weights, used)
    if (pick) { items[slot] = pick; used.add(pick.link) }
  }

  if (spec.want_outerwear && buckets.outerwear.length) {
    const o = best(buckets.outerwear, weights, used)
    if (o) { items.outerwear = o; used.add(o.link) }
  }

  if (Object.keys(items).length < 2) return null

  const vals = Object.values(items)
  const total = Math.round(vals.reduce((s, p) => s + price(p), 0) * 100) / 100
  const fits = vals.map((p) => fit(p, weights))
  const match = fits.length ? Math.round(fits.reduce((a, b) => a + b, 0) / fits.length) : 0

  return {
    occasion: key,
    label: spec.label,
    emoji: spec.emoji,
    tip: spec.tip,
    total_price: total,
    currency: (vals.find((p) => p.currency) || {}).currency || 'EUR',
    match,
    items: Object.entries(items).map(([slot, prod]) => ({
      slot, slot_label: SLOT_LABELS[slot] || slot, ...prod,
    })),
  }
}

export function buildAll(products, occasions = null, boostLinks = null) {
  let list = products
  if (boostLinks && boostLinks.size) {
    list = products.map((p) => {
      if (!boostLinks.has(p.link)) return p
      const sc = { ...(p.scores || {}) }
      for (const k of Object.keys(sc)) sc[k] = Math.min(100, sc[k] + 25)
      return { ...p, scores: sc }
    })
  }
  const buckets = byCategory(list)
  const keys = occasions || Object.keys(OCCASIONS)
  const outfits = []
  for (const key of keys) {
    const spec = OCCASIONS[key]
    if (!spec) continue
    const outfit = buildOutfit(key, spec, buckets)
    if (outfit) outfits.push(outfit)
  }
  return outfits
}
