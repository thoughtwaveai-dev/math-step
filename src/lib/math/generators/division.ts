import { randInt } from './rand'

export type DivisionProblemType = 'division'

export interface DivisionProblem {
  id: string
  type: DivisionProblemType
  prompt: string
  answer: string
}

// Level 4/1 — Basic division facts (inverse of single-digit multiplication)
// Domain: divisor b ∈ [1,9], quotient a ∈ [1,9] → dividend = a*b
// 81 unique pairs; whole-number answers only; no remainders by construction.
export function generateDivisionFacts(count = 10, rand: () => number = Math.random): DivisionProblem[] {
  const problems: DivisionProblem[] = []
  const seen = new Set<string>()
  let tries = 0
  while (problems.length < count && tries < count * 50) {
    tries++
    const a = randInt(1, 9, rand)
    const b = randInt(1, 9, rand)
    const dividend = a * b
    const prompt = `${dividend} ÷ ${b} = ?`
    if (!seen.has(prompt)) {
      seen.add(prompt)
      problems.push({ id: `div1_${problems.length + 1}`, type: 'division', prompt, answer: String(a) })
    }
  }
  return problems
}

// Level 4/2 — Long division (two-digit ÷ one-digit, no remainders)
// Domain: divisor b ∈ [2,9], quotient q ∈ [11,25] → dividend = b*q (max 225)
// Whole-number answers only; no remainders by construction.
export function generateLongDivision(count = 10, rand: () => number = Math.random): DivisionProblem[] {
  const problems: DivisionProblem[] = []
  const seen = new Set<string>()
  let tries = 0
  while (problems.length < count && tries < count * 50) {
    tries++
    const b = randInt(2, 9, rand)
    const q = randInt(11, 25, rand)
    const dividend = b * q
    const prompt = `${dividend} ÷ ${b} = ?`
    if (!seen.has(prompt)) {
      seen.add(prompt)
      problems.push({ id: `div2_${problems.length + 1}`, type: 'division', prompt, answer: String(q) })
    }
  }
  return problems
}
