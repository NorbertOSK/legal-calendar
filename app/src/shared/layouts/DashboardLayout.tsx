import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { toCapitalizedName } from '@/shared/utils/text'
import { Button } from '@/shared/components/Button'
import { useAppointment } from '@/features/appointments/hooks/useAppointment'

interface DashboardLayoutProps {
  children: ReactNode
}

const sidebarWidth = 240
const collapsedSidebarWidth = 88
const topBarHeight = 56

const navItems = {
  lawyer: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/profile', label: 'Perfil' },
  ],
  admin: [
    { to: '/admin/lawyers', label: 'Abogados' },
    { to: '/admin/invitations', label: 'Invitaciones' },
    { to: '/profile', label: 'Perfil' },
  ],
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { isSidebarOpen, isDesktopSidebarCollapsed, setSidebarOpen, toggleDesktopSidebar } =
    useUiStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const isDesktopCollapsed = !isMobile && isDesktopSidebarCollapsed
  const currentSidebarWidth = isDesktopCollapsed ? collapsedSidebarWidth : sidebarWidth
  const isLawyer = user?.role === 'lawyer'
  const detailMatch = location.pathname.match(/^\/appointments\/([^/]+)$/)
  const appointmentIdFromDetail = detailMatch?.[1]
  const appointmentDetail = useAppointment(isLawyer && appointmentIdFromDetail ? appointmentIdFromDetail : undefined)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  const items = navItems[user?.role ?? 'lawyer']

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const showBackButton =
    location.pathname === '/appointments/new' ||
    /^\/appointments\/[^/]+(\/edit)?$/.test(location.pathname)

  const handleCreateAppointment = () => {
    const prefillClientName = appointmentDetail.data?.clientName
    const prefillClientEmail = appointmentDetail.data?.clientEmail

    if (appointmentIdFromDetail && prefillClientName && prefillClientEmail) {
      navigate('/appointments/new', {
        state: {
          prefillClientName,
          prefillClientEmail,
        },
      })
      return
    }

    navigate('/appointments/new')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 30,
          }}
        />
      )}

      <aside
        data-testid="dashboard-sidebar"
        style={{
          width: currentSidebarWidth,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
          transform: isMobile && !isSidebarOpen ? `translateX(-${sidebarWidth}px)` : 'none',
          transition: 'width var(--transition-base), transform var(--transition-base)',
        }}
      >
        <div
          data-testid="sidebar-brand-bar"
          style={{
            height: `${topBarHeight}px`,
            padding: isDesktopCollapsed ? '0 16px' : '0 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span
            style={{
              fontSize: isDesktopCollapsed ? '16px' : '18px',
              fontWeight: 700,
              color: 'var(--color-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            aria-label="Legal Calendar"
          >
            {isDesktopCollapsed ? 'LC' : 'Legal Calendar'}
          </span>

          {!isMobile && (
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              aria-label={isDesktopCollapsed ? 'Expandir sidebar' : 'Comprimir sidebar'}
              title={isDesktopCollapsed ? 'Expandir sidebar' : 'Comprimir sidebar'}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: 0,
                fontSize: '18px',
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {isDesktopCollapsed ? '»' : '«'}
            </button>
          )}
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => isMobile && setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: isDesktopCollapsed ? 'center' : 'flex-start',
                padding: isDesktopCollapsed ? '10px 16px' : '10px 20px',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                background: isActive ? 'var(--color-primary-light)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '14px',
                textDecoration: 'none',
                borderRight: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                transition: 'all var(--transition-fast)',
              })}
            >
              <span
                style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {isDesktopCollapsed ? item.label.charAt(0) : item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div
          style={{
            padding: isDesktopCollapsed ? '16px' : '16px 20px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
              textAlign: isDesktopCollapsed ? 'center' : 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={toCapitalizedName(user?.name)}
          >
            {isDesktopCollapsed ? toCapitalizedName(user?.name).charAt(0) : toCapitalizedName(user?.name)}
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesion"
            aria-label="Cerrar sesion"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-danger)',
              fontSize: '13px',
              cursor: 'pointer',
              padding: 0,
              display: 'block',
              width: '100%',
              textAlign: isDesktopCollapsed ? 'center' : 'left',
            }}
          >
            {isDesktopCollapsed ? '↩' : 'Cerrar sesion'}
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          data-testid="dashboard-header"
          style={{
            height: `${topBarHeight}px`,
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            background: 'var(--color-background)',
          }}
        >
          {showBackButton && (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                marginRight: '12px',
                color: 'var(--color-text-primary)',
              }}
              aria-label="Volver al calendario"
            >
              ←
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                marginRight: '12px',
                color: 'var(--color-text-primary)',
              }}
            >
              ☰
            </button>
          )}
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {user?.role === 'admin' ? 'Panel de Administracion' : 'Panel del Abogado'}
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isLawyer && (
              <Button onClick={handleCreateAppointment} style={{ padding: '8px 16px' }}>
                Agendar cita
              </Button>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: 'var(--spacing-lg)', overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
