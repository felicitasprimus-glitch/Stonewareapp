// Zentrale API-Anbindung an das FastAPI-Backend.
const BASE = '/api'

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let msg = `Fehler ${res.status}`
    try {
      const data = await res.json()
      msg = data.detail || msg
    } catch (_) {}
    throw new Error(msg)
  }
  return res.json()
}

export const api = {
  health: () => req('/health'),
  occasions: () => req('/occasions'),
  scrape: (url) => req('/scrape', { method: 'POST', body: JSON.stringify({ url }) }),
  manual: (product) => req('/manual', { method: 'POST', body: JSON.stringify(product) }),
  outfits: (products, occasions, boost_links) =>
    req('/outfits', {
      method: 'POST',
      body: JSON.stringify({ products, occasions, boost_links }),
    }),
  store: () => req('/store'),
  addToStore: (bucket, product) =>
    req(`/store/${bucket}`, { method: 'POST', body: JSON.stringify({ product }) }),
  removeFromStore: (bucket, id) =>
    req(`/store/${bucket}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  clearStore: (bucket) =>
    req('/store/clear', { method: 'POST', body: JSON.stringify({ bucket }) }),
  favoriteOutfits: (occasions) =>
    req('/outfits/favorites', { method: 'POST', body: JSON.stringify({ occasions }) }),
}
