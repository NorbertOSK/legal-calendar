import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { useAppointments } from '../hooks/useAppointments'
import { useCalendarNavigation } from '../hooks/useCalendarNavigation'
import { useAppointmentFilters } from '../hooks/useAppointmentFilters'
import { useAppointmentDrag } from '../hooks/useAppointmentDrag'
import { CalendarHeader } from '../components/CalendarHeader'
import { AppointmentFilters } from '../components/AppointmentFilters'
import { CalendarView } from '../components/CalendarView'
import { ListView } from '../components/ListView'
import { Spinner } from '@/shared/components/Spinner'

export default function DashboardView() {
  const navigate = useNavigate()
  const timezone = useAuthStore((s) => s.user?.timezone) ?? 'America/Argentina/Buenos_Aires'
  const calendarViewMode = useUiStore((s) => s.calendarViewMode)
  const setCalendarViewMode = useUiStore((s) => s.setCalendarViewMode)

  const { currentYear, currentMonth, from, to, goToNextMonth, goToPrevMonth, goToToday, label } =
    useCalendarNavigation()

  const allAppointments = useAppointments({ from, to })

  const {
    statusFilter,
    clientEmailFilter,
    setStatusFilter,
    setClientEmailFilter,
    resetFilters,
    uniqueClientEmails,
  } = useAppointmentFilters(allAppointments.data?.data ?? [])

  const appointments = allAppointments.data?.data ?? []
  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter && apt.status !== statusFilter) return false
    if (clientEmailFilter && apt.clientEmail !== clientEmailFilter) return false
    return true
  })

  const { sensors, handleDragStart, handleDragEnd, draggedAppointmentId, draggedAppointment } =
    useAppointmentDrag(filteredAppointments)

  useEffect(() => {
    const isDesktop = window.innerWidth >= 768
    setCalendarViewMode(isDesktop ? 'calendar' : 'list')
  }, [setCalendarViewMode])

  const handleDayClick = (date: string) => {
    navigate('/appointments/new', { state: { selectedDate: date } })
  }

  const handleAppointmentClick = (id: string) => {
    navigate(`/appointments/${id}`)
  }

  if (allAppointments.isLoading) {
    return <Spinner size="lg" />
  }

  return (
    <div>
      <CalendarHeader
        label={label}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
        onToday={goToToday}
        viewMode={calendarViewMode}
        onViewModeChange={setCalendarViewMode}
      />

      {appointments.length > 0 && (
        <AppointmentFilters
          statusFilter={statusFilter}
          clientEmailFilter={clientEmailFilter}
          uniqueClientEmails={uniqueClientEmails}
          onStatusChange={setStatusFilter}
          onClientEmailChange={setClientEmailFilter}
          onReset={resetFilters}
        />
      )}

      <div style={{ marginTop: '16px' }}>
        {calendarViewMode === 'calendar' ? (
          <CalendarView
            appointments={filteredAppointments}
            year={currentYear}
            month={currentMonth}
            onDayClick={handleDayClick}
            onAppointmentClick={handleAppointmentClick}
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            draggedId={draggedAppointmentId}
            draggedAppointment={draggedAppointment}
          />
        ) : (
          <ListView
            appointments={filteredAppointments}
            timezone={timezone}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
      </div>
    </div>
  )
}
