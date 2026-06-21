'use client'

import { useEffect, useRef, useState } from 'react'
import WorksheetScratchpad from './WorksheetScratchpad'

// Floating, always-reachable working area for the worksheet page.
// The drawer is animated with transform only — the scratchpad canvas is NEVER
// unmounted and NEVER hidden with display:none/`hidden`, so the drawing is
// preserved across open/close. (See WorksheetScratchpad for the resize safety net.)
export default function FloatingWorkingArea() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const hasOpened = useRef(false)

  // Escape closes the drawer.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Light focus handling: focus the panel on open, return focus to the trigger
  // on close. Guarded so it never steals focus on the initial render.
  useEffect(() => {
    if (open) {
      hasOpened.current = true
      panelRef.current?.focus()
    } else if (hasOpened.current) {
      triggerRef.current?.focus()
    }
  }, [open])

  return (
    <>
      {!open && (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open working area"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#2d6a35] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#1f4d26] transition-colors"
        >
          <span aria-hidden="true">✏️</span>
          Working area
        </button>
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-label="Working area"
        aria-hidden={!open}
        tabIndex={-1}
        className={`fixed inset-x-0 bottom-0 z-50 px-3 pb-3 outline-none transition-transform duration-200 ease-out sm:inset-x-auto sm:left-auto sm:right-6 sm:bottom-6 sm:w-[420px] sm:px-0 sm:pb-0 ${
          open ? 'translate-y-0' : 'translate-y-[120%] pointer-events-none'
        }`}
      >
        <div className="mx-auto w-full max-w-lg rounded-2xl shadow-2xl sm:mx-0 sm:max-w-none">
          <WorksheetScratchpad active={open} onClose={() => setOpen(false)} />
        </div>
      </div>
    </>
  )
}
