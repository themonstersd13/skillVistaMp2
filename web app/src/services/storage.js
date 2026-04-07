const STORAGE_KEYS = {
  token: 'skillvista.auth.token',
  user: 'skillvista.auth.user',
  sessionId: 'skillvista.interview.sessionId',
  sessionStartedAt: 'skillvista.interview.startedAt',
  interviewPreferences: 'skillvista.interview.preferences',
}

export function persistAuthStorage(token, user) {
  sessionStorage.setItem(STORAGE_KEYS.token, token)
  sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
}

export function loadAuthStorage() {
  const token = sessionStorage.getItem(STORAGE_KEYS.token)
  const user = sessionStorage.getItem(STORAGE_KEYS.user)

  return {
    token,
    user: user ? JSON.parse(user) : null,
  }
}

export function getStoredToken() {
  return sessionStorage.getItem(STORAGE_KEYS.token)
}

export function clearAuthStorage() {
  sessionStorage.removeItem(STORAGE_KEYS.token)
  sessionStorage.removeItem(STORAGE_KEYS.user)
}

export function persistInterviewStorage(sessionId, startedAt) {
  sessionStorage.setItem(STORAGE_KEYS.sessionId, sessionId)

  if (startedAt) {
    sessionStorage.setItem(STORAGE_KEYS.sessionStartedAt, String(startedAt))
  }
}

export function loadInterviewStorage() {
  const sessionId = sessionStorage.getItem(STORAGE_KEYS.sessionId)
  const startedAt = sessionStorage.getItem(STORAGE_KEYS.sessionStartedAt)

  if (!sessionId) {
    return null
  }

  return {
    sessionId,
    startedAt: startedAt ? Number(startedAt) : null,
  }
}

export function clearInterviewStorage() {
  sessionStorage.removeItem(STORAGE_KEYS.sessionId)
  sessionStorage.removeItem(STORAGE_KEYS.sessionStartedAt)
}

export function persistInterviewPreferences(preferences) {
  sessionStorage.setItem(STORAGE_KEYS.interviewPreferences, JSON.stringify(preferences))
}

export function loadInterviewPreferences() {
  const raw = sessionStorage.getItem(STORAGE_KEYS.interviewPreferences)
  return raw ? JSON.parse(raw) : null
}

export function clearInterviewPreferences() {
  sessionStorage.removeItem(STORAGE_KEYS.interviewPreferences)
}
