import { Link } from 'react-router-dom'

function EmptyState({ icon, title, description, actionLabel, actionTo }) {
  const Icon = icon

  return (
    <div className="sv-empty-state py-10">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--primary-light)' }}>
        <Icon className="h-7 w-7" style={{ color: 'var(--primary)', opacity: 0.7 }} />
      </div>
      <h3 className="text-base font-semibold" style={{ color: 'var(--app-text)' }}>{title}</h3>
      <p className="mt-1.5 text-sm max-w-sm" style={{ color: 'var(--app-text-muted)' }}>{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="sv-btn-primary mt-4 text-sm">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

export default EmptyState
