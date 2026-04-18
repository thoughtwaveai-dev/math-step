import { generateFactorizationProblems, generateFactorizationPairProblems } from './factorization'
import { generateSingleDigitAddition, generateDoubleDigitAddition } from './addition'
import { generateSingleDigitSubtraction, generateDoubleDigitSubtraction } from './subtraction'
import { generateBasicMultiplication, generateMultiDigitMultiplication } from './multiplication'
import { generateDivisionFacts, generateLongDivision } from './division'
import { generateLinearEquations, generateVariablesBothSides } from './linear-equations'
import { generateInequalities } from './inequalities'

export type { MathProblem, ProblemType } from './factorization'
export type { AdditionProblem, AdditionProblemType } from './addition'
export type { SubtractionProblem, SubtractionProblemType } from './subtraction'
export type { MultiplicationProblem, MultiplicationProblemType } from './multiplication'
export type { DivisionProblem, DivisionProblemType } from './division'
export type { LinearEquationProblem, LinearEquationType } from './linear-equations'
export type { InequalityProblem, InequalityProblemType } from './inequalities'

// Unified problem type covering all generators
export type AnyProblemType =
  | import('./factorization').ProblemType
  | import('./addition').AdditionProblemType
  | import('./subtraction').SubtractionProblemType
  | import('./multiplication').MultiplicationProblemType
  | import('./division').DivisionProblemType
  | import('./linear-equations').LinearEquationType
  | import('./inequalities').InequalityProblemType

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
  if (levelNumber === 4 && sublevelNumber === 1) {
    return generateDivisionFacts(count)
  }
  if (levelNumber === 4 && sublevelNumber === 2) {
    return generateLongDivision(count)
  }
  if (levelNumber === 9 && sublevelNumber === 1) {
    return generateFactorizationProblems(count)
  }
  if (levelNumber === 9 && sublevelNumber === 2) {
    return generateFactorizationPairProblems(count)
  }
  if (levelNumber === 10 && sublevelNumber === 1) {
    return generateLinearEquations(count)
  }
  if (levelNumber === 10 && sublevelNumber === 2) {
    return generateVariablesBothSides(count)
  }
  if (levelNumber === 11 && sublevelNumber === 1) {
    return generateInequalities(count)
  }
  return []
}
