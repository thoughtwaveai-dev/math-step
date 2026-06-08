'use client'

export type Sign = '+' | '-'

// Shared styling + sign-toggle button used by the equation and coordinate controls.
// Digit-only numeric magnitude field paired with a +/− toggle, so the student never
// has to type a minus sign (avoids the mobile stylus "x → ." bug) and the number pad
// directly answers the painful-typing complaint.
export const magInputClass =
  'w-14 rounded-lg border border-[#bae0bd] px-2 py-2.5 text-center text-base text-[#1a2e1c] placeholder-[#a0b8a3] focus:border-[#2d6a35] focus:outline-none focus:ring-2 focus:ring-[#bae0bd]'

export function SignToggle({
  value,
  onChange,
  label,
}: {
  value: Sign
  onChange: (s: Sign) => void
  label: string
}) {
  return (
    <span className="inline-flex overflow-hidden rounded-lg border border-[#bae0bd]" role="group" aria-label={label}>
      {(['+', '-'] as Sign[]).map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={value === s}
          onClick={() => onChange(s)}
          className={`w-9 py-2.5 text-base font-bold transition-colors ${
            value === s ? 'bg-[#2d6a35] text-white' : 'bg-white text-[#2d6a35] hover:bg-[#f2faf3]'
          }`}
        >
          {s === '-' ? '−' : '+'}
        </button>
      ))}
    </span>
  )
}

// Digits only — strip anything else so the numeric pad can never inject a stray char.
export const onlyDigits = (v: string) => v.replace(/[^0-9]/g, '')
