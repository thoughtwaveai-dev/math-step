import { randInt } from './rand'

export type ExponentProblemType =
  | 'exponent_evaluate'
  | 'exponent_multiply_same_base'
  | 'exponent_divide_same_base'
  | 'exponent_power_of_power'
  | 'exponent_zero_and_one'

export interface ExponentProblem {
  id: string
  type: ExponentProblemType
  prompt: string
  answer: string
}

// --- Level 14/2 — Exponents (Indices) ---------------------------------------
// Prompts display powers as Unicode superscripts (3⁴, x²) so they read the way
// they do in a textbook. Every answer is a plain non-negative integer, so all
// five types ride the existing signed-integer path in gradeAnswer — no grading
// change, and the input stays on the numeric keypad.
//
// The three index-law types ask for the resulting *power* as a number rather
// than the expression "x⁷". That keeps the law itself as the thing being tested
// while avoiding caret/superscript typing on a tablet keyboard.

const SUPERSCRIPT_DIGITS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

function sup(n: number): string {
  return String(n)
    .split('')
    .map(d => SUPERSCRIPT_DIGITS[Number(d)] ?? d)
    .join('')
}

const BASE_LETTERS = ['x', 'a', 'm', 'n', 'y']

function pickLetter(rand: () => number): string {
  return BASE_LETTERS[randInt(0, BASE_LETTERS.length - 1, rand)]
}

// Largest exponent (min 2) that keeps base^exp at or under 1000, so answers stay
// mentally checkable rather than turning into calculator work.
function maxExponentFor(base: number): number {
  let exp = 2
  while (Math.pow(base, exp + 1) <= 1000) exp++
  return exp
}

const POWER_HINT = 'The answer is a power — write just that number.'

type Exp142 = { type: ExponentProblemType; prompt: string; answer: string }

// (1) Evaluate a power: 3⁴ → 81.
function makeEvaluate(rand: () => number): Exp142 {
  const base = randInt(2, 12, rand)
  const exp = randInt(2, maxExponentFor(base), rand)
  return {
    type: 'exponent_evaluate',
    prompt: `Work out ${base}${sup(exp)}.`,
    answer: String(Math.pow(base, exp)),
  }
}

// (2) Multiplying powers of the same base: add the indices.
function makeMultiplySameBase(rand: () => number): Exp142 {
  const letter = pickLetter(rand)
  const a = randInt(2, 7, rand)
  const b = randInt(2, 7, rand)
  return {
    type: 'exponent_multiply_same_base',
    prompt: `Simplify: ${letter}${sup(a)} × ${letter}${sup(b)}. ${POWER_HINT}`,
    answer: String(a + b),
  }
}

// (3) Dividing powers of the same base: subtract the indices. a > b keeps the
// result a positive power (negative indices are not taught at this level).
function makeDivideSameBase(rand: () => number): Exp142 {
  const letter = pickLetter(rand)
  const a = randInt(4, 9, rand)
  const b = randInt(2, a - 2, rand)
  return {
    type: 'exponent_divide_same_base',
    prompt: `Simplify: ${letter}${sup(a)} ÷ ${letter}${sup(b)}. ${POWER_HINT}`,
    answer: String(a - b),
  }
}

// (4) Power of a power: multiply the indices.
function makePowerOfPower(rand: () => number): Exp142 {
  const letter = pickLetter(rand)
  const a = randInt(2, 5, rand)
  const b = randInt(2, 4, rand)
  return {
    type: 'exponent_power_of_power',
    prompt: `Simplify: (${letter}${sup(a)})${sup(b)}. ${POWER_HINT}`,
    answer: String(a * b),
  }
}

// (5) Zero and first index: n⁰ = 1, n¹ = n.
function makeZeroAndOne(rand: () => number): Exp142 {
  const base = randInt(2, 15, rand)
  const exp = rand() < 0.5 ? 0 : 1
  return {
    type: 'exponent_zero_and_one',
    prompt: `Work out ${base}${sup(exp)}.`,
    answer: exp === 0 ? '1' : String(base),
  }
}

type Maker142 = (rand: () => number) => Exp142

// Distribution for count=20 → 4/4/4/4/4.
function buildPlan142(count: number): Maker142[] {
  const makers: Maker142[] = [
    makeEvaluate,
    makeMultiplySameBase,
    makeDivideSameBase,
    makePowerOfPower,
    makeZeroAndOne,
  ]
  const perType = Math.round(count / makers.length)
  const plan: Maker142[] = []
  for (const maker of makers) {
    for (let i = 0; i < perType; i++) plan.push(maker)
  }
  while (plan.length < count) plan.push(makeEvaluate)
  while (plan.length > count) plan.pop()
  return plan
}

// Generates problems for Level 14/2 — Exponents.
export function generateExponentProblems(
  count = 10,
  rand: () => number = Math.random,
): ExponentProblem[] {
  const plan = buildPlan142(count)
  const problems: ExponentProblem[] = []
  const seen = new Set<string>()

  for (const maker of plan) {
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      seen.add(p.prompt)
      problems.push({ id: `exp142_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
