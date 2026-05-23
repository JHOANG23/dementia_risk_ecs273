import { addMockRiskScores } from "../utils/mockData"

/*
Expected backend city format:

{
  city_name: string,
  state_name: string,

  location: {
    coordinates: [longitude, latitude]
  },

  risk_score?: number
}
*/

const API_BASE_URL = "http://localhost:8000"

export async function getCityData() {

  const response = await fetch(`${API_BASE_URL}/city_coordinates`)

  if (!response.ok) {
    throw new Error("Failed to fetch city data.")
  }

  const data = await response.json()

  /*
    TEMPORARY:
    Add fake risk scores until backend provides them.
  */

  return addMockRiskScores(data.items)
}