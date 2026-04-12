import { useMemo, useState } from 'react'

function GrowthChart({ data, width = 600, height = 240 }) {
  const [hoverIndex, setHoverIndex] = useState(null)

  const padding = { top: 24, right: 20, bottom: 40, left: 44 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const points = useMemo(() => {
    if (!data || !data.length) return []
    const maxVal = Math.max(...data.map((d) => d.value), 100)
    return data.map((d, i) => ({
      x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
      y: padding.top + chartH - (d.value / maxVal) * chartH,
      ...d,
    }))
  }, [data, chartW, chartH])

  if (!data || !data.length) return null

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`

  // Y-axis ticks
  const yTicks = [0, 25, 50, 75, 100]
  const maxVal = Math.max(...data.map((d) => d.value), 100)

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: `${Math.max(width, data.length * 80)}px` }}>
        {/* Y grid lines */}
        {yTicks.map((tick) => {
          const y = padding.top + chartH - (tick / maxVal) * chartH
          return (
            <g key={`y-${tick}`}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--card-border)" strokeWidth={0.5} opacity={0.5} />
              <text x={padding.left - 8} y={y + 3} textAnchor="end" fill="var(--app-text-soft)" fontSize="9" fontFamily="Inter, sans-serif">
                {tick}
              </text>
            </g>
          )
        })}

        {/* Area fill */}
        <path d={areaPath} fill="rgba(79, 70, 229, 0.08)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#4F46E5" strokeWidth={2.5} strokeLinejoin="round" />

        {/* Points & labels */}
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
            {/* X-axis label */}
            <text x={p.x} y={height - 10} textAnchor="middle" fill="var(--app-text-muted)" fontSize="10" fontWeight="500" fontFamily="Inter, sans-serif">
              {p.label}
            </text>

            {/* Hover vertical line */}
            {hoverIndex === i && (
              <line x1={p.x} y1={padding.top} x2={p.x} y2={padding.top + chartH} stroke="var(--primary)" strokeWidth={1} opacity={0.3} strokeDasharray="4 4" />
            )}

            {/* Point */}
            <circle cx={p.x} cy={p.y} r={hoverIndex === i ? 5 : 3.5} fill="#4F46E5" stroke="var(--card-bg)" strokeWidth={2} style={{ cursor: 'pointer' }} />

            {/* Tooltip */}
            {hoverIndex === i && (
              <g>
                <rect x={p.x - 55} y={p.y - 42} width={110} height={32} rx={6} fill="var(--card-bg)" stroke="var(--card-border)" strokeWidth={1} style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }} />
                <text x={p.x} y={p.y - 27} textAnchor="middle" fill="var(--app-text)" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">
                  {Math.round(p.value)}% Readiness
                </text>
                <text x={p.x} y={p.y - 16} textAnchor="middle" fill="var(--app-text-muted)" fontSize="8" fontFamily="Inter, sans-serif">
                  {p.detail || p.label}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

export default GrowthChart
