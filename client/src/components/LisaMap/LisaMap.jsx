import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { feature } from "topojson-client"
import "./LisaMap.css"

const CLUSTER_COLORS = {
  HH: "#d7191c",
  LL: "#2c7bb6",
  HL: "#fdae61",
  LH: "#abd9e9",
  NS: "#a8d5a2",   // light green — was #cccccc
}

const CLUSTER_LABELS = {
  HH: "High-High",
  LL: "Low-Low",
  HL: "High-Low",
  LH: "Low-High",
  NS: "Not Significant",
}

function LisaMap({ selectedCity, onSelectCity, zoomTransform, onZoomChange, isZoomSource }) {
  const containerRef = useRef()
  const svgRef = useRef()
  const tooltipRef = useRef()
  const zoomRef = useRef(null)
  const applyingExternalRef = useRef(false)
  const [lisaData, setLisaData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchLisa() {
      try {
        setLoading(true)
        const res = await fetch("http://localhost:8000/moran_lisa")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setLisaData(data)
      } catch (err) {
        console.error("LISA fetch failed:", err)
        setError("Failed to load LISA data.")
      } finally {
        setLoading(false)
      }
    }
    fetchLisa()
  }, [])

  useEffect(() => {
    if (!lisaData) return

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

      const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
          g.attr("transform", event.transform)
          g.selectAll("circle").attr("r", 6 / event.transform.k)
          g.selectAll("path").attr("stroke-width", 1 / event.transform.k)

          if (!applyingExternalRef.current) {
            onZoomChange?.({ x: event.transform.x, y: event.transform.y, k: event.transform.k })
          }
        })

      zoomRef.current = zoom
      svg.call(zoom)

      // Apply any existing shared transform on first render
      if (zoomTransform && (zoomTransform.k !== 1 || zoomTransform.x !== 0 || zoomTransform.y !== 0)) {
        applyingExternalRef.current = true
        svg.call(zoom.transform, d3.zoomIdentity.translate(zoomTransform.x, zoomTransform.y).scale(zoomTransform.k))
        applyingExternalRef.current = false
      }

      try {
        const usData = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
        const states = feature(usData, usData.objects.states)

        g.append("g")
          .selectAll("path")
          .data(states.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", "#e0e0e0")       // aligned with Map's STATE_FILL_COLOR
          .attr("stroke", "#333")        // aligned with Map's STATE_BORDER_COLOR
          .attr("stroke-width", 1)

        g.append("g")
          .selectAll("circle")
          .data(lisaData.cities)
          .enter()
          .append("circle")
          .attr("cx", d => projection([d.longitude, d.latitude])?.[0] ?? null)
          .attr("cy", d => projection([d.longitude, d.latitude])?.[1] ?? null)
          .attr("r", 6)
          .attr("fill", d => CLUSTER_COLORS[d.lisa_cluster])
          .attr("stroke", d => selectedCity?.city_id === d.city_id ? "#000" : "white")
          .attr("stroke-width", d => selectedCity?.city_id === d.city_id ? 2 : 0.5)
          .attr("opacity", 0.85)
          .style("cursor", "pointer")
          .on("mouseover", (event, d) => {
            tooltip
              .style("opacity", 1)
              .html(`
                <strong>${d.city_name}, ${d.state_abbr}</strong><br/>
                Cluster: <strong>${CLUSTER_LABELS[d.lisa_cluster]}</strong><br/>
                COGNITION: ${d.cognition.toFixed(1)}%<br/>
                Local I: ${d.local_i.toFixed(3)}<br/>
                p-value: ${d.p_value.toFixed(3)}
              `)
          })
          .on("mousemove", (event) => {
            tooltip
              .style("left", (event.offsetX + 12) + "px")
              .style("top", (event.offsetY - 28) + "px")
          })
          .on("mouseout", () => tooltip.style("opacity", 0))
          .on("click", (event, d) => onSelectCity?.(d))

      } catch (err) {
        console.error("LISA map render failed:", err)
      }
    }

    renderMap()
  }, [lisaData, selectedCity])

  // Apply external zoom transform when it changes and this map is NOT the source
  useEffect(() => {
    if (!zoomRef.current || !svgRef.current) return
    if (isZoomSource) return
    if (!zoomTransform) return

    const svg = d3.select(svgRef.current)
    applyingExternalRef.current = true
    svg.call(
      zoomRef.current.transform,
      d3.zoomIdentity.translate(zoomTransform.x, zoomTransform.y).scale(zoomTransform.k)
    )
    applyingExternalRef.current = false
  }, [zoomTransform, isZoomSource])

  if (loading) return <div className="lisa-status">Computing Moran's I...</div>
  if (error) return <div className="lisa-status lisa-error">{error}</div>

  return (
    <div className="lisa-map-wrapper">
      <div className="lisa-header">
        <h3 className="lisa-title">LISA Cluster Map - COGNITION</h3>
        <div className="lisa-stats">
          <span>Global Moran's I: <strong>{lisaData.global_moran_i}</strong></span>
          <span>z-score: <strong>{lisaData.global_z_score}</strong></span>
          <span>p-value: <strong>{lisaData.global_p_value}</strong></span>
        </div>
      </div>

      <div ref={containerRef} className="lisa-map-container">
        <svg ref={svgRef} />
        <div ref={tooltipRef} className="lisa-tooltip" />
      </div>

      <div className="lisa-legend">
        {Object.entries(CLUSTER_LABELS).map(([key, label]) => (
          <div key={key} className="lisa-legend-item">
            <span className="lisa-legend-dot" style={{ background: CLUSTER_COLORS[key] }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LisaMap