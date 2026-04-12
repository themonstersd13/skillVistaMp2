import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Briefcase, Check, MessagesSquare, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { persistInterviewPreferences } from '../services/storage'

const STEPS = [
  { id: 1, label: 'Select Lens' },
  { id: 2, label: 'Choose Topic' },
  { id: 3, label: 'Review Profile' },
  { id: 4, label: 'Start' },
]

function ProgressBar({ currentStep }) {
  return (
    <div className="flex items-center gap-1 mb-4">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep
        const isCompleted = step.id < currentStep
        return (
          <div key={step.id} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center gap-1.5 ${index > 0 ? 'flex-1' : ''}`}>
              {index > 0 && (
                <div className="flex-1 h-0.5 rounded" style={{ background: isCompleted || isActive ? 'var(--primary)' : 'var(--card-border)' }} />
              )}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all"
                style={{
                  background: isCompleted ? 'var(--primary)' : isActive ? 'var(--primary)' : 'var(--card-border)',
                  color: isCompleted || isActive ? '#fff' : 'var(--app-text-muted)',
                }}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : step.id}
              </div>
            </div>
            <span className="text-xs font-medium whitespace-nowrap hidden sm:block" style={{ color: isActive ? 'var(--primary)' : 'var(--app-text-muted)' }}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function TypeCard({ title, description, active, onClick, icon }) {
  const Icon = icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={`sv-card-interactive p-4 text-left ${active ? 'sv-card-active' : ''}`}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: active ? 'rgba(79,70,229,0.2)' : 'var(--primary-light)' }}>
        <Icon className="h-4.5 w-4.5" style={{ color: 'var(--primary)' }} />
      </div>
      <h2 className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>{title}</h2>
      <p className="mt-1 text-xs" style={{ color: 'var(--app-text-muted)' }}>{description}</p>
    </button>
  )
}

function FocusCard({ option, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`sv-card-interactive p-3.5 text-left ${active ? 'sv-card-active' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium" style={{ color: 'var(--app-text)' }}>{option.title}</h3>
          <span className="sv-badge sv-badge-primary mt-1.5">{option.content_type.replace('_', ' ')}</span>
        </div>
        {active && <Sparkles className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />}
      </div>
      <p className="mt-2 text-xs" style={{ color: 'var(--app-text-muted)', lineHeight: '1.6' }}>{option.summary}</p>
    </button>
  )
}

function SetupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState(null)
  const [interviewType, setInterviewType] = useState('tech')
  const [focusArea, setFocusArea] = useState('')

  const currentStep = useMemo(() => {
    if (!interviewType) return 1
    if (!focusArea) return 2
    return 3
  }, [interviewType, focusArea])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get('/interview/dashboard')
        const payload = response.data
        setDashboard(payload)
        const initialType = payload.interview_options.tech?.length ? 'tech' : 'non_tech'
        setInterviewType(initialType)
        setFocusArea(payload.interview_options[initialType]?.[0]?.title ?? '')
      } catch (nextError) {
        setError(nextError.response?.data?.detail ?? nextError.message)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  const focusOptions = useMemo(() => {
    if (!dashboard) return []
    return dashboard.interview_options[interviewType] ?? []
  }, [dashboard, interviewType])

  useEffect(() => {
    if (focusOptions.length && !focusOptions.some((item) => item.title === focusArea)) {
      setFocusArea(focusOptions[0].title)
    }
  }, [focusArea, focusOptions])

  const handleStart = () => {
    if (!focusArea) return
    persistInterviewPreferences({ interviewType, focusArea })
    navigate('/app/interview')
  }

  if (loading) {
    return <section className="sv-card p-5 text-sm" style={{ color: 'var(--app-text-muted)' }}>Loading interview setup...</section>
  }

  if (!dashboard) {
    return <section className="sv-card p-5 text-sm" style={{ color: '#FB7185' }}>{error || 'Unable to load interview setup.'}</section>
  }

  const profile = dashboard.student.profile ?? {}

  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_320px]">
      <div className="grid gap-3">
        {/* Progress Bar */}
        <div className="sv-card p-4">
          <ProgressBar currentStep={focusArea ? 3 : interviewType ? 2 : 1} />
          <h1 className="text-lg font-semibold" style={{ color: 'var(--app-text)' }}>Interview Setup</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--app-text-muted)' }}>
            Pick the interview lens and focus area, then start.
          </p>
        </div>

        {/* Round Type */}
        <div className="sv-card p-4">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--app-text)' }}>1. Select Interview Lens</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <TypeCard
              title="Technical"
              description="Architecture, coding, APIs, problem solving."
              active={interviewType === 'tech'}
              onClick={() => setInterviewType('tech')}
              icon={Briefcase}
            />
            <TypeCard
              title="Non-Technical"
              description="Communication, ownership, behavioral judgment."
              active={interviewType === 'non_tech'}
              onClick={() => setInterviewType('non_tech')}
              icon={MessagesSquare}
            />
          </div>
        </div>

        {/* Focus Area */}
        <div className="sv-card p-4">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--app-text)' }}>2. Choose Topic Pack</h2>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {focusOptions.map((option) => (
              <FocusCard
                key={option.title}
                option={option}
                active={focusArea === option.title}
                onClick={() => setFocusArea(option.title)}
              />
            ))}
          </div>

          {/* Launch */}
          <div className="mt-4 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderTop: '1px solid var(--card-border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--app-text)' }}>{focusArea || 'Choose a focus area'}</p>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--app-text-muted)' }}>
                Blended with your profile and prior answers.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStart}
              disabled={!focusArea}
              className="sv-btn-primary"
            >
              Go to Interview
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="grid gap-3">
        <div className="sv-card p-4">
          <p className="text-label">Current Context</p>
          <h2 className="mt-2 text-base font-semibold" style={{ color: 'var(--app-text)' }}>{dashboard.student.name}</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--app-text-muted)' }}>{dashboard.student.target_role}</p>

          <div className="mt-3 sv-card p-3">
            <p className="text-label mb-1">Project Context</p>
            <p className="text-xs" style={{ color: 'var(--app-text-muted)', lineHeight: '1.6' }}>
              {profile.project_context || 'Add candidate evidence in Profile to improve grounding.'}
            </p>
          </div>
        </div>

        <div className="sv-card p-4">
          <p className="text-label">Recent Signals</p>
          <div className="mt-2.5 space-y-2">
            {dashboard.recent_sessions.slice(0, 3).map((session) => (
              <div key={session.id} className="sv-card p-3">
                <p className="text-sm font-medium" style={{ color: 'var(--app-text)' }}>{session.focus_area}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--app-text-muted)' }}>
                  {session.interview_type.replace('_', ' ')} ·{' '}
                  {session.overall_readiness != null ? `${Math.round(session.overall_readiness)}%` : 'Pending'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  )
}

export default SetupPage
