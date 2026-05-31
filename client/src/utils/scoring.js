import { FACTORS } from "./constants"

export function computeScores(cityData, zScoreMap, weights) {
  const totalWeight = FACTORS.reduce((sum, f) => sum + (weights[f] ?? 0), 0)

  return cityData.map(city => {
    const zScores = zScoreMap[city.city_id] ?? {}

    const score = totalWeight === 0
      ? 0
      : FACTORS.reduce((sum, f) => {
          const w = weights[f] ?? 0
          const z = zScores[f] ?? 0
          return sum + w * z
        }, 0)

    return { ...city, score }
  })
}
