import { createContext, useContext, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { useLiveInterview } from '../hooks/useLiveInterview'

const InterviewContext = createContext(null)

export function InterviewProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const interview = useLiveInterview({
    token,
    enabled: isAuthenticated,
  })

  const value = useMemo(() => interview, [interview])

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>
}

export function useInterview() {
  const context = useContext(InterviewContext)

  if (!context) {
    throw new Error('useInterview must be used inside InterviewProvider')
  }

  return context
}
