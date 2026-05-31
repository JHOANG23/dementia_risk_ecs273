import * as d3 from "d3"
import { feature } from "topojson-client"
import { STATE_FILL_COLOR, STATE_BORDER_COLOR, CITY_POINT_COLOR } from "./constants"
import { showTooltip, moveTooltip, hideTooltip } from "./tooltipHelpers"

export function drawStates(g, usData, path) {
  const states = feature(usData, usData.objects.states)

  g.append("g")
    .selectAll("path")
    .data(states.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", STATE_FILL_COLOR)
    .attr("stroke", STATE_BORDER_COLOR)
    .attr("stroke-width", 1)
}

export function drawCities(g, cityData, projection, tooltip, selectedCity, onSelectCity) {
  const maxScore = d3.max(cityData, d => d.score ?? 0)
  const radiusScale = d3.scaleSqrt().domain([0, maxScore]).range([2, 12])
  const clampedRadius = score => radiusScale(Math.max(0, score ?? 0))

  g.append("g")
    .selectAll("circle")
    .data(cityData)
    .enter()
    .append("circle")
    .attr("cx", d => projection([d.coordinates.longitude, d.coordinates.latitude])?.[0] ?? null)
    .attr("cy", d => projection([d.coordinates.longitude, d.coordinates.latitude])?.[1] ?? null)
    .attr("data-base-radius", d => clampedRadius(d.score))
    .attr("r", d => {
      const baseRadius = clampedRadius(d.score)
      const isSelected = selectedCity?.city_id === d.city_id
      return isSelected ? baseRadius * 1.5 : baseRadius
    })
    .attr("fill", d => {
      const isSelected = selectedCity?.city_id === d.city_id
      return isSelected ? "#2563eb" : CITY_POINT_COLOR
    })
    .attr("opacity", 0.75)
    .on("mouseover", (event, d) => showTooltip(tooltip, event, d))
    .on("mousemove", (event) => moveTooltip(tooltip, event))
    .on("mouseout", () => hideTooltip(tooltip))
    .on("click", (event, d) => onSelectCity?.(d))
}