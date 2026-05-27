import { randInt, shuffled } from './rand'
import {
  encodeChoicesPrompt,
  encodeGraphPrompt,
  type GraphSpec,
} from '../graphPrompt'

export type GraphingProblemType =
  | 'read_point_coordinates'
  | 'identify_slope_from_graph'
  | 'identify_y_intercept_from_graph'
  | 'read_y_for_x'
  | 'match_equation_to_graph'

export interface GraphingProblem {
  id: string
  type: GraphingProblemType
  prompt: string
  answer: string
}

const RANGE = 6 // visible math range on each axis, matches CoordinatePlane default

// Format the linear coefficient term of an equation: 1 → "x", -1 → "-x", -3 → "-3x".
function formatCoeffTerm(a: number): string {
  if (a === 1) return 'x'
  if (a === -1) return '-x'
  return `${a}x`
}

// Format the constant term of a linear equation: 5 → " + 5", -7 → " - 7", 0 → "".
function formatConst(b: number): string {
  if (b === 0) return ''
  if (b > 0) return ` + ${b}`
  return ` - ${-b}`
}

function formatEquation(slope: number, intercept: number): string {
  return `${formatCoeffTerm(slope)}${formatConst(intercept)}`
}

function pickFrom<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

// (1) Read coordinates of a labeled point.
function makePoint(rand: () => number): { type: GraphingProblemType; prompt: string; answer: string } {
  // Bound to ±5 so the label text never bumps against the plot edge.
  let x = 0
  let y = 0
  while (x === 0 && y === 0) {
    x = randInt(-5, 5, rand)
    y = randInt(-5, 5, rand)
  }
  const graph: GraphSpec = { kind: 'point', x, y, label: 'A' }
  return {
    type: 'read_point_coordinates',
    prompt: encodeGraphPrompt(
      'What are the coordinates of point A? Give your answer as: x = ?, y = ?',
      graph,
    ),
    answer: `x = ${x}, y = ${y}`,
  }
}

// (2) Identify slope from graph. Slope ∈ {-3..3} \ {0}.
function makeSlope(rand: () => number): { type: GraphingProblemType; prompt: string; answer: string } {
  const slopes = [-3, -2, -1, 1, 2, 3]
  const slope = pickFrom(slopes, rand)
  const intercept = randInt(-3, 3, rand)
  const graph: GraphSpec = { kind: 'line', slope, intercept }
  return {
    type: 'identify_slope_from_graph',
    prompt: encodeGraphPrompt('What is the slope of this line?', graph),
    answer: String(slope),
  }
}

// (3) Identify y-intercept from graph. Intercept ∈ [-5, 5].
function makeYIntercept(rand: () => number): { type: GraphingProblemType; prompt: string; answer: string } {
  const slopes = [-2, -1, 1, 2]
  const slope = pickFrom(slopes, rand)
  const intercept = randInt(-5, 5, rand)
  const graph: GraphSpec = { kind: 'line', slope, intercept }
  return {
    type: 'identify_y_intercept_from_graph',
    prompt: encodeGraphPrompt('What is the y-intercept of this line?', graph),
    answer: String(intercept),
  }
}

// (4) Read y-value for a given x. Constrain so the answer stays in the
// visible range and x ≠ 0 (that would just be the y-intercept question).
function makeReadY(rand: () => number): { type: GraphingProblemType; prompt: string; answer: string } {
  for (let attempt = 0; attempt < 50; attempt++) {
    const slope = pickFrom([-2, -1, 1, 2], rand)
    const intercept = randInt(-3, 3, rand)
    const xCandidates = [-3, -2, -1, 1, 2, 3]
    const x = pickFrom(xCandidates, rand)
    const y = slope * x + intercept
    if (y < -RANGE || y > RANGE) continue
    const graph: GraphSpec = { kind: 'line', slope, intercept, highlightX: x }
    return {
      type: 'read_y_for_x',
      prompt: encodeGraphPrompt(`What is the y-value when x = ${x}?`, graph),
      answer: String(y),
    }
  }
  // Fallback that's guaranteed to fit: slope=1, intercept=0, x=2 → y=2
  const graph: GraphSpec = { kind: 'line', slope: 1, intercept: 0, highlightX: 2 }
  return {
    type: 'read_y_for_x',
    prompt: encodeGraphPrompt('What is the y-value when x = 2?', graph),
    answer: '2',
  }
}

// (5) Match equation to one of 4 graph choices.
function makeMatchEquation(rand: () => number): { type: GraphingProblemType; prompt: string; answer: string } {
  const slopes = [-3, -2, -1, 1, 2, 3]
  const correctSlope = pickFrom(slopes, rand)
  const correctIntercept = randInt(-4, 4, rand)

  // Build 3 distractors that differ from the correct line and from each other.
  // Each distractor flips slope OR intercept by ±1, with a guard so the
  // resulting line still fits in [-RANGE, RANGE] when drawn.
  const distractors: { slope: number; intercept: number }[] = []
  const seenKeys = new Set([`${correctSlope}|${correctIntercept}`])

  for (let attempt = 0; attempt < 200 && distractors.length < 3; attempt++) {
    const mode = randInt(0, 1, rand) // 0 = mutate slope, 1 = mutate intercept
    const delta = randInt(0, 1, rand) === 0 ? -1 : 1
    let s = correctSlope
    let b = correctIntercept
    if (mode === 0) {
      s = correctSlope + delta
      if (s === 0) continue // 0 slope removed for v1 to keep "obviously different" lines
      if (Math.abs(s) > 4) continue
    } else {
      b = correctIntercept + delta
      if (Math.abs(b) > 5) continue
    }
    const key = `${s}|${b}`
    if (seenKeys.has(key)) continue
    seenKeys.add(key)
    distractors.push({ slope: s, intercept: b })
  }

  // Top up with simple slope perturbations if the random walk fell short.
  while (distractors.length < 3) {
    const s = correctSlope + distractors.length + 1
    const b = correctIntercept
    const key = `${s}|${b}`
    if (!seenKeys.has(key) && s !== 0 && Math.abs(s) <= 5) {
      seenKeys.add(key)
      distractors.push({ slope: s, intercept: b })
    } else {
      // Final fallback: flip the sign of the slope
      const s2 = -correctSlope
      const b2 = correctIntercept + (distractors.length + 1)
      const key2 = `${s2}|${b2}`
      if (!seenKeys.has(key2)) {
        seenKeys.add(key2)
        distractors.push({ slope: s2, intercept: b2 })
      } else {
        break
      }
    }
  }

  const correctSpec: GraphSpec = { kind: 'line', slope: correctSlope, intercept: correctIntercept }
  const all = [correctSpec, ...distractors.map(d => ({ kind: 'line' as const, slope: d.slope, intercept: d.intercept }))]
  const shuffledAll = shuffled(all, rand)
  const correctIndex = shuffledAll.findIndex(g => g.kind === 'line' && g.slope === correctSlope && g.intercept === correctIntercept)
  const letters = ['A', 'B', 'C', 'D']

  return {
    type: 'match_equation_to_graph',
    prompt: encodeChoicesPrompt(
      `Which graph matches y = ${formatEquation(correctSlope, correctIntercept)}?`,
      shuffledAll,
    ),
    answer: letters[correctIndex],
  }
}

type Maker = (rand: () => number) => { type: GraphingProblemType; prompt: string; answer: string }

// Distribution for count=20 → 4/4/4/4/4. Scales proportionally for other counts.
function buildPlan(count: number): Maker[] {
  const weights: { maker: Maker; weight: number }[] = [
    { maker: makePoint, weight: 1 },
    { maker: makeSlope, weight: 1 },
    { maker: makeYIntercept, weight: 1 },
    { maker: makeReadY, weight: 1 },
    { maker: makeMatchEquation, weight: 1 },
  ]
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0)
  const plan: Maker[] = []
  for (const w of weights) {
    const n = Math.round((w.weight / totalWeight) * count)
    for (let i = 0; i < n; i++) plan.push(w.maker)
  }
  while (plan.length < count) plan.push(makePoint)
  while (plan.length > count) plan.pop()
  return plan
}

export function generateGraphingProblems(
  count = 10,
  rand: () => number = Math.random,
): GraphingProblem[] {
  const plan = buildPlan(count)
  const problems: GraphingProblem[] = []
  const seen = new Set<string>()

  for (let i = 0; i < plan.length; i++) {
    const maker = plan[i]
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      seen.add(p.prompt)
      problems.push({ id: `gr122_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
