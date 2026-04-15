export type MultiplicationProblemType = 'multiplication'

export interface MultiplicationProblem {
  id: string
  type: MultiplicationProblemType
  prompt: string
  answer: string
}

// --- Level 3/1 — Basic multiplication facts ---
// 10 fixed pairs, single-digit × single-digit, age-appropriate times tables
const BASIC_FACTS_PAIRS: [number, number][] = [
  [2, 3],
  [4, 5],
  [3, 6],
  [7, 2],
  [5, 4],
  [6, 3],
  [8, 2],
  [4, 7],
  [9, 3],
  [6, 6],
]

export function generateBasicMultiplication(count: number = BASIC_FACTS_PAIRS.length): MultiplicationProblem[] {
  return Array.from({ length: count }, (_, i) => {
    const [a, b] = BASIC_FACTS_PAIRS[i % BASIC_FACTS_PAIRS.length]
    return {
      id: `mul1_${i + 1}`,
      type: 'multiplication',
      prompt: `${a} × ${b} = ?`,
      answer: String(a * b),
    }
  })
}

// --- Level 3/2 — Multi-digit multiplication ---
// 10 fixed pairs: two-digit × one-digit, manageable products, no overwhelming numbers
const MULTI_DIGIT_PAIRS: [number, number][] = [
  [12, 3],
  [14, 2],
  [11, 5],
  [13, 4],
  [21, 3],
  [15, 4],
  [22, 3],
  [16, 5],
  [24, 3],
  [31, 2],
]

export function generateMultiDigitMultiplication(count: number = MULTI_DIGIT_PAIRS.length): MultiplicationProblem[] {
  return Array.from({ length: count }, (_, i) => {
    const [a, b] = MULTI_DIGIT_PAIRS[i % MULTI_DIGIT_PAIRS.length]
    return {
      id: `mul2_${i + 1}`,
      type: 'multiplication',
      prompt: `${a} × ${b} = ?`,
      answer: String(a * b),
    }
  })
}
