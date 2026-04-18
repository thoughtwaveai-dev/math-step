import { randInt } from './rand'

export type SubtractionProblemType = 'subtraction'

export interface SubtractionProblem {
  id: string
  type: SubtractionProblemType
  prompt: string
  answer: string
}

// Level 2/1 — Single-digit subtraction, no negative results
// Domain: a ∈ [1,9], b ∈ [0,a] → 54 unique pairs (> 2× max count of 20)
export function generateSingleDigitSubtraction(count = 10, rand: () => number = Math.random): SubtractionProblem[] {
  const problems: SubtractionProblem[] = []
  const seen = new Set<string>()
  let tries = 0
  while (problems.length < count && tries < count * 50) {
    tries++
    const a = randInt(1, 9, rand)
    const b = randInt(0, a, rand)
    const prompt = `${a} - ${b} = ?`
    if (!seen.has(prompt)) {
      seen.add(prompt)
      problems.push({ id: `sub1_${problems.length + 1}`, type: 'subtraction', prompt, answer: String(a - b) })
    }
  }
  return problems
}

// Level 2/2 — Double-digit subtraction, positive results, manageable borrowing
// Domain: a ∈ [20,89], b ∈ [11,a-1] → very large; result always ≥ 1
export function generateDoubleDigitSubtraction(count = 10, rand: () => number = Math.random): SubtractionProblem[] {
  const problems: SubtractionProblem[] = []
  const seen = new Set<string>()
  let tries = 0
  while (problems.length < count && tries < count * 50) {
    tries++
    const a = randInt(20, 89, rand)
    const b = randInt(11, a - 1, rand)
    const prompt = `${a} - ${b} = ?`
    if (!seen.has(prompt)) {
      seen.add(prompt)
      problems.push({ id: `sub2_${problems.length + 1}`, type: 'subtraction', prompt, answer: String(a - b) })
    }
  }
  return problems
}
