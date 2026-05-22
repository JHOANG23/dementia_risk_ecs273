import { useEffect, useRef } from "react"
import { feature } from "topojson-client"
import * as d3 from "d3"

function Map() {
  const svgRef = useRef()
  const tooltipRef = useRef()

  useEffect(() => {
    const width = 800
    const height = 500

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)

    svg.selectAll("*").remove()

    const g = svg.append("g")

    const projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(1000)

    const path = d3.geoPath().projection(projection)

    const tooltip = d3.select(tooltipRef.current)

    // Zoom logic
    const zoom = d3.zoom()
      .scaleExtent([1, 8])

      .on("zoom", (event) => {

        g.attr("transform", event.transform)

        g.selectAll("circle")
          .attr("r", 4 / event.transform.k)

        g.selectAll("path")
          .attr("stroke-width", 1 / event.transform.k)
      })

    svg.call(zoom)
    
    // cityData contains 
    Promise.all([
      d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
      d3.csv("../../data/city_coords.csv")
    ]).then(([us, cityData]) => {

      // RISK SCORE
      cityData = cityData.map(d => ({
        ...d,
        RiskScore: Math.random()
      }))

      // Plot US states
      const states = feature(us, us.objects.states)

      g.append("g")
        .selectAll("path")
        .data(states.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#e0e0e0")
        .attr("stroke", "#333")
        .attr("stroke-width", 1)

      // Plot city points
      g.append("g")
        .selectAll("circle")
        .data(cityData)
        .enter()
        .append("circle")
        .attr("cx", d => {
          const coords = projection([
            +d.Longitude,
            +d.Latitude
          ])

          return coords ? coords[0] : null
        })
        .attr("cy", d => {
          const coords = projection([
            +d.Longitude,
            +d.Latitude
          ])

          return coords ? coords[1] : null
        })
        .attr("r", 4)
        .attr("fill", "red")
        .attr("opacity", 0.75)

        // Hover interactions
        .on("mouseover", (event, d) => {

          tooltip
            .style("opacity", 1)
            .html(`
              <strong>${d.CityName}</strong><br/>
              ${d.StateDesc}<br/>
              Risk Score: ${d.RiskScore}
            `)
        })

        .on("mousemove", (event) => {

          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`)
        })

        .on("mouseout", () => {

          tooltip.style("opacity", 0)
        })
    })

  }, [])

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