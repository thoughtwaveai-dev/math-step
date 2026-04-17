'use client'

import { useActionState } from 'react'
import { submitFeedback } from '@/app/actions/feedback'

type Student = { id: string; name: string }

export default function FeedbackForm({ students }: { students: Student[] }) {
  const [state, action, pending] = useActionState(submitFeedback, null)

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-[#1a2e1c] mb-1.5">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          className="w-full rounded-xl border border-[#bae0bd] bg-white px-4 py-3 text-sm text-[#1a2e1c] focus:border-[#2d6a35] focus:outline-none focus:ring-2 focus:ring-[#2d6a35]/20"
        >
          <option value="">Select a category</option>
          <option value="bug">Bug — something isn&apos;t working</option>
          <option value="idea">Idea — feature request or suggestion</option>
          <option value="confusion">Confusion — something was unclear</option>
          <option value="praise">Praise — something you love</option>
        </select>
      </div>

      {students.length > 0 && (
        <div>
          <label htmlFor="student_id" className="block text-sm font-medium text-[#1a2e1c] mb-1.5">
            Related to a student? <span className="text-[#4a6b4e] font-normal">(optional)</span>
          </label>
          <select
            id="student_id"
            name="student_id"
            className="w-full rounded-xl border border-[#bae0bd] bg-white px-4 py-3 text-sm text-[#1a2e1c] focus:border-[#2d6a35] focus:outline-none focus:ring-2 focus:ring-[#2d6a35]/20"
          >
            <option value="">Not specific to a student</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-[#1a2e1c] mb-1.5">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          maxLength={2000}
          placeholder="Tell us what's on your mind..."
          className="w-full rounded-xl border border-[#bae0bd] bg-white px-4 py-3 text-sm text-[#1a2e1c] placeholder-[#8fad93] focus:border-[#2d6a35] focus:outline-none focus:ring-2 focus:ring-[#2d6a35]/20 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[#2d6a35] px-6 py-3.5 text-base font-semibold text-white hover:bg-[#1f4d26] disabled:opacity-60 transition-colors"
      >
        {pending ? 'Sending…' : 'Send feedback'}
      </button>
    </form>
  )
}
