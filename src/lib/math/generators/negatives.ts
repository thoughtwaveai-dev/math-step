import { randInt } from './rand'

export type NegativeProblemType =
  | 'neg_addition'
  | 'neg_subtraction'
  | 'neg_multiplication'
  | 'neg_division'

export interface NegativeProblem {
  id: string
  type: NegativeProblemType
  prompt: string
  answer: string
}

// Operand ranges kept small so mental arithmetic is realistic for kids.
const SMALL = 12

function generateOneProblem(
  rand: () => number
): { type: NegativeProblemType; prompt: string; answer: string } | null {
  const pick = rand()

  if (pick < 0.30) {
    // Addition with at least one negative operand
    // Ensure at least one operand is negative to make it genuinely a negatives problem
    const a = randInt(-SMALL, SMALL, rand)
    const b = randInt(-SMALL, SMALL, rand)
    if (a >= 0 && b >= 0) return null // reject all-positive
    const sum = a + b
    const bStr = b < 0 ? `(${b})` : `${b}`
    return {
      type: 'neg_addition',
      prompt: `${a} + ${bStr} = ?`,
      answer: sum.toString(),
    }
  }

  if (pick < 0.55) {
    // Subtraction with negatives: covers "positive minus positive → negative",
    // "negative minus positive", and "minus a negative" cases.
    const a = randInt(-SMALL, SMALL, rand)
    const b = randInt(-SMALL, SMALL, rand)
    if (a >= 0 && b >= 0 && a >= b) return null // this is plain subtraction; skip boring cases
    const diff = a - b
    const bStr = b < 0 ? `(${b})` : `${b}`
    return {
      type: 'neg_subtraction',
      prompt: `${a} - ${bStr} = ?`,
      answer: diff.toString(),
    }
  }

  if (pick < 0.78) {
    // Multiplication: exactly one or both operands negative
    const a = randInt(1, 9, rand) * (rand() < 0.5 ? -1 : 1)
    const b = randInt(1, 9, rand) * (rand() < 0.5 ? -1 : 1)
    if (a > 0 && b > 0) return null // skip all-positive
    const product = a * b
    if (Math.abs(product) > SMALL * 9) return null
    const bStr = b < 0 ? `(${b})` : `${b}`
    return {
      type: 'neg_multiplication',
      prompt: `${a} × ${bStr} = ?`,
      answer: product.toString(),
    }
  }

  // Division: dividend or divisor is negative, quotient must be a clean integer
  // Pick quotient first to guarantee no remainder
  const quotient = randInt(1, 9, rand) * (rand() < 0.5 ? -1 : 1)
  const divisor = randInt(1, 9, rand) * (rand() < 0.5 ? -1 : 1)
  if (divisor === 0) return null
  const dividend = quotient * divisor
  if (dividend > 0 && divisor > 0) return null // skip all-positive
  if (Math.abs(dividend) > SMALL * 9) return null
  const divisorStr = divisor < 0 ? `(${divisor})` : `${divisor}`
  return {
    type: 'neg_division',
    prompt: `${dividend} ÷ ${divisorStr} = ?`,
    answer: quotient.toString(),
  }
}

export function generateNegativeProblems(
  count = 10,
  rand: () => number = Math.random
): NegativeProblem[] {
  const problems: NegativeProblem[] = []
  const seen = new Set<string>()
  let tries = 0

  while (problems.length < count && tries < count * 100) {
    tries++
    const p = generateOneProblem(rand)
    if (!p || seen.has(p.prompt)) continue
    seen.add(p.prompt)
    problems.push({ id: `neg71_${problems.length + 1}`, ...p })
  }

  return problems
}
