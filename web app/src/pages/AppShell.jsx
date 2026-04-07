import { BarChart3, ClipboardList, LogOut, LayoutDashboard, Mic2 } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useInterview } from '../context/InterviewContext'

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/interview', label: 'Interview', icon: Mic2 },
  { to: '/app/history', label: 'History', icon: ClipboardList },
  { to: '/app/report', label: 'Report', icon: BarChart3 },
]

function AppShell({ children }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { resetSession } = useInterview()

  const handleSignOut = () => {
    resetSession()
    signOut()
    navigate('/', { replace: true })
  }

  return (
    <main className="h-screen overflow-hidden px-3 py-3 sm:px-4">
      <div className="mx-auto grid h-full max-w-[1500px] gap-3 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="glass-panel hidden h-full rounded-[24px] p-4 lg:flex lg:flex-col">
          <div className="border-b border-white/8 pb-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-cyan-300">SKILLVISTA</p>
            <h1 className="mt-3 text-xl font-semibold text-slate-100">{user?.name}</h1>
            <p className="mt-1 text-sm text-slate-300/65">{user?.email}</p>
          </div>

          <nav className="mt-5 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'border-cyan-300/40 bg-cyan-300/12 text-slate-50'
                        : 'border-white/8 bg-white/4 text-slate-300 hover:bg-white/7'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        <section className="flex min-h-0 flex-col gap-3">
          <div className="glass-panel flex items-center justify-between rounded-[20px] px-4 py-3 lg:hidden">
            <p className="text-sm font-semibold text-slate-100">{user?.name}</p>
            <div className="flex items-center gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-2 text-xs font-medium ${
                      isActive ? 'bg-cyan-300/14 text-cyan-300' : 'text-slate-300'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </section>
      </div>
    </main>
  )
}

export default AppShell
