import { useState } from "react"
import "./sliderPanel.css"
import { FACTORS } from "../../utils/constants"
import { FACTOR_LABELS } from "./constants"

function SliderPanel({ weights, onWeightChange }) {
  const [editing, setEditing] = useState({})

  function handleValueClick(factor) {
    setEditing(prev => ({ ...prev, [factor]: String(weights[factor]) }))
  }

  function handleInputChange(factor, value) {
    setEditing(prev => ({ ...prev, [factor]: value }))
  }

  function handleInputBlur(factor) {
    const raw = editing[factor]
    const parsed = Number(raw)
    if (!isNaN(parsed)) {
      const clamped = Math.max(0, Math.min(100, Math.round(parsed)))
      onWeightChange(factor, clamped)
    }
    setEditing(prev => {
      const next = { ...prev }
      delete next[factor]
      return next
    })
  }

  function handleInputKeyDown(factor, e) {
    if (e.key === "Enter") e.target.blur()
    if (e.key === "Escape") {
      setEditing(prev => {
        const next = { ...prev }
        delete next[factor]
        return next
      })
    }
  }

  return (
    <div className="slider-panel-inner">
      {FACTORS.map(factor => (
        <div key={factor} className="slider-item">
          <label className="slider-label">{FACTOR_LABELS[factor]}</label>
          <input
            type="range"
            min={0}
            max={100}
            value={weights[factor]}
            onChange={e => onWeightChange(factor, Number(e.target.value))}
            className="slider-input"
          />
          {editing[factor] !== undefined ? (
            <input
              type="number"
              className="slider-value-input"
              value={editing[factor]}
              min={0}
              max={100}
              autoFocus
              onChange={e => handleInputChange(factor, e.target.value)}
              onBlur={() => handleInputBlur(factor)}
              onKeyDown={e => handleInputKeyDown(factor, e)}
            />
          ) : (
            <span
              className="slider-value clickable"
              title="Click to edit"
              onClick={() => handleValueClick(factor)}
            >
              {weights[factor]}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default SliderPanel
