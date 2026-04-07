import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Play, RefreshCw, Volume2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DynamicQuestionBoard from '../components/InterviewArena/DynamicQuestionBoard'
import WebcamPip from '../components/InterviewArena/WebcamPip'
import WebRTCAudioSender from '../components/InterviewArena/WebRTCAudioSender'
import HardwareTester from '../components/PreCheck/HardwareTester'
import { useInterview } from '../context/InterviewContext'
import { clearInterviewPreferences, loadInterviewPreferences } from '../services/storage'

function LiveInterviewArena() {
  const navigate = useNavigate()
  const streamRef = useRef(null)
  const [mediaStream, setMediaStream] = useState(null)
  const [hardwareReport, setHardwareReport] = useState(null)
  const [startingSession, setStartingSession] = useState(false)
  const [timerLabel, setTimerLabel] = useState('00:00')
  const [preferences, setPreferences] = useState(null)
  const {
    currentQuestion,
    questionHistory,
    connectionState,
    sessionId,
    sessionStartedAt,
    isThinking,
    submittingAudio,
    lastError,
    startSession,
    reconnect,
    endSession,
  } = useInterview()

  useEffect(() => {
    const stored = loadInterviewPreferences()
    if (!stored) {
      navigate('/app/dashboard', { replace: true })
      return
    }
    setPreferences(stored)
  }, [navigate])

  useEffect(() => {
    if (!sessionStartedAt) {
      setTimerLabel('00:00')
      return undefined
    }

    const intervalId = window.setInterval(() => {
      const diffSeconds = Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000))
      const minutes = String(Math.floor(diffSeconds / 60)).padStart(2, '0')
      const seconds = String(diffSeconds % 60).padStart(2, '0')
      setTimerLabel(`${minutes}:${seconds}`)
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [sessionStartedAt])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      window.speechSynthesis?.cancel()
    }
  }, [])

  const handleHardwareReady = (stream, report) => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = stream
    setMediaStream(stream)
    setHardwareReport(report)
  }

  const handleStartSession = async () => {
    if (!preferences) {
      navigate('/app/dashboard', { replace: true })
      return
    }

    setStartingSession(true)
    try {
      await startSession({
        interviewType: preferences.interviewType,
        focusArea: preferences.focusArea,
      })
    } finally {
      setStartingSession(false)
    }
  }

  const handleFinish = async () => {
    await endSession()
    clearInterviewPreferences()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setMediaStream(null)
    setHardwareReport(null)
    navigate('/app/report')
  }

  if (!preferences) {
    return null
  }

  return (
    <section className="grid h-full gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div className="flex min-h-0 flex-col gap-3">
        {!mediaStream ? (
          <HardwareTester onReady={handleHardwareReady} />
        ) : (
          <>
            <section className="glass-panel rounded-[24px] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-300">
                    {preferences.interviewType === 'tech' ? 'Technical interview' : 'Non-technical interview'}
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold text-slate-100">{preferences.focusArea}</h1>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100">
                    {timerLabel}
                  </div>
                  {!sessionId ? (
                    <button
                      type="button"
                      onClick={handleStartSession}
                      disabled={startingSession}
                      className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-300/60"
                    >
                      <Play className="h-4 w-4" />
                      {startingSession ? 'Starting...' : 'Start'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={reconnect}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Finish
                  </button>
                </div>
              </div>

              {lastError ? (
                <div className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {lastError}
                </div>
              ) : null}
            </section>

            <div className="grid min-h-0 gap-3 xl:grid-rows-[minmax(0,1fr)_auto]">
              <DynamicQuestionBoard
                question={currentQuestion}
                isThinking={isThinking}
                sessionId={sessionId}
                questionCount={questionHistory.length}
              />

              <WebRTCAudioSender
                mediaStream={mediaStream}
                disabled={!sessionId}
                isThinking={isThinking}
                submittingAudio={submittingAudio}
              />
            </div>
          </>
        )}
      </div>

      <aside className="flex min-h-0 flex-col gap-3">
        <WebcamPip mediaStream={mediaStream} connectionState={connectionState} />
        <div className="glass-panel rounded-[24px] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
            <Volume2 className="h-4 w-4 text-cyan-300" />
            Questions are read aloud automatically
          </div>
          {hardwareReport ? (
            <div className="mt-4 space-y-2 text-xs text-slate-300/62">
              <p>{hardwareReport.videoLabel}</p>
              <p>{hardwareReport.audioLabel}</p>
            </div>
          ) : null}
        </div>
      </aside>
    </section>
  )
}

export default LiveInterviewArena
