'use client'
import { useState, useEffect } from 'react'
import { COOLDOWN_SECONDS } from '@/lib/contract'

export function useCooldown(lastSignalTimestamp?: number) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!lastSignalTimestamp) { setRemaining(0); return }

    const calc = () => {
      const elapsed = Date.now() / 1000 - lastSignalTimestamp
      const rem = Math.max(0, COOLDOWN_SECONDS - elapsed)
      setRemaining(rem)
    }
    calc()
    const id = setInterval(calc, 500)
    return () => clearInterval(id)
  }, [lastSignalTimestamp])

  const minutes = Math.floor(remaining / 60)
  const seconds = Math.floor(remaining % 60)
  const formatted = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
  const isActive = remaining > 0

  return { remaining, formatted, isActive, minutes, seconds }
}
