const API_BASE_URL = "http://localhost:8000"

export async function getCityData() {
  const response = await fetch(`${API_BASE_URL}/all_cities_data`)

  if (!response.ok) {
    throw new Error("Failed to fetch city data.")
  }

  const data = await response.json()
  return data.items
}

export async function getCityZScores() {
  const response = await fetch(`${API_BASE_URL}/all_cities_zscores`)

  if (!response.ok) {
    throw new Error("Failed to fetch city z-scores.")
  }

  const data = await response.json()
  return data.items
}
