import { randInt } from './rand'

export type DoubleBracketsProblemType =
  | 'expand_double_positive'
  | 'expand_double_mixed'
  | 'expand_double_negative'
  | 'expand_double_square_positive'
  | 'expand_double_square_negative'

export interface DoubleBracketsProblem {
  id: string
  type: DoubleBracketsProblemType
  prompt: string
  answer: string
}

// --- Level 16/1 - Expanding Double Brackets ---------------------------------
// Straight on from 15.1 (expanding a single bracket) and 15.2 (using it to
// solve). Every answer is a quadratic in the fixed shape x2 + bx + c, so all
// five types ride the existing algebraic path in gradeAnswer (lowercase, strip
// whitespace, strict match). No grading change.
//
// The canonical answer carries a real superscript two, which a student cannot
// type on a tablet. That is why this level ships a structured answer control
// (QuadraticExpressionInput) rather than a prompt format hint: the control fills
// in the x2 for them and they only tap the two signs and type the two numbers.
// formatQuadratic below is the single source of truth for the string, imported
// by both the control and the gates so the two can never drift apart.
//
// Every maker picks the two bracket numbers first and derives b and c from them,
// so the expansion is correct by construction. Ranges guarantee |b| >= 2 and
// |c| >= 4, so "1x", "0x" and "+ 0" can never appear.

// Renders "x2 + 8x + 15" / "x2 - 5x + 6" with a real superscript two.
export function formatQuadratic(b: number, c: number): string {
  return `x\u00B2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}x ${c < 0 ? '-' : '+'} ${Math.abs(c)}`
}

type Double161 = { type: DoubleBracketsProblemType; prompt: string; answer: string }

// (1) (x + a)(x + b) -> x2 + (a + b)x + ab. Everything stays positive.
function makeBothPositive(rand: () => number): Double161 {
  const a = randInt(2, 9, rand)
  let b = randInt(2, 9, rand)
  if (b === a) b = a === 9 ? 2 : a + 1
  return {
    type: 'expand_double_positive',
    prompt: `Expand and simplify: (x + ${a})(x + ${b}).`,
    answer: formatQuadratic(a + b, a * b),
  }
}

// (2) (x + a)(x - b) -> x2 + (a - b)x - ab. The middle term can come out either
// way round, so the student has to actually work out a - b rather than guess.
// |a - b| >= 2 keeps a "1x" term off the page.
function makeMixedSigns(rand: () => number): Double161 {
  for (let attempt = 0; attempt < 40; attempt++) {
    const a = randInt(2, 9, rand)
    const b = randInt(2, 9, rand)
    if (Math.abs(a - b) < 2) continue
    return {
      type: 'expand_double_mixed',
      prompt: `Expand and simplify: (x + ${a})(x - ${b}).`,
      answer: formatQuadratic(a - b, -(a * b)),
    }
  }
  // Deterministic fallback: (x + 7)(x - 3) -> x2 + 4x - 21.
  return {
    type: 'expand_double_mixed',
    prompt: 'Expand and simplify: (x + 7)(x - 3).',
    answer: formatQuadratic(4, -21),
  }
}

// (3) (x - a)(x - b) -> x2 - (a + b)x + ab. Two negatives multiply to a
// positive constant, which is the step most students drop.
function makeBothNegative(rand: () => number): Double161 {
  const a = randInt(2, 9, rand)
  let b = randInt(2, 9, rand)
  if (b === a) b = a === 9 ? 2 : a + 1
  return {
    type: 'expand_double_negative',
    prompt: `Expand and simplify: (x - ${a})(x - ${b}).`,
    answer: formatQuadratic(-(a + b), a * b),
  }
}

// (4) (x + a)^2 -> x2 + 2ax + a2. Squaring a bracket, not squaring each term.
function makeSquarePositive(rand: () => number): Double161 {
  const a = randInt(2, 9, rand)
  return {
    type: 'expand_double_square_positive',
    prompt: `Expand and simplify: (x + ${a})\u00B2.`,
    answer: formatQuadratic(2 * a, a * a),
  }
}

// (5) (x - a)^2 -> x2 - 2ax + a2. Same shape, but the middle term goes negative
// while the constant stays positive.
function makeSquareNegative(rand: () => number): Double161 {
  const a = randInt(2, 9, rand)
  return {
    type: 'expand_double_square_negative',
    prompt: `Expand and simplify: (x - ${a})\u00B2.`,
    answer: formatQuadratic(-2 * a, a * a),
  }
}

type Maker161 = (rand: () => number) => Double161

// Distribution for count=20 -> 4/4/4/4/4.
function buildPlan161(count: number): Maker161[] {
  const makers: Maker161[] = [
    makeBothPositive,
    makeMixedSigns,
    makeBothNegative,
    makeSquarePositive,
    makeSquareNegative,
  ]
  const perType = Math.round(count / makers.length)
  const plan: Maker161[] = []
  for (const maker of makers) {
    for (let i = 0; i < perType; i++) plan.push(maker)
  }
  while (plan.length < count) plan.push(makeBothPositive)
  while (plan.length > count) plan.pop()
  return plan
}

// Generates problems for Level 16/1 - Expanding Double Brackets.
export function generateDoubleBracketsProblems(
  count = 10,
  rand: () => number = Math.random,
): DoubleBracketsProblem[] {
  const plan = buildPlan161(count)
  const problems: DoubleBracketsProblem[] = []
  const seen = new Set<string>()

  for (const maker of plan) {
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      seen.add(p.prompt)
      problems.push({ id: `dbr161_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
