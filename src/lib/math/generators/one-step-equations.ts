import { randInt } from './rand'

export type OneStepEquationType = 'eq_add' | 'eq_sub' | 'eq_mul' | 'eq_div'

export interface OneStepEquationProblem {
  id: string
  type: OneStepEquationType
  prompt: string
  answer: string
}

// x + a = b  →  x = b - a  (x ∈ [1,12], a ∈ [1,10])
function makeAddEq(rand: () => number): { prompt: string; answer: number } {
  const x = randInt(1, 12, rand)
  const a = randInt(1, 10, rand)
  return { prompt: `x + ${a} = ${x + a}`, answer: x }
}

// x - a = b  →  x = b + a  (x ∈ [5,18], a ∈ [1, x-1], b always positive)
function makeSubEq(rand: () => number): { prompt: string; answer: number } {
  const x = randInt(5, 18, rand)
  const a = randInt(1, x - 1, rand)
  return { prompt: `x - ${a} = ${x - a}`, answer: x }
}

// ax = b  →  x = b / a  (a ∈ [2,9], x ∈ [1,10])
function makeMulEq(rand: () => number): { prompt: string; answer: number } {
  const a = randInt(2, 9, rand)
  const x = randInt(1, 10, rand)
  return { prompt: `${a}x = ${a * x}`, answer: x }
}

// x / a = b  →  x = a * b  (a ∈ [2,9], b ∈ [1,10])
function makeDivEq(rand: () => number): { prompt: string; answer: number } {
  const a = randInt(2, 9, rand)
  const b = randInt(1, 10, rand)
  return { prompt: `x / ${a} = ${b}`, answer: a * b }
}

const makers = [makeAddEq, makeSubEq, makeMulEq, makeDivEq]

export function generateOneStepEquations(count: number, rand: () => number = Math.random): OneStepEquationProblem[] {
  const types: OneStepEquationType[] = ['eq_add', 'eq_sub', 'eq_mul', 'eq_div']
  const seen = new Set<string>()
  const problems: OneStepEquationProblem[] = []
  let attempts = 0
  const maxAttempts = count * 50

  while (problems.length < count && attempts < maxAttempts) {
    attempts++
    const i = Math.floor(rand() * makers.length)
    const { prompt, answer } = makers[i](rand)
    if (seen.has(prompt)) continue
    seen.add(prompt)
    problems.push({
      id: `eq-${problems.length}-${Date.now()}-${attempts}`,
      type: types[i],
      prompt,
      answer: String(answer),
    })
  }

  return problems
}
