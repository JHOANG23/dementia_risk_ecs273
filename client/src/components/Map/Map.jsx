import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { ZOOM_SCALE_EXTENT } from "./constants"
import { drawStates, drawCities } from "./mapHelpers"

function Map({ cityData, selectedCity, onSelectCity }) {
  const containerRef = useRef()
  const svgRef = useRef()
  const tooltipRef = useRef()

  useEffect(() => {
    async function renderMap() {
      const svg = d3.select(svgRef.current)
      svg.selectAll("*").remove()

      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      svg.attr("width", width).attr("height", height)

      const g = svg.append("g")

      const projection = d3.geoAlbersUsa()
        .translate([width / 2, height / 2])
        .scale(width * 0.85)

      const path = d3.geoPath().projection(projection)
      const tooltip = d3.select(tooltipRef.current)

      const maxScore = d3.max(cityData, d => d.score ?? 0)
      const radiusScale = d3.scaleSqrt().domain([0, maxScore]).range([2, 12])

      const zoom = d3.zoom()
        .scaleExtent(ZOOM_SCALE_EXTENT)
        .on("zoom", (event) => {
          g.attr("transform", event.transform)

          g.selectAll("circle").attr("r", d => {
            const baseRadius = radiusScale(d.score ?? 0)
            const isSelected =
              selectedCity?.city_name === d.city_name &&
              selectedCity?.state_name === d.state_name
            return (isSelected ? baseRadius * 1.5 : baseRadius) / event.transform.k
          })

          g.selectAll("path").attr("stroke-width", 1 / event.transform.k)
        })

      svg.call(zoom)

      try {
        const usData = await d3.json(
          "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"
        )
        drawStates(g, usData, path)
        drawCities(g, cityData, projection, tooltip, selectedCity, onSelectCity)
      } catch (error) {
        console.error("Failed rendering map:", error)
      }
    }

    renderMap()
  }, [cityData])

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    const maxScore = d3.max(cityData, d => d.score ?? 0)
    const radiusScale = d3.scaleSqrt().domain([0, maxScore]).range([2, 12])

    // Get the current zoom scale so radii stay consistent
    const currentTransform = d3.zoomTransform(svgRef.current)

    svg.selectAll("circle")
      .attr("r", d => {
        const isSelected =
          selectedCity?.city_name === d.city_name &&
          selectedCity?.state_name === d.state_name
        const baseRadius = radiusScale(d.score ?? 0)
        return (isSelected ? baseRadius * 1.5 : baseRadius) / currentTransform.k
      })
      .attr("fill", d => {
        const isSelected =
          selectedCity?.city_name === d.city_name &&
          selectedCity?.state_name === d.state_name
        return isSelected ? "#2563eb" : "red"
      })
  }, [selectedCity, cityData])

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg ref={svgRef} />
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