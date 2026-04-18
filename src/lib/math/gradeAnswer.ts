function normalizeInequality(s: string): string {
  return s.trim()
    .toLowerCase()
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/\s+/g, '')
}

export function gradeAnswer(studentAnswer: string, correctAnswer: string): boolean {
  if (!studentAnswer.trim()) return false

  if (/[<>]/.test(correctAnswer)) {
    return normalizeInequality(studentAnswer) === normalizeInequality(correctAnswer)
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
