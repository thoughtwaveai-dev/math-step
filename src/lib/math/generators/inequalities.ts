import { randInt } from './rand'

export type InequalityProblemType =
  | 'inequality'
  | 'inequality_one_step'
  | 'inequality_two_step'
  | 'inequality_negative_coefficient'
  | 'inequality_check_value'
  | 'inequality_from_words'

export interface InequalityProblem {
  id: string
  type: InequalityProblemType
  prompt: string
  answer: string
}

// --- Level 11/1 helpers ---
// Prompts use Unicode ≤/≥ for display; answers use ASCII <=/>= for keyboard entry.
// Grading normalizes both to the same form.

function makeAddGt(rand: () => number): { prompt: string; answer: string } {
  // x + a > b → x > threshold; threshold ∈ [1,12], a ∈ [1,9]
  const a = randInt(1, 9, rand)
  const threshold = randInt(1, 12, rand)
  const b = threshold + a
  return {
    prompt: `Solve: x + ${a} > ${b}. Write your answer like: x > 4`,
    answer: `x > ${threshold}`,
  }
}

function makeSubLt(rand: () => number): { prompt: string; answer: string } {
  // x - a < b → x < threshold = a + b; a ∈ [1,9], b ∈ [1,10]
  const a = randInt(1, 9, rand)
  const b = randInt(1, 10, rand)
  const threshold = a + b
  return {
    prompt: `Solve: x - ${a} < ${b}. Write your answer like: x < 7`,
    answer: `x < ${threshold}`,
  }
}

function makeMulLe(rand: () => number): { prompt: string; answer: string } {
  // ax ≤ b → x ≤ threshold; a ∈ [2,6], threshold ∈ [2,10]
  const a = randInt(2, 6, rand)
  const threshold = randInt(2, 10, rand)
  const b = a * threshold
  return {
    prompt: `Solve: ${a}x ≤ ${b}. Write your answer like: x <= 5`,
    answer: `x <= ${threshold}`,
  }
}

function makeDivGe(rand: () => number): { prompt: string; answer: string } {
  // x / a ≥ b → x ≥ threshold = a*b; a ∈ [2,5], b ∈ [2,8]
  const a = randInt(2, 5, rand)
  const b = randInt(2, 8, rand)
  const threshold = a * b
  return {
    prompt: `Solve: x / ${a} ≥ ${b}. Write your answer like: x >= 12`,
    answer: `x >= ${threshold}`,
  }
}

// Generates problems for Level 11/1 — One-Variable Inequalities
// Distribution: 25% each of the 4 inequality types
export function generateInequalities(count = 10, rand: () => number = Math.random): InequalityProblem[] {
  const perType = Math.floor(count / 4)
  const remainder = count - perType * 4

  type Maker = (r: () => number) => { prompt: string; answer: string }

  function buildSegment(
    n: number,
    prefix: string,
    make: Maker,
  ): InequalityProblem[] {
    const results: InequalityProblem[] = []
    const seen = new Set<string>()
    let tries = 0
    while (results.length < n && tries < n * 50) {
      tries++
      const { prompt, answer } = make(rand)
      if (!seen.has(prompt)) {
        seen.add(prompt)
        results.push({ id: `${prefix}_${results.length + 1}`, type: 'inequality', prompt, answer })
      }
    }
    return results
  }

  return [
    ...buildSegment(perType, 'ineq_gt', makeAddGt),
    ...buildSegment(perType, 'ineq_lt', makeSubLt),
    ...buildSegment(perType, 'ineq_le', makeMulLe),
    ...buildSegment(perType + remainder, 'ineq_ge', makeDivGe),
  ]
}

// --- Level 14/1 — Inequalities (5 problem types) ----------------------------
// Prompts display Unicode ≤/≥; stored answers use ASCII <=/>= (the inequality
// grading path normalizes both). Solve prompts append a generic format hint
// (number differs from the real answer) so kids type "x <op> n", not bare values
// or words. No gradeAnswer changes: solve/words answers ride the /[<>]/ path,
// check answers ride the yes/no algebraic path. Integer solutions, one variable.

type Op = { disp: string; ascii: '<' | '>' | '<=' | '>=' }

const OPS: Op[] = [
  { disp: '<', ascii: '<' },
  { disp: '>', ascii: '>' },
  { disp: '≤', ascii: '<=' },
  { disp: '≥', ascii: '>=' },
]

function pickOp(rand: () => number): Op {
  return OPS[randInt(0, OPS.length - 1, rand)]
}

// Generic example number per operator — purposely not the computed answer.
const HINT_EXAMPLE: Record<Op['ascii'], number> = { '<': 6, '>': 4, '<=': 5, '>=': 12 }
function solveHint(ascii: Op['ascii']): string {
  return `Write your answer like: x ${ascii} ${HINT_EXAMPLE[ascii]}`
}

function flipOp(op: Op): Op {
  switch (op.ascii) {
    case '<': return OPS[1]
    case '>': return OPS[0]
    case '<=': return OPS[3]
    case '>=': return OPS[2]
  }
}

function evalIneq(l: number, ascii: Op['ascii'], r: number): boolean {
  switch (ascii) {
    case '<': return l < r
    case '>': return l > r
    case '<=': return l <= r
    case '>=': return l >= r
  }
}

type Ineq141 = { type: InequalityProblemType; prompt: string; answer: string }

// (1) One-step: x ± a {op} b → x {op} t. Positive coefficient (no flip).
function makeOneStep(rand: () => number): Ineq141 {
  const op = pickOp(rand)
  const a = randInt(1, 9, rand)
  let prompt: string
  let t: number
  if (rand() < 0.5) {
    t = randInt(1, 12, rand)
    const b = t + a
    prompt = `Solve: x + ${a} ${op.disp} ${b}. ${solveHint(op.ascii)}`
  } else {
    const b = randInt(1, 10, rand)
    t = b + a
    prompt = `Solve: x - ${a} ${op.disp} ${b}. ${solveHint(op.ascii)}`
  }
  return { type: 'inequality_one_step', prompt, answer: `x ${op.ascii} ${t}` }
}

// (2) Two-step: ax ± c {op} b → x {op} t. Positive coefficient (no flip).
function makeTwoStep(rand: () => number): Ineq141 {
  const op = pickOp(rand)
  const a = randInt(2, 5, rand)
  const t = randInt(2, 9, rand)
  let prompt: string
  if (rand() < 0.5) {
    const c = randInt(1, 9, rand)
    const b = a * t + c
    prompt = `Solve: ${a}x + ${c} ${op.disp} ${b}. ${solveHint(op.ascii)}`
  } else {
    const c = randInt(1, Math.min(9, a * t - 1), rand)
    const b = a * t - c
    prompt = `Solve: ${a}x - ${c} ${op.disp} ${b}. ${solveHint(op.ascii)}`
  }
  return { type: 'inequality_two_step', prompt, answer: `x ${op.ascii} ${t}` }
}

// (3) Negative coefficient: -ax {op} b → divide by negative, FLIP the sign →
// x {flipped} -t. t ≥ 2 so the answer is never "-0". Example uses -1 (never an
// actual answer) and the flipped operator the lesson teaches.
function makeNegativeCoeff(rand: () => number): Ineq141 {
  const op = pickOp(rand)
  const a = randInt(2, 5, rand)
  const t = randInt(2, 8, rand)
  const b = a * t
  const flipped = flipOp(op)
  const prompt = `Solve: -${a}x ${op.disp} ${b}. Dividing by a negative flips the sign. Write your answer like: x ${flipped.ascii} -1`
  return {
    type: 'inequality_negative_coefficient',
    prompt,
    answer: `x ${flipped.ascii} -${t}`,
  }
}

// (4) Check a value: does x = v satisfy ax + c {op} rhs? Balanced yes/no via
// the yes_no control. rhs is chosen so the statement's truth equals wantYes.
function makeCheckValue(wantYes: boolean, rand: () => number): Ineq141 {
  const a = randInt(2, 4, rand)
  const c = randInt(1, 6, rand)
  const v = randInt(1, 6, rand)
  const op = pickOp(rand)
  const lhs = a * v + c
  const offsets = [0, 1, 2, 3, 4, -1, -2, -3, -4].sort(() => rand() - 0.5)
  let rhs = lhs + 1
  for (const off of offsets) {
    const cand = lhs + off
    if (cand >= 0 && evalIneq(lhs, op.ascii, cand) === wantYes) {
      rhs = cand
      break
    }
  }
  return {
    type: 'inequality_check_value',
    prompt: `Does x = ${v} satisfy ${a}x + ${c} ${op.disp} ${rhs}? Answer yes or no.`,
    answer: wantYes ? 'yes' : 'no',
  }
}

// (5) From words: "a number ± k is {phrase} v" → x ± k {op} v. Names the unknown
// as x so kids don't use n/y. Phrases limited to the four taught comparisons.
function makeFromWords(rand: () => number): Ineq141 {
  const PH: { text: string; ascii: Op['ascii'] }[] = [
    { text: 'less than', ascii: '<' },
    { text: 'greater than', ascii: '>' },
    { text: 'at most', ascii: '<=' },
    { text: 'at least', ascii: '>=' },
  ]
  const ph = PH[randInt(0, PH.length - 1, rand)]
  const usePlus = rand() < 0.5
  const k = randInt(1, 9, rand)
  const v = randInt(5, 20, rand)
  const word = usePlus ? 'plus' : 'minus'
  const sign = usePlus ? '+' : '-'
  return {
    type: 'inequality_from_words',
    prompt: `A number ${word} ${k} is ${ph.text} ${v}. Using x for the number, write the inequality.`,
    answer: `x ${sign} ${k} ${ph.ascii} ${v}`,
  }
}

type Maker141 = (rand: () => number) => Ineq141

// Distribution for count=20 → 4/4/4/4/4. check_value split 2 yes / 2 no.
function buildPlan141(count: number): Maker141[] {
  const weights: { maker: Maker141; weight: number }[] = [
    { maker: makeOneStep, weight: 4 },
    { maker: makeTwoStep, weight: 4 },
    { maker: makeNegativeCoeff, weight: 4 },
    { maker: (r) => makeCheckValue(true, r), weight: 2 },
    { maker: (r) => makeCheckValue(false, r), weight: 2 },
    { maker: makeFromWords, weight: 4 },
  ]
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0)
  const plan: Maker141[] = []
  for (const w of weights) {
    const n = Math.round((w.weight / totalWeight) * count)
    for (let i = 0; i < n; i++) plan.push(w.maker)
  }
  while (plan.length < count) plan.push(makeOneStep)
  while (plan.length > count) plan.pop()
  return plan
}

// Generates problems for Level 14/1 — Inequalities.
export function generateInequalitiesLevel141(
  count = 10,
  rand: () => number = Math.random,
): InequalityProblem[] {
  const plan = buildPlan141(count)
  const problems: InequalityProblem[] = []
  const seen = new Set<string>()

  for (let i = 0; i < plan.length; i++) {
    const maker = plan[i]
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      seen.add(p.prompt)
      problems.push({ id: `ineq141_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
