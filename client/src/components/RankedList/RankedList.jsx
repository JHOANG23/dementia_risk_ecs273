import "./rankedList.css"
import { useEffect, useRef } from "react"

function RankedList({ cityData, selectedCities, onSelectCity }) {
  const sortedCities = [...cityData].sort((a, b) => b.score - a.score)
  const itemRefs = useRef({})

  const primaryId = selectedCities[0]?.city_id
  const secondaryId = selectedCities[1]?.city_id

  useEffect(() => {
    if (!primaryId) return
    const el = itemRefs.current[primaryId]
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [primaryId])

  function getSelectionClass(city) {
    if (city.city_id === primaryId) return "selected primary"
    if (city.city_id === secondaryId) return "selected secondary"
    return ""
  }

  return (
    <div className="ranked-list-container">
      <div className="ranked-list-header">City Rankings</div>
      <div className="ranked-list-hint">Shift+click to compare two cities</div>
      <div className="ranked-list">
        {sortedCities.map((city, index) => (
          <div
            key={city.city_id}
            ref={el => { itemRefs.current[city.city_id] = el }}
            className={`ranked-list-item ${getSelectionClass(city)}`}
            onClick={e => onSelectCity(city, e.shiftKey)}
          >
            <div className="rank-number">#{index + 1}</div>
            <div className="city-info">
              <div className="city-name">{city.city_name}</div>
              <div className="state-name">{city.state_name}</div>
            </div>
            <div className="city-score">{(city.score ?? 0).toFixed(3)}</div>
            {city.city_id === primaryId && <span className="selection-badge primary-badge">A</span>}
            {city.city_id === secondaryId && <span className="selection-badge secondary-badge">B</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default RankedList
