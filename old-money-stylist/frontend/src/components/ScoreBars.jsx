import React from 'react'

const DIMS = [
  ['oldmoney', 'Old Money'],
  ['elegant', 'Elegant'],
  ['luxury', 'Hochwertig'],
  ['sexy', 'Sexy-tauglich'],
  ['everyday', 'Alltag'],
]

export default function ScoreBars({ scores }) {
  if (!scores) return null
  return (
    <div className="scorebars">
      {DIMS.map(([key, label]) => (
        <div className="scorebar" key={key}>
          <span className="scorebar-label">{label}</span>
          <span className="scorebar-track">
            <span
              className="scorebar-fill"
              style={{ width: `${scores[key] || 0}%` }}
            />
          </span>
          <span className="scorebar-val">{scores[key] || 0}</span>
        </div>
      ))}
    </div>
  )
}
