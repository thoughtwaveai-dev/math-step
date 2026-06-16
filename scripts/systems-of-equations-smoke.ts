// Smoke test for Level 13.2 Systems of Equations generator.
// Run: npx tsx scripts/systems-of-equations-smoke.ts
import { generateSystemsOfEquationsProblems } from '../src/lib/math/generators/systems-of-equations'
import { gradeAnswer } from '../src/lib/math/gradeAnswer'
import { seededRand } from '../src/lib/math/generators/rand'

const TYPES = [
  'system_substitution_simple',
  'system_elimination_simple',
  'system_find_missing_value',
  'system_check_solution',
  'system_word_problem_simple',
] as const

let failures = 0
function check(cond: boolean, msg: string) {
  if (!cond) {
    failures++
    console.error('FAIL:', msg)
  }
}

// Parse "x = a, y = b" → [a, b].
function parsePair(s: string): [number, number] {
  const x = Number(s.match(/x\s*=\s*(-?\d+)/)![1])
  const y = Number(s.match(/y\s*=\s*(-?\d+)/)![1])
  return [x, y]
}

// Recompute the correct answer from the prompt to verify the generator's math.
function verifyMath(type: string, prompt: string, answer: string) {
  if (type === 'system_substitution_simple' || type === 'system_elimination_simple') {
    const [x, y] = parsePair(answer)
    const eqs = prompt.split('\n').filter((l) => l.includes('='))
    // Validate the "x + y = S" equation appears and holds.
    const sumLine = eqs.find((l) => /x \+ y =/.test(l))
    check(!!sumLine, `${type}: missing x + y line: ${prompt}`)
    if (sumLine) {
      const S = Number(sumLine.match(/=\s*(-?\d+)/)![1])
      check(x + y === S, `${type}: x+y mismatch ${x}+${y}≠${S}`)
    }
    check(Number.isInteger(x) && Number.isInteger(y), `${type}: non-integer solution`)
  } else if (type === 'system_find_missing_value') {
    check(/^\d+$/.test(answer), `find_missing: answer not a non-negative integer: "${answer}"`)
    const x = Number(prompt.match(/x = (-?\d+):/)![1])
    const y = Number(answer)
    const S = Number(prompt.match(/x \+ y = (-?\d+)/)![1])
    check(x + y === S, `find_missing: x+y≠S (${x}+${y}≠${S})`)
  } else if (type === 'system_check_solution') {
    check(answer === 'yes' || answer === 'no', `check_solution: answer not yes/no: "${answer}"`)
    const px = Number(prompt.match(/x = (-?\d+),/)![1])
    const py = Number(prompt.match(/y = (-?\d+)/)![1])
    const S = Number(prompt.match(/x \+ y = (-?\d+)/)![1])
    const R = Number(prompt.match(/2x - y = (-?\d+)/)![1])
    const solves = px + py === S && 2 * px - py === R
    check(solves === (answer === 'yes'), `check_solution: answer "${answer}" but solves=${solves}`)
  } else if (type === 'system_word_problem_simple') {
    const [x, y] = parsePair(answer)
    check(x > 0 && y > 0 && y > x, `word: expected 0<x<y, got x=${x},y=${y}`)
    const S = Number(prompt.match(/(?:add to|sum of two numbers is) (\d+)/)![1])
    const D = Number(prompt.match(/(?:is|difference is) (\d+) (?:more|)/)?.[1] ?? prompt.match(/difference is (\d+)/)![1])
    check(x + y === S, `word: x+y≠S (${x}+${y}≠${S})`)
    check(y - x === D, `word: y-x≠D (${y}-${x}≠${D})`)
  }
}

for (const count of [16, 20, 40]) {
  for (let seed = 1; seed <= 5; seed++) {
    const problems = generateSystemsOfEquationsProblems(count, seededRand(seed * 7919))
    check(problems.length === count, `count=${count} seed=${seed}: got ${problems.length} problems`)

    // No duplicate prompts within a session.
    const prompts = new Set(problems.map((p) => p.prompt))
    check(prompts.size === problems.length, `count=${count} seed=${seed}: duplicate prompts`)

    // Distribution by type (count=20 → 4 each; check_solution split 2 yes / 2 no).
    if (count === 20) {
      const byType: Record<string, number> = {}
      for (const t of TYPES) byType[t] = 0
      for (const p of problems) byType[p.type]++
      for (const t of TYPES) check(byType[t] === 4, `count=20 seed=${seed}: ${t}=${byType[t]} (want 4)`)
      const yes = problems.filter((p) => p.type === 'system_check_solution' && p.answer === 'yes').length
      const no = problems.filter((p) => p.type === 'system_check_solution' && p.answer === 'no').length
      check(yes === 2 && no === 2, `count=20 seed=${seed}: check_solution yes=${yes} no=${no} (want 2/2)`)
    }

    for (const p of problems) {
      verifyMath(p.type, p.prompt, p.answer)
      // Correct answer grades true.
      check(gradeAnswer(p.answer, p.answer) === true, `grade-true failed: ${p.type} "${p.answer}"`)
      // Obvious wrong answers grade false.
      if (p.type === 'system_check_solution') {
        const wrong = p.answer === 'yes' ? 'no' : 'yes'
        check(gradeAnswer(wrong, p.answer) === false, `grade-false (yes/no) failed: ${p.type}`)
      } else if (p.type === 'system_find_missing_value') {
        const wrong = String(Number(p.answer) + 1)
        check(gradeAnswer(wrong, p.answer) === false, `grade-false (int) failed: ${p.type}`)
      } else {
        const [x, y] = parsePair(p.answer)
        const wrong = `x = ${x + 1}, y = ${y + 1}`
        check(gradeAnswer(wrong, p.answer) === false, `grade-false (pair) failed: ${p.type}`)
        // Spacing/case variant of the correct answer still grades true.
        check(gradeAnswer(`x=${x},y=${y}`, p.answer) === true, `grade variant failed: ${p.type}`)
      }
    }
  }
}

if (failures === 0) {
  console.log('All systems-of-equations smoke checks passed (counts 16/20/40 × 5 seeds).')
} else {
  console.error(`\n${failures} check(s) FAILED.`)
  process.exit(1)
}
