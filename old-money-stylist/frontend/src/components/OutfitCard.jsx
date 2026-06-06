import React from 'react'

function placeholder(slot) {
  const map = {
    dress: '👗', top: '👚', bottom: '👖', outerwear: '🧥',
    shoes: '👠', bag: '👜', jewelry: '💍',
  }
  return map[slot] || '🧷'
}

export default function OutfitCard({ outfit }) {
  return (
    <article className="outfit">
      <header className="outfit-head">
        <div>
          <span className="outfit-emoji">{outfit.emoji}</span>
          <h3>{outfit.label}</h3>
        </div>
        <span className="outfit-match" title="Stil-Übereinstimmung">
          {outfit.match}%
        </span>
      </header>

      <div className="outfit-items">
        {outfit.items.map((it, i) => (
          <a
            key={i}
            className="outfit-item"
            href={it.link || '#'}
            target="_blank"
            rel="noreferrer"
          >
            <div className="outfit-thumb">
              {it.image ? (
                <img src={it.image} alt={it.name} loading="lazy"
                     onError={(e) => { e.currentTarget.style.display = 'none' }} />
              ) : (
                <span>{placeholder(it.slot)}</span>
              )}
            </div>
            <div className="outfit-item-meta">
              <span className="outfit-slot">{it.slot_label}</span>
              <span className="outfit-item-name">{it.name}</span>
              <span className="outfit-item-price">
                {it.price ? `${it.price} ${it.currency || '€'}` : '—'}
              </span>
            </div>
          </a>
        ))}
      </div>

      <p className="outfit-tip"><strong>Styling-Tipp.</strong> {outfit.tip}</p>

      <footer className="outfit-foot">
        <span className="outfit-total">
          Gesamtpreis <strong>{outfit.total_price} {outfit.currency || '€'}</strong>
        </span>
      </footer>
    </article>
  )
}
