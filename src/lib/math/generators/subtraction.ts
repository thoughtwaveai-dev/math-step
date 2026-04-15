export type SubtractionProblemType = 'subtraction'

export interface SubtractionProblem {
  id: string
  type: SubtractionProblemType
  prompt: string
  answer: string
}

// --- Level 2/1 — Single-digit subtraction ---
// 10 fixed pairs, results are 0–9, no negatives
const SINGLE_DIGIT_PAIRS: [number, number][] = [
  [8, 3],
  [9, 4],
  [7, 2],
  [6, 1],
  [5, 3],
  [9, 6],
  [8, 5],
  [7, 4],
  [6, 3],
  [9, 7],
]

export function generateSingleDigitSubtraction(count: number = SINGLE_DIGIT_PAIRS.length): SubtractionProblem[] {
  return Array.from({ length: count }, (_, i) => {
    const [a, b] = SINGLE_DIGIT_PAIRS[i % SINGLE_DIGIT_PAIRS.length]
    return {
      id: `sub1_${i + 1}`,
      type: 'subtraction',
      prompt: `${a} - ${b} = ?`,
      answer: String(a - b),
    }
  })
}

// --- Level 2/2 — Double-digit subtraction ---
// 10 fixed pairs, age-appropriate, no negatives, manageable borrowing
const DOUBLE_DIGIT_PAIRS: [number, number][] = [
  [25, 13],
  [38, 14],
  [47, 22],
  [56, 31],
  [64, 28],
  [73, 45],
  [82, 37],
  [91, 56],
  [67, 34],
  [85, 49],
]

export function generateDoubleDigitSubtraction(count: number = DOUBLE_DIGIT_PAIRS.length): SubtractionProblem[] {
  return Array.from({ length: count }, (_, i) => {
    const [a, b] = DOUBLE_DIGIT_PAIRS[i % DOUBLE_DIGIT_PAIRS.length]
    return {
      id: `sub2_${i + 1}`,
      type: 'subtraction',
      prompt: `${a} - ${b} = ?`,
      answer: String(a - b),
    }
  })
}
