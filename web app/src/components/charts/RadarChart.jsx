function RadarChart({ data, size = 260 }) {
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.38
  const levels = 5
  const angleStep = (2 * Math.PI) / data.length

  // Grid rings
  const rings = Array.from({ length: levels }, (_, i) => {
    const r = (radius / levels) * (i + 1)
    const points = data.map((_, j) => {
      const angle = angleStep * j - Math.PI / 2
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
    }).join(' ')
    return points
  })

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2
    const value = Math.min(100, Math.max(0, d.value)) / 100
    const r = radius * value
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')

  // Label positions
  const labels = data.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2
    const labelR = radius + 24
    return {
      x: cx + labelR * Math.cos(angle),
      y: cy + labelR * Math.sin(angle),
      label: d.label,
      value: Math.round(d.value),
    }
  })

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid Rings */}
        {rings.map((points, i) => (
          <polygon
            key={`ring-${i}`}
            points={points}
            fill="none"
            stroke="var(--card-border)"
            strokeWidth={i === levels - 1 ? 1 : 0.5}
            opacity={0.5}
          />
        ))}

        {/* Spokes */}
        {data.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2
          return (
            <line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={cx + radius * Math.cos(angle)}
              y2={cy + radius * Math.sin(angle)}
              stroke="var(--card-border)"
              strokeWidth={0.5}
              opacity={0.4}
            />
          )
        })}

        {/* Data Fill */}
        <polygon
          points={dataPoints}
          fill="rgba(79, 70, 229, 0.15)"
          stroke="#4F46E5"
          strokeWidth={2}
        />

        {/* Data Points */}
        {data.map((d, i) => {
          const angle = angleStep * i - Math.PI / 2
          const value = Math.min(100, Math.max(0, d.value)) / 100
          const r = radius * value
          return (
            <circle
              key={`point-${i}`}
              cx={cx + r * Math.cos(angle)}
              cy={cy + r * Math.sin(angle)}
              r={3.5}
              fill="#4F46E5"
              stroke="var(--card-bg)"
              strokeWidth={2}
            />
          )
        })}

        {/* Labels */}
        {labels.map((l, i) => (
          <g key={`label-${i}`}>
            <text
              x={l.x}
              y={l.y - 6}
              textAnchor="middle"
              fill="var(--app-text)"
              fontSize="10"
              fontWeight="600"
              fontFamily="Inter, sans-serif"
            >
              {l.label}
            </text>
            <text
              x={l.x}
              y={l.y + 8}
              textAnchor="middle"
              fill="var(--app-text-muted)"
              fontSize="10"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              {l.value}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default RadarChart
