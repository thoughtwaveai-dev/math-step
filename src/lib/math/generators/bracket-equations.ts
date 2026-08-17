import { randInt } from './rand'

export type BracketEquationProblemType =
  | 'bracket_equation_simple'
  | 'bracket_equation_subtraction'
  | 'bracket_equation_negative'
  | 'bracket_equation_both_sides'
  | 'bracket_equation_expand_collect'

export interface BracketEquationProblem {
  id: string
  type: BracketEquationProblemType
  prompt: string
  answer: string
}

// --- Level 15/2 — Equations with Brackets -----------------------------------
// Uses the expanding skill from 15.1 for the thing it is actually for: solving.
//
// Every answer is a single positive integer, so all five types ride the existing
// signed-integer path in gradeAnswer. No grading change, and the numeric keypad
// is safe here because nothing algebraic is ever typed (the stylus "x → ." bug
// only affects answers containing letters or brackets).
//
// Each generator picks the SOLUTION first and derives the constants from it, so
// a whole-number answer is guaranteed by construction rather than by filtering.
// Solutions are kept positive in v1: the difficulty being trained is the bracket
// manipulation, not negative arithmetic (that is Level 7.1).

const NUMBER_HINT = 'Answer with just the number.'

type Bracket152 = { type: BracketEquationProblemType; prompt: string; answer: string }

// (1) a(x + b) = c, where c is built from the chosen solution.
function makeSimple(rand: () => number): Bracket152 {
  const a = randInt(2, 6, rand)
  const b = randInt(2, 9, rand)
  const x = randInt(2, 12, rand)
  return {
    type: 'bracket_equation_simple',
    prompt: `Solve for x: ${a}(x + ${b}) = ${a * (x + b)}. ${NUMBER_HINT}`,
    answer: String(x),
  }
}

// (2) a(x - b) = c. x > b keeps the right-hand side positive.
function makeSubtraction(rand: () => number): Bracket152 {
  const a = randInt(2, 6, rand)
  const b = randInt(2, 8, rand)
  const x = b + randInt(1, 10, rand)
  return {
    type: 'bracket_equation_subtraction',
    prompt: `Solve for x: ${a}(x - ${b}) = ${a * (x - b)}. ${NUMBER_HINT}`,
    answer: String(x),
  }
}

// (3) -a(x + b) = c, so both sides are negative. Forces the student to divide by
// a negative rather than pattern-matching the positive case.
function makeNegative(rand: () => number): Bracket152 {
  const a = randInt(2, 5, rand)
  const b = randInt(2, 8, rand)
  const x = randInt(2, 10, rand)
  return {
    type: 'bracket_equation_negative',
    prompt: `Solve for x: -${a}(x + ${b}) = ${-a * (x + b)}. ${NUMBER_HINT}`,
    answer: String(x),
  }
}

// (4) a(x + b) = c(x + d), variables on both sides.
// ax + ab = cx + cd  =>  ab = cd + x(c - a)  =>  b = (cd + x(c - a)) / a
// a, c, d and the solution are chosen, then b is derived; retry until b lands on
// a usable whole number.
function makeBothSides(rand: () => number): Bracket152 {
  for (let attempt = 0; attempt < 60; attempt++) {
    const a = randInt(2, 6, rand)
    const c = randInt(2, 6, rand)
    if (a === c) continue
    const d = randInt(2, 9, rand)
    const x = randInt(2, 10, rand)
    const numerator = c * d + x * (c - a)
    if (numerator <= 0 || numerator % a !== 0) continue
    const b = numerator / a
    if (b < 1 || b > 12 || b === d) continue
    return {
      type: 'bracket_equation_both_sides',
      prompt: `Solve for x: ${a}(x + ${b}) = ${c}(x + ${d}). ${NUMBER_HINT}`,
      answer: String(x),
    }
  }
  // Deterministic fallback: 4(x + 2) = 2(x + 7) → x = 3.
  return {
    type: 'bracket_equation_both_sides',
    prompt: `Solve for x: 4(x + 2) = 2(x + 7). ${NUMBER_HINT}`,
    answer: '3',
  }
}

// (5) a(x + b) + cx = d. Expand, collect like terms, then solve.
function makeExpandCollect(rand: () => number): Bracket152 {
  const a = randInt(2, 5, rand)
  const b = randInt(2, 8, rand)
  const c = randInt(2, 6, rand)
  const x = randInt(2, 10, rand)
  const d = x * (a + c) + a * b
  return {
    type: 'bracket_equation_expand_collect',
    prompt: `Expand and solve for x: ${a}(x + ${b}) + ${c}x = ${d}. ${NUMBER_HINT}`,
    answer: String(x),
  }
}

type Maker152 = (rand: () => number) => Bracket152

// Distribution for count=20 → 4/4/4/4/4.
function buildPlan152(count: number): Maker152[] {
  const makers: Maker152[] = [
    makeSimple,
    makeSubtraction,
    makeNegative,
    makeBothSides,
    makeExpandCollect,
  ]
  const perType = Math.round(count / makers.length)
  const plan: Maker152[] = []
  for (const maker of makers) {
    for (let i = 0; i < perType; i++) plan.push(maker)
  }
  while (plan.length < count) plan.push(makeSimple)
  while (plan.length > count) plan.pop()
  return plan
}

// Generates problems for Level 15/2 — Equations with Brackets.
export function generateBracketEquationProblems(
  count = 10,
  rand: () => number = Math.random,
): BracketEquationProblem[] {
  const plan = buildPlan152(count)
  const problems: BracketEquationProblem[] = []
  const seen = new Set<string>()

  for (const maker of plan) {
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      seen.add(p.prompt)
      problems.push({ id: `beq152_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
