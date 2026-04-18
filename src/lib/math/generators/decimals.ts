import { randInt } from './rand'

export type DecimalProblemType =
  | 'decimal_addition'
  | 'decimal_subtraction'
  | 'decimal_multiplication'

export interface DecimalProblem {
  id: string
  type: DecimalProblemType
  prompt: string
  answer: string
}

// Returns "3.5", "2.75", or "4" (whole) — always clean, no trailing zeros.
function formatDecimal(n: number): string {
  return parseFloat(n.toFixed(2)).toString()
}

// Random 1-decimal-place number in [min, max]: e.g. 1.3, 4.7
function randDec1(min: number, max: number, rand: () => number): number {
  const tenths = randInt(Math.round(min * 10), Math.round(max * 10), rand)
  return tenths / 10
}

function generateOneProblem(
  rand: () => number
): { type: DecimalProblemType; prompt: string; answer: string } | null {
  const pick = rand()

  if (pick < 0.38) {
    // Decimal addition: both 1 decimal place
    const a = randDec1(0.1, 9.9, rand)
    const b = randDec1(0.1, 9.9, rand)
    const sum = parseFloat((a + b).toFixed(1))
    if (sum > 19.9) return null
    return {
      type: 'decimal_addition',
      prompt: `${a} + ${b} = ?`,
      answer: formatDecimal(sum),
    }
  }

  if (pick < 0.72) {
    // Decimal subtraction: a > b, result > 0
    const a = randDec1(1.2, 9.9, rand)
    const b = randDec1(0.1, parseFloat((a - 0.1).toFixed(1)), rand)
    const diff = parseFloat((a - b).toFixed(1))
    if (diff <= 0) return null
    return {
      type: 'decimal_subtraction',
      prompt: `${a} - ${b} = ?`,
      answer: formatDecimal(diff),
    }
  }

  // Decimal multiplication: decimal × small whole number
  const a = randDec1(0.2, 4.9, rand)
  const b = randInt(2, 5, rand)
  const product = parseFloat((a * b).toFixed(1))
  if (product > 19.9) return null
  return {
    type: 'decimal_multiplication',
    prompt: `${a} × ${b} = ?`,
    answer: formatDecimal(product),
  }
}

export function generateDecimalProblems(
  count = 10,
  rand: () => number = Math.random
): DecimalProblem[] {
  const problems: DecimalProblem[] = []
  const seen = new Set<string>()
  let tries = 0

  while (problems.length < count && tries < count * 100) {
    tries++
    const p = generateOneProblem(rand)
    if (!p || seen.has(p.prompt)) continue
    seen.add(p.prompt)
    problems.push({ id: `dec61_${problems.length + 1}`, ...p })
  }

  return problems
}
