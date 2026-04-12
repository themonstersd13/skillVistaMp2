import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BarChart3, Briefcase, ClipboardList, Mic2, Rocket, Settings2, Target, UserRoundPen } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import EmptyState from '../components/EmptyState'

function formatDate(value) {
  if (!value) return 'In progress'
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function scoreColor(score) {
  if (score >= 75) return 'score-high'
  if (score >= 50) return 'score-mid'
  return 'score-low'
}

function scoreBg(score) {
  if (score >= 75) return 'score-bg-high'
  if (score >= 50) return 'score-bg-mid'
  return 'score-bg-low'
}

function RecommendedAction({ title, description, to, icon }) {
  const Icon = icon
  return (
    <Link to={to} className="sv-card-interactive p-4 flex items-start gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-light)' }}>
        <Icon className="h-4 w-4" style={{ color: 'var(--primary)' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>{title}</p>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--app-text-muted)' }}>{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--app-text-soft)' }} />
    </Link>
  )
}

function OverviewPage() {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/interview/dashboard')
        setDashboard(response.data)
      } catch (nextError) {
        setError(nextError.response?.data?.detail ?? nextError.message)
      }
    }
    load()
  }, [])

  const latestReadiness = useMemo(() => {
    if (!dashboard) return null
    const recent = dashboard.recent_sessions.find((item) => item.overall_readiness != null)
    return recent?.overall_readiness ?? null
  }, [dashboard])

  const recommendedActions = useMemo(() => {
    if (!dashboard || !latestReadiness) return []
    const actions = []
    const sessions = dashboard.recent_sessions
    const latest = sessions.find((s) => s.overall_readiness != null)

    if (!latest) {
      actions.push({
        title: 'Take Your First Mock Interview',
        description: 'Set up your first session and start building your readiness score.',
        to: '/app/setup',
        icon: Mic2,
      })
      return actions
    }

    if (latestReadiness < 60) {
      actions.push({
        title: 'Improve Your Readiness Score',
        description: `Your score is ${Math.round(latestReadiness)}%. Schedule another mock interview to practice.`,
        to: '/app/setup',
        icon: Target,
      })
    }

    const techSessions = sessions.filter((s) => s.interview_type === 'tech')
    const nonTechSessions = sessions.filter((s) => s.interview_type === 'non_tech')
    if (techSessions.length > nonTechSessions.length + 1) {
      actions.push({
        title: 'Practice Non-Technical Skills',
        description: 'Your behavioral score may be lagging. Try a non-technical mock interview.',
        to: '/app/setup',
        icon: Briefcase,
      })
    }

    if (!(dashboard.student.profile?.project_context)) {
      actions.push({
        title: 'Complete Your Profile',
        description: 'Add project context and evidence so questions stay grounded in your real experience.',
        to: '/app/profile',
        icon: UserRoundPen,
      })
    }

    return actions
  }, [dashboard, latestReadiness])

  if (error) {
    return <section className="sv-card p-5 text-sm" style={{ color: '#FB7185' }}>{error}</section>
  }

  if (!dashboard) {
    return <section className="sv-card p-5 text-sm" style={{ color: 'var(--app-text-muted)' }}>Loading dashboard...</section>
  }

  const hasNoSessions = !dashboard.recent_sessions.length

  return (
    <section className="grid gap-3">
      {/* ── Summary Stats ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sv-card p-4">
          <p className="text-label">Academic Year</p>
          <p className="mt-1.5 text-lg text-number">{dashboard.student.academic_year}</p>
        </div>
        <div className="sv-card p-4">
          <p className="text-label">Target Role</p>
          <p className="mt-1.5 text-lg font-semibold" style={{ color: 'var(--app-text)' }}>{dashboard.student.target_role}</p>
        </div>
        <div className={`sv-card p-4 border ${latestReadiness != null ? scoreBg(latestReadiness) : ''}`}>
          <p className="text-label">Latest Readiness</p>
          <p className={`mt-1.5 text-2xl text-number ${latestReadiness != null ? scoreColor(latestReadiness) : ''}`}>
            {latestReadiness != null ? `${Math.round(latestReadiness)}%` : 'Pending'}
          </p>
        </div>
      </div>

      {/* ── Recommended Actions ── */}
      {recommendedActions.length > 0 && (
        <div className="sv-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>Recommended Next Steps</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {recommendedActions.map((action) => (
              <RecommendedAction key={action.title} {...action} />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_340px]">
        {/* ── Quick Navigation ── */}
        <div className="grid gap-3">
          <div className="sv-card p-4">
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--app-text)' }}>Quick Navigation</h2>
            <div className="grid gap-2 md:grid-cols-3">
              <Link to="/app/setup" className="sv-card-interactive p-3.5">
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--app-text)' }}>
                  <Settings2 className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                  Interview Setup
                </div>
              </Link>
              <Link to="/app/profile" className="sv-card-interactive p-3.5">
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--app-text)' }}>
                  <UserRoundPen className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                  Candidate Profile
                </div>
              </Link>
              <Link to="/app/history" className="sv-card-interactive p-3.5">
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--app-text)' }}>
                  <ClipboardList className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                  History & Reports
                </div>
              </Link>
            </div>
          </div>

          {/* ── Recent Sessions ── */}
          <div className="sv-card p-4">
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--app-text)' }}>Recent Sessions</h2>
            {hasNoSessions ? (
              <EmptyState
                icon={Mic2}
                title="No interviews yet"
                description="Take your first mock interview to start building your readiness score."
                actionLabel="Start First Interview"
                actionTo="/app/setup"
              />
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {dashboard.recent_sessions.map((session) => (
                  <div key={session.id} className="sv-card p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium capitalize" style={{ color: 'var(--app-text)' }}>
                        {session.interview_type.replace('_', ' ')}
                      </p>
                      <span className={`sv-badge ${session.status === 'completed' ? 'sv-badge-success' : session.status === 'live' ? 'sv-badge-warning' : 'sv-badge-muted'}`}>
                        {session.status}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs" style={{ color: 'var(--app-text-muted)' }}>{session.focus_area}</p>
                    <div className="mt-2.5 flex items-center justify-between text-xs" style={{ color: 'var(--app-text-soft)' }}>
                      <span>{formatDate(session.started_at)}</span>
                      {session.overall_readiness != null && (
                        <span className={`font-semibold ${scoreColor(session.overall_readiness)}`}>
                          {Math.round(session.overall_readiness)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Context Sidebar ── */}
        <aside className="grid gap-3">
          <div className="sv-card p-4">
            <p className="text-label">Context</p>
            <h2 className="mt-2 text-base font-semibold" style={{ color: 'var(--app-text)' }}>{dashboard.student.name}</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--app-text-muted)' }}>
              {dashboard.student.profile?.headline || dashboard.student.specialization}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(dashboard.student.strengths ?? []).map((item) => (
                <span key={item} className="sv-badge sv-badge-primary">{item}</span>
              ))}
            </div>

            <div className="mt-3 sv-card p-3">
              <p className="text-label mb-1.5">Grounding Context</p>
              <p className="text-xs" style={{ color: 'var(--app-text-muted)', lineHeight: '1.6' }}>
                {dashboard.student.profile?.project_context || 'Add project evidence in Profile so RAG prompts stay grounded.'}
              </p>
            </div>
          </div>

          <Link to="/app/setup" className="sv-card-interactive p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-label" style={{ color: 'var(--primary)' }}>Next Action</p>
                <p className="mt-1.5 text-sm font-semibold" style={{ color: 'var(--app-text)' }}>Prepare the next round</p>
              </div>
              <ArrowRight className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            </div>
          </Link>
        </aside>
      </div>
    </section>
  )
}

export default OverviewPage
