import React from 'react'
import ScoreBars from './ScoreBars.jsx'

const CATEGORY_LABELS = {
  dress: 'Kleid',
  top: 'Oberteil',
  bottom: 'Unterteil',
  outerwear: 'Mantel/Blazer',
  shoes: 'Schuhe',
  bag: 'Tasche',
  jewelry: 'Schmuck/Accessoire',
  other: 'Sonstiges',
}

function placeholder(category) {
  const map = {
    dress: '👗', top: '👚', bottom: '👖', outerwear: '🧥',
    shoes: '👠', bag: '👜', jewelry: '💍', other: '🧷',
  }
  return map[category] || '🧷'
}

export default function ProductCard({ product, status, onStatus }) {
  const price = product.price
    ? `${product.price} ${product.currency || '€'}`
    : 'Preis offen'

  return (
    <article className={`product ${status === 'rejected' ? 'is-rejected' : ''}`}>
      <div className="product-media">
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy"
               onError={(e) => { e.currentTarget.style.display = 'none' }} />
        ) : (
          <span className="product-ph">{placeholder(product.category)}</span>
        )}
        <span className="product-overall" title="Gesamtwertung">
          {product.scores?.overall ?? '–'}
        </span>
      </div>

      <div className="product-body">
        <div className="product-cat">
          {CATEGORY_LABELS[product.category] || product.category}
          {product.color && <span className="product-color">· {product.color}</span>}
        </div>
        <h4 className="product-name" title={product.name}>{product.name}</h4>
        <div className="product-price">{price}</div>

        {product.tags?.length > 0 && (
          <div className="product-tags">
            {product.tags.map((t, i) => (
              <span className="tag" key={i}>{t}</span>
            ))}
          </div>
        )}

        <ScoreBars scores={product.scores} />

        <div className="product-actions">
          <button
            className={`pill-btn ${status === 'favorites' ? 'active gold' : ''}`}
            onClick={() => onStatus(status === 'favorites' ? null : 'favorites')}
            title="Favorit"
          >★ Favorit</button>
          <button
            className={`pill-btn ${status === 'saved' ? 'active' : ''}`}
            onClick={() => onStatus(status === 'saved' ? null : 'saved')}
            title="Speichern"
          >⌖ Merken</button>
          <button
            className={`pill-btn ${status === 'rejected' ? 'active dim' : ''}`}
            onClick={() => onStatus(status === 'rejected' ? null : 'rejected')}
            title="Ablehnen"
          >✕</button>
          {product.link && (
            <a className="pill-btn link" href={product.link} target="_blank" rel="noreferrer">
              ↗ Shop
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
