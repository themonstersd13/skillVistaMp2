import { BarChart3, ChevronRight, ClipboardList, LayoutDashboard, LogOut, Mic2, Settings2, UserRoundPen, Users } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useInterview } from '../context/InterviewContext'

const navItems = [
  { to: '/app/overview', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/setup', label: 'Setup', icon: Settings2 },
  { to: '/app/profile', label: 'Profile', icon: UserRoundPen },
  { to: '/app/interview', label: 'Interview', icon: Mic2 },
  { to: '/app/history', label: 'History', icon: ClipboardList },
  { to: '/app/report', label: 'Report', icon: BarChart3 },
]

const facultyItem = { to: '/app/faculty', label: 'Faculty', icon: Users }

function AppShell({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { resetSession } = useInterview()

  const allNavItems = user?.role === 'faculty' ? [...navItems, facultyItem] : navItems
  const activeItem = allNavItems.find((item) => location.pathname.startsWith(item.to)) ?? navItems[0]

  const handleSignOut = () => {
    resetSession()
    signOut()
    navigate('/', { replace: true })
  }

  return (
    <main className="h-screen overflow-hidden p-2 sm:p-3">
      <div className="mx-auto flex h-full max-w-[1600px] min-h-0 gap-3">
        {/* ── Icon Rail Sidebar ── */}
        <aside className="shell-sidebar hidden w-[60px] hover:w-[220px] transition-all duration-300 overflow-hidden flex-col rounded-xl py-3 px-2 lg:flex group">
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SV</span>
            </div>
            <span className="text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ color: 'var(--app-text)' }}>
              SkillVista
            </span>
          </div>

          {/* Nav Links */}
          <nav className="grid gap-0.5 mt-1">
            {allNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `shell-link flex items-center gap-2.5 px-2.5 py-2 ${isActive ? 'shell-link-active' : ''}`
                  }
                >
                  <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                  <span className="text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {item.label}
                  </span>
                </NavLink>
              )
            })}
          </nav>

          {/* Bottom Area */}
          <div className="mt-auto grid gap-1.5 pt-3">
            <div className="flex items-center gap-2.5 px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                {user?.name?.charAt(0) ?? 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--app-text)' }}>{user?.name}</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--app-text-muted)' }}>{user?.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="shell-link flex items-center gap-2.5 px-2.5 py-2"
            >
              <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
              <span className="text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Sign out
              </span>
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex min-h-0 flex-1 flex-col gap-2.5">
          {/* Top Bar */}
          <header className="shell-topbar sv-card px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold" style={{ color: 'var(--app-text)' }}>{activeItem.label}</h1>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 sv-pill text-xs" style={{ color: 'var(--app-text-muted)' }}>
                  {user?.name}
                </div>
                <ThemeToggle />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="sv-btn-secondary py-1.5 px-3 text-xs lg:hidden"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Exit
                </button>
              </div>
            </div>

            {/* Mobile Nav */}
            <nav className="overflow-x-auto mt-3 lg:hidden">
              <div className="flex min-w-max gap-1.5">
                {allNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname.startsWith(item.to)
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? 'border-primary-500/40 bg-primary-500/10 text-primary-300'
                          : 'border-transparent text-surface-400 hover:bg-surface-800'
                      }`}
                      style={isActive ? {} : { borderColor: 'var(--card-border)' }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            </nav>
          </header>

          <section className="min-h-0 flex-1 overflow-auto pr-1">{children}</section>
        </div>
      </div>
    </main>
  )
}

export default AppShell
