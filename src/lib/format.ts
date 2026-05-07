export function formatSpeed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}

const NZ_TIME_ZONE = 'Pacific/Auckland'

export function formatNzDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: NZ_TIME_ZONE,
  })
}

export function formatNzDateTime(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: NZ_TIME_ZONE,
  })
  const time = d.toLocaleTimeString('en-NZ', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: NZ_TIME_ZONE,
  })
  return `${date}, ${time} NZT`
}
