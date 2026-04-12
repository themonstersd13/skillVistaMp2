import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

function ThemeToggle({ compact = false }) {
  const { isLight, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle ${compact ? 'theme-toggle-compact' : ''}`}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <span className="theme-toggle-icon">
        {isLight ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
      </span>
      {!compact ? <span>{isLight ? 'Dark mode' : 'Light mode'}</span> : null}
    </button>
  )
}

export default ThemeToggle
