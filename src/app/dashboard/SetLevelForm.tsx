'use client'

import { useActionState } from 'react'
import { updateStudentPlacement } from '@/app/actions/students'

type Level = {
  id?: number
  level_number: number
  sublevel_number: number
  topic: string
  description: string
}

type Props = {
  studentId: string
  currentLevel: number
  currentSublevel: number
  levels: Level[]
}

const initialState = null

export default function SetLevelForm({ studentId, currentLevel, currentSublevel, levels }: Props) {
  const [state, formAction, isPending] = useActionState(updateStudentPlacement, initialState)

  const currentValue = `${currentLevel}:${currentSublevel}`

  return (
    <div className="rounded-xl border border-[#bae0bd] bg-white p-5">
      <h2 className="text-base font-semibold text-[#1a2e1c] mb-1">Set Level</h2>
      <p className="text-xs text-[#4a6b4e] mb-4">
        Currently on{' '}
        <span className="font-semibold text-[#1a2e1c]">
          Level {currentLevel}.{currentSublevel}
        </span>
        . Change the placement below.
      </p>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="student_id" value={studentId} />

        <select
          name="placement"
          defaultValue={currentValue}
          className="w-full rounded-lg border border-[#bae0bd] bg-[#f7faf7] px-3 py-2.5 text-sm text-[#1a2e1c] focus:border-[#2d6a35] focus:outline-none focus:ring-1 focus:ring-[#2d6a35]"
        >
          {levels.map((l) => (
            <option key={`${l.level_number}:${l.sublevel_number}`} value={`${l.level_number}:${l.sublevel_number}`}>
              Level {l.level_number}.{l.sublevel_number} — {l.topic}: {l.description}
            </option>
          ))}
        </select>

        {state?.error && (
          <p className="text-xs font-medium text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-[#2d6a35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1f4d26] transition-colors disabled:opacity-60"
        >
          {isPending ? 'Updating…' : 'Update Placement'}
        </button>
      </form>
    </div>
  )
}
