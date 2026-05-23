export function showTooltip(tooltip, event, city) {

  tooltip
    .style("opacity", 1)
    .style("left", `${event.pageX + 10}px`)
    .style("top", `${event.pageY + 10}px`)
    .html(`
      <strong>${city.city_name}</strong><br/>
      ${city.state_name}<br/>
      Risk Score: ${city.risk_score.toFixed(3)}
    `)
}

export function moveTooltip(tooltip, event) {

  tooltip
    .style("left", `${event.pageX + 10}px`)
    .style("top", `${event.pageY + 10}px`)
}

export function hideTooltip(tooltip) {

  tooltip.style("opacity", 0)
}