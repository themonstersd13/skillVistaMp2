import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BrainCircuit, CheckCircle2, MessagesSquare, Sparkles, Target, XCircle } from 'lucide-react'
import api from '../services/api'
import RadarChart from '../components/charts/RadarChart'
import EmptyState from '../components/EmptyState'
import { Mic2 } from 'lucide-react'

function scoreColor(v) {
  if (v >= 75) return 'score-high'
  if (v >= 50) return 'score-mid'
  return 'score-low'
}

function scoreBg(v) {
  if (v >= 75) return 'score-bg-high'
  if (v >= 50) return 'score-bg-mid'
  return 'score-bg-low'
}

const SWOT_CONFIG = {
  Strengths:     { icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  Weaknesses:    { icon: XCircle,      color: '#E11D48', bg: 'rgba(225,29,72,0.1)' },
  Opportunities: { icon: Target,       color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  Threats:       { icon: AlertTriangle, color: '#E11D48', bg: 'rgba(225,29,72,0.08)' },
}

function SwotList({ label, items }) {
  const config = SWOT_CONFIG[label] || SWOT_CONFIG.Strengths
  const Icon = config.icon

  return (
    <div className="sv-card p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: config.bg }}>
          <Icon className="h-3 w-3" style={{ color: config.color }} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: config.color }}>{label}</span>
      </div>
      <ul className="space-y-1.5">
        {(items ?? []).map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Icon className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: config.color, opacity: 0.6 }} />
            <span className="text-xs" style={{ color: 'var(--app-text-muted)', lineHeight: '1.55' }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AnalysisCard({ title, analysis, icon, children }) {
  const Icon = icon
  return (
    <div className="sv-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" style={{ color: 'var(--primary)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>{title}</h3>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--app-text-muted)', lineHeight: '1.6' }}>{analysis.summary}</p>
      {children}
      <div className="grid gap-2 md:grid-cols-2">
        <SwotList label="Strengths" items={analysis.strengths} />
        <SwotList label="Weaknesses" items={analysis.weaknesses} />
        <SwotList label="Opportunities" items={analysis.opportunities} />
        <SwotList label="Threats" items={analysis.threats} />
      </div>
    </div>
  )
}

function buildFallbackAnalysis(qualitative, kind) {
  const base = qualitative.summary ?? 'Evaluation available.'
  return {
    summary: `${kind === 'technical' ? 'Technical' : 'Professional'} lens: ${base}`,
    strengths: qualitative.strengths ?? [],
    weaknesses: qualitative.weaknesses ?? [],
    opportunities: qualitative.opportunities ?? [],
    threats: qualitative.threats ?? [],
  }
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
        const errMsg = nextError.response?.data?.detail ?? nextError.message
        // If 404, treat as no report (empty state)
        if (nextError.response?.status === 404) {
          setReport('empty')
        } else {
          setError(errMsg)
        }
      }
    }
    load()
  }, [])

  const technicalAnalysis = useMemo(() => {
    if (!report || report === 'empty') return null
    return report.qualitative.technical_analysis ?? buildFallbackAnalysis(report.qualitative, 'technical')
  }, [report])

  const nonTechnicalAnalysis = useMemo(() => {
    if (!report || report === 'empty') return null
    return report.qualitative.non_technical_analysis ?? buildFallbackAnalysis(report.qualitative, 'non_technical')
  }, [report])

  if (error) {
    return <section className="sv-card p-5 text-sm" style={{ color: '#FB7185' }}>{error}</section>
  }

  if (!report) {
    return <section className="sv-card p-5 text-sm" style={{ color: 'var(--app-text-muted)' }}>Loading evaluation...</section>
  }

  if (report === 'empty') {
    return (
      <section className="sv-card h-full">
        <EmptyState
          icon={Mic2}
          title="No Evaluation Yet"
          description="Complete a mock interview to see your detailed SWOT analysis, scores, and recommended actions."
          actionLabel="Take Your First Mock Interview"
          actionTo="/app/setup"
        />
      </section>
    )
  }

  const quant = report.quantitative
  const recommendedFocus = report.qualitative.recommended_focus ?? report.combined?.insights?.recommended_focus ?? []
  const profile = report.student.profile ?? {}

  const radarData = [
    { label: 'Technical', value: quant.technical_score },
    { label: 'Behavioral', value: quant.behavioral_score },
    { label: 'Communication', value: quant.communication_score },
    { label: 'Confidence', value: quant.confidence_score },
  ]

  return (
    <section className="grid gap-3">
      {/* ── Header & Scores ── */}
      <div className="sv-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--app-text)' }}>Evaluation Report</h1>
            <p className="mt-1 text-xs max-w-xl" style={{ color: 'var(--app-text-muted)', lineHeight: '1.6' }}>{report.qualitative.summary}</p>
          </div>
          <div className="sv-card p-3 text-right">
            <p className="text-label">Target</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>{report.student.target_role}</p>
            <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>{report.student.academic_year} · {report.student.specialization}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 grid-cols-2 xl:grid-cols-5">
          <div className={`sv-card p-3 border ${scoreBg(quant.overall_readiness)}`}>
            <p className="text-label">Overall</p>
            <p className={`mt-1 text-xl text-number ${scoreColor(quant.overall_readiness)}`}>{Math.round(quant.overall_readiness)}%</p>
          </div>
          <div className={`sv-card p-3 border ${scoreBg(quant.technical_score)}`}>
            <p className="text-label">Technical</p>
            <p className={`mt-1 text-xl text-number ${scoreColor(quant.technical_score)}`}>{Math.round(quant.technical_score)}%</p>
          </div>
          <div className={`sv-card p-3 border ${scoreBg(quant.behavioral_score)}`}>
            <p className="text-label">Behavioral</p>
            <p className={`mt-1 text-xl text-number ${scoreColor(quant.behavioral_score)}`}>{Math.round(quant.behavioral_score)}%</p>
          </div>
          <div className={`sv-card p-3 border ${scoreBg(quant.communication_score)}`}>
            <p className="text-label">Communication</p>
            <p className={`mt-1 text-xl text-number ${scoreColor(quant.communication_score)}`}>{Math.round(quant.communication_score)}%</p>
          </div>
          <div className={`sv-card p-3 border ${scoreBg(quant.confidence_score)}`}>
            <p className="text-label">Confidence</p>
            <p className={`mt-1 text-xl text-number ${scoreColor(quant.confidence_score)}`}>{Math.round(quant.confidence_score)}%</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-3">
          {/* Radar Chart */}
          <div className="sv-card p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--app-text)' }}>Skills Footprint</h3>
            <RadarChart data={radarData} size={280} />
          </div>

          {/* SWOT Analysis */}
          <AnalysisCard title="Technical Analysis" analysis={technicalAnalysis} icon={BrainCircuit} />
          <AnalysisCard title="Professional & Communication" analysis={nonTechnicalAnalysis} icon={MessagesSquare} />
        </div>

        {/* Sidebar */}
        <aside className="grid gap-3">
          <div className="sv-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: 'var(--app-text)' }}>
              <Target className="h-4 w-4" style={{ color: 'var(--primary)' }} />
              Recommended Actions
            </div>
            <ul className="space-y-2">
              {recommendedFocus.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                  <span className="text-xs" style={{ color: 'var(--app-text-muted)', lineHeight: '1.55' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="sv-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: 'var(--app-text)' }}>
              <Sparkles className="h-4 w-4" style={{ color: 'var(--primary)' }} />
              Context Used
            </div>
            <p className="text-xs" style={{ color: 'var(--app-text-muted)', lineHeight: '1.6' }}>
              {profile.project_context || 'Report used the profile available at evaluation time.'}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {(profile.current_focus ?? []).slice(0, 6).map((item) => (
                <span key={item} className="sv-badge sv-badge-muted">{item}</span>
              ))}
            </div>
          </div>

          <div className="sv-card p-4">
            <p className="text-label mb-2">Session Info</p>
            <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>ID: {report.sessionId?.slice(0, 8)}...</p>
            <p className="text-xs mt-1" style={{ color: 'var(--app-text-muted)' }}>
              {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default ReportPage
