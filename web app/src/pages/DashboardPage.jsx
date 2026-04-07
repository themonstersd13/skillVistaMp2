import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Briefcase, MessagesSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { persistInterviewPreferences } from '../services/storage'

function TypeCard({ title, description, active, onClick, icon }) {
  const Icon = icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[22px] border p-5 text-left transition ${
        active ? 'border-cyan-300/40 bg-cyan-300/10' : 'border-white/8 bg-white/4 hover:bg-white/7'
      }`}
    >
      <div className="mb-4 inline-flex rounded-2xl bg-white/6 p-3 text-cyan-300">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300/68">{description}</p>
    </button>
  )
}

function FocusCard({ option, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active ? 'border-cyan-300/40 bg-cyan-300/10' : 'border-white/8 bg-white/4 hover:bg-white/7'
      }`}
    >
      <h3 className="text-sm font-semibold text-slate-100">{option.title}</h3>
      <p className="mt-2 line-clamp-3 text-xs leading-6 text-slate-300/65">{option.summary}</p>
    </button>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState(null)
  const [interviewType, setInterviewType] = useState('tech')
  const [focusArea, setFocusArea] = useState('')

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
    if (!dashboard) {
      return []
    }

    return dashboard.interview_options[interviewType] ?? []
  }, [dashboard, interviewType])

  useEffect(() => {
    if (focusOptions.length && !focusOptions.some((item) => item.title === focusArea)) {
      setFocusArea(focusOptions[0].title)
    }
  }, [focusArea, focusOptions])

  const handleStart = async () => {
    if (!focusArea) {
      return
    }
    persistInterviewPreferences({
      interviewType,
      focusArea,
    })
    navigate('/app/interview')
  }

  if (loading) {
    return <section className="glass-panel h-full rounded-[24px] p-5 text-sm text-slate-300">Loading...</section>
  }

  if (!dashboard) {
    return (
      <section className="glass-panel h-full rounded-[24px] p-5 text-sm text-rose-200">
        {error || 'Unable to load dashboard.'}
      </section>
    )
  }

  return (
    <section className="grid h-full gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="glass-panel flex min-h-0 flex-col rounded-[24px] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-cyan-300">Dashboard</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-100">Choose your interview</h1>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-right">
            <p className="text-xs text-slate-300/60">{dashboard.student.academic_year}</p>
            <p className="text-sm font-medium text-slate-100">{dashboard.student.target_role}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <TypeCard
            title="Technical"
            description="Core engineering, coding, systems, and domain depth."
            active={interviewType === 'tech'}
            onClick={() => setInterviewType('tech')}
            icon={Briefcase}
          />
          <TypeCard
            title="Non-technical"
            description="Communication, ownership, teamwork, confidence, and behavior."
            active={interviewType === 'non_tech'}
            onClick={() => setInterviewType('non_tech')}
            icon={MessagesSquare}
          />
        </div>

        <div className="mt-5 grid flex-1 gap-3 md:grid-cols-2">
          {focusOptions.map((option) => (
            <FocusCard
              key={option.title}
              option={option}
              active={focusArea === option.title}
              onClick={() => setFocusArea(option.title)}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-100">{focusArea || 'Choose a focus'}</p>
            {error ? <p className="mt-1 text-sm text-rose-200">{error}</p> : null}
          </div>
          <button
            type="button"
            onClick={handleStart}
            disabled={!focusArea}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-300/60"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <aside className="grid gap-3">
        <div className="glass-panel rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-300/58">Profile</p>
          <h2 className="mt-3 text-lg font-semibold text-slate-100">{dashboard.student.name}</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300/68">
            <p>{dashboard.student.specialization}</p>
            <p>{dashboard.student.academic_year}</p>
            <p>{dashboard.student.target_role}</p>
          </div>
        </div>

        <div className="glass-panel rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-300/58">Recent</p>
          <div className="mt-4 space-y-3">
            {dashboard.recent_sessions.slice(0, 3).map((session) => (
              <div key={session.id} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                <p className="text-sm font-medium capitalize text-slate-100">{session.interview_type.replace('_', '-')}</p>
                <p className="mt-1 text-xs text-slate-300/62">{session.focus_area}</p>
              </div>
            ))}
            {!dashboard.recent_sessions.length ? <p className="text-sm text-slate-300/60">No sessions yet.</p> : null}
          </div>
        </div>
      </aside>
    </section>
  )
}

export default DashboardPage
