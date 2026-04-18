import { randInt } from './rand'

export type InequalityProblemType = 'inequality'

export interface InequalityProblem {
  id: string
  type: InequalityProblemType
  prompt: string
  answer: string
}

// --- Level 11/1 helpers ---
// Prompts use Unicode ≤/≥ for display; answers use ASCII <=/>= for keyboard entry.
// Grading normalizes both to the same form.

function makeAddGt(rand: () => number): { prompt: string; answer: string } {
  // x + a > b → x > threshold; threshold ∈ [1,12], a ∈ [1,9]
  const a = randInt(1, 9, rand)
  const threshold = randInt(1, 12, rand)
  const b = threshold + a
  return {
    prompt: `Solve: x + ${a} > ${b}. Write your answer like: x > 4`,
    answer: `x > ${threshold}`,
  }
}

function makeSubLt(rand: () => number): { prompt: string; answer: string } {
  // x - a < b → x < threshold = a + b; a ∈ [1,9], b ∈ [1,10]
  const a = randInt(1, 9, rand)
  const b = randInt(1, 10, rand)
  const threshold = a + b
  return {
    prompt: `Solve: x - ${a} < ${b}. Write your answer like: x < 7`,
    answer: `x < ${threshold}`,
  }
}

function makeMulLe(rand: () => number): { prompt: string; answer: string } {
  // ax ≤ b → x ≤ threshold; a ∈ [2,6], threshold ∈ [2,10]
  const a = randInt(2, 6, rand)
  const threshold = randInt(2, 10, rand)
  const b = a * threshold
  return {
    prompt: `Solve: ${a}x ≤ ${b}. Write your answer like: x <= 5`,
    answer: `x <= ${threshold}`,
  }
}

function makeDivGe(rand: () => number): { prompt: string; answer: string } {
  // x / a ≥ b → x ≥ threshold = a*b; a ∈ [2,5], b ∈ [2,8]
  const a = randInt(2, 5, rand)
  const b = randInt(2, 8, rand)
  const threshold = a * b
  return {
    prompt: `Solve: x / ${a} ≥ ${b}. Write your answer like: x >= 12`,
    answer: `x >= ${threshold}`,
  }
}

// Generates problems for Level 11/1 — One-Variable Inequalities
// Distribution: 25% each of the 4 inequality types
export function generateInequalities(count = 10, rand: () => number = Math.random): InequalityProblem[] {
  const perType = Math.floor(count / 4)
  const remainder = count - perType * 4

  type Maker = (r: () => number) => { prompt: string; answer: string }

  function buildSegment(
    n: number,
    prefix: string,
    make: Maker,
  ): InequalityProblem[] {
    const results: InequalityProblem[] = []
    const seen = new Set<string>()
    let tries = 0
    while (results.length < n && tries < n * 50) {
      tries++
      const { prompt, answer } = make(rand)
      if (!seen.has(prompt)) {
        seen.add(prompt)
        results.push({ id: `${prefix}_${results.length + 1}`, type: 'inequality', prompt, answer })
      }
    }
    return results
  }

  return [
    ...buildSegment(perType, 'ineq_gt', makeAddGt),
    ...buildSegment(perType, 'ineq_lt', makeSubLt),
    ...buildSegment(perType, 'ineq_le', makeMulLe),
    ...buildSegment(perType + remainder, 'ineq_ge', makeDivGe),
  ]
}
