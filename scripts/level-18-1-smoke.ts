// Level 18.1 smoke test: every generated Pythagoras problem must be exactly
// right by integer arithmetic (a*a + b*b === c*c) when its numbers are read
// back out of the prompt, give a whole-number (or yes / no) answer, and grade
// correct through the real gradeAnswer path.
//
// Run: npx tsx scripts/level-18-1-smoke.ts
//      npx tsx scripts/level-18-1-smoke.ts --no-wiring   (before shared wiring)

import { generatePythagorasProblems } from '../src/lib/math/generators/pythagoras'
import { seededRand } from '../src/lib/math/generators/rand'
import { gradeAnswer } from '../src/lib/math/gradeAnswer'
import { inputModeForType, placeholderForType, problemTypeLabel } from '../src/lib/math/inputMode'
import { getAnswerControlType } from '../src/lib/math/answerControl'
import { generateProblems } from '../src/lib/math/generators'

const WIRING = !process.argv.includes('--no-wiring')

let checks = 0
let failures = 0

function fail(msg: string) {
  failures++
  if (failures <= 20) console.log(`FAIL: ${msg}`)
}

function check(cond: boolean, msg: string) {
  checks++
  if (!cond) fail(msg)
}

// Whole-number square root by integer search, or null if n is not a square.
function isqrt(n: number): number | null {
  if (n <= 0) return null
  for (let r = 1; r * r <= n; r++) if (r * r === n) return r
  return null
}
const hyp = (a: number, b: number) => isqrt(a * a + b * b)
const leg = (c: number, a: number) => (c > a ? isqrt(c * c - a * a) : null)

const HINT = ' Answer with just the number\\.$'
const RE_HYP = new RegExp(
  '^A right-angled triangle has shorter sides of (\\d+) (cm|m) and (\\d+) \\2\\. How long is the longest side\\?' + HINT,
)
const RE_SHORT = new RegExp(
  '^A right-angled triangle has a longest side of (\\d+) (cm|m) and one shorter side of (\\d+) \\2\\. How long is the other shorter side\\?' + HINT,
)
const RE_CHECK =
  /^A triangle has sides of (\d+) (cm|m), (\d+) \2 and (\d+) \2\. Is it a right-angled triangle\? Answer yes or no\.$/
const RE_DIST =
  /^What is the distance between the points \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\?$/

// Word problem templates: solve returns the expected answer, or null if the
// numbers are not a whole-number triple in the right roles.
const WORD: { name: string; re: RegExp; solve: (m: RegExpMatchArray) => number | null; maxHyp: number }[] = [
  {
    name: 'ladder_length',
    re: new RegExp('^A ladder leans against a wall\\. Its foot is (\\d+) m from the wall and its top is (\\d+) m up the wall\\. How long is the ladder\\?' + HINT),
    solve: m => (Number(m[1]) < Number(m[2]) ? hyp(Number(m[1]), Number(m[2])) : null),
    maxHyp: 13,
  },
  {
    name: 'ladder_height',
    re: new RegExp('^A (\\d+) m ladder leans against a wall with its foot (\\d+) m from the wall\\. How high up the wall does the ladder reach\\?' + HINT),
    solve: m => {
      const h = leg(Number(m[1]), Number(m[2]))
      return h !== null && h > Number(m[2]) ? h : null
    },
    maxHyp: 13,
  },
  {
    name: 'rectangle_diagonal',
    re: new RegExp('^A rectangle is (\\d+) cm wide and (\\d+) cm long\\. How long is its diagonal\\?' + HINT),
    solve: m => (Number(m[1]) < Number(m[2]) ? hyp(Number(m[1]), Number(m[2])) : null),
    maxHyp: 65,
  },
  {
    name: 'rectangle_length',
    re: new RegExp('^A rectangle is (\\d+) cm wide and its diagonal is (\\d+) cm\\. How long is the rectangle\\?' + HINT),
    solve: m => {
      const l = leg(Number(m[2]), Number(m[1]))
      return l !== null && l > Number(m[1]) ? l : null
    },
    maxHyp: 65,
  },
  {
    name: 'walk_distance',
    re: new RegExp('^([A-Z][a-z]+) walks (\\d+) m east and then (\\d+) m north\\. How far is \\1 from the start in a straight line\\?' + HINT),
    solve: m => hyp(Number(m[2]), Number(m[3])),
    maxHyp: 65,
  },
  {
    name: 'walk_north',
    re: new RegExp('^([A-Z][a-z]+) walks (\\d+) m east and then some distance north, ending up (\\d+) m from the start in a straight line\\. How far north did \\1 walk\\?' + HINT),
    solve: m => leg(Number(m[3]), Number(m[2])),
    maxHyp: 65,
  },
]

const BANNED_NAMES = ['Joaquin', 'Jude', 'Roman', 'Jacob', 'Vilma', 'Aryan', 'Leica', 'Enzo']
// En dash, em dash and Unicode minus, built from code points so this file stays dash free.
const DASHES = new RegExp('[' + String.fromCharCode(0x2013, 0x2014, 0x2212) + ']')

// Independent answer for one prompt, from the prompt text alone. Returns the
// expected answer string or null if the prompt did not parse.
function solveFromPrompt(type: string, prompt: string, wordHits: Map<string, number>): string | null {
  if (type === 'pythagoras_hypotenuse') {
    const m = prompt.match(RE_HYP)
    if (!m) return null
    const c = hyp(Number(m[1]), Number(m[3]))
    return c === null ? null : String(c)
  }
  if (type === 'pythagoras_shorter_side') {
    const m = prompt.match(RE_SHORT)
    if (!m) return null
    const b = leg(Number(m[1]), Number(m[3]))
    return b === null ? null : String(b)
  }
  if (type === 'pythagoras_check_right_angle') {
    const m = prompt.match(RE_CHECK)
    if (!m) return null
    const [x, y, z] = [Number(m[1]), Number(m[3]), Number(m[4])].sort((p, q) => p - q)
    // Every "no" must still be a real triangle, not just a non-triple.
    if (x + y <= z) return 'not a triangle'
    return x * x + y * y === z * z ? 'yes' : 'no'
  }
  if (type === 'pythagoras_word_problem') {
    for (const w of WORD) {
      const m = prompt.match(w.re)
      if (!m) continue
      wordHits.set(w.name, (wordHits.get(w.name) ?? 0) + 1)
      const nums = (prompt.match(/\d+/g) ?? []).map(Number)
      const ans = w.solve(m)
      if (ans === null) return null
      if (Math.max(ans, ...nums) > w.maxHyp) return `too big for ${w.name}`
      return String(ans)
    }
    return null
  }
  if (type === 'pythagoras_distance_points') {
    const m = prompt.match(RE_DIST)
    if (!m) return null
    const [x1, y1, x2, y2] = [m[1], m[2], m[3], m[4]].map(Number)
    if ([x1, y1, x2, y2].some(v => v < -10 || v > 20)) return 'coordinate out of range'
    const dx = Math.abs(x2 - x1)
    const dy = Math.abs(y2 - y1)
    if (dx === 0 || dy === 0) return 'flat gap'
    const d = hyp(dx, dy)
    return d === null ? null : String(d)
  }
  return null
}

const TYPES = [
  'pythagoras_hypotenuse',
  'pythagoras_shorter_side',
  'pythagoras_check_right_angle',
  'pythagoras_word_problem',
  'pythagoras_distance_points',
]
const typeCounts = new Map<string, number>()
const wordHits = new Map<string, number>()
let checkSorted = 0
let checkUnsorted = 0
let yesTotal = 0
let noTotal = 0
const numericAnswers = new Set<string>()

for (let seed = 1; seed <= 300; seed++) {
  const problems = generatePythagorasProblems(20, seededRand(seed))
  check(problems.length === 20, `seed ${seed}: expected 20 problems, got ${problems.length}`)

  const prompts = new Set<string>()
  let yes = 0
  let no = 0
  problems.forEach((p, i) => {
    typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1)

    check(p.id === `pyt181_${i + 1}`, `seed ${seed}: unexpected id ${p.id}`)
    check(!prompts.has(p.prompt), `seed ${seed}: duplicate prompt "${p.prompt}"`)
    prompts.add(p.prompt)
    check(!DASHES.test(p.prompt), `seed ${seed}: dash character in "${p.prompt}"`)
    check(!BANNED_NAMES.some(n => p.prompt.includes(n)), `seed ${seed}: banned name in "${p.prompt}"`)

    // The generator's answer must match an independent solve of its own prompt.
    const expected = solveFromPrompt(p.type, p.prompt, wordHits)
    check(expected !== null, `seed ${seed}: prompt did not parse or is not whole: "${p.prompt}"`)
    if (expected !== null) {
      check(expected === p.answer, `seed ${seed}: prompt gives "${expected}" but answer says "${p.answer}": "${p.prompt}"`)
    }

    // The real grader must accept the canonical answer on its intended path.
    check(gradeAnswer(p.answer, p.answer) === true, `seed ${seed}: grader rejected "${p.answer}"`)

    if (p.type === 'pythagoras_check_right_angle') {
      // Algebraic path: lowercase + strip whitespace, strict match.
      check(p.answer === 'yes' || p.answer === 'no', `seed ${seed}: check answer "${p.answer}" is not yes/no`)
      const other = p.answer === 'yes' ? 'no' : 'yes'
      check(gradeAnswer(other, p.answer) === false, `seed ${seed}: grader accepted "${other}" for "${p.answer}"`)
      check(gradeAnswer(p.answer.toUpperCase(), p.answer) === true, `seed ${seed}: grader rejected upper-case "${p.answer}"`)
      if (p.answer === 'yes') yes++
      else no++
      const sides = (p.prompt.match(/\d+/g) ?? []).map(Number)
      const ascending = sides[0] <= sides[1] && sides[1] <= sides[2]
      if (ascending) checkSorted++
      else checkUnsorted++
      check(Math.max(...sides) <= 66, `seed ${seed}: side too big in "${p.prompt}"`)
      check(new Set(sides).size === 3, `seed ${seed}: two equal sides in "${p.prompt}"`)
    } else {
      // Signed-integer path: a plain positive whole number, 1 to 65.
      check(/^\d+$/.test(p.answer), `seed ${seed}: answer "${p.answer}" is not a plain positive integer`)
      const n = Number(p.answer)
      check(n >= 1 && n <= 65, `seed ${seed}: answer ${n} out of range 1 to 65`)
      check(gradeAnswer(String(n + 1), p.answer) === false, `seed ${seed}: grader accepted ${n + 1} for ${n}`)
      check(gradeAnswer(String(n - 1), p.answer) === false, `seed ${seed}: grader accepted ${n - 1} for ${n}`)
      numericAnswers.add(p.answer)
      // The prompt must never show the answer as one of its own numbers (either sign).
      const nums = (p.prompt.match(/-?\d+/g) ?? []).map(v => Math.abs(Number(v)))
      check(!nums.includes(n), `seed ${seed}: prompt shows the answer ${n}: "${p.prompt}"`)
      check(Math.max(...nums) <= 65, `seed ${seed}: number over 65 in "${p.prompt}"`)
      check(p.prompt.endsWith('Answer with just the number.') || p.type === 'pythagoras_distance_points',
        `seed ${seed}: unit prompt without the number hint: "${p.prompt}"`)
    }
  })

  // Check slots alternate yes / no: a sheet of 20 has exactly 2 of each.
  check(yes === 2 && no === 2, `seed ${seed}: expected 2 yes and 2 no, got ${yes} yes and ${no} no`)
  yesTotal += yes
  noTotal += no
}

// Every declared type, every word template, and both side orders must appear.
for (const t of TYPES) {
  check((typeCounts.get(t) ?? 0) > 0, `type ${t} was never generated`)
}
for (const w of WORD) {
  check((wordHits.get(w.name) ?? 0) > 0, `word template ${w.name} was never generated`)
}
check(checkSorted > 0 && checkUnsorted > 0, `check sides order: sorted ${checkSorted}, unsorted ${checkUnsorted}`)

// Count 10 still works and stays balanced (1 yes, 1 no).
const ten = generatePythagorasProblems(10, seededRand(7))
check(ten.length === 10, `count 10 returned ${ten.length}`)
check(
  ten.filter(p => p.answer === 'yes').length === 1 && ten.filter(p => p.answer === 'no').length === 1,
  'count 10 is not 1 yes and 1 no',
)

console.log(`\ntype distribution: ${TYPES.map(t => `${t}=${typeCounts.get(t) ?? 0}`).join(', ')}`)
console.log(`word templates: ${WORD.map(w => `${w.name}=${wordHits.get(w.name) ?? 0}`).join(', ')}`)
console.log(`check answers: yes=${yesTotal}, no=${noTotal}; sides shown sorted=${checkSorted}, shuffled=${checkUnsorted}`)

// --- Wiring (fails until the orchestrator wires the shared files) ------------
if (WIRING) {
  const NUMERIC_PLACEHOLDER = 'e.g. 23'
  // The placeholder's number must never be a real answer, so it cannot leak one.
  check(!numericAnswers.has('23'), 'placeholder number 23 is a real generated answer')

  for (const t of TYPES) {
    const type = t as Parameters<typeof inputModeForType>[0]
    const isCheck = t === 'pythagoras_check_right_angle'
    const control = getAnswerControlType(type)
    check(control === (isCheck ? 'yes_no' : 'default'), `type ${t}: unexpected answer control ${control}`)
    const mode = inputModeForType(type)
    check(mode === (isCheck ? 'text' : 'numeric'), `type ${t}: unexpected input mode ${mode}`)
    const ph = placeholderForType(type)
    check(!!ph && ph !== t, `type ${t}: missing placeholder`)
    if (!isCheck) check(ph === NUMERIC_PLACEHOLDER, `type ${t}: expected placeholder "${NUMERIC_PLACEHOLDER}", got "${ph}"`)
    const label = problemTypeLabel(type)
    check(!!label && label !== t, `type ${t}: missing parent-facing label`)
  }

  // The router must serve 18/1.
  const routed = generateProblems(18, 1, 20)
  check(routed.length === 20, `router returned ${routed.length} problems for 18/1`)
  check(
    routed.every(p => TYPES.includes(p.type as string)),
    'router returned problems of an unexpected type for 18/1',
  )
}

console.log(`${checks} checks, ${failures} failures`)
process.exit(failures === 0 ? 0 : 1)
