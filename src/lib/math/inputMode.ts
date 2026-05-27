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
  return 'numeric'
}

export function placeholderForType(type: AnyProblemType): string {
  if (type === 'equation_from_slope_intercept') return 'e.g. y = 2x + 3'
  if (type === 'point_on_line') return 'yes or no'
  return 'Your answer'
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
  }
}
