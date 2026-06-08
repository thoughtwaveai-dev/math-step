'use client'

import { useId } from 'react'

interface Props {
  // A radio group with this name submits the canonical 'yes' / 'no' string — the same
  // values the algebraic grading path already expects (case + whitespace insensitive).
  name: string
  onValueChange?: (canonical: string) => void
}

export default function YesNoAnswerInput({ name, onValueChange }: Props) {
  // useId gives a stable id across server + client render (no hydration mismatch).
  const idBase = useId()

  return (
    <fieldset>
      <legend className="sr-only">Is the point on the line?</legend>
      <div className="grid grid-cols-2 gap-3">
        {(['yes', 'no'] as const).map((value) => {
          const inputId = `${idBase}_${value}`
          return (
            <label key={value} htmlFor={inputId} className="cursor-pointer">
              <input
                id={inputId}
                type="radio"
                name={name}
                value={value}
                onChange={() => onValueChange?.(value)}
                className="peer sr-only"
              />
              <div className="flex items-center justify-center rounded-lg border-2 border-[#bae0bd] bg-white px-4 py-3 text-base font-semibold text-[#1a2e1c] transition-colors peer-checked:border-[#2d6a35] peer-checked:bg-[#e1f4e3] peer-focus-visible:ring-2 peer-focus-visible:ring-[#2d6a35]">
                {value === 'yes' ? 'Yes' : 'No'}
              </div>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
