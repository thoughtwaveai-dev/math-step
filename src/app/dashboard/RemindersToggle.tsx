'use client'

import { useActionState } from 'react'
import { setRemindersEnabled } from '@/app/actions/reminders'

type Props = {
  enabled: boolean
}

export default function RemindersToggle({ enabled }: Props) {
  const [state, action, pending] = useActionState(setRemindersEnabled, null)

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#1a2e1c]">Daily reminder email</h3>
      <p className="mt-1 text-xs text-[#4a6b4e]">
        A short email if your child hasn&apos;t practised by 4 pm NZ time. Off by default for existing accounts.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            enabled
              ? 'bg-[#e1f4e3] text-[#2d6a35]'
              : 'border border-[#bae0bd] bg-white text-[#4a6b4e]'
          }`}
        >
          {enabled ? 'Reminders on' : 'Reminders off'}
        </span>
        <form action={action}>
          <input type="hidden" name="enabled" value={enabled ? 'false' : 'true'} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-[#bae0bd] bg-white px-3 py-1.5 text-xs font-semibold text-[#2d6a35] hover:bg-[#f2faf3] disabled:opacity-50 transition-colors"
          >
            {pending ? 'Saving…' : enabled ? 'Turn off' : 'Turn on'}
          </button>
        </form>
      </div>

      {state && 'error' in state && state.error && (
        <p className="mt-2 text-xs text-[#a85630]">{state.error}</p>
      )}
      {state && 'success' in state && state.success && (
        <p className="mt-2 text-xs font-medium text-[#2d6a35]">{state.success}</p>
      )}
    </div>
  )
}
