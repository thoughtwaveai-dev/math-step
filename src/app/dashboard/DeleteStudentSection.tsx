'use client'

import { useActionState, useState } from 'react'
import { deleteStudent } from '@/app/actions/students'

type Props = {
  studentId: string
  studentName: string
  studentCount: number
}

export default function DeleteStudentSection({ studentId, studentName, studentCount }: Props) {
  const [state, action, pending] = useActionState(deleteStudent, null)
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const matches = typed.trim() === studentName.trim()

  if (studentCount <= 1) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-[#1a2e1c]">Delete student</h3>
        <p className="mt-1 text-xs text-[#4a6b4e]">
          You need at least one student profile. Add another student before deleting this one.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#1a2e1c]">Delete student</h3>
      <p className="mt-1 text-xs text-[#4a6b4e]">
        This permanently removes <strong>{studentName}</strong>&rsquo;s worksheets, progress,
        milestones, practice history, and streak data.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
        >
          Delete student
        </button>
      ) : (
        <form action={action} className="mt-4 space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <input type="hidden" name="student_id" value={studentId} />
          <label className="block">
            <span className="text-xs font-medium text-[#1a2e1c]">
              Type <span className="font-semibold">{studentName}</span> to confirm
            </span>
            <input
              name="confirm_name"
              type="text"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="mt-1 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-[#1a2e1c] focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </label>

          {state && 'error' in state && state.error && (
            <p className="text-xs text-red-700">{state.error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending || !matches}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {pending ? 'Deleting…' : 'Delete student'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setTyped('')
              }}
              className="rounded-lg border border-[#bae0bd] bg-white px-4 py-2 text-xs font-medium text-[#4a6b4e] hover:bg-[#f2faf3] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
