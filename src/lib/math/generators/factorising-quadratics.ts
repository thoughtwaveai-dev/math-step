import { randInt } from './rand'
import { formatQuadratic } from './double-brackets'

export type FactorisingQuadraticsProblemType =
  | 'factorise_quadratic_positive'
  | 'factorise_quadratic_negative'
  | 'factorise_quadratic_mixed_positive'
  | 'factorise_quadratic_mixed_negative'
  | 'factorise_difference_of_squares'

export interface FactorisingQuadraticsProblem {
  id: string
  type: FactorisingQuadraticsProblemType
  prompt: string
  answer: string
}

// --- Level 16/2 - Factorising Quadratics ------------------------------------
// The reverse of 16.1: the prompt is a quadratic x2 + bx + c (rendered by 16.1's
// own formatQuadratic) and the answer is the pair of brackets it came from,
// e.g. "(x + 3)(x + 5)". The answer contains a letter, so it rides the existing
// algebraic path in gradeAnswer (lowercase, strip whitespace, strict match). No
// grading change.
//
// Strict match means bracket order matters to the grader: "(x + 5)(x + 3)"
// would not match "(x + 3)(x + 5)". formatBracketPair below fixes one canonical
// order, and the structured answer control (BracketPairInput) imports it, so a
// student can type the brackets either way round and still send the canonical
// string. It is the single source of truth, shared by the control and the gates.
//
// Every maker picks the two bracket numbers first and derives b and c, so the
// factorisation is correct by construction (and unique for a monic quadratic).
// Bracket numbers are never 0 or 1, and |b| >= 2 wherever an x term is shown,
// so the prompt never shows "1x" or "0x".

// Canonical order: plus brackets before minus brackets, then smaller number
// first. (3, 5) -> "(x + 3)(x + 5)", (7, -3) -> "(x + 7)(x - 3)",
// (-5, 2) -> "(x + 2)(x - 5)", (-2, -6) -> "(x - 2)(x - 6)".
export function formatBracketPair(p: number, q: number): string {
  const [first, second] = [p, q].sort((a, b) => {
    if (a > 0 !== b > 0) return a > 0 ? -1 : 1
    return Math.abs(a) - Math.abs(b)
  })
  const bracket = (n: number) => `(x ${n < 0 ? '-' : '+'} ${Math.abs(n)})`
  return `${bracket(first)}${bracket(second)}`
}

type Factor162 = { type: FactorisingQuadraticsProblemType; prompt: string; answer: string }

// Two different numbers from 2 to 9.
function distinctPair(rand: () => number): [number, number] {
  const a = randInt(2, 9, rand)
  let b = randInt(2, 9, rand)
  if (b === a) b = a === 9 ? 2 : a + 1
  return [a, b]
}

// Smaller and larger numbers from 2 to 9, at least 2 apart, so the x term of
// (x + big)(x - small) is never 0x or 1x.
function spreadPair(rand: () => number): [number, number] {
  const small = randInt(2, 7, rand)
  const big = randInt(small + 2, 9, rand)
  return [small, big]
}

// (1) x2 + bx + c, both positive -> (x + p)(x + q).
function makeBothPositive(rand: () => number): Factor162 {
  const [p, q] = distinctPair(rand)
  return {
    type: 'factorise_quadratic_positive',
    prompt: `Factorise: ${formatQuadratic(p + q, p * q)}.`,
    answer: formatBracketPair(p, q),
  }
}

// (2) x2 - bx + c -> (x - p)(x - q). A positive constant with a negative x term
// means both brackets are negative.
function makeBothNegative(rand: () => number): Factor162 {
  const [p, q] = distinctPair(rand)
  return {
    type: 'factorise_quadratic_negative',
    prompt: `Factorise: ${formatQuadratic(-(p + q), p * q)}.`,
    answer: formatBracketPair(-p, -q),
  }
}

// (3) x2 + bx - c -> (x + big)(x - small). A negative constant means the signs
// differ; a positive x term means the bigger number is the plus one.
function makeMixedPositive(rand: () => number): Factor162 {
  const [small, big] = spreadPair(rand)
  return {
    type: 'factorise_quadratic_mixed_positive',
    prompt: `Factorise: ${formatQuadratic(big - small, -(big * small))}.`,
    answer: formatBracketPair(big, -small),
  }
}

// (4) x2 - bx - c -> (x + small)(x - big). Same idea, the bigger number is now
// the minus one.
function makeMixedNegative(rand: () => number): Factor162 {
  const [small, big] = spreadPair(rand)
  return {
    type: 'factorise_quadratic_mixed_negative',
    prompt: `Factorise: ${formatQuadratic(small - big, -(big * small))}.`,
    answer: formatBracketPair(small, -big),
  }
}

// (5) x2 - a2 -> (x + a)(x - a). No x term at all, because +a and -a cancel.
// formatQuadratic cannot show a missing x term, so this prompt is written out.
function makeDifferenceOfSquares(rand: () => number): Factor162 {
  const a = randInt(2, 10, rand)
  return {
    type: 'factorise_difference_of_squares',
    prompt: `Factorise: x² - ${a * a}.`,
    answer: formatBracketPair(a, -a),
  }
}

type Maker162 = (rand: () => number) => Factor162

// Distribution for count=20 -> 4/4/4/4/4.
function buildPlan162(count: number): Maker162[] {
  const makers: Maker162[] = [
    makeBothPositive,
    makeBothNegative,
    makeMixedPositive,
    makeMixedNegative,
    makeDifferenceOfSquares,
  ]
  const perType = Math.round(count / makers.length)
  const plan: Maker162[] = []
  for (const maker of makers) {
    for (let i = 0; i < perType; i++) plan.push(maker)
  }
  while (plan.length < count) plan.push(makeBothPositive)
  while (plan.length > count) plan.pop()
  return plan
}

// Generates problems for Level 16/2 - Factorising Quadratics.
export function generateFactorisingQuadraticsProblems(
  count = 10,
  rand: () => number = Math.random,
): FactorisingQuadraticsProblem[] {
  const plan = buildPlan162(count)
  const problems: FactorisingQuadraticsProblem[] = []
  const seen = new Set<string>()

  for (const maker of plan) {
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      seen.add(p.prompt)
      problems.push({ id: `fq162_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
