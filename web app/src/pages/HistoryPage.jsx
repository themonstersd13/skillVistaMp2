import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, DatabaseZap, History, RefreshCw } from 'lucide-react'
import api from '../services/api'
import EmptyState from '../components/EmptyState'
import { Mic2 } from 'lucide-react'

function formatDateTime(value) {
  if (!value) return 'In progress'
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function HistoryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadHistory = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true); else setLoading(true)
    try {
      const response = await api.get('/interview/history')
      setItems(response.data)
      setError('')
    } catch (nextError) {
      setError(nextError.response?.data?.detail ?? nextError.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const completedCount = useMemo(() => items.filter((item) => item.status === 'completed').length, [items])

  if (loading) {
    return <section className="sv-card p-5 text-sm" style={{ color: 'var(--app-text-muted)' }}>Loading history...</section>
  }

  return (
    <section className="grid gap-3">
      {/* Header Stats */}
      <div className="sv-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--app-text)' }}>Interview History</h1>
          <div className="flex items-center gap-2">
            <div className="sv-pill text-xs">
              <span style={{ color: 'var(--app-text-muted)' }}>{items.length} sessions</span>
            </div>
            <div className="sv-pill text-xs">
              <span style={{ color: 'var(--app-text-muted)' }}>{completedCount} completed</span>
            </div>
            <button
              type="button"
              onClick={() => loadHistory({ silent: true })}
              disabled={refreshing}
              className="sv-btn-secondary py-1.5 px-3 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && <div className="sv-card p-4 text-sm" style={{ color: '#FB7185' }}>{error}</div>}

      {!items.length && !error ? (
        <div className="sv-card">
          <EmptyState
            icon={Mic2}
            title="No History Yet"
            description="Complete your first interview to see session data here."
            actionLabel="Start Interview"
            actionTo="/app/setup"
          />
        </div>
      ) : (
        <div className="grid gap-2.5 xl:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="sv-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="sv-badge sv-badge-primary">{item.interview_type.replace('_', ' ')}</span>
                    <span className={`sv-badge ${item.status === 'completed' ? 'sv-badge-success' : item.status === 'live' ? 'sv-badge-warning' : 'sv-badge-muted'}`}>
                      {item.status}
                    </span>
                  </div>
                  <h2 className="mt-2 text-sm font-semibold" style={{ color: 'var(--app-text)' }}>{item.focus_area}</h2>
                  <p className="mt-1 text-xs" style={{ color: 'var(--app-text-muted)', lineHeight: '1.5' }}>
                    {item.latest_question || 'No stored question.'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-label">Readiness</p>
                  <p className={`text-lg text-number ${item.overall_readiness != null ? (item.overall_readiness >= 75 ? 'score-high' : item.overall_readiness >= 50 ? 'score-mid' : 'score-low') : ''}`}>
                    {item.overall_readiness != null ? `${Math.round(item.overall_readiness)}%` : '—'}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div className="sv-card p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--app-text)' }}>
                    <CalendarDays className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                    Timing
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--app-text-muted)' }}>Started: {formatDateTime(item.started_at)}</p>
                  <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>Completed: {formatDateTime(item.completed_at)}</p>
                </div>
                <div className="sv-card p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--app-text)' }}>
                    <DatabaseZap className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                    Metadata
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--app-text-muted)' }}>{item.question_count} questions · LLM: {item.llm_provider}</p>
                  <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                    <History className="h-3 w-3 inline mr-1" style={{ color: 'var(--primary)' }} />
                    {item.id.slice(0, 8)}... · {item.report_ready ? 'Report stored' : 'Pending'}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default HistoryPage
