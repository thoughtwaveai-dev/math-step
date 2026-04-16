import { generateFactorizationProblems, generateFactorizationPairProblems } from './factorization'
import { generateSingleDigitAddition, generateDoubleDigitAddition } from './addition'
import { generateSingleDigitSubtraction, generateDoubleDigitSubtraction } from './subtraction'
import { generateBasicMultiplication, generateMultiDigitMultiplication } from './multiplication'

export type { MathProblem, ProblemType } from './factorization'
export type { AdditionProblem, AdditionProblemType } from './addition'
export type { SubtractionProblem, SubtractionProblemType } from './subtraction'
export type { MultiplicationProblem, MultiplicationProblemType } from './multiplication'

// Unified problem type covering all generators
export type AnyProblemType =
  | import('./factorization').ProblemType
  | import('./addition').AdditionProblemType
  | import('./subtraction').SubtractionProblemType
  | import('./multiplication').MultiplicationProblemType

export function generateProblems(levelNumber: number, sublevelNumber: number, count: number) {
  if (levelNumber === 1 && sublevelNumber === 1) {
    return generateSingleDigitAddition(count)
  }
  if (levelNumber === 1 && sublevelNumber === 2) {
    return generateDoubleDigitAddition(count)
  }
  if (levelNumber === 2 && sublevelNumber === 1) {
    return generateSingleDigitSubtraction(count)
  }
  if (levelNumber === 2 && sublevelNumber === 2) {
    return generateDoubleDigitSubtraction(count)
  }
  if (levelNumber === 3 && sublevelNumber === 1) {
    return generateBasicMultiplication(count)
  }
  if (levelNumber === 3 && sublevelNumber === 2) {
    return generateMultiDigitMultiplication(count)
  }
  if (levelNumber === 9 && sublevelNumber === 1) {
    return generateFactorizationProblems(count)
  }
  if (levelNumber === 9 && sublevelNumber === 2) {
    return generateFactorizationPairProblems(count)
  }
  return []
}
