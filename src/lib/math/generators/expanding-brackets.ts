import { randInt } from './rand'

export type ExpandingBracketsProblemType =
  | 'expand_single_bracket'
  | 'expand_bracket_subtraction'
  | 'expand_negative_multiplier'
  | 'expand_and_simplify'
  | 'factorise_single_bracket'

export interface ExpandingBracketsProblem {
  id: string
  type: ExpandingBracketsProblemType
  prompt: string
  answer: string
}

// --- Level 15/1 — Expanding Brackets ----------------------------------------
// Every answer is an algebraic expression, so all five types ride the existing
// algebraic path in gradeAnswer (lowercase + strip whitespace + exact match) —
// the same path Level 8/1 already uses. No grading change.
//
// The grader does not reorder terms, so each prompt carries a format hint using
// a fixed example that the generator can never actually produce (guarded in the
// build loop). Coefficients are always ≥ 2 and constants ≥ 2, so "1x" and "+ 0"
// can never appear.

const EXPAND_HINT = 'Write your answer like: 4x + 20'
const SUBTRACT_HINT = 'Write your answer like: 4x - 20'
const NEGATIVE_HINT = 'Write your answer like: -4x - 20'
const SIMPLIFY_HINT = 'Write the x term first, like: 9x + 20'
const FACTORISE_HINT = 'Write your answer like: 4(2x + 7)'

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

// Renders "+ 12" / "- 12" so the canonical answer is always spaced the same way.
function signedTerm(value: number): string {
  return value < 0 ? `- ${Math.abs(value)}` : `+ ${value}`
}

type Expand151 = { type: ExpandingBracketsProblemType; prompt: string; answer: string }

// (1) a(x + b) → ax + ab
function makeSingleBracket(rand: () => number): Expand151 {
  const a = randInt(2, 9, rand)
  const b = randInt(2, 9, rand)
  return {
    type: 'expand_single_bracket',
    prompt: `Expand: ${a}(x + ${b}). ${EXPAND_HINT}`,
    answer: `${a}x + ${a * b}`,
  }
}

// (2) a(x - b) → ax - ab
function makeBracketSubtraction(rand: () => number): Expand151 {
  const a = randInt(2, 9, rand)
  const b = randInt(2, 9, rand)
  return {
    type: 'expand_bracket_subtraction',
    prompt: `Expand: ${a}(x - ${b}). ${SUBTRACT_HINT}`,
    answer: `${a}x - ${a * b}`,
  }
}

// (3) -a(x ± b) → -ax ∓ ab. Both signs in the bracket appear, so the student has
// to apply the negative multiplier to each term rather than pattern-match.
function makeNegativeMultiplier(rand: () => number): Expand151 {
  const a = randInt(2, 6, rand)
  const b = randInt(2, 8, rand)
  const plusInside = rand() < 0.5
  const inner = plusInside ? `x + ${b}` : `x - ${b}`
  const constant = plusInside ? -(a * b) : a * b
  return {
    type: 'expand_negative_multiplier',
    prompt: `Expand: -${a}(${inner}). ${NEGATIVE_HINT}`,
    answer: `-${a}x ${signedTerm(constant)}`,
  }
}

// (4) a(x ± b) + cx → (a + c)x ± ab
function makeExpandAndSimplify(rand: () => number): Expand151 {
  const a = randInt(2, 6, rand)
  const b = randInt(2, 8, rand)
  const c = randInt(2, 7, rand)
  const plusInside = rand() < 0.5
  const inner = plusInside ? `x + ${b}` : `x - ${b}`
  const constant = plusInside ? a * b : -(a * b)
  return {
    type: 'expand_and_simplify',
    prompt: `Expand and simplify: ${a}(${inner}) + ${c}x. ${SIMPLIFY_HINT}`,
    answer: `${a + c}x ${signedTerm(constant)}`,
  }
}

// (5) Reverse direction: gpx + gq → g(px + q). gcd(p, q) = 1 guarantees g really
// is the highest common factor, so the fully-factorised answer is unique.
function makeFactoriseSingleBracket(rand: () => number): Expand151 {
  const g = randInt(2, 8, rand)
  let p = randInt(1, 6, rand)
  let q = randInt(2, 9, rand)
  let tries = 0
  while (gcd(p, q) !== 1 && tries < 20) {
    tries++
    p = randInt(1, 6, rand)
    q = randInt(2, 9, rand)
  }
  if (gcd(p, q) !== 1) {
    p = 1
    q = randInt(2, 9, rand)
  }
  const inner = p === 1 ? 'x' : `${p}x`
  return {
    type: 'factorise_single_bracket',
    prompt: `Factorise by taking out the highest common factor: ${g * p}x + ${g * q}. ${FACTORISE_HINT}`,
    answer: `${g}(${inner} + ${q})`,
  }
}

type Maker151 = (rand: () => number) => Expand151

// Distribution for count=20 → 4/4/4/4/4.
function buildPlan151(count: number): Maker151[] {
  const makers: Maker151[] = [
    makeSingleBracket,
    makeBracketSubtraction,
    makeNegativeMultiplier,
    makeExpandAndSimplify,
    makeFactoriseSingleBracket,
  ]
  const perType = Math.round(count / makers.length)
  const plan: Maker151[] = []
  for (const maker of makers) {
    for (let i = 0; i < perType; i++) plan.push(maker)
  }
  while (plan.length < count) plan.push(makeSingleBracket)
  while (plan.length > count) plan.pop()
  return plan
}

// Generates problems for Level 15/1 — Expanding Brackets.
export function generateExpandingBracketsProblems(
  count = 10,
  rand: () => number = Math.random,
): ExpandingBracketsProblem[] {
  const plan = buildPlan151(count)
  const problems: ExpandingBracketsProblem[] = []
  const seen = new Set<string>()

  for (const maker of plan) {
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      // The format hint must never hand the student the actual answer.
      if (p.prompt.includes(p.answer)) continue
      seen.add(p.prompt)
      problems.push({ id: `exb151_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
