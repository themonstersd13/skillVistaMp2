import { useEffect, useMemo, useRef, useState } from 'react'
import { Mic, Square, UploadCloud } from 'lucide-react'
import { useInterview } from '../../context/InterviewContext'

function formatDuration(durationMs) {
  const seconds = Math.max(0, Math.floor(durationMs / 1000))
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const remainder = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${remainder}`
}

function WebRTCAudioSender({ mediaStream, disabled, isThinking, submittingAudio }) {
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const startTimeRef = useRef(0)
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [localError, setLocalError] = useState('')
  const { submitAudio } = useInterview()

  useEffect(() => {
    if (!isRecording) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setDuration(Date.now() - startTimeRef.current)
    }, 250)

    return () => {
      window.clearInterval(interval)
    }
  }, [isRecording])

  const recorderMimeType = useMemo(() => {
    if (window.MediaRecorder?.isTypeSupported('audio/webm;codecs=opus')) {
      return 'audio/webm;codecs=opus'
    }

    if (window.MediaRecorder?.isTypeSupported('audio/webm')) {
      return 'audio/webm'
    }

    return ''
  }, [])

  const startRecording = () => {
    setLocalError('')

    if (!mediaStream) {
      setLocalError('Run the hardware check before recording.')
      return
    }

    if (!window.MediaRecorder) {
      setLocalError('This browser does not support MediaRecorder.')
      return
    }

    const audioTracks = mediaStream.getAudioTracks()

    if (!audioTracks.length) {
      setLocalError('No microphone track is available.')
      return
    }

    const recorder = new MediaRecorder(new MediaStream(audioTracks), recorderMimeType ? { mimeType: recorderMimeType } : {})
    chunksRef.current = []
    startTimeRef.current = Date.now()
    setDuration(0)

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    recorder.onstop = async () => {
      const elapsed = Date.now() - startTimeRef.current
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || recorderMimeType || 'audio/webm',
      })

      try {
        await submitAudio({
          blob,
          durationMs: elapsed,
          mimeType: blob.type,
        })
      } catch (error) {
        setLocalError(error.response?.data?.message ?? error.message)
      } finally {
        setIsRecording(false)
      }
    }

    recorder.onerror = (event) => {
      setLocalError(event.error?.message ?? 'The recorder failed while capturing audio.')
      setIsRecording(false)
    }

    recorderRef.current = recorder
    recorder.start(400)
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }

  return (
    <section className="glass-panel rounded-[24px] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-300/58">Your answer</p>
          <h2 className="mt-2 text-[1.4rem] font-semibold text-slate-100 sm:text-[1.55rem]">Record</h2>
        </div>

        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200">
          <span className={`status-dot h-2.5 w-2.5 rounded-full ${isRecording ? 'bg-rose-400 text-rose-400' : 'bg-emerald-300 text-emerald-300'}`} />
          {isRecording ? 'Microphone active' : 'Recorder armed'}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-[20px] border border-white/8 bg-carbon-950/75 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-300/55">Timer</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-slate-100">{formatDuration(duration)}</p>
          <p className="mt-2 text-xs text-slate-300/66">{isThinking ? 'Waiting for next prompt' : 'Record when ready'}</p>
        </div>

        <div className="rounded-[20px] border border-white/8 bg-white/4 p-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled || isRecording || submittingAudio}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-300/55"
            >
              <Mic className="h-4 w-4" />
              Start
            </button>
            <button
              type="button"
              onClick={stopRecording}
              disabled={!isRecording}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-white/3"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
          </div>

          <div className="mt-4 rounded-[18px] border border-white/8 bg-carbon-950/70 px-4 py-3">
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <UploadCloud className="h-4 w-4 text-cyan-300" />
              {submittingAudio ? 'Uploading...' : 'Uploads automatically after stop.'}
            </div>
          </div>

          {localError ? (
            <div className="mt-4 rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {localError}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default WebRTCAudioSender
