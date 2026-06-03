import { useEffect, useState } from "react"
import RankedList from "./components/RankedList/RankedList"
import SliderPanel from "./components/SliderPanel/SliderPanel"
import MapPanel from "./components/MapPanel/MapPanel"
import ComparePanel from "./components/ComparePanel/ComparePanel"
import { getCityData, getCityZScores } from "./services/api"
import { computeScores } from "./utils/scoring"
import { DEFAULT_WEIGHTS } from "./utils/constants"
import "./App.css"

function App() {
  const [cityData, setCityData] = useState([])
  const [zScoreMap, setZScoreMap] = useState({})
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const [scoredCities, setScoredCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCities, setSelectedCities] = useState([])

  useEffect(() => {
    async function loadData() {
      try {
        const cities = await getCityData()
        const zScores = await getCityZScores()
        const map = {}
        zScores.forEach(entry => { map[entry.city_id] = entry.z_scores })
        setCityData(cities)
        setZScoreMap(map)
        setScoredCities(computeScores(cities, map, DEFAULT_WEIGHTS))
      } catch (err) {
        console.error(err)
        setError("Failed to load city data.")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (cityData.length === 0) return
    setScoredCities(computeScores(cityData, zScoreMap, weights))
  }, [weights])

  function handleWeightChange(factor, value) {
    setWeights(prev => ({ ...prev, [factor]: value }))
  }

  function handleSelectCity(city, shiftKey = false) {
    setSelectedCities(prev => {
      const alreadyIdx = prev.findIndex(c => c.city_id === city.city_id)
      if (alreadyIdx !== -1) {
        return prev.filter(c => c.city_id !== city.city_id)
      }
      if (shiftKey && prev.length >= 1) {
        return [prev[0], city]
      }
      if (prev.length === 2) return [city, prev[1]]
      return [city]
    })
  }

  if (loading) return <h1>Loading...</h1>
  if (error) return <h1>{error}</h1>

  return (
    <div className="app-layout">
      <RankedList
        cityData={scoredCities}
        selectedCities={selectedCities}
        onSelectCity={handleSelectCity}
      />

      <div className="main-content">
        <div className="slider-panel">
          <SliderPanel weights={weights} onWeightChange={handleWeightChange} />
          <div className="slider-panel-instructions">
            <span>Sliders range from 0 (exclude) to 10 (maximum weight)</span>
            <span>Shift+click any city on the map or list to compare two cities</span>
          </div>
        </div>

        <div className="maps-column">
          <div className="map-container">
            <MapPanel
              cityData={scoredCities}
              selectedCities={selectedCities}
              onSelectCity={handleSelectCity}
            />
          </div>
        </div>
      </div>

      <ComparePanel
        selectedCities={selectedCities}
        zScoreMap={zScoreMap}
        weights={weights}
        onClose={() => setSelectedCities(prev => prev.slice(0, 1))}
      />
    </div>
  )
}

export default App
