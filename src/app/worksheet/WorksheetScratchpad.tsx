'use client'

import { useRef, useEffect, useCallback } from 'react'

interface Props {
  // When this becomes true (drawer opened) the canvas re-sizes to its box.
  // Safety net so the drawing always survives open/close. The canvas is never
  // unmounted and is never hidden with display:none/`hidden`, so the bitmap is
  // preserved across toggles.
  active?: boolean
  // When provided, the scratchpad is in drawer mode: renders a Close button
  // and the "rough working" helper line.
  onClose?: () => void
}

export default function WorksheetScratchpad({ active, onClose }: Props = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  // Resize canvas to fill its CSS box — called on mount and on window resize
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Save the current drawing as an image before resize
    const imgData = canvas.toDataURL()

    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.round(rect.width)
    canvas.height = Math.round(rect.height)

    // Restore drawing after resize
    const img = new Image()
    img.onload = () => ctx.drawImage(img, 0, 0)
    img.src = imgData
  }, [])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  // Re-size when the drawer opens. Lossless (resizeCanvas saves/restores the
  // drawing); also corrects the size if the device rotated while closed.
  useEffect(() => {
    if (active) resizeCanvas()
  }, [active, resizeCanvas])

  // Convert a pointer event to canvas-local coordinates
  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  function startDrawing(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    // Capture so we get move/up even if pointer leaves canvas
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    drawing.current = true
    lastPoint.current = getPoint(e)

    // Draw a dot on single tap/click
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const p = lastPoint.current
    ctx.beginPath()
    ctx.arc(p.x, p.y, lineWidth(e) / 2, 0, Math.PI * 2)
    ctx.fillStyle = '#1a2e1c'
    ctx.fill()
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!drawing.current || !lastPoint.current) return

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const current = getPoint(e)

    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(current.x, current.y)
    ctx.strokeStyle = '#1a2e1c'
    ctx.lineWidth = lineWidth(e)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    lastPoint.current = current
  }

  function stopDrawing(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    drawing.current = false
    lastPoint.current = null
  }

  function lineWidth(e: React.PointerEvent<HTMLCanvasElement>): number {
    // Use stylus pressure if available, otherwise fixed width
    if (e.pressure && e.pressure > 0 && e.pointerType === 'pen') {
      return Math.max(1, e.pressure * 4)
    }
    return 2
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="rounded-2xl border border-[#bae0bd] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#bae0bd] px-5 py-3">
        <span className="text-sm font-semibold text-[#1a2e1c]">Working area</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearCanvas}
            className="rounded-lg border border-[#bae0bd] px-3.5 py-1.5 text-xs font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
          >
            Clear
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close working area"
              className="rounded-lg border border-[#bae0bd] px-3 py-1.5 text-xs font-medium text-[#2d6a35] hover:bg-[#f2faf3] transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {onClose && (
        <p className="px-5 pt-3 text-xs text-[#4a6b4e]">
          Use this space for rough working. It won&apos;t be submitted.
        </p>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
        // touch-none prevents the browser from hijacking touch for scroll
        className="block w-full touch-none cursor-crosshair"
        style={{ height: '320px' }}
        aria-label="Drawing scratchpad"
      />
    </div>
  )
}
