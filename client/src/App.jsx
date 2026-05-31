import { useEffect, useState } from "react"
import Map from "./components/Map/Map"
import RankedList from "./components/RankedList/RankedList"
import SliderPanel from "./components/SliderPanel/SliderPanel"
import LisaMap from "./components/LisaMap/LisaMap"
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
  const [selectedCity, setSelectedCity] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const cities = await getCityData()
        const zScores = await getCityZScores()

        const map = {}
        zScores.forEach(entry => {
          map[entry.city_id] = entry.z_scores
        })

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

  if (loading) return <h1>Loading...</h1>
  if (error) return <h1>{error}</h1>

  return (
    <div className="app-layout">
      <RankedList
        cityData={scoredCities}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
      />

      <div className="main-content">
        <div className="slider-panel">
          <SliderPanel weights={weights} onWeightChange={handleWeightChange} />
        </div>

        <div className="maps-column">
          <div className="map-container">
            <Map
              cityData={scoredCities}
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
            />
          </div>

          <div className="map-container">
            <LisaMap
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
