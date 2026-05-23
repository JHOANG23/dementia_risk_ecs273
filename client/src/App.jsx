import { useEffect, useState } from "react"

import Map from "./components/Map/Map"

import { getCityData } from "./services/api"

import "./App.css"

function App() {

  const [cityData, setCityData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {

    async function loadData() {

      try {
        const data = await getCityData()
        setCityData(data)

      } catch (err) {
        console.error(err)
        setError("Failed to load city data.")

      } finally {
        setLoading(false)

      }
    }

    loadData()
  }, [])

  if (loading) {
    return <h1>Loading...</h1>
  }

  if (error) {
    return <h1>{error}</h1>
  }

  return (
    <div className="App">

      <h1>Dementia Risk Map</h1>

      <Map cityData={cityData} />

    </div>
  )
}

export default App