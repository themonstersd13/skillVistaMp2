import { useEffect, useState } from 'react'
import { Save, Sparkles, Target, UserRoundPen } from 'lucide-react'
import api from '../services/api'
import { buildProfileDraft, profileDraftToPayload } from '../utils/candidateProfile'

function ProfilePage() {
  const [student, setStudent] = useState(null)
  const [profileDraft, setProfileDraft] = useState(null)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/auth/me')
        setStudent(response.data)
        setProfileDraft(buildProfileDraft(response.data))
      } catch (nextError) {
        setError(nextError.response?.data?.detail ?? nextError.message)
      }
    }
    load()
  }, [])

  const updateField = (key, value) => {
    setProfileDraft((previous) => ({ ...previous, [key]: value }))
  }

  const handleSave = async () => {
    if (!profileDraft) return
    setSaving(true)
    setError('')
    setSaveMessage('')
    try {
      const response = await api.patch('/auth/me/profile', profileDraftToPayload(profileDraft))
      setStudent(response.data)
      setProfileDraft(buildProfileDraft(response.data))
      setSaveMessage('Profile updated. Future prompts will use this context.')
    } catch (nextError) {
      setError(nextError.response?.data?.detail ?? nextError.message)
    } finally {
      setSaving(false)
    }
  }

  if (error && !student) {
    return <section className="sv-card p-5 text-sm" style={{ color: '#FB7185' }}>{error}</section>
  }

  if (!student || !profileDraft) {
    return <section className="sv-card p-5 text-sm" style={{ color: 'var(--app-text-muted)' }}>Loading profile...</section>
  }

  const profile = student.profile ?? {}

  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="sv-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserRoundPen className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h1 className="text-lg font-semibold" style={{ color: 'var(--app-text)' }}>Candidate Profile</h1>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-label">Target Role</span>
            <input value={profileDraft.targetRole} onChange={(e) => updateField('targetRole', e.target.value)} className="sv-input mt-1.5" />
          </label>
          <label className="block">
            <span className="text-label">Headline</span>
            <input value={profileDraft.headline} onChange={(e) => updateField('headline', e.target.value)} className="sv-input mt-1.5" />
          </label>
          <label className="block">
            <span className="text-label">Strengths</span>
            <input value={profileDraft.strengths} onChange={(e) => updateField('strengths', e.target.value)} className="sv-input mt-1.5" placeholder="Comma separated" />
          </label>
          <label className="block">
            <span className="text-label">Growth Areas</span>
            <input value={profileDraft.stretchGoals} onChange={(e) => updateField('stretchGoals', e.target.value)} className="sv-input mt-1.5" placeholder="Comma separated" />
          </label>
          <label className="block">
            <span className="text-label">Languages & Tools</span>
            <input value={profileDraft.preferredLanguages} onChange={(e) => updateField('preferredLanguages', e.target.value)} className="sv-input mt-1.5" />
          </label>
          <label className="block">
            <span className="text-label">Current Focus Areas</span>
            <input value={profileDraft.currentFocus} onChange={(e) => updateField('currentFocus', e.target.value)} className="sv-input mt-1.5" />
          </label>
        </div>

        <div className="mt-3 grid gap-3">
          <label className="block">
            <span className="text-label">Project Context</span>
            <textarea value={profileDraft.projectContext} onChange={(e) => updateField('projectContext', e.target.value)} className="sv-input mt-1.5" style={{ minHeight: '5rem', lineHeight: '1.6' }} />
          </label>
          <label className="block">
            <span className="text-label">Evidence & Work</span>
            <textarea value={profileDraft.evidence} onChange={(e) => updateField('evidence', e.target.value)} className="sv-input mt-1.5" style={{ minHeight: '5rem', lineHeight: '1.6' }} />
          </label>
          <label className="block">
            <span className="text-label">Interview Preferences</span>
            <input value={profileDraft.interviewPreferences} onChange={(e) => updateField('interviewPreferences', e.target.value)} className="sv-input mt-1.5" />
          </label>
        </div>

        {error && <p className="mt-3 text-xs" style={{ color: '#FB7185' }}>{error}</p>}
        {saveMessage && <p className="mt-3 text-xs" style={{ color: '#10B981' }}>{saveMessage}</p>}

        <button type="button" onClick={handleSave} disabled={saving} className="sv-btn-primary mt-4">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <aside className="grid gap-3">
        <div className="sv-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--app-text)' }}>
            <Target className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            Active Profile
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>{student.name}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--app-text-muted)' }}>{student.academic_year} · {student.specialization}</p>
          <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>{student.target_role}</p>
        </div>
        <div className="sv-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--app-text)' }}>
            <Sparkles className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            Grounded Context
          </div>
          <p className="text-xs" style={{ color: 'var(--app-text-muted)', lineHeight: '1.6' }}>
            {profile.project_context || 'No project context added yet.'}
          </p>
        </div>
      </aside>
    </section>
  )
}

export default ProfilePage
