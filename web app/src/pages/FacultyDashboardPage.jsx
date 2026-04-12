import { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, Download, Search, Users } from 'lucide-react'
import api from '../services/api'
import RadarChart from '../components/charts/RadarChart'
import GrowthChart from '../components/charts/GrowthChart'
import EmptyState from '../components/EmptyState'

function statusPill(readiness) {
  if (readiness == null) return { label: 'No Data', cls: 'sv-badge-muted' }
  if (readiness >= 75) return { label: 'On Track', cls: 'sv-badge-success' }
  if (readiness >= 50) return { label: 'Fair', cls: 'sv-badge-warning' }
  return { label: 'At Risk', cls: 'sv-badge-danger' }
}

function weakestArea(report) {
  if (!report) return '—'
  const scores = {
    Technical: report.technical_score ?? 0,
    Behavioral: report.behavioral_score ?? 0,
    Communication: report.communication_score ?? 0,
    Confidence: report.confidence_score ?? 0,
  }
  const min = Object.entries(scores).reduce((a, b) => (b[1] < a[1] ? b : a))
  return min[0]
}

function FacultyDashboardPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState('all')
  const [sortCol, setSortCol] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [selectedStudent, setSelectedStudent] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        // Load all students with their reports
        const [studentsRes] = await Promise.all([
          api.get('/auth/candidates'),
        ])

        // For each student, try to get their report
        const enriched = await Promise.all(
          studentsRes.data.map(async (s) => {
            try {
              const reportRes = await api.get(`/analytics/student/${s.id}`)
              return { ...s, report: reportRes.data }
            } catch {
              return { ...s, report: null }
            }
          })
        )

        setStudents(enriched)
      } catch (nextError) {
        setError(nextError.response?.data?.detail ?? nextError.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let result = students

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.target_role.toLowerCase().includes(q) ||
          s.specialization.toLowerCase().includes(q)
      )
    }

    // Filter tab
    if (filterTab === 'at_risk') {
      result = result.filter((s) => {
        const score = s.report?.quantitative?.overall_readiness
        return score != null && score < 50
      })
    } else if (filterTab === 'top') {
      result = result.filter((s) => {
        const score = s.report?.quantitative?.overall_readiness
        return score != null && score >= 75
      })
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal, bVal
      if (sortCol === 'name') {
        aVal = a.name; bVal = b.name
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (sortCol === 'readiness') {
        aVal = a.report?.quantitative?.overall_readiness ?? -1
        bVal = b.report?.quantitative?.overall_readiness ?? -1
      } else if (sortCol === 'year') {
        const order = { FY: 1, SY: 2, TY: 3, LY: 4 }
        aVal = order[a.academic_year] ?? 0
        bVal = order[b.academic_year] ?? 0
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })

    return result
  }, [students, searchQuery, filterTab, sortCol, sortDir])

  const toggleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const exportCSV = () => {
    const headers = ['Name', 'Year', 'Role', 'Readiness', 'Weakest Area', 'Status']
    const rows = filtered.map((s) => {
      const score = s.report?.quantitative?.overall_readiness
      const status = statusPill(score)
      return [
        s.name,
        s.academic_year,
        s.target_role,
        score != null ? Math.round(score) : 'N/A',
        s.report ? weakestArea(s.report.quantitative) : 'N/A',
        status.label,
      ]
    })

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'skillvista_cohort_report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const atRiskCount = students.filter((s) => {
    const score = s.report?.quantitative?.overall_readiness
    return score != null && score < 50
  }).length

  if (loading) {
    return <section className="sv-card p-5 text-sm" style={{ color: 'var(--app-text-muted)' }}>Loading cohort data...</section>
  }

  if (error) {
    return <section className="sv-card p-5 text-sm" style={{ color: '#FB7185' }}>{error}</section>
  }

  // Student Detail View
  if (selectedStudent) {
    const s = selectedStudent
    const quant = s.report?.quantitative
    const radarData = quant ? [
      { label: 'Technical', value: quant.technical_score },
      { label: 'Behavioral', value: quant.behavioral_score },
      { label: 'Communication', value: quant.communication_score },
      { label: 'Confidence', value: quant.confidence_score },
    ] : null

    return (
      <section className="grid gap-3">
        <div className="sv-card p-4">
          <button type="button" onClick={() => setSelectedStudent(null)} className="sv-btn-secondary py-1.5 px-3 text-xs mb-3">
            ← Back to Cohort
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--app-text)' }}>{s.name}</h1>
              <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>{s.academic_year} · {s.specialization} · {s.target_role}</p>
            </div>
            {quant && (
              <div className={`sv-card p-3 border ${quant.overall_readiness >= 75 ? 'score-bg-high' : quant.overall_readiness >= 50 ? 'score-bg-mid' : 'score-bg-low'}`}>
                <p className="text-label">Readiness</p>
                <p className={`text-2xl text-number ${quant.overall_readiness >= 75 ? 'score-high' : quant.overall_readiness >= 50 ? 'score-mid' : 'score-low'}`}>
                  {Math.round(quant.overall_readiness)}%
                </p>
              </div>
            )}
          </div>
        </div>

        {radarData && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="sv-card p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--app-text)' }}>Skills Footprint</h3>
              <RadarChart data={radarData} size={240} />
            </div>
            <div className="sv-card p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--app-text)' }}>Score Breakdown</h3>
              <div className="grid gap-2 grid-cols-2">
                {radarData.map((d) => (
                  <div key={d.label} className={`sv-card p-3 border ${d.value >= 75 ? 'score-bg-high' : d.value >= 50 ? 'score-bg-mid' : 'score-bg-low'}`}>
                    <p className="text-label">{d.label}</p>
                    <p className={`mt-1 text-lg text-number ${d.value >= 75 ? 'score-high' : d.value >= 50 ? 'score-mid' : 'score-low'}`}>
                      {Math.round(d.value)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!quant && (
          <div className="sv-card">
            <EmptyState icon={Users} title="No Evaluation" description="This student hasn't completed a mock interview yet." />
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="grid gap-3">
      {/* Summary */}
      <div className="sv-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            <h1 className="text-lg font-semibold" style={{ color: 'var(--app-text)' }}>Faculty Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="sv-pill text-xs" style={{ color: 'var(--app-text-muted)' }}>
              {students.length} students
            </span>
            {atRiskCount > 0 && (
              <span className="sv-badge sv-badge-danger">{atRiskCount} at risk</span>
            )}
            <button type="button" onClick={exportCSV} className="sv-btn-secondary py-1.5 px-3 text-xs">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sv-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="sv-search flex-1 w-full sm:w-auto">
            <Search className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--app-text-soft)' }} />
            <input
              id="faculty-search"
              placeholder="Search by name, role, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'at_risk', label: 'At Risk' },
              { key: 'top', label: 'Top Performers' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filterTab === tab.key
                    ? 'text-white'
                    : ''
                }`}
                style={{
                  background: filterTab === tab.key ? 'var(--primary)' : 'transparent',
                  color: filterTab === tab.key ? '#fff' : 'var(--app-text-muted)',
                  border: filterTab === tab.key ? 'none' : '1px solid var(--card-border)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="sv-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="sv-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">
                    Student <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th onClick={() => toggleSort('year')}>
                  <div className="flex items-center gap-1">
                    Year <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th>Target Role</th>
                <th onClick={() => toggleSort('readiness')}>
                  <div className="flex items-center gap-1">
                    Readiness <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th>Weakest Area</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const score = s.report?.quantitative?.overall_readiness
                const status = statusPill(score)
                return (
                  <tr key={s.id} onClick={() => setSelectedStudent(s)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--app-text)' }}>{s.name}</p>
                          <p className="text-xs" style={{ color: 'var(--app-text-soft)' }}>{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="sv-badge sv-badge-muted">{s.academic_year}</span></td>
                    <td className="text-sm" style={{ color: 'var(--app-text-muted)' }}>{s.target_role}</td>
                    <td>
                      <span className={`text-sm font-bold ${score != null ? (score >= 75 ? 'score-high' : score >= 50 ? 'score-mid' : 'score-low') : ''}`}>
                        {score != null ? `${Math.round(score)}%` : '—'}
                      </span>
                    </td>
                    <td className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                      {s.report ? weakestArea(s.report.quantitative) : '—'}
                    </td>
                    <td><span className={`sv-badge ${status.cls}`}>{status.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!filtered.length && (
          <div className="p-8 text-center text-xs" style={{ color: 'var(--app-text-soft)' }}>
            No students match your search or filter.
          </div>
        )}
      </div>
    </section>
  )
}

export default FacultyDashboardPage
