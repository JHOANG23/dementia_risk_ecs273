import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { ZOOM_SCALE_EXTENT } from "./constants"
import { drawStates, drawCities } from "./mapHelpers"

function Map({ cityData, selectedCities, onSelectCity, zoomTransform, onZoomChange, isZoomSource }) {
  const containerRef = useRef()
  const svgRef = useRef()
  const tooltipRef = useRef()
  const zoomRef = useRef(null)
  const applyingExternalRef = useRef(false)

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
      const clampedRadius = score => radiusScale(Math.max(0, score ?? 0))

      const zoom = d3.zoom()
        .scaleExtent(ZOOM_SCALE_EXTENT)
        .on("zoom", (event) => {
          g.attr("transform", event.transform)
          g.selectAll("circle").attr("r", d => {
            const base = clampedRadius(d.score)
            const isSelected = selectedCities?.some(c => c.city_id === d.city_id)
            return (isSelected ? base * 1.5 : base) / event.transform.k
          })
          g.selectAll("path").attr("stroke-width", 1 / event.transform.k)
          if (!applyingExternalRef.current) {
            onZoomChange?.({ x: event.transform.x, y: event.transform.y, k: event.transform.k })
          }
        })

      zoomRef.current = zoom
      svg.call(zoom)

      if (zoomTransform && (zoomTransform.k !== 1 || zoomTransform.x !== 0 || zoomTransform.y !== 0)) {
        applyingExternalRef.current = true
        svg.call(zoom.transform, d3.zoomIdentity.translate(zoomTransform.x, zoomTransform.y).scale(zoomTransform.k))
        applyingExternalRef.current = false
      }

      try {
        const usData = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
        drawStates(g, usData, path)
        drawCities(g, cityData, projection, tooltip, selectedCities, onSelectCity)
      } catch (error) {
        console.error("Failed rendering map:", error)
      }
    }

    renderMap()
  }, [cityData])

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    const primaryId = selectedCities?.[0]?.city_id
    const secondaryId = selectedCities?.[1]?.city_id
    const maxScore = d3.max(cityData, d => d.score ?? 0)
    const radiusScale = d3.scaleSqrt().domain([0, maxScore]).range([2, 12])
    const clampedRadius = score => radiusScale(Math.max(0, score ?? 0))
    const currentTransform = d3.zoomTransform(svgRef.current)

    svg.selectAll("circle")
      .attr("r", d => {
        const base = clampedRadius(d.score)
        const isSelected = d.city_id === primaryId || d.city_id === secondaryId
        return (isSelected ? base * 1.5 : base) / currentTransform.k
      })
      .attr("fill", d => {
        if (d.city_id === primaryId) return "#2563eb"
        if (d.city_id === secondaryId) return "#f59e0b"
        return "red"
      })
  }, [selectedCities, cityData])

  useEffect(() => {
    if (!zoomRef.current || !svgRef.current || isZoomSource || !zoomTransform) return
    const svg = d3.select(svgRef.current)
    applyingExternalRef.current = true
    svg.call(zoomRef.current.transform, d3.zoomIdentity.translate(zoomTransform.x, zoomTransform.y).scale(zoomTransform.k))
    applyingExternalRef.current = false
  }, [zoomTransform, isZoomSource])

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
