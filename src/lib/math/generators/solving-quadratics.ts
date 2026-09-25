import { randInt } from './rand'
import { formatQuadratic } from './double-brackets'

export type SolvingQuadraticsProblemType =
  | 'solve_quadratic_factorised'
  | 'solve_quadratic_positive_roots'
  | 'solve_quadratic_negative_roots'
  | 'solve_quadratic_mixed_roots'
  | 'solve_quadratic_difference_of_squares'

export interface SolvingQuadraticsProblem {
  id: string
  type: SolvingQuadraticsProblemType
  prompt: string
  answer: string
}

// --- Level 17/1 - Solving Quadratics (by factorising) -----------------------
// The reverse of 16.1: the student factorises x2 + bx + c into two brackets,
// then uses "if two things multiply to 0, one of them is 0" to read off both
// solutions. Every equation has exactly two distinct nonzero integer roots.
//
// Every answer has the fixed shape "x = -5 or x = 3". It contains letters but no
// "y=" and no "<" or ">", so it skips the sim-eq and inequality branches of
// gradeAnswer and lands on the algebraic path (lowercase, strip whitespace,
// strict match). No grading change. That path does NOT reorder, so
// "x = 3 or x = -5" would grade wrong. formatRoots below always puts the smaller
// root first and is the single source of truth for the string, imported by the
// answer control (which sorts whatever order the student types) and the gates.
//
// Every maker picks the two roots first and derives the equation from them, so
// the answer is exact by construction. Ranges keep |b| >= 2 and |c| >= 4 in the
// expanded forms, so "1x", "0x" and "+ 0" never appear in a prompt.

// Renders "x = -5 or x = 3" / "x = 2 or x = 7", smaller root first.
export function formatRoots(r1: number, r2: number): string {
  const lo = Math.min(r1, r2)
  const hi = Math.max(r1, r2)
  return `x = ${lo} or x = ${hi}`
}

// Renders one bracket "(x + 3)" / "(x - 5)" for a signed bracket number.
function bracket(n: number): string {
  return `(x ${n < 0 ? '-' : '+'} ${Math.abs(n)})`
}

// A signed number with magnitude 2 to 9.
function signedTwoToNine(rand: () => number): number {
  const n = randInt(2, 9, rand)
  return rand() < 0.5 ? -n : n
}

type Quad171 = { type: SolvingQuadraticsProblemType; prompt: string; answer: string }

// (1) (x + p)(x + q) = 0 -> x = -p or x = -q. Already factorised, so this is
// only the "set each bracket to 0" step, with the sign flip that trips people up.
function makeFactorised(rand: () => number): Quad171 {
  const p = signedTwoToNine(rand)
  let q = signedTwoToNine(rand)
  if (q === p) q = -p
  return {
    type: 'solve_quadratic_factorised',
    prompt: `Solve: ${bracket(p)}${bracket(q)} = 0.`,
    answer: formatRoots(-p, -q),
  }
}

// (2) Both roots positive, so the equation is x2 - bx + c with c > 0.
function makePositiveRoots(rand: () => number): Quad171 {
  const r1 = randInt(2, 9, rand)
  let r2 = randInt(2, 9, rand)
  if (r2 === r1) r2 = r1 === 9 ? 2 : r1 + 1
  return {
    type: 'solve_quadratic_positive_roots',
    prompt: `Solve: ${formatQuadratic(-(r1 + r2), r1 * r2)} = 0.`,
    answer: formatRoots(r1, r2),
  }
}

// (3) Both roots negative, so the equation is x2 + bx + c with c > 0. The
// brackets hold positive numbers but the solutions come out negative.
function makeNegativeRoots(rand: () => number): Quad171 {
  const a = randInt(2, 9, rand)
  let b = randInt(2, 9, rand)
  if (b === a) b = a === 9 ? 2 : a + 1
  return {
    type: 'solve_quadratic_negative_roots',
    prompt: `Solve: ${formatQuadratic(a + b, a * b)} = 0.`,
    answer: formatRoots(-a, -b),
  }
}

// (4) One positive and one negative root, so c < 0 and the x term can go either
// way. |r1 + r2| >= 2 keeps a "0x" or "1x" term off the page.
function makeMixedRoots(rand: () => number): Quad171 {
  for (let attempt = 0; attempt < 40; attempt++) {
    const pos = randInt(2, 9, rand)
    const neg = -randInt(2, 9, rand)
    if (Math.abs(pos + neg) < 2) continue
    return {
      type: 'solve_quadratic_mixed_roots',
      prompt: `Solve: ${formatQuadratic(-(pos + neg), pos * neg)} = 0.`,
      answer: formatRoots(pos, neg),
    }
  }
  // Deterministic fallback: roots 7 and -3 -> x2 - 4x - 21 = 0.
  return {
    type: 'solve_quadratic_mixed_roots',
    prompt: `Solve: ${formatQuadratic(-4, -21)} = 0.`,
    answer: formatRoots(7, -3),
  }
}

// (5) x2 - a2 = 0 -> (x - a)(x + a) = 0 -> x = -a or x = a. Written by hand
// because formatQuadratic cannot render a missing x term. The trap is giving
// only the positive root.
function makeDifferenceOfSquares(rand: () => number): Quad171 {
  const a = randInt(2, 10, rand)
  return {
    type: 'solve_quadratic_difference_of_squares',
    prompt: `Solve: x² - ${a * a} = 0.`,
    answer: formatRoots(-a, a),
  }
}

type Maker171 = (rand: () => number) => Quad171

// Distribution for count=20 -> 4/4/4/4/4.
function buildPlan171(count: number): Maker171[] {
  const makers: Maker171[] = [
    makeFactorised,
    makePositiveRoots,
    makeNegativeRoots,
    makeMixedRoots,
    makeDifferenceOfSquares,
  ]
  const perType = Math.round(count / makers.length)
  const plan: Maker171[] = []
  for (const maker of makers) {
    for (let i = 0; i < perType; i++) plan.push(maker)
  }
  while (plan.length < count) plan.push(makeFactorised)
  while (plan.length > count) plan.pop()
  return plan
}

// Generates problems for Level 17/1 - Solving Quadratics (by factorising).
export function generateSolvingQuadraticsProblems(
  count = 10,
  rand: () => number = Math.random,
): SolvingQuadraticsProblem[] {
  const plan = buildPlan171(count)
  const problems: SolvingQuadraticsProblem[] = []
  const seen = new Set<string>()

  for (const maker of plan) {
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      seen.add(p.prompt)
      problems.push({ id: `sq171_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
