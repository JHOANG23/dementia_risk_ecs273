import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { FACTORS } from "../../utils/constants"
import "./comparePanel.css"

const FACTOR_LABELS = {
  OBESITY: "Obesity",
  DIABETES: "Diabetes",
  BPHIGH: "High BP",
  CSMOKING: "Smoking",
  LPA: "Inactivity",
  MHLTH: "Mental Health",
}

const CITY_A_COLOR = "#2563eb"
const CITY_B_COLOR = "#f59e0b"

function ComparePanel({ selectedCities, zScoreMap, weights, onClose }) {
  const chartRef = useRef()
  const open = selectedCities.length === 2
  const cityA = selectedCities[0]
  const cityB = selectedCities[1]

  useEffect(() => {
    if (!open || !chartRef.current) return

    const timer = setTimeout(() => {
      const container = chartRef.current
      if (!container) return
      d3.select(container).selectAll("*").remove()

    const margin = { top: 16, right: 16, bottom: 60, left: 48 }
    const width = container.clientWidth - margin.left - margin.right
    const height = container.clientHeight - margin.top - margin.bottom

    const svg = d3.select(container)
      .append("svg")
      .attr("width", container.clientWidth)
      .attr("height", container.clientHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const zA = zScoreMap[cityA.city_id] ?? {}
    const zB = zScoreMap[cityB.city_id] ?? {}

    const data = FACTORS.map(f => ({
      factor: f,
      label: FACTOR_LABELS[f],
      a: zA[f] ?? 0,
      b: zB[f] ?? 0,
    }))

    const x0 = d3.scaleBand()
      .domain(FACTORS)
      .range([0, width])
      .paddingInner(0.2)
      .paddingOuter(0.1)

    const x1 = d3.scaleBand()
      .domain(["a", "b"])
      .range([0, x0.bandwidth()])
      .padding(0.08)

    const allVals = data.flatMap(d => [d.a, d.b])
    const yMin = Math.min(0, d3.min(allVals))
    const yMax = Math.max(0, d3.max(allVals))

    const y = d3.scaleLinear()
      .domain([yMin - 0.2, yMax + 0.2])
      .range([height, 0])

    svg.append("line")
      .attr("x1", 0).attr("x2", width)
      .attr("y1", y(0)).attr("y2", y(0))
      .attr("stroke", "#999")
      .attr("stroke-dasharray", "3,3")
      .attr("stroke-width", 1)

    svg.append("g")
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
      .selectAll("line")
      .attr("stroke", "#eee")
      .attr("stroke-width", 1)

    svg.selectAll(".domain").remove()

    const groups = svg.selectAll(".factor-group")
      .data(data)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${x0(d.factor)},0)`)

    groups.append("rect")
      .attr("x", x1("a"))
      .attr("y", d => d.a >= 0 ? y(d.a) : y(0))
      .attr("width", x1.bandwidth())
      .attr("height", d => Math.abs(y(d.a) - y(0)))
      .attr("fill", CITY_A_COLOR)
      .attr("opacity", 0.85)
      .attr("rx", 2)

    groups.append("rect")
      .attr("x", x1("b"))
      .attr("y", d => d.b >= 0 ? y(d.b) : y(0))
      .attr("width", x1.bandwidth())
      .attr("height", d => Math.abs(y(d.b) - y(0)))
      .attr("fill", CITY_B_COLOR)
      .attr("opacity", 0.85)
      .attr("rx", 2)

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0).tickFormat(f => FACTOR_LABELS[f]))
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end")
      .attr("dx", "-0.4em")
      .attr("dy", "0.6em")
      .style("font-size", "11px")

    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".1f")))
      .selectAll("text")
      .style("font-size", "11px")

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -36)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("fill", "#555")
      .text("Z-Score")

    }, 350)
    return () => clearTimeout(timer)
  }, [open, cityA, cityB, zScoreMap])

  function computeScore(city) {
    const z = zScoreMap[city.city_id] ?? {}
    const total = FACTORS.reduce((s, f) => s + (weights[f] ?? 0), 0)
    if (total === 0) return 0
    return FACTORS.reduce((s, f) => s + (weights[f] ?? 0) * (z[f] ?? 0), 0)
  }

  return (
    <div className={`compare-panel ${open ? "open" : ""}`}>
      <div className="compare-header">
        <span className="compare-title">City Comparison</span>
        <button className="compare-close" onClick={onClose}>✕</button>
      </div>

      {open && (
        <>
          <div className="compare-cities-row">
            <div className="compare-city-card" style={{ borderColor: CITY_A_COLOR }}>
              <span className="compare-badge" style={{ background: CITY_A_COLOR }}>A</span>
              <div className="compare-city-name">{cityA.city_name}</div>
              <div className="compare-city-state">{cityA.state_name}</div>
              <div className="compare-stat">
                <span className="compare-stat-label">Risk Score</span>
                <span className="compare-stat-value">{computeScore(cityA).toFixed(3)}</span>
              </div>
              <div className="compare-stat">
                <span className="compare-stat-label">COGNITION</span>
                <span className="compare-stat-value">{(cityA.outcome_value ?? cityA.cognition ?? 0).toFixed(1)}%</span>
              </div>
            </div>

            <div className="compare-vs">vs</div>

            <div className="compare-city-card" style={{ borderColor: CITY_B_COLOR }}>
              <span className="compare-badge" style={{ background: CITY_B_COLOR }}>B</span>
              <div className="compare-city-name">{cityB.city_name}</div>
              <div className="compare-city-state">{cityB.state_name}</div>
              <div className="compare-stat">
                <span className="compare-stat-label">Risk Score</span>
                <span className="compare-stat-value">{computeScore(cityB).toFixed(3)}</span>
              </div>
              <div className="compare-stat">
                <span className="compare-stat-label">COGNITION</span>
                <span className="compare-stat-value">{(cityB.outcome_value ?? cityB.cognition ?? 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="compare-chart-title">Risk Factor Z-Scores</div>
          <div className="compare-chart-legend">
            <span className="legend-dot" style={{ background: CITY_A_COLOR }} />
            {cityA.city_name}
            <span className="legend-dot" style={{ background: CITY_B_COLOR, marginLeft: 12 }} />
            {cityB.city_name}
          </div>
          <div ref={chartRef} className="compare-chart" />
        </>
      )}

      {!open && (
        <div className="compare-empty">
          Shift+click a second city to compare
        </div>
      )}
    </div>
  )
}

export default ComparePanel
