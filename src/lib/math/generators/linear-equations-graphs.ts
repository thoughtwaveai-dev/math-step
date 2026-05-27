import { randInt } from './rand'

export type LinearEquationsGraphsProblemType =
  | 'equation_from_slope_intercept'
  | 'slope_from_two_points'
  | 'y_intercept_from_slope_and_point'
  | 'point_on_line'
  | 'evaluate_linear_equation'

export interface LinearEquationsGraphsProblem {
  id: string
  type: LinearEquationsGraphsProblemType
  prompt: string
  answer: string
}

// Format the coefficient term of a line equation: 2 → "2x", -3 → "-3x", 1 → "x", -1 → "-x".
// Generators avoid slope ∈ {-1, 0, 1} so the "x" / "-x" branches are safety nets only.
function formatCoeffTerm(a: number): string {
  if (a === 1) return 'x'
  if (a === -1) return '-x'
  return `${a}x`
}

// Format the constant term: 5 → " + 5", -7 → " - 7", 0 → "".
// Generators avoid intercept 0 so the empty branch is a safety net only.
function formatConst(b: number): string {
  if (b === 0) return ''
  if (b > 0) return ` + ${b}`
  return ` - ${-b}`
}

function formatEquation(slope: number, intercept: number): string {
  return `y = ${formatCoeffTerm(slope)}${formatConst(intercept)}`
}

// Slope/intercept ranges that keep the displayed equation unambiguous for the
// algebraic grader path: excludes {-1, 0, 1} for slope and 0 for intercept.
function pickSafeSlope(rand: () => number): number {
  const choices = [-5, -4, -3, -2, 2, 3, 4, 5]
  return choices[Math.floor(rand() * choices.length)]
}
function pickSafeIntercept(rand: () => number): number {
  const choices = [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  return choices[Math.floor(rand() * choices.length)]
}
// For slope_from_two_points we allow ±1 in the slope (the answer is just a
// number, no equation is displayed), but still exclude 0.
function pickNonZeroSlope(rand: () => number): number {
  const choices = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]
  return choices[Math.floor(rand() * choices.length)]
}

// Pick a generic example for the prompt that never matches the current answer.
// Default example is "y = 2x + 3"; if that would be the answer, swap to "y = 3x - 4".
function pickPromptExample(m: number, b: number): string {
  if (m === 2 && b === 3) return 'y = 3x - 4'
  return 'y = 2x + 3'
}

// (1) "Write the equation of a line with slope m and y-intercept b."
function makeEquationFromSI(rand: () => number) {
  const m = pickSafeSlope(rand)
  const b = pickSafeIntercept(rand)
  const example = pickPromptExample(m, b)
  return {
    type: 'equation_from_slope_intercept' as const,
    prompt: `Write the equation of the line with slope ${m} and y-intercept ${b}. Use this format: ${example}.`,
    answer: formatEquation(m, b),
  }
}

// (2) "Find the slope of the line through (x1, y1) and (x2, y2)." Integer slope guaranteed.
function makeSlopeFrom2Points(rand: () => number) {
  const m = pickNonZeroSlope(rand)
  const x1 = randInt(-5, 5, rand)
  const dx = randInt(1, 4, rand) // dx > 0 so x2 > x1; sign of slope is carried by m
  const x2 = x1 + dx
  const y1 = randInt(-5, 5, rand)
  const y2 = y1 + m * dx
  return {
    type: 'slope_from_two_points' as const,
    prompt: `Find the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2}).`,
    answer: String(m),
  }
}

// (3) "A line has slope m and passes through (x, y). What is the y-intercept?"
function makeYInterceptFromSP(rand: () => number) {
  const m = pickNonZeroSlope(rand)
  // x ≠ 0 — if x = 0 then the point IS the y-intercept and the question is trivial.
  let x = 0
  while (x === 0) x = randInt(-5, 5, rand)
  const b = randInt(-9, 9, rand)
  const y = m * x + b
  return {
    type: 'y_intercept_from_slope_and_point' as const,
    prompt: `A line has slope ${m} and passes through (${x}, ${y}). What is the y-intercept?`,
    answer: String(b),
  }
}

// (4) "Is the point (x, y) on the line y = mx + b? Answer yes or no."
function makePointOnLine(wantYes: boolean, rand: () => number) {
  const m = pickSafeSlope(rand)
  const b = pickSafeIntercept(rand)
  const x = randInt(-5, 5, rand)
  const yOnLine = m * x + b
  let y: number
  if (wantYes) {
    y = yOnLine
  } else {
    // Δ ∈ {-3,-2,-1,1,2,3} — clearly off the line, never on it by accident.
    const deltas = [-3, -2, -1, 1, 2, 3]
    const delta = deltas[Math.floor(rand() * deltas.length)]
    y = yOnLine + delta
  }
  return {
    type: 'point_on_line' as const,
    prompt: `Is the point (${x}, ${y}) on the line ${formatEquation(m, b)}? Answer yes or no.`,
    answer: wantYes ? 'yes' : 'no',
  }
}

// (5) "For y = mx + b, what is y when x = c?" OR "...what is x when y = k?"
function makeEvalLinear(findY: boolean, rand: () => number) {
  const m = pickSafeSlope(rand)
  const b = pickSafeIntercept(rand)
  if (findY) {
    const x = randInt(-5, 5, rand)
    const y = m * x + b
    return {
      type: 'evaluate_linear_equation' as const,
      prompt: `For ${formatEquation(m, b)}, what is y when x = ${x}?`,
      answer: String(y),
    }
  }
  // Find x given y: construct k from a chosen integer xAns so the answer is integer.
  const xAns = randInt(-5, 5, rand)
  const k = m * xAns + b
  return {
    type: 'evaluate_linear_equation' as const,
    prompt: `For ${formatEquation(m, b)}, what is x when y = ${k}?`,
    answer: String(xAns),
  }
}

type Maker = (rand: () => number) => { type: LinearEquationsGraphsProblemType; prompt: string; answer: string }

// Distribution for count=20 → 4/4/4/4/4 across the 5 types.
// point_on_line is split 2 yes / 2 no; evaluate_linear_equation is split 2 findY / 2 findX.
function buildPlan(count: number): Maker[] {
  const weights: { maker: Maker; weight: number }[] = [
    { maker: makeEquationFromSI, weight: 4 },
    { maker: makeSlopeFrom2Points, weight: 4 },
    { maker: makeYInterceptFromSP, weight: 4 },
    { maker: (r) => makePointOnLine(true, r), weight: 2 },
    { maker: (r) => makePointOnLine(false, r), weight: 2 },
    { maker: (r) => makeEvalLinear(true, r), weight: 2 },
    { maker: (r) => makeEvalLinear(false, r), weight: 2 },
  ]
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0)
  const plan: Maker[] = []
  for (const w of weights) {
    const n = Math.round((w.weight / totalWeight) * count)
    for (let i = 0; i < n; i++) plan.push(w.maker)
  }
  while (plan.length < count) plan.push(makeEquationFromSI)
  while (plan.length > count) plan.pop()
  return plan
}

export function generateLinearEquationsGraphsProblems(
  count = 10,
  rand: () => number = Math.random,
): LinearEquationsGraphsProblem[] {
  const plan = buildPlan(count)
  const problems: LinearEquationsGraphsProblem[] = []
  const seen = new Set<string>()

  for (let i = 0; i < plan.length; i++) {
    const maker = plan[i]
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      seen.add(p.prompt)
      problems.push({ id: `lin131_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
