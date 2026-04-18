import { randInt } from './rand'

export type SimplifyingProblemType =
  | 'expr_combine_like'
  | 'expr_multi_terms'
  | 'expr_with_constant'

export interface SimplifyingProblem {
  id: string
  type: SimplifyingProblemType
  prompt: string
  answer: string
}

const VARIABLES = ['a', 'b', 'm', 'n', 'x', 'y']

function pickVar(rand: () => number): string {
  return VARIABLES[Math.floor(rand() * VARIABLES.length)]
}

function generateOneProblem(
  rand: () => number
): { type: SimplifyingProblemType; prompt: string; answer: string } | null {
  const pick = rand()

  if (pick < 0.35) {
    // Two like terms: ax ± bx
    const v = pickVar(rand)
    const a = randInt(2, 9, rand)
    const b = randInt(1, 6, rand)
    const subtract = rand() < 0.4
    const resultCoeff = subtract ? a - b : a + b
    if (resultCoeff < 2) return null
    const op = subtract ? '−' : '+'
    const prompt = `${a}${v} ${op} ${b}${v} = ?`
    return { type: 'expr_combine_like', prompt, answer: `${resultCoeff}${v}` }
  }

  if (pick < 0.65) {
    // Three like terms: ax + bx - cx or ax - bx + cx
    const v = pickVar(rand)
    const a = randInt(2, 7, rand)
    const b = randInt(1, 5, rand)
    const c = randInt(1, 4, rand)
    // Randomly choose one subtraction operation
    const subB = rand() < 0.5
    const subC = !subB
    const resultCoeff = a + (subB ? -b : b) + (subC ? -c : c)
    if (resultCoeff < 2) return null
    const opB = subB ? '−' : '+'
    const opC = subC ? '−' : '+'
    const prompt = `${a}${v} ${opB} ${b}${v} ${opC} ${c}${v} = ?`
    return { type: 'expr_multi_terms', prompt, answer: `${resultCoeff}${v}` }
  }

  // Variable terms + constant terms: ax + c1 + bx ± c2
  const v = pickVar(rand)
  const a = randInt(2, 6, rand)
  const b = randInt(1, 4, rand)
  const c1 = randInt(1, 9, rand)
  const c2 = randInt(1, 9, rand)
  const varCoeff = a + b
  if (varCoeff < 2) return null
  const subtractConst = rand() < 0.5
  const constSum = subtractConst ? c1 - c2 : c1 + c2
  if (constSum === 0) return null

  const constOp = subtractConst ? '−' : '+'
  const prompt = `${a}${v} + ${c1} + ${b}${v} ${constOp} ${c2} = ?`

  let answer: string
  if (constSum > 0) {
    answer = `${varCoeff}${v} + ${constSum}`
  } else {
    answer = `${varCoeff}${v} - ${-constSum}`
  }
  return { type: 'expr_with_constant', prompt, answer }
}

export function generateSimplifyingProblems(
  count = 10,
  rand: () => number = Math.random
): SimplifyingProblem[] {
  const problems: SimplifyingProblem[] = []
  const seen = new Set<string>()
  let tries = 0

  while (problems.length < count && tries < count * 100) {
    tries++
    const p = generateOneProblem(rand)
    if (!p || seen.has(p.prompt)) continue
    seen.add(p.prompt)
    problems.push({ id: `expr81_${problems.length + 1}`, ...p })
  }

  return problems
}
