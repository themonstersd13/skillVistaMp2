import { useEffect, useRef } from 'react'
import { Camera, CircleUserRound } from 'lucide-react'

function WebcamPip({ mediaStream, connectionState }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (!videoRef.current || !mediaStream) {
      return
    }

    videoRef.current.srcObject = mediaStream
  }, [mediaStream])

  return (
    <section className="glass-panel rounded-[24px] p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-300/58">Webcam</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
          <Camera className="h-3.5 w-3.5 text-cyan-300" />
          {connectionState}
        </div>
      </div>

      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] border border-white/10 bg-carbon-950">
        {mediaStream ? (
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center">
            <CircleUserRound className="h-14 w-14 text-slate-300/35" />
          </div>
        )}
        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-100 backdrop-blur">
          <span className="status-dot h-2.5 w-2.5 rounded-full bg-emerald-300 text-emerald-300" />
          Live
        </div>
      </div>
    </section>
  )
}

export default WebcamPip
