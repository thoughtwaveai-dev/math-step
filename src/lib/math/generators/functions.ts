import { randInt } from './rand'

export type FunctionsProblemType =
  | 'function_evaluate_linear'
  | 'function_evaluate_quadratic'
  | 'function_evaluate_negative'
  | 'function_compose_simple'
  | 'function_inverse_solve'

export interface FunctionsProblem {
  id: string
  type: FunctionsProblemType
  prompt: string
  answer: string
}

// Format a linear coefficient term: 2 → "2x", -3 → "-3x", 1 → "x", -1 → "-x".
// Generators avoid a ∈ {-1, 0, 1} so the "x" / "-x" branches are safety nets.
function formatCoeffTerm(a: number): string {
  if (a === 1) return 'x'
  if (a === -1) return '-x'
  return `${a}x`
}

// Format the constant term of a linear function: 5 → " + 5", -7 → " - 7", 0 → "".
function formatConst(b: number): string {
  if (b === 0) return ''
  if (b > 0) return ` + ${b}`
  return ` - ${-b}`
}

// f(x) = ax + b, find f(c). All positive ints.
function makeLinear(rand: () => number) {
  const a = randInt(2, 5, rand)
  const b = randInt(1, 9, rand)
  const c = randInt(1, 8, rand)
  const answer = a * c + b
  return {
    type: 'function_evaluate_linear' as const,
    prompt: `f(x) = ${formatCoeffTerm(a)}${formatConst(b)}. Find f(${c}).`,
    answer: String(answer),
  }
}

// f(x) = x² + c, find f(d). Always non-negative.
function makeQuadratic(rand: () => number) {
  const c = randInt(1, 9, rand)
  const d = randInt(1, 7, rand)
  const answer = d * d + c
  return {
    type: 'function_evaluate_quadratic' as const,
    prompt: `f(x) = x² + ${c}. Find f(${d}).`,
    answer: String(answer),
  }
}

// f(x) = ax + b with a, b, or input possibly negative. Answer can be either sign.
function makeNegative(rand: () => number) {
  const aMag = randInt(2, 5, rand)
  const bMag = randInt(1, 9, rand)
  const cMag = randInt(1, 7, rand)
  // Pick a non-trivial combination of negative signs (≥1 negative).
  // 6 patterns out of 8 — exclude (+,+,+) and avoid all-three-negative which is uncommon.
  const patterns: [number, number, number][] = [
    [-1, +1, +1], // -ax + b, find f(c)
    [+1, -1, +1], // ax - b, find f(c)
    [+1, +1, -1], // ax + b, find f(-c)
    [-1, -1, +1], // -ax - b, find f(c)
    [-1, +1, -1], // -ax + b, find f(-c)
    [+1, -1, -1], // ax - b, find f(-c)
  ]
  const [sa, sb, sc] = patterns[Math.floor(rand() * patterns.length)]
  const a = aMag * sa
  const b = bMag * sb
  const c = cMag * sc
  const answer = a * c + b
  return {
    type: 'function_evaluate_negative' as const,
    prompt: `f(x) = ${formatCoeffTerm(a)}${formatConst(b)}. Find f(${c}).`,
    answer: String(answer),
  }
}

// f(x) = x + a, g(x) = bx, find f(g(c)). Always positive int.
function makeCompose(rand: () => number) {
  const a = randInt(1, 5, rand)
  const b = randInt(2, 4, rand)
  const c = randInt(1, 5, rand)
  const answer = b * c + a
  return {
    type: 'function_compose_simple' as const,
    prompt: `f(x) = x + ${a} and g(x) = ${b}x. Find f(g(${c})).`,
    answer: String(answer),
  }
}

// f(x) = ax + b. What x gives f(x) = k? Construct so x_target is a positive int.
function makeInverse(rand: () => number) {
  const a = randInt(2, 5, rand)
  const b = randInt(1, 9, rand)
  const xTarget = randInt(1, 8, rand)
  const k = a * xTarget + b
  return {
    type: 'function_inverse_solve' as const,
    prompt: `f(x) = ${formatCoeffTerm(a)}${formatConst(b)}. What value of x gives f(x) = ${k}?`,
    answer: String(xTarget),
  }
}

type Maker = (rand: () => number) => { type: FunctionsProblemType; prompt: string; answer: string }

// Distribution for count=20 → 5/4/4/4/3 (linear/quadratic/negative/compose/inverse).
// Scales proportionally for other counts.
function buildPlan(count: number): Maker[] {
  const weights: { maker: Maker; weight: number }[] = [
    { maker: makeLinear, weight: 5 },
    { maker: makeQuadratic, weight: 4 },
    { maker: makeNegative, weight: 4 },
    { maker: makeCompose, weight: 4 },
    { maker: makeInverse, weight: 3 },
  ]
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0)
  const plan: Maker[] = []
  for (const w of weights) {
    const n = Math.round((w.weight / totalWeight) * count)
    for (let i = 0; i < n; i++) plan.push(w.maker)
  }
  // Fix off-by-one rounding so plan length matches count exactly.
  while (plan.length < count) plan.push(makeLinear)
  while (plan.length > count) plan.pop()
  return plan
}

export function generateFunctionsProblems(
  count = 10,
  rand: () => number = Math.random,
): FunctionsProblem[] {
  const plan = buildPlan(count)
  const problems: FunctionsProblem[] = []
  const seen = new Set<string>()

  for (let i = 0; i < plan.length; i++) {
    const maker = plan[i]
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      seen.add(p.prompt)
      problems.push({ id: `fn121_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
