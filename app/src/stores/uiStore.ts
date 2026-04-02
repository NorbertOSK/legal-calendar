import { create } from 'zustand'

type CalendarViewMode = 'calendar' | 'list'

interface UiState {
  isSidebarOpen: boolean
  isDesktopSidebarCollapsed: boolean
  calendarViewMode: CalendarViewMode
  toggleSidebar: () => void
  toggleDesktopSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setDesktopSidebarCollapsed: (collapsed: boolean) => void
  setCalendarViewMode: (mode: CalendarViewMode) => void
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: false,
  isDesktopSidebarCollapsed: false,
  calendarViewMode: 'calendar',
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleDesktopSidebar: () =>
    set((state) => ({ isDesktopSidebarCollapsed: !state.isDesktopSidebarCollapsed })),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setDesktopSidebarCollapsed: (isDesktopSidebarCollapsed) => set({ isDesktopSidebarCollapsed }),
  setCalendarViewMode: (calendarViewMode) => set({ calendarViewMode }),
}))
