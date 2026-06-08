import type { AnyProblemType } from './generators'

// Which structured answer control a problem type should use on the worksheet,
// targeted practice, and self-correction surfaces. Future generators get the
// right control for free by reusing these canonical problem_type strings.
//
// MC graph (`match_equation_to_graph`) and graph *display* stay prompt-driven via
// parseGraphPrompt/CoordinatePlane — they need server-rendered SVGs + choice specs,
// so they are intentionally NOT part of this dispatcher and fall through to 'default'.
export type AnswerControlType =
  | 'equation_slope_intercept'
  | 'yes_no'
  | 'coordinate_pair'
  | 'default'

export function getAnswerControlType(type: AnyProblemType): AnswerControlType {
  if (type === 'equation_from_slope_intercept') return 'equation_slope_intercept'
  if (type === 'point_on_line') return 'yes_no'
  if (type === 'sim_eq' || type === 'read_point_coordinates') return 'coordinate_pair'
  return 'default'
}
