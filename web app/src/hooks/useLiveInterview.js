import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { io } from 'socket.io-client'
import api from '../services/api'
import {
  clearInterviewStorage,
  loadInterviewStorage,
  persistInterviewStorage,
} from '../services/storage'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000'
const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH ?? '/socket.io'

function extractQuestionText(payload) {
  if (!payload) {
    return ''
  }

  return payload.text ?? payload.question ?? payload.content ?? ''
}

function createEvent(message, tone = 'neutral') {
  return {
    id: crypto.randomUUID(),
    message,
    tone,
    createdAt: Date.now(),
  }
}

export function useLiveInterview({ token, enabled }) {
  const socketRef = useRef(null)
  const sessionRef = useRef(null)
  const [sessionId, setSessionId] = useState(null)
  const [sessionStartedAt, setSessionStartedAt] = useState(null)
  const [connectionState, setConnectionState] = useState('idle')
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [questionHistory, setQuestionHistory] = useState([])
  const [eventFeed, setEventFeed] = useState([createEvent('Waiting for a secure session.')])
  const [isThinking, setIsThinking] = useState(false)
  const [submittingAudio, setSubmittingAudio] = useState(false)
  const [isSessionLive, setIsSessionLive] = useState(false)
  const [lastError, setLastError] = useState('')
  const [lastAnswerMeta, setLastAnswerMeta] = useState(null)

  const pushEvent = useCallback((message, tone = 'neutral') => {
    setEventFeed((previous) => [createEvent(message, tone), ...previous].slice(0, 6))
  }, [])

  const attachQuestion = useCallback((incoming, mode = 'replace') => {
    const nextText = extractQuestionText(incoming)
    const questionId = incoming?.id ?? incoming?.questionId ?? crypto.randomUUID()

    startTransition(() => {
      setCurrentQuestion((previous) => (mode === 'append' ? `${previous}${nextText}` : nextText))
      setQuestionHistory((previous) => {
        const previousQuestion = previous[0]
        const mergedText =
          mode === 'append' && previousQuestion?.id === questionId
            ? `${previousQuestion.text}${nextText}`
            : nextText

        const nextEntry = {
          id: questionId,
          text: mergedText,
          receivedAt: Date.now(),
        }

        if (mode === 'append' && previousQuestion?.id === questionId) {
          return [nextEntry, ...previous.slice(1)]
        }

        return [nextEntry, ...previous].slice(0, 8)
      })
    })
  }, [])

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  const resetSession = useCallback(() => {
    sessionRef.current = null
    clearInterviewStorage()
    disconnectSocket()
    setSessionId(null)
    setSessionStartedAt(null)
    setConnectionState('idle')
    setCurrentQuestion('')
    setQuestionHistory([])
    setEventFeed([createEvent('Waiting for a secure session.')])
    setIsThinking(false)
    setSubmittingAudio(false)
    setIsSessionLive(false)
    setLastError('')
    setLastAnswerMeta(null)
  }, [disconnectSocket])

  const connectSocket = useCallback(
    (activeSessionId) => {
      if (!token || !activeSessionId) {
        return
      }

      disconnectSocket()
      setConnectionState('connecting')
      setLastError('')

      const socket = io(SOCKET_URL, {
        path: SOCKET_PATH,
        transports: ['websocket'],
        auth: {
          token,
          sessionId: activeSessionId,
        },
        query: {
          session: activeSessionId,
        },
      })

      socketRef.current = socket

      socket.on('connect', () => {
        setConnectionState('connected')
        setIsSessionLive(true)
        pushEvent(`Connected to session ${activeSessionId}.`, 'success')
      })

      socket.on('disconnect', (reason) => {
        setConnectionState(reason === 'io client disconnect' ? 'idle' : 'reconnecting')
        setIsSessionLive(false)
        pushEvent(`Socket disconnected: ${reason}.`, 'warning')
      })

      socket.on('connect_error', (error) => {
        setConnectionState('error')
        setLastError(error.message)
        pushEvent(`Realtime connection failed: ${error.message}`, 'danger')
      })

      socket.on('session_resumed', (payload) => {
        const resumedQuestion = extractQuestionText(payload?.currentQuestion)

        if (resumedQuestion) {
          setCurrentQuestion(resumedQuestion)
        }

        setSessionStartedAt(payload?.startedAt ? new Date(payload.startedAt).getTime() : Date.now())
        pushEvent('Recovered an in-progress session from browser storage.', 'success')
      })

      socket.on('receive_question', (payload) => {
        setIsThinking(false)
        attachQuestion(payload, payload?.mode === 'append' ? 'append' : 'replace')
        pushEvent('A fresh prompt streamed in from the backend.', 'success')
      })

      socket.on('question_chunk', (payload) => {
        setIsThinking(false)
        attachQuestion(payload, 'append')
      })

      socket.on('ai_thinking', (payload) => {
        const nextThinking =
          typeof payload?.thinking === 'boolean' ? payload.thinking : payload?.status !== 'done'

        setIsThinking(nextThinking)

        if (nextThinking) {
          pushEvent('AI is generating the next question.', 'neutral')
        }
      })

      socket.on('answer_received', (payload) => {
        setSubmittingAudio(false)
        setIsThinking(true)
        setLastAnswerMeta(payload ?? { receivedAt: Date.now() })
        pushEvent('Answer uploaded. Awaiting the next adaptive question.', 'neutral')
      })

      socket.on('interview_finished', () => {
        setIsThinking(false)
        setIsSessionLive(false)
        pushEvent('Interview finished. Evaluation generation has started.', 'success')
      })
    },
    [attachQuestion, disconnectSocket, pushEvent, token],
  )

  useEffect(() => {
    if (!enabled || !token) {
      resetSession()
      return
    }

    const cached = loadInterviewStorage()

    if (cached?.sessionId) {
      sessionRef.current = cached.sessionId
      setSessionId(cached.sessionId)
      setSessionStartedAt(cached.startedAt ?? Date.now())
      connectSocket(cached.sessionId)
      pushEvent('Attempting session recovery from browser storage.', 'neutral')
    }

    return () => {
      disconnectSocket()
    }
  }, [connectSocket, disconnectSocket, enabled, pushEvent, resetSession, token])

  const startSession = useCallback(async ({ interviewType, focusArea }) => {
    if (!token) {
      throw new Error('Authentication is required before starting a session.')
    }

    pushEvent('Requesting a fresh interview session from the API gateway.', 'neutral')
    setLastError('')

    try {
      const response = await api.post('/interview/start', {
        interview_type: interviewType,
        focus_area: focusArea,
      })
      const nextSessionId = response.data?.sessionId ?? response.data?.id
      const firstQuestion = extractQuestionText(response.data?.question)
      const nextStartedAt = response.data?.startedAt
        ? new Date(response.data.startedAt).getTime()
        : Date.now()

      if (!nextSessionId) {
        throw new Error('The backend did not return a sessionId.')
      }

      sessionRef.current = nextSessionId
      persistInterviewStorage(nextSessionId, nextStartedAt)
      setSessionId(nextSessionId)
      setSessionStartedAt(nextStartedAt)

      if (firstQuestion) {
        setCurrentQuestion(firstQuestion)
        setQuestionHistory([
          {
            id: crypto.randomUUID(),
            text: firstQuestion,
            receivedAt: Date.now(),
          },
        ])
      }

      connectSocket(nextSessionId)
      return nextSessionId
    } catch (error) {
      const message = error.response?.data?.message ?? error.message
      setLastError(message)
      pushEvent(`Unable to start interview: ${message}`, 'danger')
      throw error
    }
  }, [connectSocket, pushEvent, token])

  const submitAudio = useCallback(
    async ({ blob, durationMs, mimeType }) => {
      const activeSessionId = sessionRef.current

      if (!activeSessionId) {
        throw new Error('Start a session before submitting audio.')
      }

      setSubmittingAudio(true)
      setIsThinking(true)
      pushEvent('Uploading audio response to the backend.', 'neutral')

      const socket = socketRef.current

      if (socket?.connected) {
        try {
          await new Promise((resolve, reject) => {
            socket.timeout(20000).emit(
              'submit_audio',
              {
                sessionId: activeSessionId,
                blob,
                mimeType,
                durationMs,
              },
              (error, acknowledgement) => {
                if (error || acknowledgement?.ok === false) {
                  reject(error ?? new Error(acknowledgement?.message ?? 'Socket upload failed.'))
                  return
                }

                resolve(acknowledgement)
              },
            )
          })

          return
        } catch {
          pushEvent('Socket upload failed, retrying over HTTP fallback.', 'warning')
        }
      }

      const formData = new FormData()
      formData.append('audio', blob, `answer.${mimeType?.split('/')[1] ?? 'webm'}`)
      formData.append('sessionId', activeSessionId)
      formData.append('durationMs', String(durationMs))

      const response = await api.post(`/interview/${activeSessionId}/audio`, formData)
      const payload = response.data ?? {}

      setSubmittingAudio(false)
      setLastAnswerMeta(payload.ack ?? { receivedAt: Date.now() })

      if (payload.finished) {
        setIsThinking(false)
        setIsSessionLive(false)
        pushEvent('Answer uploaded over HTTP fallback. Interview finished and evaluation started.', 'success')
        return
      }

      if (payload.next_question) {
        attachQuestion(payload.next_question, payload.next_question?.mode === 'append' ? 'append' : 'replace')
      }

      setIsThinking(false)
      pushEvent('Answer uploaded over HTTP fallback and the next question was recovered.', 'success')
    },
    [attachQuestion, pushEvent],
  )

  const reconnect = useCallback(() => {
    if (sessionRef.current) {
      connectSocket(sessionRef.current)
    }
  }, [connectSocket])

  const endSession = useCallback(async () => {
    if (!sessionRef.current) {
      return
    }

    try {
      await api.post(`/interview/${sessionRef.current}/complete`)
    } catch {
      pushEvent('The completion request failed, but the local session was cleared.', 'warning')
    } finally {
      resetSession()
    }
  }, [pushEvent, resetSession])

  return useMemo(
    () => ({
      sessionId,
      sessionStartedAt,
      connectionState,
      currentQuestion,
      questionHistory,
      eventFeed,
      isThinking,
      submittingAudio,
      isSessionLive,
      lastError,
      lastAnswerMeta,
      startSession,
      submitAudio,
      reconnect,
      endSession,
      resetSession,
    }),
    [
      connectionState,
      currentQuestion,
      endSession,
      eventFeed,
      isSessionLive,
      isThinking,
      lastAnswerMeta,
      lastError,
      questionHistory,
      reconnect,
      resetSession,
      sessionId,
      sessionStartedAt,
      startSession,
      submitAudio,
      submittingAudio,
    ],
  )
}
