import { randInt } from './rand'

export type LinearEquationType = 'linear_equation'

export interface LinearEquationProblem {
  id: string
  type: LinearEquationType
  prompt: string
  answer: string
}

// --- Level 10/1 helpers — build one problem of each subtype ---

function makeAddEq(rand: () => number): { prompt: string; answer: number } {
  // x + a = b; x ∈ [2,15], a ∈ [1,12]
  const x = randInt(2, 15, rand)
  const a = randInt(1, 12, rand)
  return { prompt: `x + ${a} = ${x + a}`, answer: x }
}

function makeSubEq(rand: () => number): { prompt: string; answer: number } {
  // x - a = b; x ∈ [5,20], a ∈ [2,12], b = x - a > 0
  const x = randInt(5, 20, rand)
  const a = randInt(2, x - 1, rand)
  return { prompt: `x - ${a} = ${x - a}`, answer: x }
}

function makeMulEq(rand: () => number): { prompt: string; answer: number } {
  // ax = b; a ∈ [2,9], x ∈ [2,10]
  const a = randInt(2, 9, rand)
  const x = randInt(2, 10, rand)
  return { prompt: `${a}x = ${a * x}`, answer: x }
}

function makeDivEq(rand: () => number): { prompt: string; answer: number } {
  // x / a = b; a ∈ [2,6], b ∈ [2,10]; answer x = a*b
  const a = randInt(2, 6, rand)
  const b = randInt(2, 10, rand)
  return { prompt: `x / ${a} = ${b}`, answer: a * b }
}

function makeTwoStepEq(rand: () => number): { prompt: string; answer: number } {
  // Randomly pick one of 4 two-step forms
  const form = randInt(0, 3, rand)

  if (form === 0) {
    // ax + b = c
    const a = randInt(2, 5, rand)
    const x = randInt(1, 9, rand)
    const b = randInt(1, 15, rand)
    return { prompt: `${a}x + ${b} = ${a * x + b}`, answer: x }
  }

  if (form === 1) {
    // ax - b = c (c > 0 ensured by b < a*x)
    const a = randInt(2, 5, rand)
    const x = randInt(2, 9, rand)
    const b = randInt(1, a * x - 1, rand)
    return { prompt: `${a}x - ${b} = ${a * x - b}`, answer: x }
  }

  if (form === 2) {
    // x / a + b = c; answer x = a * k
    const a = randInt(2, 4, rand)
    const k = randInt(2, 9, rand)
    const b = randInt(1, 8, rand)
    return { prompt: `x / ${a} + ${b} = ${k + b}`, answer: a * k }
  }

  // form === 3: x / a - b = c (c > 0 ensured by b < k)
  const a = randInt(2, 4, rand)
  const k = randInt(3, 10, rand)
  const b = randInt(1, k - 1, rand)
  return { prompt: `x / ${a} - ${b} = ${k - b}`, answer: a * k }
}

// Generates problems for Level 10/1 — Linear Equations
// Distribution: 25% add, 25% sub, 20% mult, 15% div, remainder two-step
export function generateLinearEquations(count = 10, rand: () => number = Math.random): LinearEquationProblem[] {
  const addCount = Math.floor(count * 0.25)
  const subCount = Math.floor(count * 0.25)
  const multCount = Math.floor(count * 0.20)
  const divCount = Math.floor(count * 0.15)
  const twoStepCount = count - addCount - subCount - multCount - divCount

  function buildSegment(
    n: number,
    prefix: string,
    make: (r: () => number) => { prompt: string; answer: number },
  ): LinearEquationProblem[] {
    const results: LinearEquationProblem[] = []
    const seen = new Set<string>()
    let tries = 0
    while (results.length < n && tries < n * 50) {
      tries++
      const { prompt, answer } = make(rand)
      const full = `Solve for x: ${prompt}`
      if (!seen.has(full)) {
        seen.add(full)
        results.push({ id: `${prefix}_${results.length + 1}`, type: 'linear_equation', prompt: full, answer: String(answer) })
      }
    }
    return results
  }

  return [
    ...buildSegment(addCount, 'leq_add', makeAddEq),
    ...buildSegment(subCount, 'leq_sub', makeSubEq),
    ...buildSegment(multCount, 'leq_mul', makeMulEq),
    ...buildSegment(divCount, 'leq_div', makeDivEq),
    ...buildSegment(twoStepCount, 'leq_2s', makeTwoStepEq),
  ]
}

// --- Level 10/2 — Variables on Both Sides ---

function makeBothSidesProblem(rand: () => number): { prompt: string; answer: number } {
  // c1*x ± b1 = c2*x + b2; x = (b2 ± b1) / (c1 - c2)
  // Strategy: pick c1 > c2, x, b1; compute b2 to balance
  const c1 = randInt(2, 7, rand)
  const c2 = randInt(1, c1 - 1, rand)
  const diff = c1 - c2
  const x = randInt(1, 10, rand)
  const useSubtraction = rand() < 0.5

  let prompt: string

  const cx = (n: number) => n === 1 ? 'x' : `${n}x`

  if (useSubtraction && diff * x > 1) {
    // c1*x - b1 = c2*x + b2 → b2 = diff*x - b1
    const b1 = randInt(1, diff * x - 1, rand)
    const b2 = diff * x - b1
    prompt = `${cx(c1)} - ${b1} = ${cx(c2)} + ${b2}`
  } else {
    // c1*x + b1 = c2*x + b2 → b2 = diff*x + b1
    const b1 = randInt(0, 10, rand)
    const b2 = diff * x + b1
    prompt = b1 === 0 ? `${cx(c1)} = ${cx(c2)} + ${b2}` : `${cx(c1)} + ${b1} = ${cx(c2)} + ${b2}`
  }

  return { prompt, answer: x }
}

// Generates problems for Level 10/2 — Variables on Both Sides
export function generateVariablesBothSides(count = 10, rand: () => number = Math.random): LinearEquationProblem[] {
  const problems: LinearEquationProblem[] = []
  const seen = new Set<string>()
  let tries = 0
  while (problems.length < count && tries < count * 50) {
    tries++
    const { prompt, answer } = makeBothSidesProblem(rand)
    const full = `Solve for x: ${prompt}`
    if (!seen.has(full)) {
      seen.add(full)
      problems.push({ id: `vbs_${problems.length + 1}`, type: 'linear_equation', prompt: full, answer: String(answer) })
    }
  }
  return problems
}
