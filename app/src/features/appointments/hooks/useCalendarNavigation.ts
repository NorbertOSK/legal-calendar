import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getMonthRange } from '@/shared/utils/dates'
import { useAuthStore } from '@/stores/authStore'

export function useCalendarNavigation() {
  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const timezone = useAuthStore((s) => s.user?.timezone) ?? 'America/Argentina/Buenos_Aires'

  const { from, to } = useMemo(
    () => getMonthRange(currentYear, currentMonth, timezone),
    [currentYear, currentMonth, timezone],
  )

  const label = useMemo(() => {
    const date = new Date(currentYear, currentMonth, 1)
    const raw = format(date, 'MMMM yyyy', { locale: es })
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [currentYear, currentMonth])

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
  }

  return {
    currentYear,
    currentMonth,
    from,
    to,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    label,
  }
}
