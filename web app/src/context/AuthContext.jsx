import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { clearAuthStorage, loadAuthStorage, persistAuthStorage } from '../services/storage'

const AuthContext = createContext(null)

function decodeJwtPayload(token) {
  const [, payload] = token.split('.')

  if (!payload) {
    throw new Error('Invalid JWT structure')
  }

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const decoded = window.atob(normalized)

  return JSON.parse(decoded)
}

function normalizeUserClaims(payload) {
  return {
    candidateId: payload.sub ?? payload.candidateId ?? payload.id ?? 'candidate',
    name: payload.name ?? payload.fullName ?? payload.preferred_username ?? 'Candidate',
    email: payload.email ?? '',
    role: payload.role ?? 'candidate',
    expiresAt: payload.exp ? payload.exp * 1000 : null,
  }
}

function readInitialAuthState() {
  const stored = loadAuthStorage()

  if (!stored?.token) {
    return {
      token: null,
      user: null,
    }
  }

  try {
    const payload = decodeJwtPayload(stored.token)
    const nextUser = normalizeUserClaims(payload)

    if (nextUser.expiresAt && nextUser.expiresAt < Date.now()) {
      clearAuthStorage()
      return {
        token: null,
        user: null,
      }
    }

    return {
      token: stored.token,
      user: nextUser,
    }
  } catch {
    clearAuthStorage()
    return {
      token: null,
      user: null,
    }
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(readInitialAuthState)

  const signIn = useCallback((nextToken) => {
    const trimmedToken = nextToken.trim()
    const payload = decodeJwtPayload(trimmedToken)
    const nextUser = normalizeUserClaims(payload)

    if (nextUser.expiresAt && nextUser.expiresAt < Date.now()) {
      throw new Error('This access token has expired. Request a fresh JWT.')
    }

    persistAuthStorage(trimmedToken, nextUser)
    setAuthState({
      token: trimmedToken,
      user: nextUser,
    })
  }, [])

  const signOut = useCallback(() => {
    clearAuthStorage()
    setAuthState({
      token: null,
      user: null,
    })
  }, [])

  const value = useMemo(
    () => ({
      token: authState.token,
      user: authState.user,
      isAuthenticated: Boolean(authState.token),
      signIn,
      signOut,
    }),
    [authState, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
