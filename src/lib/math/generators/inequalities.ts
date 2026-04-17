export type InequalityProblemType = 'inequality'

export interface InequalityProblem {
  id: string
  type: InequalityProblemType
  prompt: string
  answer: string
}

// Fixed pools — integer thresholds only
// Answers use > < >= <= notation (no Unicode symbols) for easy keyboard entry
// Format: [equation display, answer]
const ADD_GT_POOL: [string, string][] = [
  ['x + 3 > 7', 'x > 4'],
  ['x + 5 > 11', 'x > 6'],
  ['x + 2 > 9', 'x > 7'],
  ['x + 4 > 13', 'x > 9'],
  ['x + 6 > 10', 'x > 4'],
  ['x + 1 > 8', 'x > 7'],
  ['x + 7 > 15', 'x > 8'],
  ['x + 3 > 12', 'x > 9'],
]

const SUB_LT_POOL: [string, string][] = [
  ['x - 2 < 5', 'x < 7'],
  ['x - 4 < 8', 'x < 12'],
  ['x - 1 < 6', 'x < 7'],
  ['x - 3 < 9', 'x < 12'],
  ['x - 5 < 3', 'x < 8'],
  ['x - 6 < 4', 'x < 10'],
  ['x - 2 < 11', 'x < 13'],
  ['x - 7 < 5', 'x < 12'],
]

// Prompt displays ≤ symbol; answer uses <= for easy typing
const MULT_LE_POOL: [string, string][] = [
  ['2x ≤ 10', 'x <= 5'],
  ['3x ≤ 12', 'x <= 4'],
  ['4x ≤ 20', 'x <= 5'],
  ['2x ≤ 14', 'x <= 7'],
  ['5x ≤ 25', 'x <= 5'],
  ['3x ≤ 18', 'x <= 6'],
  ['6x ≤ 24', 'x <= 4'],
  ['4x ≤ 16', 'x <= 4'],
]

// Prompt displays ≥ symbol; answer uses >= for easy typing
const DIV_GE_POOL: [string, string][] = [
  ['x / 3 ≥ 4', 'x >= 12'],
  ['x / 2 ≥ 5', 'x >= 10'],
  ['x / 4 ≥ 3', 'x >= 12'],
  ['x / 5 ≥ 2', 'x >= 10'],
  ['x / 3 ≥ 6', 'x >= 18'],
  ['x / 2 ≥ 8', 'x >= 16'],
  ['x / 4 ≥ 5', 'x >= 20'],
  ['x / 6 ≥ 3', 'x >= 18'],
]

// Generates problems for Level 11 / Sublevel 1 — One-Variable Inequalities
// Distribution: 25% each category, equal split across 4 types
export function generateInequalities(count: number = 10): InequalityProblem[] {
  const perType = Math.floor(count / 4)
  const remainder = count - perType * 4

  const problems: InequalityProblem[] = []

  for (let i = 0; i < perType; i++) {
    const [eq, ans] = ADD_GT_POOL[i % ADD_GT_POOL.length]
    problems.push({ id: `ineq_gt_${i + 1}`, type: 'inequality', prompt: `Solve: ${eq}. Write your answer like: x > 4`, answer: ans })
  }
  for (let i = 0; i < perType; i++) {
    const [eq, ans] = SUB_LT_POOL[i % SUB_LT_POOL.length]
    problems.push({ id: `ineq_lt_${i + 1}`, type: 'inequality', prompt: `Solve: ${eq}. Write your answer like: x < 7`, answer: ans })
  }
  for (let i = 0; i < perType; i++) {
    const [eq, ans] = MULT_LE_POOL[i % MULT_LE_POOL.length]
    problems.push({ id: `ineq_le_${i + 1}`, type: 'inequality', prompt: `Solve: ${eq}. Write your answer like: x <= 5`, answer: ans })
  }
  // remainder goes to the last pool (div/ge)
  for (let i = 0; i < perType + remainder; i++) {
    const [eq, ans] = DIV_GE_POOL[i % DIV_GE_POOL.length]
    problems.push({ id: `ineq_ge_${i + 1}`, type: 'inequality', prompt: `Solve: ${eq}. Write your answer like: x >= 12`, answer: ans })
  }

  return problems
}
