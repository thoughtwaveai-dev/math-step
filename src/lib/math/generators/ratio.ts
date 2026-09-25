import { randInt } from './rand'

export type RatioProblemType =
  | 'ratio_share_larger'
  | 'ratio_share_smaller'
  | 'ratio_missing_value'
  | 'ratio_find_total'
  | 'proportion_unitary'

export interface RatioProblem {
  id: string
  type: RatioProblemType
  prompt: string
  answer: string
}

// --- Level 18/2 - Ratio and Proportion --------------------------------------
// Sharing an amount in a ratio, equivalent ratios, finding the whole from one
// share, and the unitary method ("find one, then scale"). The single idea
// behind all five types is the value of ONE part.
//
// Every answer is ONE positive integer, so all five types ride the existing
// signed-integer path in gradeAnswer (/^-?\d+$/). No grading change. An answer
// is never written as a ratio like "3:4": that string would fall through to the
// grader's last path, which compares SORTED digit sets, so "4:3" would wrongly
// be marked correct. Keeping every answer a bare integer closes that hole.
//
// Every maker picks the ratio and the value of one part (or one unit) first and
// derives the numbers shown from them, so the answer is a whole number by
// construction. Ratios are always in simplest form: a != b, both 1 to 9, and
// coprime. Every multiplier is at least 2 and at most 12, so every answer is
// either 12 or less (a ratio term, or the smaller share of a 1:n ratio) or a
// product of two whole numbers that are both 2 or more. So no answer can ever be
// a prime above 12, which is what makes the placeholder "e.g. 37" safe (it can
// never leak a real answer).

const NUMBER_HINT = 'Answer with just the number.'
const NAMES = ['Mia', 'Leo', 'Sam', 'Ava', 'Tom', 'Zoe', 'Noah', 'Ella']

type Ratio182 = { type: RatioProblemType; prompt: string; answer: string }

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

// A simplest-form ratio a:b with a != b, both 1 to 9. The two terms are drawn
// independently, so the larger term is first or second at random.
function pickRatio(rand: () => number): [number, number] {
  for (let attempt = 0; attempt < 40; attempt++) {
    const a = randInt(1, 9, rand)
    const b = randInt(1, 9, rand)
    if (a === b || gcd(a, b) !== 1) continue
    return [a, b]
  }
  return [3, 5]
}

// A whole number from min to max that is not `avoid` (avoid must be in range).
function randIntExcept(min: number, max: number, avoid: number, rand: () => number): number {
  const n = randInt(min, max - 1, rand)
  return n >= avoid ? n + 1 : n
}

function pick<T>(items: readonly T[], rand: () => number): T {
  return items[randInt(0, items.length - 1, rand)]
}

// (1) Share (a + b) * unit in the ratio a:b; the answer is the larger share.
function makeShareLarger(rand: () => number): Ratio182 {
  const [a, b] = pickRatio(rand)
  const unit = randInt(2, 12, rand)
  return {
    type: 'ratio_share_larger',
    prompt: `Share ${(a + b) * unit} in the ratio ${a}:${b}. How much is the larger share?`,
    answer: String(Math.max(a, b) * unit),
  }
}

// (2) Same setup, but the answer is the smaller share.
function makeShareSmaller(rand: () => number): Ratio182 {
  const [a, b] = pickRatio(rand)
  const unit = randInt(2, 12, rand)
  return {
    type: 'ratio_share_smaller',
    prompt: `Share ${(a + b) * unit} in the ratio ${a}:${b}. How much is the smaller share?`,
    answer: String(Math.min(a, b) * unit),
  }
}

// (3) a:b and ka:kb are equivalent; any one of the four numbers is hidden, so
// the student sometimes scales up and sometimes scales back down.
function makeMissingValue(rand: () => number): Ratio182 {
  const [a, b] = pickRatio(rand)
  const k = randInt(2, 9, rand)
  const values = [a, b, k * a, k * b]
  const missing = randInt(0, 3, rand)
  const shown = values.map((v, i) => (i === missing ? '?' : String(v)))
  return {
    type: 'ratio_missing_value',
    prompt: `The ratios ${shown[0]}:${shown[1]} and ${shown[2]}:${shown[3]} are equivalent. What is the missing number?`,
    answer: String(values[missing]),
  }
}

// (4) Two people share in the ratio a:b and one share is given; the answer is
// the whole amount. The known share belongs to either person at random.
function makeFindTotal(rand: () => number): Ratio182 {
  const [a, b] = pickRatio(rand)
  const unit = randInt(2, 12, rand)
  const i = randInt(0, NAMES.length - 1, rand)
  const j = randIntExcept(0, NAMES.length - 1, i, rand)
  const first = NAMES[i]
  const second = NAMES[j]
  const knowFirst = rand() < 0.5
  const who = knowFirst ? first : second
  const known = (knowFirst ? a : b) * unit
  const thing = pick(['sweets', 'stickers', 'money'] as const, rand)
  const lead = `${first} and ${second} share some ${thing} in the ratio ${a}:${b}.`
  const prompt =
    thing === 'money'
      ? `${lead} ${who} gets $${known}. How much money is there altogether? ${NUMBER_HINT}`
      : `${lead} ${who} gets ${known} ${thing}. How many ${thing} are there altogether?`
  return { type: 'ratio_find_total', prompt, answer: String((a + b) * unit) }
}

// (5) Unitary method in four everyday contexts. The value of one (price of one
// item, grams per person, speed, pages per minute) is chosen first, and the two
// quantities always differ.
function makeUnitary(rand: () => number): Ratio182 {
  const context = randInt(0, 3, rand)
  if (context === 0) {
    const price = randInt(2, 9, rand)
    const q1 = randInt(2, 9, rand)
    const q2 = randIntExcept(2, 12, q1, rand)
    const item = pick(['pens', 'notebooks', 'muffins', 'bus tickets'], rand)
    return {
      type: 'proportion_unitary',
      prompt: `${q1} ${item} cost $${price * q1}. How much do ${q2} ${item} cost? ${NUMBER_HINT}`,
      answer: String(price * q2),
    }
  }
  if (context === 1) {
    const perPerson = pick([20, 25, 30, 40, 50, 60, 75, 80, 100], rand)
    const q1 = randInt(2, 8, rand)
    const q2 = randIntExcept(2, 12, q1, rand)
    const food = pick(['flour', 'sugar', 'rice'], rand)
    return {
      type: 'proportion_unitary',
      prompt: `A recipe uses ${perPerson * q1} g of ${food} for ${q1} people. How much ${food} is needed for ${q2} people? ${NUMBER_HINT}`,
      answer: String(perPerson * q2),
    }
  }
  if (context === 2) {
    const speed = randInt(4, 9, rand) * 10
    const h1 = randInt(2, 5, rand)
    const h2 = randIntExcept(2, 8, h1, rand)
    return {
      type: 'proportion_unitary',
      prompt: `A car travels ${speed * h1} km in ${h1} hours at a steady speed. How far does it travel in ${h2} hours? ${NUMBER_HINT}`,
      answer: String(speed * h2),
    }
  }
  const rate = randInt(4, 15, rand)
  const m1 = randInt(2, 6, rand)
  const m2 = randIntExcept(2, 10, m1, rand)
  return {
    type: 'proportion_unitary',
    prompt: `A printer prints ${rate * m1} pages in ${m1} minutes. How many pages does it print in ${m2} minutes?`,
    answer: String(rate * m2),
  }
}

// A number in the prompt that happens to equal the answer (for example the
// smaller share of 1:4 coming out as 4) lets a student copy it instead of
// working it out, so such a draw is rejected and redrawn.
function showsAnswer(p: Ratio182): boolean {
  const numbers: string[] = p.prompt.match(/\d+/g) ?? []
  return numbers.includes(p.answer)
}

type Maker182 = (rand: () => number) => Ratio182

// Distribution for count=20 -> 4/4/4/4/4.
function buildPlan182(count: number): Maker182[] {
  const makers: Maker182[] = [
    makeShareLarger,
    makeShareSmaller,
    makeMissingValue,
    makeFindTotal,
    makeUnitary,
  ]
  const perType = Math.round(count / makers.length)
  const plan: Maker182[] = []
  for (const maker of makers) {
    for (let i = 0; i < perType; i++) plan.push(maker)
  }
  while (plan.length < count) plan.push(makeShareLarger)
  while (plan.length > count) plan.pop()
  return plan
}

// Generates problems for Level 18/2 - Ratio and Proportion.
export function generateRatioProblems(
  count = 10,
  rand: () => number = Math.random,
): RatioProblem[] {
  const plan = buildPlan182(count)
  const problems: RatioProblem[] = []
  const seen = new Set<string>()

  for (const maker of plan) {
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      if (showsAnswer(p)) continue
      seen.add(p.prompt)
      problems.push({ id: `rat182_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
