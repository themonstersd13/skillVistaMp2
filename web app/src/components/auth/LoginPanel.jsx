import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, KeyRound, LoaderCircle, LockKeyhole, TriangleAlert, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

function CandidateCard({ candidate, loading, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(candidate)}
      disabled={loading}
      className="rounded-[24px] border border-white/10 bg-white/4 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-100">{candidate.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-300">{candidate.academic_year}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/6 p-2 text-cyan-300">
          <UserRound className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-300/78">{candidate.target_role}</p>
      <p className="mt-1 text-xs text-slate-300/60">{candidate.specialization}</p>
      <p className="mt-3 text-xs text-slate-300/58">
        {candidate.latest_report_ready ? 'Sample report available' : 'Fresh profile ready for new interview'}
      </p>
    </button>
  )
}

function LoginPanel() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [candidates, setCandidates] = useState([])
  const [loadingCandidates, setLoadingCandidates] = useState(true)
  const [showManualAccess, setShowManualAccess] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loggingInCandidateId, setLoggingInCandidateId] = useState(null)

  useEffect(() => {
    let ignore = false

    const loadCandidates = async () => {
      try {
        const response = await api.get('/auth/candidates')
        if (!ignore) {
          setCandidates(response.data ?? [])
        }
      } catch (nextError) {
        if (!ignore) {
          setError(nextError.response?.data?.detail ?? nextError.message)
        }
      } finally {
        if (!ignore) {
          setLoadingCandidates(false)
        }
      }
    }

    loadCandidates()

    return () => {
      ignore = true
    }
  }, [])

  const tokenPreview = useMemo(() => {
    if (!tokenInput.trim()) {
      return 'You can use the database-backed demo candidates above, or paste a JWT manually.'
    }

    const parts = tokenInput.trim().split('.')

    if (parts.length !== 3) {
      return 'JWT format should look like header.payload.signature.'
    }

    return 'Token structure looks valid. The claims will be parsed locally before the portal opens.'
  }, [tokenInput])

  const handleCandidateLogin = async (candidate) => {
    setLoggingInCandidateId(candidate.id)
    setSubmitting(true)
    setError('')

    try {
      const response = await api.post('/auth/login', {
        student_id: candidate.id,
      })
      signIn(response.data)
      navigate('/app/overview', { replace: true })
    } catch (nextError) {
      setError(nextError.response?.data?.detail ?? nextError.message)
    } finally {
      setLoggingInCandidateId(null)
      setSubmitting(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      signIn(tokenInput)
      navigate('/app/overview', { replace: true })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="glass-panel w-full rounded-[32px] p-6 sm:p-8 lg:max-h-full lg:overflow-auto">
      <div className="mb-8">
        <div className="mb-4 inline-flex rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-300">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h2 className="text-3xl font-semibold text-slate-100">Open your interview workspace</h2>
        <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300/74">
          Choose a candidate record from the backend to launch a context-aware interview flow. Manual JWT access stays
          available, but the database-first path is the recommended one.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-[0.32em] text-slate-300/60">Demo candidates</span>
          {loadingCandidates ? (
            <span className="inline-flex items-center gap-2 text-xs text-slate-300/60">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Loading
            </span>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              loading={submitting}
              onSelect={handleCandidateLogin}
            />
          ))}
          {!loadingCandidates && !candidates.length ? (
            <div className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-4 text-sm text-slate-300/70">
              No candidates were returned by the backend seed data.
            </div>
          ) : null}
        </div>
        {loggingInCandidateId ? (
          <div className="rounded-[24px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
            Signing into candidate profile #{loggingInCandidateId}...
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-white/10 pt-6">
        <button
          type="button"
          onClick={() => setShowManualAccess((previous) => !previous)}
          className="flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-white/4 px-4 py-4 text-left text-sm font-medium text-slate-100 transition hover:bg-white/8"
        >
          <span>Use manual JWT access instead</span>
          <ChevronDown className={`h-4 w-4 transition ${showManualAccess ? 'rotate-180' : ''}`} />
        </button>

        {showManualAccess ? (
          <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-3">
              <span className="font-mono text-xs uppercase tracking-[0.32em] text-slate-300/60">Manual candidate access token</span>
              <textarea
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="surface-input min-h-32 w-full rounded-[24px] border px-4 py-4 font-mono text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-400/40 focus:border-cyan-300/40"
                required
              />
            </label>

            <div className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-4">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-4 w-4 text-cyan-300" />
                <p className="text-sm leading-7 text-slate-300/76">{tokenPreview}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[24px] bg-cyan-300 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-300/70"
            >
              <LockKeyhole className="h-4 w-4" />
              {submitting && !loggingInCandidateId ? 'Validating token...' : 'Enter secure portal with JWT'}
            </button>
          </form>
        ) : null}
      </div>

      {error ? (
        <div className="mt-5 rounded-[24px] border border-rose-400/24 bg-rose-500/10 px-4 py-4 text-sm text-rose-200">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default LoginPanel
