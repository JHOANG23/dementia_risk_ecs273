export function showTooltip(tooltip, event, city) {
  const container = tooltip.node().parentElement
  const rect = container.getBoundingClientRect()

  tooltip
    .style("opacity", 1)
    .style("left", `${event.clientX - rect.left + 12}px`)
    .style("top", `${event.clientY - rect.top - 28}px`)
    .html(`
      <strong>${city.city_name}</strong><br/>
      ${city.state_name}<br/>
      Score: ${(city.score ?? 0).toFixed(3)}
    `)
}

export function moveTooltip(tooltip, event) {
  const container = tooltip.node().parentElement
  const rect = container.getBoundingClientRect()

  tooltip
    .style("left", `${event.clientX - rect.left + 12}px`)
    .style("top", `${event.clientY - rect.top - 28}px`)
}

export function hideTooltip(tooltip) {
  tooltip.style("opacity", 0)
}