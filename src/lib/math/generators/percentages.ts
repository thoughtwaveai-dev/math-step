import { randInt } from './rand'

export type PercentageProblemType =
  | 'percent_of_number'
  | 'decimal_to_percent'
  | 'fraction_to_percent'
  | 'percent_to_decimal'

export interface PercentageProblem {
  id: string
  type: PercentageProblemType
  prompt: string
  answer: string
}

// Common percentages that give clean results
const COMMON_PERCENTS = [10, 20, 25, 50, 75]

// Numbers that work cleanly with all COMMON_PERCENTS (all divisible by 4)
const FRIENDLY_BASES = [20, 40, 60, 80, 100, 120, 200, 400, 24, 48, 80, 120, 160]

// Fractions that convert to whole-number percentages
const PERCENT_FRACTIONS: Array<{ num: number; den: number; pct: number }> = [
  { num: 1, den: 2, pct: 50 },
  { num: 1, den: 4, pct: 25 },
  { num: 3, den: 4, pct: 75 },
  { num: 1, den: 5, pct: 20 },
  { num: 2, den: 5, pct: 40 },
  { num: 3, den: 5, pct: 60 },
  { num: 4, den: 5, pct: 80 },
  { num: 1, den: 10, pct: 10 },
  { num: 3, den: 10, pct: 30 },
  { num: 7, den: 10, pct: 70 },
  { num: 9, den: 10, pct: 90 },
  { num: 1, den: 20, pct: 5 },
  { num: 3, den: 20, pct: 15 },
]

function generateOneProblem(
  rand: () => number
): { type: PercentageProblemType; prompt: string; answer: string } | null {
  const pick = rand()

  if (pick < 0.35) {
    // "What is X% of N?"
    const pct = COMMON_PERCENTS[randInt(0, COMMON_PERCENTS.length - 1, rand)]
    const base = FRIENDLY_BASES[randInt(0, FRIENDLY_BASES.length - 1, rand)]
    const result = (pct / 100) * base
    if (!Number.isInteger(result) || result <= 0) return null
    return {
      type: 'percent_of_number',
      prompt: `What is ${pct}% of ${base}?`,
      answer: String(result),
    }
  }

  if (pick < 0.55) {
    // "Convert X% to a decimal" — answer is a decimal string like "0.25"
    const pct = COMMON_PERCENTS[randInt(0, COMMON_PERCENTS.length - 1, rand)]
    const decimal = pct / 100
    const answer = parseFloat(decimal.toFixed(2)).toString()
    return {
      type: 'percent_to_decimal',
      prompt: `Convert ${pct}% to a decimal`,
      answer,
    }
  }

  if (pick < 0.75) {
    // "0.X = ?%" — student types the percentage as an integer
    const pct = COMMON_PERCENTS[randInt(0, COMMON_PERCENTS.length - 1, rand)]
    const decimal = parseFloat((pct / 100).toFixed(2))
    return {
      type: 'decimal_to_percent',
      prompt: `${decimal} = ?%`,
      answer: String(pct),
    }
  }

  // "X/Y = ?%" — student types the percentage as an integer
  const frac = PERCENT_FRACTIONS[randInt(0, PERCENT_FRACTIONS.length - 1, rand)]
  return {
    type: 'fraction_to_percent',
    prompt: `${frac.num}/${frac.den} = ?%`,
    answer: String(frac.pct),
  }
}

export function generatePercentageProblems(
  count = 10,
  rand: () => number = Math.random
): PercentageProblem[] {
  const problems: PercentageProblem[] = []
  const seen = new Set<string>()
  let tries = 0

  while (problems.length < count && tries < count * 100) {
    tries++
    const p = generateOneProblem(rand)
    if (!p || seen.has(p.prompt)) continue
    seen.add(p.prompt)
    problems.push({ id: `pct62_${problems.length + 1}`, ...p })
  }

  return problems
}
