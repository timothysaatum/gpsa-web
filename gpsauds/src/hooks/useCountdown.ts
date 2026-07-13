import { useState, useEffect } from 'react'

interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

export function useCountdown(targetDate: string): CountdownResult {
  const calculate = (): CountdownResult => {
    const diff = new Date(targetDate).getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
    return {
      days:    Math.floor(diff / 86_400_000),
      hours:   Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1_000),
      isExpired: false,
    }
  }

  const [state, setState] = useState<CountdownResult>(calculate)

  useEffect(() => {
    const id = setInterval(() => setState(calculate()), 1_000)
    return () => clearInterval(id)
  }, [targetDate])

  return state
}
