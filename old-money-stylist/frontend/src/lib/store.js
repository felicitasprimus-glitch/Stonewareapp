// Favoriten / gemerkte / abgelehnte Produkte – lokal im Browser (localStorage).
// So bleiben sie erhalten, egal ob die App lokal oder online (z.B. auf Render)
// läuft, und es wird keine serverseitige Datenbank benötigt.

const KEY = 'oms-store-v1'
const EMPTY = { favorites: [], saved: [], rejected: [] }

function idOf(p) {
  return p.link || p.name
}

export function loadStore() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { ...EMPTY, ...data }
  } catch (_) {
    return { ...EMPTY }
  }
}

function persist(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch (_) {}
  return store
}

// Setzt den Status eines Produkts. status = 'favorites' | 'saved' | 'rejected' | null
export function setStatus(product, status) {
  const store = loadStore()
  const id = idOf(product)
  for (const bucket of ['favorites', 'saved', 'rejected']) {
    store[bucket] = store[bucket].filter((p) => idOf(p) !== id)
  }
  if (status) store[status].push(product)
  return persist(store)
}

export function clearStore() {
  return persist({ ...EMPTY })
}
