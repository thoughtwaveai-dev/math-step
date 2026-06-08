'use client'

import type { AnyProblemType } from '@/lib/math/generators'
import { getAnswerControlType } from '@/lib/math/answerControl'
import { inputModeForType, placeholderForType } from '@/lib/math/inputMode'
import EquationSlopeInterceptInput from './EquationSlopeInterceptInput'
import CoordinatePairInput from './CoordinatePairInput'
import YesNoAnswerInput from './YesNoAnswerInput'

interface Props {
  // Form field name carried by the (possibly hidden) input, e.g. "answer_<id>" or
  // "correction_answer". Structured controls emit one hidden input with this name.
  name: string
  type: AnyProblemType
  // Controlled value for client-graded surfaces (PracticeForm). When omitted the
  // default text input is uncontrolled and the parent reads it from the form.
  value?: string
  onValueChange?: (canonical: string) => void
  // Override styling for the default text input only.
  className?: string
}

const DEFAULT_TEXT_CLASS =
  'w-full rounded-lg border border-[#bae0bd] px-3.5 py-3 text-base text-[#1a2e1c] placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:outline-none focus:ring-2 focus:ring-[#bae0bd]'

// Dispatcher: picks the right answer control by problem type. Graph display and
// MC choices are handled by the parent (prompt-driven), not here.
export default function AnswerInput({ name, type, value, onValueChange, className }: Props) {
  const control = getAnswerControlType(type)

  if (control === 'equation_slope_intercept') {
    return <EquationSlopeInterceptInput name={name} onValueChange={onValueChange} />
  }
  if (control === 'coordinate_pair') {
    return <CoordinatePairInput name={name} onValueChange={onValueChange} />
  }
  if (control === 'yes_no') {
    return <YesNoAnswerInput name={name} onValueChange={onValueChange} />
  }

  // Default: plain text input. Controlled when onValueChange is supplied.
  const inputClass = className ?? DEFAULT_TEXT_CLASS
  if (onValueChange) {
    return (
      <input
        type="text"
        name={name}
        value={value ?? ''}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholderForType(type)}
        autoComplete="off"
        inputMode={inputModeForType(type)}
        className={inputClass}
      />
    )
  }
  return (
    <input
      type="text"
      name={name}
      placeholder={placeholderForType(type)}
      autoComplete="off"
      inputMode={inputModeForType(type)}
      className={inputClass}
    />
  )
}
