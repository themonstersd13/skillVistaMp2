import { Clock3, FileAudio2, History, Radio, ShieldCheck } from 'lucide-react'

function timeAgo(timestamp) {
  if (!timestamp) {
    return 'No answers sent yet'
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`
  }

  const minutes = Math.floor(diffSeconds / 60)
  return `${minutes}m ago`
}

function SessionOverview({ eventFeed, lastAnswerMeta, sessionId, questionHistory, connectionState }) {
  return (
    <section className="glass-panel rounded-[28px] p-5">
      <div className="mb-5">
        <p className="font-mono text-xs uppercase tracking-[0.34em] text-slate-300/58">Session overview</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-100">Realtime telemetry</h2>
      </div>

      <div className="grid gap-3">
        <div className="rounded-3xl border border-white/8 bg-white/4 p-4">
          <div className="flex items-center gap-3 text-sm text-slate-300/70">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Live session
          </div>
          <p className="mt-2 text-sm text-slate-100">{sessionId ?? 'Not started'}</p>
        </div>

        <div className="rounded-3xl border border-white/8 bg-white/4 p-4">
          <div className="flex items-center gap-3 text-sm text-slate-300/70">
            <Radio className="h-4 w-4 text-cyan-300" />
            Socket state
          </div>
          <p className="mt-2 text-sm capitalize text-slate-100">{connectionState}</p>
        </div>

        <div className="rounded-3xl border border-white/8 bg-white/4 p-4">
          <div className="flex items-center gap-3 text-sm text-slate-300/70">
            <FileAudio2 className="h-4 w-4 text-amber-300" />
            Last answer upload
          </div>
          <p className="mt-2 text-sm text-slate-100">{timeAgo(lastAnswerMeta?.receivedAt)}</p>
        </div>

        <div className="rounded-3xl border border-white/8 bg-white/4 p-4">
          <div className="flex items-center gap-3 text-sm text-slate-300/70">
            <History className="h-4 w-4 text-cyan-300" />
            Question history
          </div>
          <p className="mt-2 text-sm text-slate-100">{questionHistory.length} prompts buffered locally</p>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/8 bg-carbon-950/70 p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-100">
          <Clock3 className="h-4 w-4 text-cyan-300" />
          Event feed
        </div>
        <div className="space-y-3">
          {eventFeed.map((event) => (
            <div key={event.id} className="rounded-2xl border border-white/8 bg-white/3 px-3 py-3">
              <p className="text-sm leading-7 text-slate-200">{event.message}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.24em] text-slate-300/50">
                {new Date(event.createdAt).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SessionOverview
