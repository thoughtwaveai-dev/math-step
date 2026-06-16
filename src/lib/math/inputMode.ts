import type { HTMLAttributes } from 'react'
import type { AnyProblemType } from './generators'

export type InputMode = HTMLAttributes<HTMLInputElement>['inputMode']

export function inputModeForType(type: AnyProblemType): InputMode {
  if (type === 'inequality') return 'text'
  if (type === 'fraction_addition' || type === 'fraction_subtraction') return 'text'
  if (type === 'fraction_multiplication' || type === 'fraction_division') return 'text'
  if (type === 'decimal_addition' || type === 'decimal_subtraction' || type === 'decimal_multiplication') return 'decimal'
  if (type === 'percent_to_decimal') return 'decimal'
  if (type === 'neg_addition' || type === 'neg_subtraction' || type === 'neg_multiplication' || type === 'neg_division') return 'text'
  if (type === 'order_add_mul' || type === 'order_sub_mul' || type === 'order_div_add' || type === 'order_paren') return 'numeric'
  if (type === 'eq_add' || type === 'eq_sub' || type === 'eq_mul' || type === 'eq_div') return 'numeric'
  if (type === 'prime_factorization' || type === 'list_factors' || type === 'factor_pairs' || type === 'common_factors') return 'text'
  if (type === 'expr_combine_like' || type === 'expr_multi_terms' || type === 'expr_with_constant') return 'text'
  if (type === 'sim_eq') return 'text'
  if (type === 'function_evaluate_negative') return 'text'
  if (
    type === 'function_evaluate_linear' ||
    type === 'function_evaluate_quadratic' ||
    type === 'function_compose_simple' ||
    type === 'function_inverse_solve'
  ) return 'numeric'
  if (type === 'read_point_coordinates' || type === 'match_equation_to_graph') return 'text'
  if (
    type === 'identify_slope_from_graph' ||
    type === 'identify_y_intercept_from_graph' ||
    type === 'read_y_for_x'
  ) return 'numeric'
  // Level 13.1: every answer here can contain '-', 'y', 'x', '=', or 'yes'/'no'.
  // Keep all five on 'text' to avoid the mobile stylus "x → ." bug.
  if (
    type === 'equation_from_slope_intercept' ||
    type === 'slope_from_two_points' ||
    type === 'y_intercept_from_slope_and_point' ||
    type === 'point_on_line' ||
    type === 'evaluate_linear_equation'
  ) return 'text'
  // Level 13.2: coordinate-pair and yes/no types ride structured controls (the
  // text input is a fallback only) → 'text'. find-missing answers are
  // non-negative integers → 'numeric' for a clean number pad.
  if (
    type === 'system_substitution_simple' ||
    type === 'system_elimination_simple' ||
    type === 'system_word_problem_simple' ||
    type === 'system_check_solution'
  ) return 'text'
  if (type === 'system_find_missing_value') return 'numeric'
  return 'numeric'
}

// Format-accurate example placeholders. Every example matches what `gradeAnswer`
// actually accepts — no `%` on percent answers (they grade as bare integers), and
// list/factor examples use the same separators the generators emit (the grader
// strips separators and compares the digit set, so these can't mislead).
// Types rendered by a structured control (sim_eq / read_point_coordinates →
// coordinate control) or as multiple-choice (match_equation_to_graph) keep the
// generic fallback — their text input is never shown.
export function placeholderForType(type: AnyProblemType): string {
  switch (type) {
    // Signed integers — leading '-' signals negatives are allowed
    case 'neg_addition':
    case 'neg_subtraction':
    case 'neg_multiplication':
    case 'neg_division':
    case 'function_evaluate_negative':
    case 'slope_from_two_points':
    case 'y_intercept_from_slope_and_point':
    case 'evaluate_linear_equation':
    case 'identify_slope_from_graph':
    case 'identify_y_intercept_from_graph':
    case 'read_y_for_x':
      return 'e.g. -5'

    // Decimals
    case 'decimal_addition':
    case 'decimal_subtraction':
    case 'decimal_multiplication':
      return 'e.g. 3.5'
    case 'percent_to_decimal':
      return 'e.g. 0.25'

    // Fractions
    case 'fraction_addition':
    case 'fraction_subtraction':
    case 'fraction_multiplication':
    case 'fraction_division':
      return 'e.g. 3/4'

    // Algebraic expressions
    case 'expr_combine_like':
    case 'expr_multi_terms':
      return 'e.g. 5x'
    case 'expr_with_constant':
      return 'e.g. 3x + 2'

    // Inequalities
    case 'inequality':
      return 'e.g. x > 4'

    // Lists / factor pairs — grader compares digit set, separators ignored
    case 'list_factors':
    case 'common_factors':
      return 'e.g. 1, 2, 3, 6'
    case 'prime_factorization':
      return 'e.g. 2, 3, 5'
    case 'factor_pairs':
      return 'e.g. 1×12, 2×6, 3×4'

    // Structured-control families (kept for fallback safety)
    case 'equation_from_slope_intercept':
      return 'e.g. y = 2x + 3'
    case 'point_on_line':
      return 'yes or no'

    // Plain non-negative integers (addition, subtraction, multiplication,
    // division, order_*, eq_*, linear_equation, gcf, lcm, percent_of_number,
    // decimal_to_percent, fraction_to_percent, function_* numeric) — no '%'
    case 'addition':
    case 'subtraction':
    case 'multiplication':
    case 'division':
    case 'order_add_mul':
    case 'order_sub_mul':
    case 'order_div_add':
    case 'order_paren':
    case 'eq_add':
    case 'eq_sub':
    case 'eq_mul':
    case 'eq_div':
    case 'linear_equation':
    case 'gcf':
    case 'lcm':
    case 'percent_of_number':
    case 'decimal_to_percent':
    case 'fraction_to_percent':
    case 'function_evaluate_linear':
    case 'function_evaluate_quadratic':
    case 'function_compose_simple':
    case 'function_inverse_solve':
      return 'e.g. 12'

    // Level 13.2 find-missing — non-negative integer answer
    case 'system_find_missing_value':
      return 'e.g. 6'

    // sim_eq, read_point_coordinates, system_* coordinate/yes-no types (structured
    // controls), match_equation_to_graph (MC) — text input never shown
    default:
      return 'Your answer'
  }
}

export function problemTypeLabel(type: AnyProblemType): string {
  switch (type) {
    case 'addition': return 'Addition'
    case 'subtraction': return 'Subtraction'
    case 'multiplication': return 'Multiplication'
    case 'division': return 'Division'
    case 'prime_factorization': return 'Prime Factorization'
    case 'list_factors': return 'List Factors'
    case 'gcf': return 'Greatest Common Factor'
    case 'lcm': return 'Least Common Multiple'
    case 'factor_pairs': return 'Factor Pairs'
    case 'common_factors': return 'Common Factors'
    case 'fraction_addition': return 'Fraction Addition'
    case 'fraction_subtraction': return 'Fraction Subtraction'
    case 'fraction_multiplication': return 'Fraction Multiplication'
    case 'fraction_division': return 'Fraction Division'
    case 'decimal_addition': return 'Decimal Addition'
    case 'decimal_subtraction': return 'Decimal Subtraction'
    case 'decimal_multiplication': return 'Decimal Multiplication'
    case 'percent_of_number': return 'Percentage'
    case 'percent_to_decimal': return 'Percentage'
    case 'decimal_to_percent': return 'Percentage'
    case 'fraction_to_percent': return 'Percentage'
    case 'neg_addition': return 'Negative Numbers'
    case 'neg_subtraction': return 'Negative Numbers'
    case 'neg_multiplication': return 'Negative Numbers'
    case 'neg_division': return 'Negative Numbers'
    case 'order_add_mul': return 'Order of Operations'
    case 'order_sub_mul': return 'Order of Operations'
    case 'order_div_add': return 'Order of Operations'
    case 'order_paren': return 'Order of Operations'
    case 'expr_combine_like': return 'Simplifying Expressions'
    case 'expr_multi_terms': return 'Simplifying Expressions'
    case 'expr_with_constant': return 'Simplifying Expressions'
    case 'eq_add': return 'One-step Equation'
    case 'eq_sub': return 'One-step Equation'
    case 'eq_mul': return 'One-step Equation'
    case 'eq_div': return 'One-step Equation'
    case 'linear_equation': return 'Linear Equation'
    case 'inequality': return 'Inequality'
    case 'sim_eq': return 'Simultaneous Equations'
    case 'function_evaluate_linear': return 'Function evaluation'
    case 'function_evaluate_quadratic': return 'Quadratic function evaluation'
    case 'function_evaluate_negative': return 'Functions with negatives'
    case 'function_compose_simple': return 'Function composition'
    case 'function_inverse_solve': return 'Solve for function input'
    case 'read_point_coordinates': return 'Reading coordinates'
    case 'identify_slope_from_graph': return 'Slope from graph'
    case 'identify_y_intercept_from_graph': return 'Y-intercept from graph'
    case 'read_y_for_x': return 'Reading values from a graph'
    case 'match_equation_to_graph': return 'Matching equations to graphs'
    case 'equation_from_slope_intercept': return 'Writing line equations'
    case 'slope_from_two_points': return 'Slope from two points'
    case 'y_intercept_from_slope_and_point': return 'Finding y-intercepts'
    case 'point_on_line': return 'Checking points on lines'
    case 'evaluate_linear_equation': return 'Using linear equations'
    case 'system_substitution_simple': return 'Solving by substitution'
    case 'system_elimination_simple': return 'Solving by elimination'
    case 'system_find_missing_value': return 'Finding missing values'
    case 'system_check_solution': return 'Checking solutions'
    case 'system_word_problem_simple': return 'System word problems'
  }
}
