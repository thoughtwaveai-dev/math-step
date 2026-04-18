import { randInt } from './rand'

export type MultiplicationProblemType = 'multiplication'

export interface MultiplicationProblem {
  id: string
  type: MultiplicationProblemType
  prompt: string
  answer: string
}

// Level 3/1 — Basic multiplication facts
// Domain: a ∈ [2,9], b ∈ [2,9] → 64 unique ordered pairs
export function generateBasicMultiplication(count = 10, rand: () => number = Math.random): MultiplicationProblem[] {
  const problems: MultiplicationProblem[] = []
  const seen = new Set<string>()
  let tries = 0
  while (problems.length < count && tries < count * 50) {
    tries++
    const a = randInt(2, 9, rand)
    const b = randInt(2, 9, rand)
    const prompt = `${a} × ${b} = ?`
    if (!seen.has(prompt)) {
      seen.add(prompt)
      problems.push({ id: `mul1_${problems.length + 1}`, type: 'multiplication', prompt, answer: String(a * b) })
    }
  }
  return problems
}

// Level 3/2 — Two-digit × one-digit multiplication
// Domain: a ∈ [11,25], b ∈ [2,5] → 60 unique pairs; products ≤ 125, matching original difficulty
export function generateMultiDigitMultiplication(count = 10, rand: () => number = Math.random): MultiplicationProblem[] {
  const problems: MultiplicationProblem[] = []
  const seen = new Set<string>()
  let tries = 0
  while (problems.length < count && tries < count * 50) {
    tries++
    const a = randInt(11, 25, rand)
    const b = randInt(2, 5, rand)
    const prompt = `${a} × ${b} = ?`
    if (!seen.has(prompt)) {
      seen.add(prompt)
      problems.push({ id: `mul2_${problems.length + 1}`, type: 'multiplication', prompt, answer: String(a * b) })
    }
  }
  return problems
}
