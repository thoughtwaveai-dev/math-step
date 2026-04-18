import { randInt } from './rand'

export type SimultaneousEquationType = 'sim_eq'

export interface SimultaneousEquationProblem {
  id: string
  type: SimultaneousEquationType
  prompt: string
  answer: string
}

// Canonical answer format: "x = 3, y = 7"
// Grading normalizes spaces/case, so "x=3,y=7" and "X = 3, Y = 7" all pass.
// x must come before y (v1 constraint — lesson states this clearly).

// Type 1: x + y = S, x - y = D
// Require x > y so D > 0 and numbers stay readable.
function makeAddSub(rand: () => number): { prompt: string; answer: string } {
  const x = randInt(3, 9, rand)
  const y = randInt(1, x - 1, rand)
  const S = x + y
  const D = x - y
  return {
    prompt: `Solve the pair of equations:\nx + y = ${S}\nx − y = ${D}\nGive your answer as: x = ?, y = ?`,
    answer: `x = ${x}, y = ${y}`,
  }
}

// Type 2: 2x + y = C, x - y = D
// Require x > y so D > 0.
function makeMulSub(rand: () => number): { prompt: string; answer: string } {
  const x = randInt(3, 8, rand)
  const y = randInt(1, x - 1, rand)
  const C = 2 * x + y
  const D = x - y
  return {
    prompt: `Solve the pair of equations:\n2x + y = ${C}\nx − y = ${D}\nGive your answer as: x = ?, y = ?`,
    answer: `x = ${x}, y = ${y}`,
  }
}

// Type 3: x + 2y = C, x + y = D
// C - D = y, D - y = x. No sign constraints needed.
function makeAddMul(rand: () => number): { prompt: string; answer: string } {
  const x = randInt(2, 8, rand)
  const y = randInt(1, 7, rand)
  const C = x + 2 * y
  const D = x + y
  return {
    prompt: `Solve the pair of equations:\nx + 2y = ${C}\nx + y = ${D}\nGive your answer as: x = ?, y = ?`,
    answer: `x = ${x}, y = ${y}`,
  }
}

// Generates problems for Level 11/2 — Simultaneous Equations
// Distribution: roughly equal across the 3 problem types.
export function generateSimultaneousEquations(
  count = 10,
  rand: () => number = Math.random,
): SimultaneousEquationProblem[] {
  const perType = Math.floor(count / 3)
  const remainder = count - perType * 3

  type Maker = (r: () => number) => { prompt: string; answer: string }

  function buildSegment(n: number, prefix: string, make: Maker): SimultaneousEquationProblem[] {
    const results: SimultaneousEquationProblem[] = []
    const seen = new Set<string>()
    let tries = 0
    while (results.length < n && tries < n * 50) {
      tries++
      const { prompt, answer } = make(rand)
      if (!seen.has(prompt)) {
        seen.add(prompt)
        results.push({ id: `${prefix}_${results.length + 1}`, type: 'sim_eq', prompt, answer })
      }
    }
    return results
  }

  return [
    ...buildSegment(perType, 'sim_add_sub', makeAddSub),
    ...buildSegment(perType, 'sim_mul_sub', makeMulSub),
    ...buildSegment(perType + remainder, 'sim_add_mul', makeAddMul),
  ]
}
