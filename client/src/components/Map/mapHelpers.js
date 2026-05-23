import * as d3 from "d3"

import { feature } from "topojson-client"

import {
  STATE_FILL_COLOR,
  STATE_BORDER_COLOR,
  CITY_POINT_COLOR,
  POINT_RADIUS
} from "./constants"

import {
  showTooltip,
  moveTooltip,
  hideTooltip
} from "./tooltipHelpers"

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

export function drawCities(g, cityData, projection, tooltip) {

  g.append("g")
    .selectAll("circle")
    .data(cityData)
    .enter()
    .append("circle")

    .attr("cx", d => {

      const coords = projection(d.location.coordinates)

      return coords ? coords[0] : null
    })

    .attr("cy", d => {

      const coords = projection(d.location.coordinates)

      return coords ? coords[1] : null
    })

    .attr("r", POINT_RADIUS)

    .attr("fill", CITY_POINT_COLOR)

    .attr("opacity", 0.75)

    .on("mouseover", (event, d) =>
      showTooltip(tooltip, event, d)
    )

    .on("mousemove", (event) =>
      moveTooltip(tooltip, event)
    )

    .on("mouseout", () =>
      hideTooltip(tooltip)
    )
}