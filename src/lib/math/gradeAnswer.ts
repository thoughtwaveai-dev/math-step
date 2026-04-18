function normalizeInequality(s: string): string {
  return s.trim()
    .toLowerCase()
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/\s+/g, '')
}

// Parses "3/4" → {num:3,den:4} or "2" → {num:2,den:1}. Returns null on invalid input.
function parseFraction(s: string): { num: number; den: number } | null {
  const trimmed = s.trim()
  if (/^\d+\/\d+$/.test(trimmed)) {
    const [n, d] = trimmed.split('/').map(Number)
    return d > 0 ? { num: n, den: d } : null
  }
  const n = parseInt(trimmed, 10)
  return isNaN(n) ? null : { num: n, den: 1 }
}

export function gradeAnswer(studentAnswer: string, correctAnswer: string): boolean {
  if (!studentAnswer.trim()) return false

  if (/[<>]/.test(correctAnswer)) {
    return normalizeInequality(studentAnswer) === normalizeInequality(correctAnswer)
  }

  // Fraction answers (e.g. "3/4", "5/6", "4/3")
  if (/^\d+\/\d+$/.test(correctAnswer)) {
    const correct = parseFraction(correctAnswer)
    const student = parseFraction(studentAnswer.trim())
    if (!correct || !student) return false
    // Cross-multiply equality: a/b == c/d iff a*d == b*c
    return student.num * correct.den === correct.num * student.den
  }

  const correctNums = (correctAnswer.match(/\d+/g) ?? []).map(Number)

  if (correctNums.length === 1) {
    const studentNum = parseInt(studentAnswer.trim(), 10)
    return !isNaN(studentNum) && studentNum === correctNums[0]
  }

  const normalize = (s: string) =>
    (s.match(/\d+/g) ?? []).map(Number).sort((a, b) => a - b).join(' ')
  return normalize(studentAnswer) === normalize(correctAnswer)
}
