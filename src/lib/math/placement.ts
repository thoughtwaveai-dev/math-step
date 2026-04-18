import { gradeAnswer } from '@/lib/math/gradeAnswer'

export type PlacementBand =
  | 'arithmetic'
  | 'mul_div'
  | 'fractions'
  | 'decimals_pct'
  | 'negatives_ops'
  | 'algebra'

export type PlacementQuestion = {
  id: number
  prompt: string
  answer: string
  inputMode: 'numeric' | 'text'
  band: PlacementBand
  hint?: string
}

// 12 questions, 6 bands of 2. Each question probes a specific level checkpoint.
// Band gate: need ≥1 correct in a band to advance. First band with 0/2 = ceiling.
export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // Band 1 — Arithmetic (levels 1/1–2/2)
  { id: 1, prompt: '8 + 6 = ?', answer: '14', inputMode: 'numeric', band: 'arithmetic' },
  { id: 2, prompt: '45 − 18 = ?', answer: '27', inputMode: 'numeric', band: 'arithmetic' },

  // Band 2 — Multiplication & Division (levels 3/1–4/1)
  { id: 3, prompt: '6 × 7 = ?', answer: '42', inputMode: 'numeric', band: 'mul_div' },
  { id: 4, prompt: '56 ÷ 8 = ?', answer: '7', inputMode: 'numeric', band: 'mul_div' },

  // Band 3 — Fractions (levels 5/1–5/2)
  {
    id: 5,
    prompt: '1/3 + 1/3 = ?',
    answer: '2/3',
    inputMode: 'text',
    band: 'fractions',
    hint: 'e.g. 3/4',
  },
  {
    id: 6,
    prompt: '1/2 × 2/3 = ?',
    answer: '1/3',
    inputMode: 'text',
    band: 'fractions',
    hint: 'e.g. 2/5',
  },

  // Band 4 — Decimals & Percentages (levels 6/1–6/2)
  { id: 7, prompt: '4.5 + 3.7 = ?', answer: '8.2', inputMode: 'numeric', band: 'decimals_pct' },
  { id: 8, prompt: 'What is 25% of 80?', answer: '20', inputMode: 'numeric', band: 'decimals_pct' },

  // Band 5 — Negative Numbers & Order of Operations (levels 7/1–7/2)
  { id: 9, prompt: '-3 + 8 = ?', answer: '5', inputMode: 'numeric', band: 'negatives_ops' },
  { id: 10, prompt: '2 + 3 × 4 = ?', answer: '14', inputMode: 'numeric', band: 'negatives_ops' },

  // Band 6 — Algebra (levels 8/1–8/2)
  {
    id: 11,
    prompt: 'Simplify:  3x + 2 + 2x',
    answer: '5x + 2',
    inputMode: 'text',
    band: 'algebra',
    hint: 'Variable term first, e.g. 4x + 3',
  },
  { id: 12, prompt: 'Solve for x:  4x = 28', answer: '7', inputMode: 'numeric', band: 'algebra' },
]

export type PlacementResult = {
  level: number
  sublevel: number
  topic: string
  explanation: string
}

const PLACEMENT_INFO: Record<string, { topic: string; explanation: string }> = {
  '1/1': {
    topic: 'Addition',
    explanation: 'Starting at the beginning with single-digit addition.',
  },
  '1/2': {
    topic: 'Addition',
    explanation: 'Good basic addition — placed at double-digit addition.',
  },
  '3/1': {
    topic: 'Multiplication',
    explanation: 'Solid arithmetic foundation — placed at multiplication facts.',
  },
  '3/2': {
    topic: 'Multiplication',
    explanation: 'Strong multiplication skills — placed at multi-digit multiplication.',
  },
  '4/2': {
    topic: 'Long Division',
    explanation: 'Division facts solid — placed at long division.',
  },
  '5/1': {
    topic: 'Fractions',
    explanation: 'Fractions are the next step — placed at fraction addition and subtraction.',
  },
  '5/2': {
    topic: 'Fractions',
    explanation: 'Fraction addition solid — placed at fraction multiplication and division.',
  },
  '6/1': {
    topic: 'Decimals',
    explanation: 'Good fraction skills — placed at decimal operations.',
  },
  '6/2': {
    topic: 'Percentages',
    explanation: 'Decimals solid — placed at percentages.',
  },
  '7/1': {
    topic: 'Negative Numbers',
    explanation: 'Percentages solid — placed at negative number operations.',
  },
  '7/2': {
    topic: 'Order of Operations',
    explanation: 'Negative numbers solid — placed at order of operations.',
  },
  '8/1': {
    topic: 'Simplifying Expressions',
    explanation: 'Order of operations solid — placed at simplifying algebraic expressions.',
  },
  '8/2': {
    topic: 'One-step Equations',
    explanation: 'Expressions solid — placed at solving one-step equations.',
  },
  '9/1': {
    topic: 'Prime Factorisation',
    explanation: 'Strong algebra readiness — placed at prime factorisation and factors.',
  },
}

// Bands in order — each entry is [firstQuestionIndex, secondQuestionIndex]
const BANDS: [number, number][] = [
  [0, 1], // arithmetic
  [2, 3], // mul_div
  [4, 5], // fractions
  [6, 7], // decimals_pct
  [8, 9], // negatives_ops
  [10, 11], // algebra
]

// Placement key when the given band fails (0/2 correct).
// Key = first question in that band (lower level = more conservative).
const BAND_FAIL_KEYS: string[] = [
  '1/1',  // arithmetic band fails → start at 1/1
  '3/1',  // mul_div band fails → start at multiplication facts
  '5/1',  // fractions band fails → start at fraction addition and subtraction
  '6/1',  // decimals_pct band fails → start at decimals
  '7/1',  // negatives_ops band fails → start at negative numbers
  '8/1',  // algebra band fails → start at simplifying expressions
]

// Placement key when first question passes but second fails in a band.
// Student has demonstrated the lower skill — place at the next level up.
const BAND_SECOND_FAIL_KEYS: string[] = [
  '1/2',  // arithmetic: Q1 pass (1/1), Q2 fail → 1/2
  '3/2',  // mul_div: Q3 pass (3/1), Q4 fail → 3/2
  '5/2',  // fractions: Q5 pass (5/1), Q6 fail → 5/2
  '6/2',  // decimals_pct: Q7 pass (6/1), Q8 fail → 6/2
  '7/2',  // negatives_ops: Q9 pass (7/1), Q10 fail → 7/2
  '8/2',  // algebra: Q11 pass (8/1), Q12 fail → 8/2
]

export function scorePlacement(answers: string[]): PlacementResult {
  const correct = PLACEMENT_QUESTIONS.map((q, i) =>
    gradeAnswer(answers[i] ?? '', q.answer)
  )

  let key = '9/1' // default: all bands passed → place at number theory

  for (let b = 0; b < BANDS.length; b++) {
    const [i, j] = BANDS[b]
    const firstOk = correct[i]
    const secondOk = correct[j]

    if (!firstOk && !secondOk) {
      // Both wrong → this band is the ceiling
      key = BAND_FAIL_KEYS[b]
      break
    }
    if (firstOk && !secondOk) {
      // First right, second wrong → place within this band at the next level
      key = BAND_SECOND_FAIL_KEYS[b]
      break
    }
    if (!firstOk && secondOk) {
      // Second right, first wrong (e.g. Q1 typo recovery) → treat band as passed
      // but place conservatively at the "second fail" level of the PREVIOUS band
      // since we didn't fully demonstrate this band. Exception: band 0 has no previous.
      if (b === 0) {
        // Q1 wrong but Q2 right → likely a typo; conservative = 1/2
        key = '1/2'
        break
      }
      // For other bands: advancing with one miss is acceptable; continue
    }
    // Both correct → advance to next band
  }

  const info = PLACEMENT_INFO[key]
  const [levelStr, sublevelStr] = key.split('/')

  return {
    level: parseInt(levelStr, 10),
    sublevel: parseInt(sublevelStr, 10),
    topic: info.topic,
    explanation: info.explanation,
  }
}
