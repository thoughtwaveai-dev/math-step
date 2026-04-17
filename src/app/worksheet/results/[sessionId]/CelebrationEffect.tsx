'use client'

import { useEffect, useState } from 'react'

const COLORS = ['#2d6a35', '#bae0bd', '#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#f97316']

type Piece = {
  id: number
  left: number
  delay: number
  color: string
  size: number
  duration: number
  isCircle: boolean
}

export default function CelebrationEffect() {
  const [pieces, setPieces] = useState<Piece[] | null>(null)

  useEffect(() => {
    setPieces(
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.8,
        color: COLORS[i % COLORS.length],
        size: 5 + Math.random() * 9,
        duration: 2.2 + Math.random() * 1.6,
        isCircle: i % 3 === 0,
      }))
    )
    const t = setTimeout(() => setPieces(null), 5500)
    return () => clearTimeout(t)
  }, [])

  if (!pieces) return null

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 9999 }}
      >
        {pieces.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              top: '-12px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: p.isCircle ? '50%' : '2px',
              animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
            }}
          />
        ))}
      </div>
    </>
  )
}
