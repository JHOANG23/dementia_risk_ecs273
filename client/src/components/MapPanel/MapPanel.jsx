import { useState, useRef } from "react"
import Map from "../Map/Map"
import LisaMap from "../LisaMap/LisaMap"
import "./MapPanel.css"

const VIEWS = {
  PROJECTED: "projected",
  LISA: "lisa",
}

function MapPanel({ cityData, selectedCities, onSelectCity }) {
  const [activeView, setActiveView] = useState(VIEWS.PROJECTED)
  const [zoomTransform, setZoomTransform] = useState({ x: 0, y: 0, k: 1 })
  const zoomSourceRef = useRef(null)

  function handleZoomChange(source, transform) {
    zoomSourceRef.current = source
    setZoomTransform(transform)
  }

  return (
    <div className="map-panel">
      <div className="map-panel-toggle">
        <button
          className={`toggle-btn ${activeView === VIEWS.PROJECTED ? "active" : ""}`}
          onClick={() => setActiveView(VIEWS.PROJECTED)}
        >
          Projected Score
        </button>
        <button
          className={`toggle-btn ${activeView === VIEWS.LISA ? "active" : ""}`}
          onClick={() => setActiveView(VIEWS.LISA)}
        >
          LISA Clusters
        </button>
      </div>

      <div className="map-panel-canvas">
        <div
          className="map-layer"
          style={{ visibility: activeView === VIEWS.PROJECTED ? "visible" : "hidden" }}
        >
          <Map
            cityData={cityData}
            selectedCities={selectedCities}
            onSelectCity={onSelectCity}
            zoomTransform={zoomTransform}
            onZoomChange={t => handleZoomChange(VIEWS.PROJECTED, t)}
            isZoomSource={zoomSourceRef.current === VIEWS.PROJECTED}
          />
        </div>

        <div
          className="map-layer"
          style={{ visibility: activeView === VIEWS.LISA ? "visible" : "hidden" }}
        >
          <LisaMap
            selectedCities={selectedCities}
            onSelectCity={onSelectCity}
            zoomTransform={zoomTransform}
            onZoomChange={t => handleZoomChange(VIEWS.LISA, t)}
            isZoomSource={zoomSourceRef.current === VIEWS.LISA}
          />
        </div>
      </div>
    </div>
  )
}

export default MapPanel
