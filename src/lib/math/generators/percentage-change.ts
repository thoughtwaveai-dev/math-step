import { randInt } from './rand'

export type PercentageChangeProblemType =
  | 'percent_increase_amount'
  | 'percent_decrease_amount'
  | 'percent_change_find'
  | 'percent_reverse'
  | 'percent_multiplier'

export interface PercentageChangeProblem {
  id: string
  type: PercentageChangeProblemType
  prompt: string
  answer: string
}

// --- Level 19/1 - Percentage Change -----------------------------------------
// Builds on 6.2 (finding a percent of a number) and turns it into change:
// increase, decrease, finding the percent change, working backwards to the
// original, and the decimal multiplier that does it all in one step.
//
// Grading, with no change to gradeAnswer:
// - Types 1 to 4 answer a plain positive integer, so they ride the signed
//   integer path (^-?\d+$). No letters, "<", ">", "/" or "." ever appear.
// - percent_multiplier answers a decimal like "1.12" or "0.7", which rides the
//   decimal path (^\d+\.\d+$, tolerance 0.001). That is why a student typing
//   "1.50" or "0.70" still grades correct.
//
// Integers only. Every base is a round multiple of 100 / gcd(p, 100), so p% of
// it is an exact whole number, and each maker builds the answer from the base
// rather than computing with floats and rounding. The multiplier is formatted
// from the whole number of hundredths (100 + p or 100 - p) by string logic.
//
// Guards: amount answers (types 1, 2 and 4) are always 20 or more, and type 3
// answers are always multiples of 5, so the placeholder 'e.g. 13' can never be
// a real answer. The build loop also rejects any prompt that shows its own
// answer as one of its numbers.

const NUMBER_HINT = 'Answer with just the number.'

const NAMES = ['Mia', 'Leo', 'Sam', 'Ava', 'Tom', 'Zoe', 'Noah', 'Ella']
const PRICE_ITEMS = ['ticket', 'book', 'video game', 'bike', 'concert ticket']
const SALE_ITEMS = ['jacket', 'skateboard', 'backpack', 'board game', 'tent', 'pair of shoes']

const INCREASE_PCTS = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75]
const DECREASE_PCTS = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 75]
const REVERSE_UP_PCTS = [5, 10, 20, 25, 50]
const REVERSE_DOWN_PCTS = [10, 20, 25, 30, 40, 50]

const MIN_BASE = 20
const MAX_BASE = 400

function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[randInt(0, arr.length - 1, rand)]
}

function gcd(a: number, b: number): number {
  while (b !== 0) [a, b] = [b, a % b]
  return a
}

// Smallest round step that keeps p% of the base whole: lcm(100 / gcd(p, 100), 10).
function baseUnit(p: number): number {
  const step = 100 / gcd(p, 100)
  return (step * 10) / gcd(step, 10)
}

// A round base between MIN_BASE and MAX_BASE for which p% is a whole number.
function pickBase(p: number, rand: () => number): number {
  const unit = baseUnit(p)
  return unit * randInt(Math.ceil(MIN_BASE / unit), Math.floor(MAX_BASE / unit), rand)
}

// p% of base, exact: base is a multiple of 100 / g, so both factors are whole.
function percentOf(base: number, p: number): number {
  const g = gcd(p, 100)
  return (base / (100 / g)) * (p / g)
}

// 112 -> "1.12", 150 -> "1.5", 70 -> "0.7", 5 -> "0.05". n % 100 is never 0 here.
function hundredthsToDecimal(n: number): string {
  const whole = Math.floor(n / 100)
  const frac = String(n % 100).padStart(2, '0').replace(/0+$/, '')
  return `${whole}.${frac}`
}

type Pct191 = { type: PercentageChangeProblemType; prompt: string; answer: string }

// (1) Increase an amount by p%. Half plain, half in a short context.
function makeIncreaseAmount(rand: () => number): Pct191 {
  const p = pick(INCREASE_PCTS, rand)
  const base = pickBase(p, rand)
  const answer = String(base + percentOf(base, p))
  if (rand() < 0.5) {
    return { type: 'percent_increase_amount', prompt: `Increase ${base} by ${p}%. ${NUMBER_HINT}`, answer }
  }
  const style = randInt(0, 2, rand)
  let prompt: string
  if (style === 0) {
    prompt = `The price of a ${pick(PRICE_ITEMS, rand)} is $${base}. It goes up by ${p}%. What is the new price? ${NUMBER_HINT}`
  } else if (style === 1) {
    prompt = `A school has ${base} students. The number of students grows by ${p}%. How many students are there now? ${NUMBER_HINT}`
  } else {
    const name = pick(NAMES, rand)
    prompt = `${name} earns $${base} a week. ${name} gets a ${p}% pay rise. How much does ${name} earn now? ${NUMBER_HINT}`
  }
  return { type: 'percent_increase_amount', prompt, answer }
}

// (2) Decrease an amount by p%. Mostly a sale price. Retries until the answer
// is at least 20 (keeps the placeholder impossible).
function makeDecreaseAmount(rand: () => number): Pct191 {
  for (let attempt = 0; attempt < 40; attempt++) {
    const p = pick(DECREASE_PCTS, rand)
    const base = pickBase(p, rand)
    const result = base - percentOf(base, p)
    if (result < 20) continue
    const answer = String(result)
    const style = randInt(0, 3, rand)
    let prompt: string
    if (style <= 1) {
      prompt = `A ${pick(SALE_ITEMS, rand)} costs $${base}. It is reduced by ${p}% in a sale. What is the sale price? ${NUMBER_HINT}`
    } else if (style === 2) {
      prompt = `Decrease ${base} by ${p}%. ${NUMBER_HINT}`
    } else {
      const name = pick(NAMES, rand)
      prompt = `${name} has ${base} stickers and gives away ${p}% of them. How many stickers does ${name} have left? ${NUMBER_HINT}`
    }
    return { type: 'percent_decrease_amount', prompt, answer }
  }
  // Deterministic fallback: 240 reduced by 35% -> 156.
  return {
    type: 'percent_decrease_amount',
    prompt: `A jacket costs $240. It is reduced by 35% in a sale. What is the sale price? ${NUMBER_HINT}`,
    answer: '156',
  }
}

// (3) Find the percentage change between two amounts. p (a multiple of 5 from
// 5 to 90) is chosen first, then the new amount is built from it.
function makeChangeFind(rand: () => number): Pct191 {
  const p = 5 * randInt(1, 18, rand)
  const from = pickBase(p, rand)
  const up = rand() < 0.5
  const to = up ? from + percentOf(from, p) : from - percentOf(from, p)
  const word = up ? 'increase' : 'decrease'
  const prompt =
    rand() < 0.5
      ? `A price ${up ? 'rises' : 'falls'} from $${from} to $${to}. What is the percentage ${word}? ${NUMBER_HINT}`
      : `A club ${up ? 'grows' : 'shrinks'} from ${from} members to ${to} members. What is the percentage ${word}? ${NUMBER_HINT}`
  return { type: 'percent_change_find', prompt, answer: String(p) }
}

// (4) Reverse percentage: the original is chosen first, the changed price is
// built from it, and the student works back to the original.
function makeReverse(rand: () => number): Pct191 {
  const up = rand() < 0.5
  const p = pick(up ? REVERSE_UP_PCTS : REVERSE_DOWN_PCTS, rand)
  const original = pickBase(p, rand)
  const shown = up ? original + percentOf(original, p) : original - percentOf(original, p)
  let prompt: string
  if (up) {
    prompt = `After a ${p}% increase, a price is $${shown}. What was the original price? ${NUMBER_HINT}`
  } else if (rand() < 0.5) {
    prompt = `After a ${p}% discount, a price is $${shown}. What was the original price? ${NUMBER_HINT}`
  } else {
    const name = pick(NAMES, rand)
    prompt = `In a ${p}% off sale, ${name} pays $${shown} for a ${pick(SALE_ITEMS, rand)}. What was the original price? ${NUMBER_HINT}`
  }
  return { type: 'percent_reverse', prompt, answer: String(original) }
}

// (5) The decimal multiplier for an increase or decrease of p% (5 to 95).
// Increases give 1.05 to 1.95, decreases give 0.05 to 0.95.
function makeMultiplier(rand: () => number): Pct191 {
  const p = randInt(5, 95, rand)
  const up = rand() < 0.5
  return {
    type: 'percent_multiplier',
    prompt: `What decimal do you multiply by to ${up ? 'increase' : 'decrease'} an amount by ${p}%?`,
    answer: hundredthsToDecimal(up ? 100 + p : 100 - p),
  }
}

// True when the answer appears as one of the prompt's own numbers.
function leaksAnswer(p: Pct191): boolean {
  const nums: string[] = p.prompt.match(/\d+(?:\.\d+)?/g) ?? []
  return nums.includes(p.answer)
}

type Maker191 = (rand: () => number) => Pct191

// Distribution for count=20 -> 4/4/4/4/4.
function buildPlan191(count: number): Maker191[] {
  const makers: Maker191[] = [
    makeIncreaseAmount,
    makeDecreaseAmount,
    makeChangeFind,
    makeReverse,
    makeMultiplier,
  ]
  const perType = Math.round(count / makers.length)
  const plan: Maker191[] = []
  for (const maker of makers) {
    for (let i = 0; i < perType; i++) plan.push(maker)
  }
  while (plan.length < count) plan.push(makeIncreaseAmount)
  while (plan.length > count) plan.pop()
  return plan
}

// Generates problems for Level 19/1 - Percentage Change.
export function generatePercentageChangeProblems(
  count = 10,
  rand: () => number = Math.random,
): PercentageChangeProblem[] {
  const plan = buildPlan191(count)
  const problems: PercentageChangeProblem[] = []
  const seen = new Set<string>()

  for (const maker of plan) {
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt) || leaksAnswer(p)) continue
      seen.add(p.prompt)
      problems.push({ id: `pct191_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
