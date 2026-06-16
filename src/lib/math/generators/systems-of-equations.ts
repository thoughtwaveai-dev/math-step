import { randInt } from './rand'

export type SystemsOfEquationsProblemType =
  | 'system_substitution_simple'
  | 'system_elimination_simple'
  | 'system_find_missing_value'
  | 'system_check_solution'
  | 'system_word_problem_simple'

export interface SystemsOfEquationsProblem {
  id: string
  type: SystemsOfEquationsProblemType
  prompt: string
  answer: string
}

// Coordinate-pair answers use the canonical "x = 4, y = 6" format the grader's
// simultaneous-equation pair path already handles (order-independent, space/case
// insensitive). yes/no answers ride the algebraic path. find-missing answers are
// non-negative integers on the signed-integer path. No gradeAnswer changes needed.

// Format "x ± k" / "y ± k" terms (k ≠ 0 guaranteed by callers).
function formatOffset(base: string, k: number): string {
  return k >= 0 ? `${base} + ${k}` : `${base} - ${-k}`
}

// (1) Substitution: one equation already solved for a variable, plus a sum equation.
function makeSubstitution(rand: () => number) {
  const x = randInt(1, 9, rand)
  let y = randInt(1, 9, rand)
  while (y === x) y = randInt(1, 9, rand)
  const solveForY = rand() < 0.5
  const eq1 = solveForY
    ? `y = ${formatOffset('x', y - x)}`
    : `x = ${formatOffset('y', x - y)}`
  const eq2 = `x + y = ${x + y}`
  return {
    type: 'system_substitution_simple' as const,
    prompt: `Solve the system:\n${eq1}\n${eq2}\nGive your answer as x = ?, y = ?`,
    answer: `x = ${x}, y = ${y}`,
  }
}

// (2) Elimination: matching unit coefficients so adding/subtracting cancels a variable.
function makeElimination(rand: () => number) {
  const x = randInt(2, 9, rand)
  const y = randInt(1, x - 1, rand) // x > y so x - y > 0
  return {
    type: 'system_elimination_simple' as const,
    prompt: `Solve the system:\nx + y = ${x + y}\nx - y = ${x - y}\nGive your answer as x = ?, y = ?`,
    answer: `x = ${x}, y = ${y}`,
  }
}

// (3) Find missing value: x is given, solve for y. Answer is a non-negative integer.
function makeFindMissing(rand: () => number) {
  const x = randInt(1, 9, rand)
  const y = randInt(1, 9, rand) // y > 0 so the numeric keypad (no minus) is correct
  return {
    type: 'system_find_missing_value' as const,
    prompt: `In this system, x = ${x}:\nx + y = ${x + y}\n2x - y = ${2 * x - y}\nWhat is y?`,
    answer: String(y),
  }
}

// (4) Check solution: does the given (x, y) satisfy both equations? Balanced yes/no.
function makeCheckSolution(wantYes: boolean, rand: () => number) {
  const x = randInt(1, 9, rand)
  const y = randInt(1, 9, rand)
  const S = x + y
  const R = 2 * x - y

  let px = x
  let py = y
  if (!wantYes) {
    // Perturb one coordinate by ±1/±2. Changing either x or y alone breaks
    // x + y = S, so the candidate fails at least one equation → "no".
    const mag = randInt(1, 2, rand)
    const perturbX = rand() < 0.5
    if (perturbX) {
      px = x - mag >= 1 ? (rand() < 0.5 ? x - mag : x + mag) : x + mag
    } else {
      py = y - mag >= 1 ? (rand() < 0.5 ? y - mag : y + mag) : y + mag
    }
  }

  return {
    type: 'system_check_solution' as const,
    prompt: `Does x = ${px}, y = ${py} solve both equations?\nx + y = ${S}\n2x - y = ${R}\nAnswer yes or no.`,
    answer: wantYes ? 'yes' : 'no',
  }
}

// (5) Word problem: sum + difference of two positive numbers. x = smaller, y = larger.
function makeWordProblem(rand: () => number) {
  const x = randInt(1, 8, rand) // smaller
  const y = randInt(x + 1, 12, rand) // larger, so difference ≥ 1
  const S = x + y
  const D = y - x
  const template = rand() < 0.5
    ? `Two numbers add to ${S}. One number is ${D} more than the other. What are the numbers? Give your answer as x = smaller number, y = larger number.`
    : `The sum of two numbers is ${S}, and their difference is ${D}. What are the two numbers? Give your answer as x = smaller number, y = larger number.`
  return {
    type: 'system_word_problem_simple' as const,
    prompt: template,
    answer: `x = ${x}, y = ${y}`,
  }
}

type Maker = (rand: () => number) => {
  type: SystemsOfEquationsProblemType
  prompt: string
  answer: string
}

// Distribution for count=20 → 4/4/4/4/4 across the 5 types.
// system_check_solution is split 2 yes / 2 no.
function buildPlan(count: number): Maker[] {
  const weights: { maker: Maker; weight: number }[] = [
    { maker: makeSubstitution, weight: 4 },
    { maker: makeElimination, weight: 4 },
    { maker: makeFindMissing, weight: 4 },
    { maker: (r) => makeCheckSolution(true, r), weight: 2 },
    { maker: (r) => makeCheckSolution(false, r), weight: 2 },
    { maker: makeWordProblem, weight: 4 },
  ]
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0)
  const plan: Maker[] = []
  for (const w of weights) {
    const n = Math.round((w.weight / totalWeight) * count)
    for (let i = 0; i < n; i++) plan.push(w.maker)
  }
  while (plan.length < count) plan.push(makeSubstitution)
  while (plan.length > count) plan.pop()
  return plan
}

export function generateSystemsOfEquationsProblems(
  count = 10,
  rand: () => number = Math.random,
): SystemsOfEquationsProblem[] {
  const plan = buildPlan(count)
  const problems: SystemsOfEquationsProblem[] = []
  const seen = new Set<string>()

  for (let i = 0; i < plan.length; i++) {
    const maker = plan[i]
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      seen.add(p.prompt)
      problems.push({ id: `sys132_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
