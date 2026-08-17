import { generateFactorizationProblems, generateFactorizationPairProblems } from './factorization'
import { generateSingleDigitAddition, generateDoubleDigitAddition } from './addition'
import { generateSingleDigitSubtraction, generateDoubleDigitSubtraction } from './subtraction'
import { generateBasicMultiplication, generateMultiDigitMultiplication } from './multiplication'
import { generateDivisionFacts, generateLongDivision } from './division'
import { generateFractionProblems, generateFractionMultDivProblems } from './fractions'
import { generateLinearEquations, generateVariablesBothSides } from './linear-equations'
import { generateInequalities, generateInequalitiesLevel141 } from './inequalities'
import { generateDecimalProblems } from './decimals'
import { generatePercentageProblems } from './percentages'
import { generateNegativeProblems } from './negatives'
import { generateOrderOfOperationsProblems } from './order-of-operations'
import { generateSimplifyingProblems } from './simplifying-expressions'
import { generateOneStepEquations } from './one-step-equations'
import { generateSimultaneousEquations } from './simultaneous-equations'
import { generateFunctionsProblems } from './functions'
import { generateGraphingProblems } from './graphing'
import { generateLinearEquationsGraphsProblems } from './linear-equations-graphs'
import { generateSystemsOfEquationsProblems } from './systems-of-equations'
import { generateExponentProblems } from './exponents'
import { generateExpandingBracketsProblems } from './expanding-brackets'
import { generateBracketEquationProblems } from './bracket-equations'

export type { MathProblem, ProblemType } from './factorization'
export type { AdditionProblem, AdditionProblemType } from './addition'
export type { SubtractionProblem, SubtractionProblemType } from './subtraction'
export type { MultiplicationProblem, MultiplicationProblemType } from './multiplication'
export type { DivisionProblem, DivisionProblemType } from './division'
export type { FractionProblem, FractionProblemType } from './fractions'
export type { LinearEquationProblem, LinearEquationType } from './linear-equations'
export type { InequalityProblem, InequalityProblemType } from './inequalities'
export type { DecimalProblem, DecimalProblemType } from './decimals'
export type { PercentageProblem, PercentageProblemType } from './percentages'
export type { NegativeProblem, NegativeProblemType } from './negatives'
export type { OrderOfOperationsProblem, OrderOfOperationsProblemType } from './order-of-operations'
export type { SimplifyingProblem, SimplifyingProblemType } from './simplifying-expressions'
export type { OneStepEquationProblem, OneStepEquationType } from './one-step-equations'
export type { SimultaneousEquationProblem, SimultaneousEquationType } from './simultaneous-equations'
export type { FunctionsProblem, FunctionsProblemType } from './functions'
export type { GraphingProblem, GraphingProblemType } from './graphing'
export type {
  LinearEquationsGraphsProblem,
  LinearEquationsGraphsProblemType,
} from './linear-equations-graphs'
export type {
  SystemsOfEquationsProblem,
  SystemsOfEquationsProblemType,
} from './systems-of-equations'
export type { ExponentProblem, ExponentProblemType } from './exponents'
export type {
  ExpandingBracketsProblem,
  ExpandingBracketsProblemType,
} from './expanding-brackets'
export type {
  BracketEquationProblem,
  BracketEquationProblemType,
} from './bracket-equations'

// Unified problem type covering all generators
export type AnyProblemType =
  | import('./factorization').ProblemType
  | import('./addition').AdditionProblemType
  | import('./subtraction').SubtractionProblemType
  | import('./multiplication').MultiplicationProblemType
  | import('./division').DivisionProblemType
  | import('./fractions').FractionProblemType
  | import('./linear-equations').LinearEquationType
  | import('./inequalities').InequalityProblemType
  | import('./decimals').DecimalProblemType
  | import('./percentages').PercentageProblemType
  | import('./negatives').NegativeProblemType
  | import('./order-of-operations').OrderOfOperationsProblemType
  | import('./simplifying-expressions').SimplifyingProblemType
  | import('./one-step-equations').OneStepEquationType
  | import('./simultaneous-equations').SimultaneousEquationType
  | import('./functions').FunctionsProblemType
  | import('./graphing').GraphingProblemType
  | import('./linear-equations-graphs').LinearEquationsGraphsProblemType
  | import('./systems-of-equations').SystemsOfEquationsProblemType
  | import('./exponents').ExponentProblemType
  | import('./expanding-brackets').ExpandingBracketsProblemType
  | import('./bracket-equations').BracketEquationProblemType

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
  if (levelNumber === 5 && sublevelNumber === 1) {
    return generateFractionProblems(count)
  }
  if (levelNumber === 5 && sublevelNumber === 2) {
    return generateFractionMultDivProblems(count)
  }
  if (levelNumber === 6 && sublevelNumber === 1) {
    return generateDecimalProblems(count)
  }
  if (levelNumber === 6 && sublevelNumber === 2) {
    return generatePercentageProblems(count)
  }
  if (levelNumber === 7 && sublevelNumber === 1) {
    return generateNegativeProblems(count)
  }
  if (levelNumber === 7 && sublevelNumber === 2) {
    return generateOrderOfOperationsProblems(count)
  }
  if (levelNumber === 8 && sublevelNumber === 1) {
    return generateSimplifyingProblems(count)
  }
  if (levelNumber === 8 && sublevelNumber === 2) {
    return generateOneStepEquations(count)
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
  if (levelNumber === 11 && sublevelNumber === 2) {
    return generateSimultaneousEquations(count)
  }
  if (levelNumber === 12 && sublevelNumber === 1) {
    return generateFunctionsProblems(count)
  }
  if (levelNumber === 12 && sublevelNumber === 2) {
    return generateGraphingProblems(count)
  }
  if (levelNumber === 13 && sublevelNumber === 1) {
    return generateLinearEquationsGraphsProblems(count)
  }
  if (levelNumber === 13 && sublevelNumber === 2) {
    return generateSystemsOfEquationsProblems(count)
  }
  if (levelNumber === 14 && sublevelNumber === 1) {
    return generateInequalitiesLevel141(count)
  }
  if (levelNumber === 14 && sublevelNumber === 2) {
    return generateExponentProblems(count)
  }
  if (levelNumber === 15 && sublevelNumber === 1) {
    return generateExpandingBracketsProblems(count)
  }
  if (levelNumber === 15 && sublevelNumber === 2) {
    return generateBracketEquationProblems(count)
  }
  return []
}
