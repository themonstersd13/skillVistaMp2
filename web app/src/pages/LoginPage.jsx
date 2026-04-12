import { useEffect, useState } from 'react'
import { ChevronRight, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/auth/candidates')
        setCandidates(res.data)
      } catch (e) {
        setError(e.response?.data?.detail ?? e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleLogin = async (studentId) => {
    try {
      const res = await api.post('/auth/login', { student_id: studentId })
      signIn(res.data.token, res.data.student)
      navigate('/app/overview', { replace: true })
    } catch (e) {
      setError(e.response?.data?.detail ?? e.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--app-bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center mb-3" style={{ background: 'var(--primary)' }}>
            <span className="text-white text-lg font-bold">SV</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--app-text)' }}>SkillVista</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--app-text-muted)' }}>AI-Powered Interview Intelligence</p>
        </div>

        <div className="sv-card-lg p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--app-text)' }}>Select a candidate to begin</h2>

          {loading && <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>Loading candidates...</p>}
          {error && <p className="text-sm" style={{ color: '#FB7185' }}>{error}</p>}

          <div className="grid gap-2">
            {candidates.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleLogin(c.id)}
                className="sv-card-interactive p-3.5 w-full text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--app-text)' }}>{c.name}</p>
                    <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                      {c.academic_year} · {c.target_role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {c.latest_report_ready && <span className="sv-badge sv-badge-success">Report</span>}
                  <ChevronRight className="h-4 w-4" style={{ color: 'var(--app-text-soft)' }} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--app-text-soft)' }}>
          Demo environment — select any candidate to explore the platform.
        </p>
      </div>
    </div>
  )
}

export default LoginPage
