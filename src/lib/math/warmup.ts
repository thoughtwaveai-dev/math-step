import { generateProblems } from './generators'

// Warm-up is only offered for X.2 levels, using the matching X.1 generator.
// X.1 levels and 1/1 fall back to lesson review only (no cross-topic warm-up).
export function getWarmupSourceLevel(levelNumber: number, sublevelNumber: number): [number, number] | null {
  if (sublevelNumber !== 2) return null
  return [levelNumber, 1]
}

// Returns 5 warm-up problems from the X.1 generator for X.2 levels, or [] if not applicable.
export function generateWarmupProblems(levelNumber: number, sublevelNumber: number, count = 5) {
  const source = getWarmupSourceLevel(levelNumber, sublevelNumber)
  if (!source) return []
  return generateProblems(source[0], source[1], count)
}

export type WarmupProblem = {
  prompt: string
  answer: string
  type: string
}
