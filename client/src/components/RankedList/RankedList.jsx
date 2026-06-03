import "./rankedList.css"
import { useEffect, useRef } from "react"

function RankedList({ cityData, selectedCity, onSelectCity }) {

  const sortedCities = [...cityData]
    .sort((a, b) => b.score - a.score)
  const itemRefs = useRef({})

  useEffect(() => {
    if (!selectedCity) return

    const key = selectedCity.city_id
    const selectedElement = itemRefs.current[key]

    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
      })
    }
  }, [selectedCity])

  return (
    <div className="ranked-list-container">
      <div className="ranked-list-header">
        City Rankings
      </div>
      <div className="ranked-list">
        {sortedCities.map((city, index) => (
          <div
            key={city.city_id}
            ref={(element) => {
              itemRefs.current[city.city_id] = element
            }}
            className={`ranked-list-item ${
              selectedCity?.city_id === city.city_id ? "selected" : ""
            }`}
            onClick={() => onSelectCity(city)}
          >
            <div className="rank-number">
              #{index + 1}
            </div>
            <div className="city-info">
              <div className="city-name">
                {city.city_name}
              </div>
              <div className="state-name">
                {city.state_name}
              </div>
            </div>
            <div className="city-score">
              {(city.score ?? 0).toFixed(3)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RankedList