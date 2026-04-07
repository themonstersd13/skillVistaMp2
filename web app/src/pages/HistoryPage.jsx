import { useEffect, useState } from 'react'
import api from '../services/api'

function HistoryPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/interview/history')
        setItems(response.data)
      } catch (nextError) {
        setError(nextError.response?.data?.detail ?? nextError.message)
      }
    }

    load()
  }, [])

  return (
    <section className="glass-panel h-full rounded-[24px] p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-cyan-300">History</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-100">Previous interviews</h1>
      {error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.slice(0, 6).map((item) => (
          <div key={item.id} className="rounded-[22px] border border-white/8 bg-white/4 p-4">
            <p className="text-sm font-semibold capitalize text-slate-100">{item.interview_type.replace('_', '-')}</p>
            <p className="mt-2 text-sm text-slate-300/66">{item.focus_area}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-300/55">
              <span>{item.question_count} questions</span>
              <span>{item.report_ready ? 'Report ready' : 'Pending'}</span>
            </div>
          </div>
        ))}
        {!items.length && !error ? <p className="text-sm text-slate-300/60">No history yet.</p> : null}
      </div>
    </section>
  )
}

export default HistoryPage
