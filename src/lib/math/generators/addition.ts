export type AdditionProblemType = 'addition'

export interface AdditionProblem {
  id: string
  type: AdditionProblemType
  prompt: string
  answer: string
}

// --- Level 1/1 — Single-digit addition ---
// 10 fixed pairs, sums within 10 to keep it age-appropriate for beginners
const SINGLE_DIGIT_PAIRS: [number, number][] = [
  [2, 3],
  [4, 5],
  [1, 6],
  [3, 4],
  [5, 3],
  [2, 7],
  [6, 2],
  [4, 4],
  [1, 8],
  [3, 6],
]

export function generateSingleDigitAddition(count: number = SINGLE_DIGIT_PAIRS.length): AdditionProblem[] {
  return Array.from({ length: count }, (_, i) => {
    const [a, b] = SINGLE_DIGIT_PAIRS[i % SINGLE_DIGIT_PAIRS.length]
    return {
      id: `add1_${i + 1}`,
      type: 'addition',
      prompt: `${a} + ${b} = ?`,
      answer: String(a + b),
    }
  })
}

// --- Level 1/2 — Double-digit addition ---
// 10 fixed pairs using tens and units, no carrying at first few then mild carrying
const DOUBLE_DIGIT_PAIRS: [number, number][] = [
  [10, 15],
  [20, 13],
  [11, 12],
  [14, 21],
  [23, 16],
  [17, 22],
  [25, 14],
  [18, 21],
  [34, 25],
  [27, 36],
]

export function generateDoubleDigitAddition(count: number = DOUBLE_DIGIT_PAIRS.length): AdditionProblem[] {
  return Array.from({ length: count }, (_, i) => {
    const [a, b] = DOUBLE_DIGIT_PAIRS[i % DOUBLE_DIGIT_PAIRS.length]
    return {
      id: `add2_${i + 1}`,
      type: 'addition',
      prompt: `${a} + ${b} = ?`,
      answer: String(a + b),
    }
  })
}
