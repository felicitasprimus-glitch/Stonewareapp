import React, { useEffect, useMemo, useState } from 'react'
import { api } from './lib/api.js'
import { exportOutfitsPdf } from './lib/pdf.js'
import ProductCard from './components/ProductCard.jsx'
import OutfitCard from './components/OutfitCard.jsx'

const TABS = [
  { key: 'discover', label: 'Entdecken' },
  { key: 'outfits', label: 'Outfits' },
  { key: 'favorites', label: 'Favoriten' },
]

const EMPTY_MANUAL = {
  link: '', name: '', price: '', image: '', color: '', category: '',
}

function idOf(p) {
  return p.link || p.name
}

export default function App() {
  const [tab, setTab] = useState('discover')

  // Produkte aus Scraping / manuell
  const [products, setProducts] = useState([])
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // Status-Map: id -> 'favorites' | 'saved' | 'rejected'
  const [statusMap, setStatusMap] = useState({})

  // Outfits
  const [outfits, setOutfits] = useState([])
  const [favOutfits, setFavOutfits] = useState([])
  const [building, setBuilding] = useState(false)

  // Manuelles Hinzufuegen
  const [showManual, setShowManual] = useState(false)
  const [manual, setManual] = useState(EMPTY_MANUAL)

  // Filter
  const [onlyHighlights, setOnlyHighlights] = useState(false)

  // Store beim Start laden
  useEffect(() => {
    api.store().then((data) => {
      const map = {}
      ;['favorites', 'saved', 'rejected'].forEach((b) =>
        (data[b] || []).forEach((p) => (map[idOf(p)] = b))
      )
      setStatusMap(map)
      // Favoriten/gespeicherte auch in die Produktliste uebernehmen
      const known = [...(data.favorites || []), ...(data.saved || []), ...(data.rejected || [])]
      setProducts((prev) => mergeProducts(prev, known))
    }).catch(() => {})
  }, [])

  function mergeProducts(a, b) {
    const map = new Map()
    ;[...a, ...b].forEach((p) => map.set(idOf(p), p))
    return [...map.values()]
  }

  async function handleScrape(e) {
    e?.preventDefault()
    if (!url.trim()) return
    setLoading(true); setError(''); setInfo('')
    try {
      const res = await api.scrape(url.trim())
      if (res.blocked || res.count === 0) {
        setError('Es konnten keine Produkte ausgelesen werden – die Seite blockiert evtl. ' +
                 'das Scraping. Füge Produkte manuell hinzu (Button unten).')
      } else {
        setInfo(`${res.count} Produkte gefunden (${res.source}, Methode: ${res.strategy}).`)
      }
      setProducts((prev) => mergeProducts(prev, res.products || []))
      setTab('discover')
    } catch (err) {
      setError(err.message + ' — Du kannst Produkte manuell hinzufügen.')
    } finally {
      setLoading(false)
    }
  }

  async function setStatus(product, status) {
    const id = idOf(product)
    const prev = statusMap[id]
    // optimistic update
    setStatusMap((m) => {
      const n = { ...m }
      if (status) n[id] = status
      else delete n[id]
      return n
    })
    try {
      if (prev && prev !== status) {
        await api.removeFromStore(prev, id)
      }
      if (status) {
        await api.addToStore(status, product)
      } else if (prev) {
        await api.removeFromStore(prev, id)
      }
    } catch (err) {
      setError('Speichern fehlgeschlagen: ' + err.message)
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault()
    if (!manual.name.trim()) return
    try {
      const payload = {
        ...manual,
        price: manual.price ? parseFloat(String(manual.price).replace(',', '.')) : null,
        link: manual.link || 'manuell://' + encodeURIComponent(manual.name),
      }
      const product = await api.manual(payload)
      setProducts((prev) => mergeProducts(prev, [product]))
      setManual(EMPTY_MANUAL)
      setShowManual(false)
      setInfo('Produkt hinzugefügt und bewertet.')
    } catch (err) {
      setError(err.message)
    }
  }

  // Produkte fuer Outfit-Erstellung (ohne abgelehnte)
  const usable = useMemo(
    () => products.filter((p) => statusMap[idOf(p)] !== 'rejected'),
    [products, statusMap]
  )

  const favoriteLinks = useMemo(
    () => products.filter((p) => statusMap[idOf(p)] === 'favorites').map(idOf),
    [products, statusMap]
  )

  async function buildOutfits() {
    if (usable.length < 2) {
      setError('Zu wenige Produkte. Lies einen Shop aus oder füge Produkte hinzu.')
      return
    }
    setBuilding(true); setError('')
    try {
      const res = await api.outfits(usable, null, favoriteLinks)
      setOutfits(res.outfits || [])
      setTab('outfits')
      if (!res.outfits?.length) {
        setError('Keine vollständigen Outfits möglich – es fehlen Kategorien (z.B. Schuhe).')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBuilding(false)
    }
  }

  async function buildFavoriteOutfits() {
    setBuilding(true); setError('')
    try {
      const res = await api.favoriteOutfits(null)
      setFavOutfits(res.outfits || [])
      if (!res.outfits?.length) {
        setInfo(res.message || 'Noch keine Favoriten gespeichert.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBuilding(false)
    }
  }

  const displayProducts = useMemo(() => {
    let list = products
    if (onlyHighlights) list = list.filter((p) => (p.scores?.overall || 0) >= 65)
    return [...list].sort((a, b) => (b.scores?.overall || 0) - (a.scores?.overall || 0))
  }, [products, onlyHighlights])

  const favoriteProducts = useMemo(
    () => products.filter((p) => statusMap[idOf(p)] === 'favorites'),
    [products, statusMap]
  )
  const savedProducts = useMemo(
    () => products.filter((p) => statusMap[idOf(p)] === 'saved'),
    [products, statusMap]
  )

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead-inner">
          <p className="eyebrow">Quiet Luxury · Curated Wardrobe</p>
          <h1>Old Money Outfit Stylist</h1>
          <p className="subtitle">
            Elegante, hochwertige Outfits aus deinen Lieblingsshops – Creme, Camel,
            Navy &amp; Gold. Tragbar, erwachsen, nie billig.
          </p>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === 'favorites' && favoriteProducts.length > 0 && (
              <span className="tab-badge">{favoriteProducts.length}</span>
            )}
          </button>
        ))}
      </nav>

      <main className="wrap">
        {error && <div className="alert error">{error}</div>}
        {info && <div className="alert info">{info}</div>}

        {tab === 'discover' && (
          <>
            <form className="urlbar" onSubmit={handleScrape}>
              <input
                type="text"
                placeholder="Shop- oder Kategorie-Link einfügen (z.B. massimodutti.com/de/…)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button className="btn primary" disabled={loading}>
                {loading ? 'Lese aus…' : 'Outfits finden'}
              </button>
            </form>

            <div className="toolbar">
              <button className="btn ghost" onClick={() => setShowManual((s) => !s)}>
                {showManual ? '– Manuell abbrechen' : '+ Produkt manuell hinzufügen'}
              </button>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={onlyHighlights}
                  onChange={(e) => setOnlyHighlights(e.target.checked)}
                />
                Nur Highlights (≥ 65)
              </label>
              <span className="count">{products.length} Produkte</span>
              <button
                className="btn primary"
                onClick={buildOutfits}
                disabled={building || usable.length < 2}
              >
                {building ? 'Stelle zusammen…' : '✨ Outfits erstellen'}
              </button>
            </div>

            {showManual && (
              <form className="manual" onSubmit={handleManualSubmit}>
                <h4>Produkt manuell hinzufügen</h4>
                <p className="hint">
                  Falls ein Shop das Auslesen blockiert: Produktdaten hier eintragen.
                  Stil-Bewertung erfolgt automatisch.
                </p>
                <div className="manual-grid">
                  <input placeholder="Produktname *" value={manual.name}
                    onChange={(e) => setManual({ ...manual, name: e.target.value })} required />
                  <input placeholder="Preis (z.B. 199.00)" value={manual.price}
                    onChange={(e) => setManual({ ...manual, price: e.target.value })} />
                  <input placeholder="Produktlink" value={manual.link}
                    onChange={(e) => setManual({ ...manual, link: e.target.value })} />
                  <input placeholder="Bild-URL" value={manual.image}
                    onChange={(e) => setManual({ ...manual, image: e.target.value })} />
                  <input placeholder="Farbe (optional)" value={manual.color}
                    onChange={(e) => setManual({ ...manual, color: e.target.value })} />
                  <select value={manual.category}
                    onChange={(e) => setManual({ ...manual, category: e.target.value })}>
                    <option value="">Kategorie automatisch</option>
                    <option value="dress">Kleid</option>
                    <option value="top">Oberteil</option>
                    <option value="bottom">Unterteil</option>
                    <option value="outerwear">Mantel/Blazer</option>
                    <option value="shoes">Schuhe</option>
                    <option value="bag">Tasche</option>
                    <option value="jewelry">Schmuck/Accessoire</option>
                  </select>
                </div>
                <button className="btn primary" type="submit">Hinzufügen &amp; bewerten</button>
              </form>
            )}

            {displayProducts.length === 0 ? (
              <EmptyState
                title="Noch keine Produkte"
                text="Füge oben einen Shop-Link ein – das Tool liest Name, Preis, Bild, Farbe
                      und Kategorie aus und bewertet jedes Teil nach Old-Money-Stil."
              />
            ) : (
              <div className="grid products-grid">
                {displayProducts.map((p) => (
                  <ProductCard
                    key={idOf(p)}
                    product={p}
                    status={statusMap[idOf(p)] || null}
                    onStatus={(s) => setStatus(p, s)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'outfits' && (
          <>
            <div className="toolbar">
              <button className="btn primary" onClick={buildOutfits} disabled={building}>
                {building ? 'Stelle zusammen…' : '↻ Neu zusammenstellen'}
              </button>
              {outfits.length > 0 && (
                <button className="btn gold"
                  onClick={() => exportOutfitsPdf(outfits, 'Old Money — Outfits')}>
                  ⬇ Als PDF exportieren
                </button>
              )}
              <span className="count">{outfits.length} Outfits</span>
            </div>
            {outfits.length === 0 ? (
              <EmptyState
                title="Noch keine Outfits"
                text="Wähle im Tab „Entdecken“ Produkte aus und klicke auf „Outfits erstellen“.
                      Das Tool baut Looks für Alltag, Date Night, Business, Urlaub, Dinner &amp; Instagram."
              />
            ) : (
              <div className="grid outfits-grid">
                {outfits.map((o) => (
                  <OutfitCard key={o.occasion} outfit={o} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'favorites' && (
          <>
            <div className="toolbar">
              <button className="btn primary" onClick={buildFavoriteOutfits} disabled={building}>
                {building ? 'Stelle zusammen…' : '✨ Bessere Outfits aus Favoriten'}
              </button>
              {favOutfits.length > 0 && (
                <button className="btn gold"
                  onClick={() => exportOutfitsPdf(favOutfits, 'Old Money — Favoriten-Outfits')}>
                  ⬇ Als PDF exportieren
                </button>
              )}
            </div>

            {favOutfits.length > 0 && (
              <>
                <h3 className="section-title">Outfits aus deinen Favoriten</h3>
                <div className="grid outfits-grid">
                  {favOutfits.map((o) => (
                    <OutfitCard key={o.occasion} outfit={o} />
                  ))}
                </div>
              </>
            )}

            <h3 className="section-title">★ Favoriten ({favoriteProducts.length})</h3>
            {favoriteProducts.length === 0 ? (
              <EmptyState
                title="Noch keine Favoriten"
                text="Markiere Produkte mit ★ – aus deinen Favoriten erstellt das Tool besonders
                      stimmige Outfits."
              />
            ) : (
              <div className="grid products-grid">
                {favoriteProducts.map((p) => (
                  <ProductCard key={idOf(p)} product={p}
                    status={statusMap[idOf(p)] || null} onStatus={(s) => setStatus(p, s)} />
                ))}
              </div>
            )}

            {savedProducts.length > 0 && (
              <>
                <h3 className="section-title">⌖ Gemerkt ({savedProducts.length})</h3>
                <div className="grid products-grid">
                  {savedProducts.map((p) => (
                    <ProductCard key={idOf(p)} product={p}
                      status={statusMap[idOf(p)] || null} onStatus={(s) => setStatus(p, s)} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <footer className="site-foot">
        Old Money Outfit Stylist · Quiet Luxury Wardrobe Tool
      </footer>
    </div>
  )
}

function EmptyState({ title, text }) {
  return (
    <div className="empty">
      <div className="empty-mark">❦</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}
