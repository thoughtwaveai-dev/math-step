import { randInt, shuffled } from './rand'

export type PythagorasProblemType =
  | 'pythagoras_hypotenuse'
  | 'pythagoras_shorter_side'
  | 'pythagoras_check_right_angle'
  | 'pythagoras_word_problem'
  | 'pythagoras_distance_points'

export interface PythagorasProblem {
  id: string
  type: PythagorasProblemType
  prompt: string
  answer: string
}

// --- Level 18/1 - Pythagoras' Theorem ---------------------------------------
// a2 + b2 = c2 for a right-angled triangle, where c is the longest side (the
// hypotenuse). Text only in v1: every prompt names its numbers in words, so no
// diagram is needed.
//
// Every number on the page comes from a fixed table of whole-number triples
// (seven primitives and their whole-number multiples, hypotenuse <= 65), so
// every answer is a whole number by construction. No square roots are taken at
// run time and nothing is rounded.
//
// Grading: four types answer a plain positive integer and ride the signed
// integer path in gradeAnswer (^-?\d+$). The check type answers "yes" or "no",
// which rides the algebraic path (has a letter, lowercase + strip whitespace,
// strict match) exactly like 13.1 point_on_line, via the existing yes_no
// control. No grading change.

const NUMBER_HINT = 'Answer with just the number.'
const NAMES = ['Mia', 'Leo', 'Sam', 'Ava', 'Tom', 'Zoe', 'Noah', 'Ella']

type Triple = readonly [number, number, number]

const PRIMITIVES: Triple[] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
  [12, 35, 37],
]
const MAX_HYPOTENUSE = 65

// One family per primitive: every whole-number multiple with hypotenuse <= 65.
// Sides are always listed shortest first, so t[2] is the hypotenuse.
const FAMILIES: Triple[][] = PRIMITIVES.map(([a, b, c]) => {
  const family: Triple[] = []
  for (let k = 1; k * c <= MAX_HYPOTENUSE; k++) family.push([k * a, k * b, k * c])
  return family
})

// Picks a family first, then a multiple, so the 3-4-5 family (13 multiples)
// does not swamp the rest. `fits` narrows the table for a context.
function pickTriple(rand: () => number, fits: (t: Triple) => boolean = () => true): Triple {
  const families = FAMILIES.map(f => f.filter(fits)).filter(f => f.length > 0)
  const family = families[randInt(0, families.length - 1, rand)]
  return family[randInt(0, family.length - 1, rand)]
}

function pick<T>(items: readonly T[], rand: () => number): T {
  return items[randInt(0, items.length - 1, rand)]
}

type Pyth181 = { type: PythagorasProblemType; prompt: string; answer: string }

// (1) Two shorter sides given, find the hypotenuse. Leg order is random.
function makeHypotenuse(rand: () => number): Pyth181 {
  const [a, b, c] = pickTriple(rand)
  const [p, q] = rand() < 0.5 ? [a, b] : [b, a]
  const unit = pick(['cm', 'm'], rand)
  return {
    type: 'pythagoras_hypotenuse',
    prompt: `A right-angled triangle has shorter sides of ${p} ${unit} and ${q} ${unit}. How long is the longest side? ${NUMBER_HINT}`,
    answer: String(c),
  }
}

// (2) Hypotenuse and one shorter side given, find the other shorter side.
// Subtracting the squares is the step students forget.
function makeShorterSide(rand: () => number): Pyth181 {
  const [a, b, c] = pickTriple(rand)
  const [given, missing] = rand() < 0.5 ? [a, b] : [b, a]
  const unit = pick(['cm', 'm'], rand)
  return {
    type: 'pythagoras_shorter_side',
    prompt: `A right-angled triangle has a longest side of ${c} ${unit} and one shorter side of ${given} ${unit}. How long is the other shorter side? ${NUMBER_HINT}`,
    answer: String(missing),
  }
}

// (3) Converse: is this triangle right-angled? "yes" uses a table triple. "no"
// nudges one side of a triple by 1 and re-checks with integers that the two
// smaller squares no longer add to the largest square (the largest side is the
// only one that can be a hypotenuse, so one check covers every ordering). Sides
// are shown shortest first half the time and shuffled otherwise.
function makeCheckRightAngle(wantYes: boolean, rand: () => number): Pyth181 {
  let sides: number[]
  if (wantYes) {
    sides = [...pickTriple(rand)]
  } else {
    // Deterministic fallback: 7, 24, 26 is not right-angled (49 + 576 = 625, not 676).
    sides = [7, 24, 26]
    for (let attempt = 0; attempt < 40; attempt++) {
      const t = [...pickTriple(rand)]
      t[randInt(0, 2, rand)] += rand() < 0.5 ? 1 : -1
      const [x, y, z] = [...t].sort((m, n) => m - n)
      // Still a real triangle, three different lengths, and not a triple by accident.
      if (x * x + y * y === z * z || x + y <= z || x === y || y === z) continue
      sides = t
      break
    }
  }
  const shown = rand() < 0.5 ? [...sides].sort((m, n) => m - n) : shuffled(sides, rand)
  const unit = pick(['cm', 'm'], rand)
  return {
    type: 'pythagoras_check_right_angle',
    prompt: `A triangle has sides of ${shown[0]} ${unit}, ${shown[1]} ${unit} and ${shown[2]} ${unit}. Is it a right-angled triangle? Answer yes or no.`,
    answer: wantYes ? 'yes' : 'no',
  }
}

// (4) Real contexts, two numbers each, half asking for the hypotenuse and half
// for a shorter side. Ladders are kept to 13 m or less so they read as real.
function makeWordProblem(rand: () => number): Pyth181 {
  const context = randInt(0, 2, rand)
  const findLongest = rand() < 0.5
  const t: Pyth181 = { type: 'pythagoras_word_problem', prompt: '', answer: '' }

  if (context === 0) {
    // Ladder: the foot is always the shorter distance from the wall.
    const [a, b, c] = pickTriple(rand, tr => tr[2] <= 13)
    if (findLongest) {
      t.prompt = `A ladder leans against a wall. Its foot is ${a} m from the wall and its top is ${b} m up the wall. How long is the ladder? ${NUMBER_HINT}`
      t.answer = String(c)
    } else {
      t.prompt = `A ${c} m ladder leans against a wall with its foot ${a} m from the wall. How high up the wall does the ladder reach? ${NUMBER_HINT}`
      t.answer = String(b)
    }
  } else if (context === 1) {
    // Rectangle: width is the shorter side, length the longer.
    const [a, b, c] = pickTriple(rand)
    if (findLongest) {
      t.prompt = `A rectangle is ${a} cm wide and ${b} cm long. How long is its diagonal? ${NUMBER_HINT}`
      t.answer = String(c)
    } else {
      t.prompt = `A rectangle is ${a} cm wide and its diagonal is ${c} cm. How long is the rectangle? ${NUMBER_HINT}`
      t.answer = String(b)
    }
  } else {
    // Walking east then north: either leg can be the longer one.
    const [a, b, c] = pickTriple(rand)
    const [east, north] = rand() < 0.5 ? [a, b] : [b, a]
    const name = pick(NAMES, rand)
    if (findLongest) {
      t.prompt = `${name} walks ${east} m east and then ${north} m north. How far is ${name} from the start in a straight line? ${NUMBER_HINT}`
      t.answer = String(c)
    } else {
      t.prompt = `${name} walks ${east} m east and then some distance north, ending up ${c} m from the start in a straight line. How far north did ${name} walk? ${NUMBER_HINT}`
      t.answer = String(north)
    }
  }
  return t
}

// (5) Distance between two points: the x and y gaps are the two legs of a
// triple (order and direction random), so the distance is the hypotenuse.
// Legs <= 30 keep every coordinate in -10 to 20. A coordinate that equals the
// distance (either sign) is rejected so the prompt never shows the answer.
function makeDistancePoints(rand: () => number): Pyth181 {
  for (let attempt = 0; attempt < 40; attempt++) {
    const [a, b, c] = pickTriple(rand, tr => tr[1] <= 30)
    const [dx, dy] = rand() < 0.5 ? [a, b] : [b, a]
    const x1 = randInt(-10, 20 - dx, rand)
    const y1 = randInt(-10, 20 - dy, rand)
    const low = [x1, y1]
    const high = [x1 + dx, y1 + dy]
    // Randomly swap each coordinate so the second point can sit left of or below the first.
    const xs = rand() < 0.5 ? [low[0], high[0]] : [high[0], low[0]]
    const ys = rand() < 0.5 ? [low[1], high[1]] : [high[1], low[1]]
    if ([...xs, ...ys].some(v => Math.abs(v) === c)) continue
    return {
      type: 'pythagoras_distance_points',
      prompt: `What is the distance between the points (${xs[0]}, ${ys[0]}) and (${xs[1]}, ${ys[1]})?`,
      answer: String(c),
    }
  }
  // Deterministic fallback: gaps 6 and 8, distance 10.
  return {
    type: 'pythagoras_distance_points',
    prompt: 'What is the distance between the points (2, 3) and (8, 11)?',
    answer: '10',
  }
}

type Maker181 = (rand: () => number) => Pyth181

// Distribution for count=20 -> 4/4/4/4/4. The check slots alternate yes / no,
// so a sheet of 20 always has 2 of each (same idea as 14.1 check_value).
function buildPlan181(count: number): Maker181[] {
  const checkYes: Maker181 = r => makeCheckRightAngle(true, r)
  const checkNo: Maker181 = r => makeCheckRightAngle(false, r)
  const perType = Math.round(count / 5)
  const plan: Maker181[] = []
  for (let i = 0; i < perType; i++) plan.push(makeHypotenuse)
  for (let i = 0; i < perType; i++) plan.push(makeShorterSide)
  for (let i = 0; i < perType; i++) plan.push(i % 2 === 0 ? checkYes : checkNo)
  for (let i = 0; i < perType; i++) plan.push(makeWordProblem)
  for (let i = 0; i < perType; i++) plan.push(makeDistancePoints)
  while (plan.length < count) plan.push(makeHypotenuse)
  while (plan.length > count) plan.pop()
  return plan
}

// Generates problems for Level 18/1 - Pythagoras' Theorem.
export function generatePythagorasProblems(
  count = 10,
  rand: () => number = Math.random,
): PythagorasProblem[] {
  const plan = buildPlan181(count)
  const problems: PythagorasProblem[] = []
  const seen = new Set<string>()

  for (const maker of plan) {
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt)) continue
      seen.add(p.prompt)
      problems.push({ id: `pyt181_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
