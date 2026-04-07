import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioLines, Camera, CircleCheckBig, RefreshCw, ShieldAlert } from 'lucide-react'

function AudioMeter({ mediaStream }) {
  const [level, setLevel] = useState(0)

  useEffect(() => {
    if (!mediaStream) {
      return undefined
    }

    const audioTrack = mediaStream.getAudioTracks()[0]

    if (!audioTrack) {
      return undefined
    }

    const audioContext = new window.AudioContext()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]))
    const data = new Uint8Array(analyser.frequencyBinCount)
    let frameId = 0

    analyser.fftSize = 256
    source.connect(analyser)

    const measure = () => {
      analyser.getByteFrequencyData(data)
      const average = data.reduce((sum, value) => sum + value, 0) / data.length
      setLevel(Math.min(1, average / 120))
      frameId = window.requestAnimationFrame(measure)
    }

    measure()

    return () => {
      window.cancelAnimationFrame(frameId)
      source.disconnect()
      analyser.disconnect()
      audioContext.close()
    }
  }, [mediaStream])

  return (
    <div className="mt-4 flex items-end gap-1">
      {Array.from({ length: 18 }).map((_, index) => {
        const active = index / 18 < level
        return (
          <div
            key={index}
            className={`recording-wave h-10 w-1.5 rounded-full ${
              active ? 'bg-emerald-300' : 'bg-white/10'
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          />
        )
      })}
    </div>
  )
}

function HardwareTester({ onReady }) {
  const videoRef = useRef(null)
  const [mediaStream, setMediaStream] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devices, setDevices] = useState([])

  useEffect(() => {
    if (!videoRef.current || !mediaStream) {
      return
    }

    videoRef.current.srcObject = mediaStream
  }, [mediaStream])

  const runSystemCheck = async () => {
    setLoading(true)
    setError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      })

      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const relevantDevices = allDevices.filter((device) =>
        ['audioinput', 'videoinput'].includes(device.kind),
      )
      const audioTrack = stream.getAudioTracks()[0]
      const videoTrack = stream.getVideoTracks()[0]

      setMediaStream(stream)
      setDevices(relevantDevices)

      onReady(stream, {
        audioLabel: audioTrack?.label ?? 'Default microphone',
        videoLabel: videoTrack?.label ?? 'Default camera',
        deviceCount: relevantDevices.length,
      })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setLoading(false)
    }
  }

  const checks = useMemo(
    () => [
      {
        icon: Camera,
        label: 'Camera access',
        status: mediaStream?.getVideoTracks().length ? 'Ready' : 'Pending',
      },
      {
        icon: AudioLines,
        label: 'Microphone access',
        status: mediaStream?.getAudioTracks().length ? 'Ready' : 'Pending',
      },
      {
        icon: CircleCheckBig,
        label: 'Device inventory',
        status: devices.length ? `${devices.length} devices found` : 'Scan required',
      },
    ],
    [devices.length, mediaStream],
  )

  return (
    <section className="glass-panel rounded-[32px] p-5 sm:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-slate-300/60">Pre-interview verification</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-100">Run the hardware system check</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300/74">
              The interview cannot begin until camera and microphone permissions are confirmed. We keep the verified stream
              alive for the webcam PiP and answer recorder.
            </p>
          </div>

          <div className="grid gap-3">
            {checks.map((check) => {
              const CheckIcon = check.icon

              return (
                <div key={check.label} className="rounded-3xl border border-white/8 bg-white/4 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-300">
                      <CheckIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-100">{check.label}</p>
                      <p className="text-sm text-slate-300/65">{check.status}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={runSystemCheck}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[24px] bg-cyan-300 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-300/70"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Checking devices...' : 'Run system check'}
          </button>

          {error ? (
            <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-200">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[30px] border border-white/8 bg-carbon-950/80 p-4">
          <div className="relative aspect-video overflow-hidden rounded-[24px] border border-white/10 bg-carbon-900">
            {mediaStream ? (
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-slate-300/55">
                Camera preview appears here once permissions are approved.
              </div>
            )}
          </div>

          {mediaStream ? (
            <div className="mt-4 rounded-[24px] border border-white/8 bg-white/4 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                <CircleCheckBig className="h-4 w-4" />
                Live input detected
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-300/68">
                Microphone amplitude below helps confirm the recorder can pick up your answer stream.
              </p>
              <AudioMeter mediaStream={mediaStream} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default HardwareTester
