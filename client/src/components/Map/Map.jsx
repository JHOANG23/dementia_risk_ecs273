import { useEffect, useRef } from "react"

import * as d3 from "d3"

import {
  MAP_WIDTH,
  MAP_HEIGHT,
  ZOOM_SCALE_EXTENT
} from "./constants"

import {
  drawStates,
  drawCities
} from "./mapHelpers"

function Map({ cityData }) {

  const svgRef = useRef()

  const tooltipRef = useRef()

  useEffect(() => {

    async function renderMap() {

      const svg = d3.select(svgRef.current)

      svg.selectAll("*").remove()

      svg
        .attr("width", MAP_WIDTH)
        .attr("height", MAP_HEIGHT)

      const g = svg.append("g")

      const projection = d3.geoAlbersUsa()
        .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2])
        .scale(1000)

      const path = d3.geoPath().projection(projection)

      const tooltip = d3.select(tooltipRef.current)

      /*
        Zoom behavior
      */

      const zoom = d3.zoom()
        .scaleExtent(ZOOM_SCALE_EXTENT)

        .on("zoom", (event) => {

          g.attr("transform", event.transform)

          g.selectAll("circle")
            .attr("r", 4 / event.transform.k)

          g.selectAll("path")
            .attr("stroke-width", 1 / event.transform.k)
        })

      svg.call(zoom)

      try {

        /*
          Load US map geometry
        */

        const usData = await d3.json(
          "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"
        )

        /*
          Draw map layers
        */

        drawStates(g, usData, path)

        drawCities(g, cityData, projection, tooltip)

      } catch (error) {

        console.error("Failed rendering map:", error)
      }
    }

    renderMap()

  }, [cityData])

  return (

    <div style={{ position: "relative" }}>

      <svg ref={svgRef}></svg>

      <div
        ref={tooltipRef}

        style={{
          position: "absolute",
          background: "white",
          padding: "6px 10px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          pointerEvents: "none",
          opacity: 0,
          fontSize: "14px"
        }}
      />

    </div>
  )
}

export default Map