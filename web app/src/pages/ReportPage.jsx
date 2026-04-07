import { useEffect, useState } from 'react'
import api from '../services/api'

function ScoreTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-300/55">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-100">{Math.round(value)}</p>
    </div>
  )
}

function ReportPage() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/analytics/me/latest')
        setReport(response.data)
      } catch (nextError) {
        setError(nextError.response?.data?.detail ?? nextError.message)
      }
    }

    load()
  }, [])

  if (error) {
    return <section className="glass-panel h-full rounded-[24px] p-5 text-sm text-rose-200">{error}</section>
  }

  if (!report) {
    return <section className="glass-panel h-full rounded-[24px] p-5 text-sm text-slate-300">Loading...</section>
  }

  return (
    <section className="grid h-full gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="glass-panel rounded-[24px] p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-cyan-300">Report</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">Latest evaluation</h1>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <ScoreTile label="Overall" value={report.quantitative.overall_readiness} />
          <ScoreTile label="Technical" value={report.quantitative.technical_score} />
          <ScoreTile label="Behavioral" value={report.quantitative.behavioral_score} />
          <ScoreTile label="Communication" value={report.quantitative.communication_score} />
          <ScoreTile label="Confidence" value={report.quantitative.confidence_score} />
        </div>

        <div className="mt-5 rounded-[22px] border border-white/8 bg-white/4 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Summary</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300/72">{report.qualitative.summary}</p>
        </div>
      </div>

      <aside className="grid gap-3">
        {['strengths', 'weaknesses', 'opportunities', 'threats'].map((key) => (
          <div key={key} className="glass-panel rounded-[24px] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-300/58">{key}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300/70">
              {(report.qualitative[key] ?? []).slice(0, 3).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
    </section>
  )
}

export default ReportPage
