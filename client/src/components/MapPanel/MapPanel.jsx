import { useState, useRef } from "react"
import Map from "../Map/Map"
import LisaMap from "../LisaMap/LisaMap"
import "./MapPanel.css"

const VIEWS = {
  PROJECTED: "projected",
  LISA: "lisa",
}

function MapPanel({ cityData, selectedCity, onSelectCity }) {
  const [activeView, setActiveView] = useState(VIEWS.PROJECTED)
  // Shared zoom transform: plain object { x, y, k }
  const [zoomTransform, setZoomTransform] = useState({ x: 0, y: 0, k: 1 })

  // Use a ref to track which map originated the zoom update,
  // so we don't bounce the transform back to the same map.
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
        {/* Both maps stay mounted; only visibility toggled */}
        <div
          className="map-layer"
          style={{ visibility: activeView === VIEWS.PROJECTED ? "visible" : "hidden" }}
        >
          <Map
            cityData={cityData}
            selectedCity={selectedCity}
            onSelectCity={onSelectCity}
            zoomTransform={zoomTransform}
            onZoomChange={(t) => handleZoomChange(VIEWS.PROJECTED, t)}
            isZoomSource={zoomSourceRef.current === VIEWS.PROJECTED}
          />
        </div>

        <div
          className="map-layer"
          style={{ visibility: activeView === VIEWS.LISA ? "visible" : "hidden" }}
        >
          <LisaMap
            selectedCity={selectedCity}
            onSelectCity={onSelectCity}
            zoomTransform={zoomTransform}
            onZoomChange={(t) => handleZoomChange(VIEWS.LISA, t)}
            isZoomSource={zoomSourceRef.current === VIEWS.LISA}
          />
        </div>
      </div>
    </div>
  )
}

export default MapPanel