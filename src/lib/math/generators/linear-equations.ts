export type LinearEquationType = 'linear_equation'

export interface LinearEquationProblem {
  id: string
  type: LinearEquationType
  prompt: string
  answer: string
}

// Fixed pools — all answers are positive integers
// Format: [prompt, answer]
const ADD_POOL: [string, number][] = [
  ['x + 4 = 11', 7],
  ['x + 7 = 15', 8],
  ['x + 9 = 21', 12],
  ['x + 6 = 18', 12],
  ['x + 3 = 10', 7],
  ['x + 8 = 20', 12],
  ['x + 5 = 14', 9],
  ['x + 11 = 25', 14],
]

const SUB_POOL: [string, number][] = [
  ['x - 6 = 9', 15],
  ['x - 3 = 8', 11],
  ['x - 5 = 12', 17],
  ['x - 8 = 6', 14],
  ['x - 4 = 13', 17],
  ['x - 7 = 9', 16],
  ['x - 2 = 11', 13],
  ['x - 9 = 6', 15],
]

const MULT_POOL: [string, number][] = [
  ['3x = 18', 6],
  ['4x = 20', 5],
  ['5x = 35', 7],
  ['2x = 16', 8],
  ['6x = 24', 4],
  ['3x = 27', 9],
  ['7x = 21', 3],
  ['4x = 32', 8],
]

const DIV_POOL: [string, number][] = [
  ['x / 4 = 3', 12],
  ['x / 5 = 4', 20],
  ['x / 3 = 6', 18],
  ['x / 6 = 4', 24],
  ['x / 3 = 7', 21],
  ['x / 5 = 3', 15],
  ['x / 2 = 7', 14],
  ['x / 4 = 6', 24],
]

const TWO_STEP_POOL: [string, number][] = [
  ['2x + 5 = 13', 4],
  ['3x - 4 = 11', 5],
  ['x / 3 - 2 = 4', 18],
  ['x / 2 + 3 = 8', 10],
  ['4x + 1 = 17', 4],
  ['2x - 6 = 10', 8],
  ['3x + 6 = 21', 5],
  ['x / 4 + 2 = 6', 16],
]

// Generates problems for Level 10 / Sublevel 1 — Linear Equations
// Distribution: 25% add, 25% sub, 20% mult, 15% div, remainder two-step
export function generateLinearEquations(count: number = 10): LinearEquationProblem[] {
  const addCount = Math.floor(count * 0.25)
  const subCount = Math.floor(count * 0.25)
  const multCount = Math.floor(count * 0.20)
  const divCount = Math.floor(count * 0.15)
  const twoStepCount = count - addCount - subCount - multCount - divCount

  const problems: LinearEquationProblem[] = []

  for (let i = 0; i < addCount; i++) {
    const [prompt, answer] = ADD_POOL[i % ADD_POOL.length]
    problems.push({ id: `leq_add_${i + 1}`, type: 'linear_equation', prompt: `Solve for x: ${prompt}`, answer: String(answer) })
  }
  for (let i = 0; i < subCount; i++) {
    const [prompt, answer] = SUB_POOL[i % SUB_POOL.length]
    problems.push({ id: `leq_sub_${i + 1}`, type: 'linear_equation', prompt: `Solve for x: ${prompt}`, answer: String(answer) })
  }
  for (let i = 0; i < multCount; i++) {
    const [prompt, answer] = MULT_POOL[i % MULT_POOL.length]
    problems.push({ id: `leq_mul_${i + 1}`, type: 'linear_equation', prompt: `Solve for x: ${prompt}`, answer: String(answer) })
  }
  for (let i = 0; i < divCount; i++) {
    const [prompt, answer] = DIV_POOL[i % DIV_POOL.length]
    problems.push({ id: `leq_div_${i + 1}`, type: 'linear_equation', prompt: `Solve for x: ${prompt}`, answer: String(answer) })
  }
  for (let i = 0; i < twoStepCount; i++) {
    const [prompt, answer] = TWO_STEP_POOL[i % TWO_STEP_POOL.length]
    problems.push({ id: `leq_2s_${i + 1}`, type: 'linear_equation', prompt: `Solve for x: ${prompt}`, answer: String(answer) })
  }

  return problems
}
