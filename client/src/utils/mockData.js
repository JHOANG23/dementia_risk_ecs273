export function addMockRiskScores(cityData) {

  return cityData.map(city => ({

    ...city,

    risk_score:
      city.risk_score ??
      Math.random()
  }))
}