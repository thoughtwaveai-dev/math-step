import { randInt } from './rand'

export type AdditionProblemType = 'addition'

export interface AdditionProblem {
  id: string
  type: AdditionProblemType
  prompt: string
  answer: string
}

// Level 1/1 — Single-digit addition
// Domain: a ∈ [1,9], b ∈ [1,9] → 81 unique ordered pairs (well above 3× max count of 20)
export function generateSingleDigitAddition(count = 10, rand: () => number = Math.random): AdditionProblem[] {
  const problems: AdditionProblem[] = []
  const seen = new Set<string>()
  let tries = 0
  while (problems.length < count && tries < count * 50) {
    tries++
    const a = randInt(1, 9, rand)
    const b = randInt(1, 9, rand)
    const prompt = `${a} + ${b} = ?`
    if (!seen.has(prompt)) {
      seen.add(prompt)
      problems.push({ id: `add1_${problems.length + 1}`, type: 'addition', prompt, answer: String(a + b) })
    }
  }
  return problems
}

// Level 1/2 — Double-digit addition
// Domain: a ∈ [10,49], b ∈ [10,49] → ~1600 unique pairs; mild carrying naturally occurs
export function generateDoubleDigitAddition(count = 10, rand: () => number = Math.random): AdditionProblem[] {
  const problems: AdditionProblem[] = []
  const seen = new Set<string>()
  let tries = 0
  while (problems.length < count && tries < count * 50) {
    tries++
    const a = randInt(10, 49, rand)
    const b = randInt(10, 49, rand)
    const prompt = `${a} + ${b} = ?`
    if (!seen.has(prompt)) {
      seen.add(prompt)
      problems.push({ id: `add2_${problems.length + 1}`, type: 'addition', prompt, answer: String(a + b) })
    }
  }
  return problems
}
