import type { GraphSpec } from '@/lib/math/graphPrompt'

interface Props {
  spec: GraphSpec
  size?: 'full' | 'mini'
  range?: number
}

const COLORS = {
  grid: '#e0ecde',
  axis: '#4a6b4e',
  line: '#2d6a35',
  point: '#2d6a35',
  label: '#1a2e1c',
  highlight: '#a0b8a3',
}

// SVG dimensions per size variant. The math area is square; padding holds the
// axis tick labels (skipped in mini mode where they'd be unreadable anyway).
const LAYOUT = {
  full: { svgSize: 320, pad: 26, showLabels: true, fontSize: 11, pointR: 5, strokeW: 2 },
  mini: { svgSize: 140, pad: 8, showLabels: false, fontSize: 9, pointR: 3, strokeW: 1.5 },
} as const

// Clip the line y = slope*x + intercept to the box [-range, range]^2.
// Returns the two visible endpoints in math coords, or null if the line is
// entirely outside (which won't happen in v1 since intercepts are bounded).
function clipLine(slope: number, intercept: number, range: number): [[number, number], [number, number]] | null {
  if (slope === 0) {
    if (intercept > range || intercept < -range) return null
    return [[-range, intercept], [range, intercept]]
  }
  // Start with the two side-edge intersections.
  let p1: [number, number] = [-range, -range * slope + intercept]
  let p2: [number, number] = [range, range * slope + intercept]

  // Clamp y to the visible range by walking each endpoint along the line until
  // it lands inside the box. The line is monotonic so one swap is enough.
  if (p1[1] > range) p1 = [(range - intercept) / slope, range]
  else if (p1[1] < -range) p1 = [(-range - intercept) / slope, -range]

  if (p2[1] > range) p2 = [(range - intercept) / slope, range]
  else if (p2[1] < -range) p2 = [(-range - intercept) / slope, -range]

  return [p1, p2]
}

export default function CoordinatePlane({ spec, size = 'full', range = 6 }: Props) {
  const { svgSize, pad, showLabels, fontSize, pointR, strokeW } = LAYOUT[size]
  const inner = svgSize - pad * 2
  const unit = inner / (range * 2)

  // Math (mx, my) → SVG (sx, sy). Y axis flipped.
  const toSvgX = (mx: number) => pad + (mx + range) * unit
  const toSvgY = (my: number) => pad + (range - my) * unit

  const gridlines: React.ReactNode[] = []
  const labels: React.ReactNode[] = []
  for (let i = -range; i <= range; i++) {
    const sx = toSvgX(i)
    const sy = toSvgY(i)
    gridlines.push(
      <line key={`vx${i}`} x1={sx} y1={pad} x2={sx} y2={pad + inner} stroke={COLORS.grid} strokeWidth={1} />,
      <line key={`hy${i}`} x1={pad} y1={sy} x2={pad + inner} y2={sy} stroke={COLORS.grid} strokeWidth={1} />,
    )
    if (showLabels && i !== 0) {
      // X-axis labels just below the axis line
      labels.push(
        <text
          key={`xl${i}`}
          x={sx}
          y={toSvgY(0) + fontSize + 2}
          fontSize={fontSize}
          fill={COLORS.label}
          textAnchor="middle"
        >
          {i}
        </text>,
      )
      // Y-axis labels just left of the axis line
      labels.push(
        <text
          key={`yl${i}`}
          x={toSvgX(0) - 4}
          y={sy + fontSize / 3}
          fontSize={fontSize}
          fill={COLORS.label}
          textAnchor="end"
        >
          {i}
        </text>,
      )
    }
  }

  const axisX = toSvgY(0)
  const axisY = toSvgX(0)

  let plotted: React.ReactNode = null
  let highlight: React.ReactNode = null

  if (spec.kind === 'point') {
    const px = toSvgX(spec.x)
    const py = toSvgY(spec.y)
    plotted = (
      <>
        <circle cx={px} cy={py} r={pointR} fill={COLORS.point} />
        {spec.label && (
          <text
            x={px + pointR + 3}
            y={py - pointR - 2}
            fontSize={fontSize + 1}
            fill={COLORS.label}
            fontWeight="bold"
          >
            {spec.label}
          </text>
        )}
      </>
    )
  } else if (spec.kind === 'line') {
    const clipped = clipLine(spec.slope, spec.intercept, range)
    if (clipped) {
      const [[mx1, my1], [mx2, my2]] = clipped
      plotted = (
        <line
          x1={toSvgX(mx1)}
          y1={toSvgY(my1)}
          x2={toSvgX(mx2)}
          y2={toSvgY(my2)}
          stroke={COLORS.line}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
      )
    }
    if (typeof spec.highlightX === 'number') {
      const hx = toSvgX(spec.highlightX)
      const hyMath = spec.slope * spec.highlightX + spec.intercept
      const hy = toSvgY(hyMath)
      highlight = (
        <>
          <line
            x1={hx}
            y1={toSvgY(0)}
            x2={hx}
            y2={hy}
            stroke={COLORS.highlight}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <circle cx={hx} cy={hy} r={pointR - 1} fill="white" stroke={COLORS.line} strokeWidth={strokeW} />
        </>
      )
    }
  }

  const maxWidthClass = size === 'full' ? 'max-w-[320px]' : 'max-w-[140px]'

  return (
    <div className={`${maxWidthClass} w-full`}>
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        width="100%"
        role="img"
        aria-label={describeSpec(spec)}
        style={{ display: 'block' }}
      >
        {gridlines}
        <line x1={pad} y1={axisX} x2={pad + inner} y2={axisX} stroke={COLORS.axis} strokeWidth={1.5} />
        <line x1={axisY} y1={pad} x2={axisY} y2={pad + inner} stroke={COLORS.axis} strokeWidth={1.5} />
        {labels}
        {plotted}
        {highlight}
      </svg>
    </div>
  )
}

function describeSpec(spec: GraphSpec): string {
  if (spec.kind === 'point') {
    return `Coordinate plane with point ${spec.label ?? ''} at (${spec.x}, ${spec.y})`
  }
  return `Coordinate plane with line y = ${spec.slope}x ${spec.intercept >= 0 ? '+' : '-'} ${Math.abs(spec.intercept)}`
}
