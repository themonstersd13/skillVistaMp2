import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MicVisualizer from '../components/InterviewArena/MicVisualizer'
import HardwareTester from '../components/PreCheck/HardwareTester'
import { useInterview } from '../context/InterviewContext'
import { clearInterviewPreferences, loadInterviewPreferences } from '../services/storage'
import { CheckCircle2, Mic, MicOff, Play, Square, Volume2 } from 'lucide-react'

function LiveInterviewArena() {
  const navigate = useNavigate()
  const streamRef = useRef(null)
  const videoRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const startTimeRef = useRef(0)
  const [mediaStream, setMediaStream] = useState(null)
  const [hardwareReport, setHardwareReport] = useState(null)
  const [startingSession, setStartingSession] = useState(false)
  const [timerLabel, setTimerLabel] = useState('00:00')
  const [preferences, setPreferences] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recDuration, setRecDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [localError, setLocalError] = useState('')
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
    submitAudio,
  } = useInterview()

  useEffect(() => {
    const stored = loadInterviewPreferences()
    if (!stored) {
      navigate('/app/setup', { replace: true })
      return
    }
    setPreferences(stored)
  }, [navigate])

  // Session timer
  useEffect(() => {
    if (!sessionStartedAt) { setTimerLabel('00:00'); return undefined }
    const intervalId = window.setInterval(() => {
      const diffSeconds = Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000))
      setTimerLabel(`${String(Math.floor(diffSeconds / 60)).padStart(2, '0')}:${String(diffSeconds % 60).padStart(2, '0')}`)
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [sessionStartedAt])

  // Recording timer
  useEffect(() => {
    if (!isRecording) return undefined
    const interval = window.setInterval(() => setRecDuration(Date.now() - startTimeRef.current), 250)
    return () => window.clearInterval(interval)
  }, [isRecording])

  // Cleanup
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      window.speechSynthesis?.cancel()
    }
  }, [])

  // Attach webcam to video
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream
    }
  }, [mediaStream])

  // Speak question
  useEffect(() => {
    if (!currentQuestion || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(currentQuestion)
    u.rate = 1
    u.pitch = 1
    window.speechSynthesis.speak(u)
    return () => window.speechSynthesis?.cancel()
  }, [currentQuestion])

  const handleHardwareReady = (stream, report) => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = stream
    setMediaStream(stream)
    setHardwareReport(report)
  }

  const handleStartSession = async () => {
    if (!preferences) { navigate('/app/setup', { replace: true }); return }
    setStartingSession(true)
    try {
      await startSession({ interviewType: preferences.interviewType, focusArea: preferences.focusArea })
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

  const toggleMute = () => {
    if (!mediaStream) return
    const audioTracks = mediaStream.getAudioTracks()
    audioTracks.forEach((t) => { t.enabled = !t.enabled })
    setIsMuted(!isMuted)
  }

  // Recording
  const recorderMimeType = typeof window !== 'undefined' && window.MediaRecorder?.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : (typeof window !== 'undefined' && window.MediaRecorder?.isTypeSupported('audio/webm') ? 'audio/webm' : '')

  const startRecording = () => {
    setLocalError('')
    if (!mediaStream) { setLocalError('Run hardware check first.'); return }
    if (!window.MediaRecorder) { setLocalError('MediaRecorder not supported.'); return }
    const audioTracks = mediaStream.getAudioTracks()
    if (!audioTracks.length) { setLocalError('No microphone available.'); return }
    const recorder = new MediaRecorder(new MediaStream(audioTracks), recorderMimeType ? { mimeType: recorderMimeType } : {})
    chunksRef.current = []
    startTimeRef.current = Date.now()
    setRecDuration(0)
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = async () => {
      const elapsed = Date.now() - startTimeRef.current
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || recorderMimeType || 'audio/webm' })
      try {
        await submitAudio({ blob, durationMs: elapsed, mimeType: blob.type })
      } catch (error) {
        setLocalError(error.response?.data?.message ?? error.message)
      } finally {
        setIsRecording(false)
      }
    }
    recorder.onerror = (e) => { setLocalError(e.error?.message ?? 'Recording failed.'); setIsRecording(false) }
    recorderRef.current = recorder
    recorder.start(400)
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  const formatDuration = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000))
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  if (!preferences) return null

  // Pre-check screen
  if (!mediaStream) {
    return (
      <section className="h-full">
        <HardwareTester onReady={handleHardwareReady} />
      </section>
    )
  }

  return (
    <section className="h-full flex flex-col relative">
      {/* ── Question Overlay (top) ── */}
      <div className="sv-card p-3 mb-2.5 animate-fade-in" style={{ minHeight: 'auto' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="sv-badge sv-badge-primary">
              {preferences.interviewType === 'tech' ? 'Technical' : 'Non-Technical'}
            </span>
            <span className="sv-badge sv-badge-muted">Q{questionHistory.length || 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="sv-pill text-xs font-mono" style={{ color: 'var(--app-text)' }}>{timerLabel}</span>
            <span className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-success-500' : 'bg-warning-500'}`} style={{ boxShadow: connectionState === 'connected' ? '0 0 8px #10B981' : '0 0 8px #F59E0B' }} />
          </div>
        </div>

        <div className="mt-2.5 rounded-lg p-3" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
          {currentQuestion ? (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--app-text)' }}>
              {currentQuestion}
              {isThinking && <span className="typing-cursor ml-1 inline-block" style={{ color: 'var(--primary)' }}>|</span>}
            </p>
          ) : (
            <p className="text-sm" style={{ color: 'var(--app-text-soft)' }}>
              {sessionId ? 'Waiting for the first question...' : 'Press Start to begin the interview.'}
            </p>
          )}
        </div>
      </div>

      {/* ── Main Video / Visualizer Area ── */}
      <div className="flex-1 min-h-0 sv-card overflow-hidden relative flex items-center justify-center" style={{ background: '#0B1120' }}>
        {/* Webcam Feed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* AI Thinking Overlay */}
        {isThinking && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(15,23,42,0.7)' }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--primary)', animation: 'pulse-glow 2s ease-in-out infinite' }}>
                <Volume2 className="h-7 w-7 text-white" />
              </div>
              <p className="text-sm font-medium text-white">Generating next question...</p>
            </div>
          </div>
        )}

        {/* Hardware Info Tag */}
        {hardwareReport && (
          <div className="absolute top-3 left-3 sv-pill text-[10px]" style={{ color: 'var(--app-text-muted)', backdropFilter: 'blur(8px)' }}>
            {hardwareReport.videoLabel}
          </div>
        )}

        {/* Mic Visualizer Inside Video */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
          <MicVisualizer mediaStream={mediaStream} isActive={isRecording} />
        </div>
      </div>

      {/* ── Floating Dock (bottom center) ── */}
      <div className="flex justify-center mt-2.5">
        <div className="sv-dock">
          {/* Timer */}
          {isRecording && (
            <span className="text-xs font-mono font-semibold" style={{ color: '#FB7185' }}>
              ● {formatDuration(recDuration)}
            </span>
          )}

          {/* Start Session (if no session yet) */}
          {!sessionId && (
            <button
              type="button"
              onClick={handleStartSession}
              disabled={startingSession}
              className="sv-btn-primary py-2 px-4 text-xs"
            >
              <Play className="h-3.5 w-3.5" />
              {startingSession ? 'Starting...' : 'Start Interview'}
            </button>
          )}

          {/* Record */}
          {sessionId && !isRecording && (
            <button
              type="button"
              onClick={startRecording}
              disabled={!sessionId || submittingAudio || isThinking}
              className="sv-btn-success py-2 px-4 text-xs"
            >
              <Mic className="h-3.5 w-3.5" />
              Record
            </button>
          )}

          {/* Stop */}
          {isRecording && (
            <button
              type="button"
              onClick={stopRecording}
              className="sv-btn-danger py-2 px-4 text-xs"
            >
              <Square className="h-3 w-3" />
              Stop
            </button>
          )}

          {/* Mute */}
          <button
            type="button"
            onClick={toggleMute}
            className={`sv-btn-secondary py-2 px-3 text-xs ${isMuted ? 'border-danger-500/40' : ''}`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="h-3.5 w-3.5" style={{ color: '#E11D48' }} /> : <Mic className="h-3.5 w-3.5" />}
          </button>

          {/* Finish */}
          {sessionId && (
            <button type="button" onClick={handleFinish} className="sv-btn-secondary py-2 px-4 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Finish
            </button>
          )}

          {/* Retry */}
          {sessionId && connectionState !== 'connected' && (
            <button type="button" onClick={reconnect} className="sv-btn-secondary py-2 px-3 text-xs">
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {(lastError || localError) && (
        <div className="mt-2 sv-card p-3 text-xs" style={{ borderColor: 'rgba(225,29,72,0.3)', color: '#FB7185' }}>
          {lastError || localError}
        </div>
      )}

      {/* Upload Status */}
      {submittingAudio && (
        <div className="mt-2 sv-card p-2.5 text-xs text-center" style={{ color: 'var(--app-text-muted)' }}>
          Uploading audio...
        </div>
      )}
    </section>
  )
}

export default LiveInterviewArena
