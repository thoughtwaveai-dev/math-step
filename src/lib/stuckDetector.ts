// Returns true if the student appears stuck on the current level.
// `results` = array of `passed` booleans, most recent first (index 0 = latest session).
// Rule 1: 3 consecutive fails (most recent 3 all failed)
// Rule 2: 4 or more fails in the last 5 sessions
// Requires at least 3 data points to avoid false positives on new students.
export function isStudentStuck(results: boolean[]): boolean {
  if (results.length < 3) return false

  if (!results[0] && !results[1] && !results[2]) return true

  if (results.length >= 5) {
    const fails = results.slice(0, 5).filter(r => !r).length
    if (fails >= 4) return true
  }

  return false
}
