import { randInt } from './rand'

export type FractionProblemType =
  | 'fraction_addition'
  | 'fraction_subtraction'
  | 'fraction_multiplication'
  | 'fraction_division'

export interface FractionProblem {
  id: string
  type: FractionProblemType
  prompt: string
  answer: string
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b
}

// Returns "3/4", "5/6", "4/3", or "2" (whole number) — always simplified.
function simplify(num: number, den: number): string {
  if (num === 0) return '0'
  const g = gcd(Math.abs(num), Math.abs(den))
  const n = num / g
  const d = den / g
  return d === 1 ? String(n) : `${n}/${d}`
}

// Unlike-denominator pairs where LCM is ≤ 12 — manageable for kids.
const UNLIKE_PAIRS: [number, number][] = [
  [2, 3], [2, 4], [2, 6], [3, 4], [3, 6], [4, 6],
  [2, 8], [3, 8], [4, 8], [3, 9], [2, 9],
]

function generateOneProblem(
  rand: () => number
): { type: FractionProblemType; prompt: string; answer: string } | null {
  const useSameDenom = rand() < 0.5
  const isAdd = rand() < 0.55

  if (useSameDenom) {
    const d = randInt(2, 9, rand)
    if (!isAdd) {
      if (d < 3) return null // need room for a > b > 0
      const a = randInt(2, d - 1, rand)
      const b = randInt(1, a - 1, rand)
      return {
        type: 'fraction_subtraction',
        prompt: `${a}/${d} - ${b}/${d} = ?`,
        answer: simplify(a - b, d),
      }
    } else {
      const a = randInt(1, d - 1, rand)
      const b = randInt(1, d - 1, rand)
      return {
        type: 'fraction_addition',
        prompt: `${a}/${d} + ${b}/${d} = ?`,
        answer: simplify(a + b, d),
      }
    }
  } else {
    const [d1, d2] = UNLIKE_PAIRS[randInt(0, UNLIKE_PAIRS.length - 1, rand)]
    const a = randInt(1, d1 - 1, rand)
    const b = randInt(1, d2 - 1, rand)

    if (!isAdd && a * d2 <= b * d1) return null // would give non-positive result

    const L = lcm(d1, d2)
    const num = isAdd
      ? a * (L / d1) + b * (L / d2)
      : a * (L / d1) - b * (L / d2)

    return {
      type: isAdd ? 'fraction_addition' : 'fraction_subtraction',
      prompt: `${a}/${d1} ${isAdd ? '+' : '-'} ${b}/${d2} = ?`,
      answer: simplify(num, L),
    }
  }
}

// Level 5/2 — Fraction multiplication and division.
function generateMultDivProblem(
  rand: () => number
): { type: FractionProblemType; prompt: string; answer: string } | null {
  const isMultiply = rand() < 0.5

  if (isMultiply) {
    const d1 = randInt(2, 6, rand)
    const d2 = randInt(2, 6, rand)
    if (d1 < 2 || d2 < 2) return null
    const a = randInt(1, d1 - 1, rand)
    const c = randInt(1, d2 - 1, rand)
    return {
      type: 'fraction_multiplication',
      prompt: `${a}/${d1} × ${c}/${d2} = ?`,
      answer: simplify(a * c, d1 * d2),
    }
  } else {
    // a/b ÷ c/d = (a×d)/(b×c)
    const b = randInt(2, 6, rand)
    const d = randInt(2, 6, rand)
    if (b < 2 || d < 2) return null
    const a = randInt(1, b - 1, rand)
    const c = randInt(1, d - 1, rand)
    const num = a * d
    const den = b * c
    const g = gcd(num, den)
    // Filter out results that are too large to be teachable
    if (num / g > 12) return null
    return {
      type: 'fraction_division',
      prompt: `${a}/${b} ÷ ${c}/${d} = ?`,
      answer: simplify(num, den),
    }
  }
}

export function generateFractionMultDivProblems(
  count = 10,
  rand: () => number = Math.random
): FractionProblem[] {
  const problems: FractionProblem[] = []
  const seen = new Set<string>()
  let tries = 0

  while (problems.length < count && tries < count * 100) {
    tries++
    const p = generateMultDivProblem(rand)
    if (!p || seen.has(p.prompt)) continue
    seen.add(p.prompt)
    problems.push({ id: `frac52_${problems.length + 1}`, ...p })
  }

  return problems
}

// Level 5/1 — Fraction addition and subtraction.
// Same-denominator and simple unlike-denominator (LCM ≤ 12).
// Answers are simplified; whole-number results returned as plain integers.
export function generateFractionProblems(
  count = 10,
  rand: () => number = Math.random
): FractionProblem[] {
  const problems: FractionProblem[] = []
  const seen = new Set<string>()
  let tries = 0

  while (problems.length < count && tries < count * 100) {
    tries++
    const p = generateOneProblem(rand)
    if (!p || seen.has(p.prompt)) continue
    seen.add(p.prompt)
    problems.push({ id: `frac_${problems.length + 1}`, ...p })
  }

  return problems
}
