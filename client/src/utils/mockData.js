export function addMockRiskScores(cityData) {

  return cityData.map(city => ({

    ...city,

    score:
      city.score ??
      Math.random()
  }))
}