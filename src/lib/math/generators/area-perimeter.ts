import { randInt } from './rand'

export type AreaPerimeterProblemType =
  | 'area_triangle'
  | 'area_parallelogram'
  | 'area_trapezium'
  | 'area_compound_shape'
  | 'rectangle_perimeter_area'

export interface AreaPerimeterProblem {
  id: string
  type: AreaPerimeterProblemType
  prompt: string
  answer: string
}

// --- Level 19/2 - Area and Perimeter ----------------------------------------
// Area of straight-sided shapes, described in words: triangles, parallelograms,
// trapeziums, a rectangle with a corner cut out, and working back from one
// measurement of a rectangle to the other. Text only, no diagrams, and no
// circles (pi would force a rounding rule onto the answer).
//
// Every answer is a single positive whole number, so all five types ride the
// existing signed-integer path in gradeAnswer (^-?\d+$). No grading change, and
// the numeric keypad is safe because only digits are ever typed. Every prompt
// ends "Answer with just the number." so nobody types "84 cm²".
//
// Each maker picks the lengths first and derives the answer from them. The two
// halving types (triangle, trapezium) bump one length by 1 when the product
// would be odd, so the half is whole by construction, never by rounding. The
// build loop also rejects any prompt that already shows its own answer.

const NUMBER_HINT = 'Answer with just the number.'

type Area192 = { type: AreaPerimeterProblemType; prompt: string; answer: string }

// cm or m, picked per problem. Square units carry a real superscript two.
function pickUnit(rand: () => number): string {
  return rand() < 0.5 ? 'cm' : 'm'
}

// (1) Triangle: base x height / 2. If both are odd the base goes up by 1, so the
// product is even. Mins of 4 and 3 stop the area ever equalling a given length.
function makeTriangle(rand: () => number): Area192 {
  const unit = pickUnit(rand)
  let base = randInt(4, 19, rand)
  const height = randInt(3, 14, rand)
  if ((base * height) % 2 !== 0) base += 1
  return {
    type: 'area_triangle',
    prompt: `A triangle has a base of ${base} ${unit} and a perpendicular height of ${height} ${unit}. What is its area in ${unit}²? ${NUMBER_HINT}`,
    answer: String((base * height) / 2),
  }
}

// (2) Parallelogram: base x perpendicular height. The slanted side is a
// distractor, always longer than the height (as it has to be) and never equal
// to the base, so multiplying by it gives a different, wrong answer. The height
// and slant swap places in the sentence so "first times last" does not work.
function makeParallelogram(rand: () => number): Area192 {
  const unit = pickUnit(rand)
  const base = randInt(5, 16, rand)
  const height = randInt(3, 10, rand)
  let slant = height + randInt(1, 5, rand)
  if (slant === base) slant += 1
  const middle =
    rand() < 0.5
      ? `a slanted side of ${slant} ${unit} and a perpendicular height of ${height} ${unit}`
      : `a perpendicular height of ${height} ${unit} and a slanted side of ${slant} ${unit}`
  return {
    type: 'area_parallelogram',
    prompt: `A parallelogram has a base of ${base} ${unit}, ${middle}. What is its area in ${unit}²? ${NUMBER_HINT}`,
    answer: String(base * height),
  }
}

// (3) Trapezium: (a + b) / 2 x height, with the parallel sides different (equal
// ones would make a parallelogram). If a + b and the height are both odd, the
// height goes up by 1 so the product is even.
function makeTrapezium(rand: () => number): Area192 {
  const unit = pickUnit(rand)
  const a = randInt(3, 14, rand)
  let b = randInt(3, 14, rand)
  if (b === a) b = a === 14 ? 3 : a + 1
  let height = randInt(2, 11, rand)
  if (((a + b) * height) % 2 !== 0) height += 1
  return {
    type: 'area_trapezium',
    prompt: `A trapezium has parallel sides of ${a} ${unit} and ${b} ${unit}, and a perpendicular height of ${height} ${unit}. What is its area in ${unit}²? ${NUMBER_HINT}`,
    answer: String(((a + b) * height) / 2),
  }
}

// (4) Compound shape: big rectangle minus a smaller rectangle cut out of one
// corner. The cut-out is strictly smaller in both directions (at least 3 shorter
// along the length, 2 along the width), so an L shape is always left.
function makeCompound(rand: () => number): Area192 {
  const unit = pickUnit(rand)
  const length = randInt(8, 15, rand)
  const width = randInt(5, length - 1, rand)
  const cutLength = randInt(2, length - 3, rand)
  const cutWidth = randInt(2, width - 2, rand)
  // "an 8 cm", "an 11 cm": numbers that are said starting with a vowel sound.
  const article = cutLength === 8 || cutLength === 11 ? 'an' : 'a'
  return {
    type: 'area_compound_shape',
    prompt: `A rectangle ${length} ${unit} by ${width} ${unit} has ${article} ${cutLength} ${unit} by ${cutWidth} ${unit} rectangle cut out of one corner. What is the area of the shape that is left, in ${unit}²? ${NUMBER_HINT}`,
    answer: String(length * width - cutLength * cutWidth),
  }
}

// Whole-number rectangle for type 5, length always the longer side. 6 by 3 is
// skipped: its area and perimeter are both 18, so the answer would already be
// sitting in the prompt.
function pickRectangle(rand: () => number): [number, number] {
  const length = randInt(4, 15, rand)
  let width = randInt(2, length - 1, rand)
  if (length === 6 && width === 3) width = 2
  return [length, width]
}

// (5a) Area and width given: find the length, then the perimeter.
function makeAreaToPerimeter(rand: () => number): Area192 {
  const unit = pickUnit(rand)
  const [length, width] = pickRectangle(rand)
  return {
    type: 'rectangle_perimeter_area',
    prompt: `A rectangle has an area of ${length * width} ${unit}² and a width of ${width} ${unit}. What is its perimeter in ${unit}? ${NUMBER_HINT}`,
    answer: String(2 * (length + width)),
  }
}

// (5b) Perimeter and length given: find the width, then the area.
function makePerimeterToArea(rand: () => number): Area192 {
  const unit = pickUnit(rand)
  const [length, width] = pickRectangle(rand)
  return {
    type: 'rectangle_perimeter_area',
    prompt: `A rectangle has a perimeter of ${2 * (length + width)} ${unit} and a length of ${length} ${unit}. What is its area in ${unit}²? ${NUMBER_HINT}`,
    answer: String(length * width),
  }
}

// True when the answer already appears in the prompt as a whole number. The
// ranges above rule this out; this is the backstop.
function leaksAnswer(p: Area192): boolean {
  return new RegExp(`\\b${p.answer}\\b`).test(p.prompt)
}

type Maker192 = (rand: () => number) => Area192

// Distribution for count=20 -> 4/4/4/4/4. The rectangle slots alternate between
// its two directions (2 + 2 for count=20), so every worksheet gets both.
function buildPlan192(count: number): Maker192[] {
  const groups: Maker192[][] = [
    [makeTriangle],
    [makeParallelogram],
    [makeTrapezium],
    [makeCompound],
    [makeAreaToPerimeter, makePerimeterToArea],
  ]
  const perType = Math.round(count / groups.length)
  const plan: Maker192[] = []
  for (const group of groups) {
    for (let i = 0; i < perType; i++) plan.push(group[i % group.length])
  }
  while (plan.length < count) plan.push(makeTriangle)
  while (plan.length > count) plan.pop()
  return plan
}

// Generates problems for Level 19/2 - Area and Perimeter.
export function generateAreaPerimeterProblems(
  count = 10,
  rand: () => number = Math.random,
): AreaPerimeterProblem[] {
  const plan = buildPlan192(count)
  const problems: AreaPerimeterProblem[] = []
  const seen = new Set<string>()

  for (const maker of plan) {
    let attempts = 0
    while (attempts < 50) {
      attempts++
      const p = maker(rand)
      if (seen.has(p.prompt) || leaksAnswer(p)) continue
      seen.add(p.prompt)
      problems.push({ id: `ap192_${problems.length + 1}`, ...p })
      break
    }
  }

  return problems
}
