import { Bot, LoaderCircle, RadioTower, Waves } from 'lucide-react'

const connectionPalette = {
  idle: 'text-slate-300',
  connecting: 'text-amber-300',
  connected: 'text-emerald-300',
  reconnecting: 'text-amber-300',
  error: 'text-rose-300',
}

function AIVisualizer({ connectionState, isThinking, submittingAudio, sessionId }) {
  const accentClass = connectionPalette[connectionState] ?? 'text-slate-300'

  return (
    <section className="glass-panel relative overflow-hidden rounded-[28px] p-5 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(109,230,255,0.12),transparent_48%)]" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-slate-300/58">AI visualizer</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-100">Model activity</h2>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm ${accentClass}`}>
            <RadioTower className="h-4 w-4" />
            {connectionState}
          </div>
        </div>

        <div className="grid place-items-center rounded-[26px] border border-white/8 bg-carbon-950/80 px-4 py-10">
          <div className="relative flex h-44 w-44 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-cyan-300/20" />
            <div className={`absolute inset-4 rounded-full border ${isThinking ? 'border-cyan-300/35' : 'border-white/10'}`} />
            <div className={`absolute inset-10 rounded-full border ${submittingAudio ? 'border-emerald-300/35' : 'border-white/6'}`} />
            <div className="rounded-full border border-white/10 bg-white/5 p-7 text-cyan-300">
              {submittingAudio ? (
                <Waves className="h-12 w-12" />
              ) : isThinking ? (
                <LoaderCircle className="h-12 w-12 animate-spin" />
              ) : (
                <Bot className="h-12 w-12" />
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-lg font-semibold text-slate-100">
              {submittingAudio
                ? 'Transferring your answer'
                : isThinking
                  ? 'AI is thinking'
                  : sessionId
                    ? 'Listening for streamed prompts'
                    : 'Awaiting session start'}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-300/70">
              {submittingAudio
                ? 'Audio blobs are being delivered to the backend.'
                : isThinking
                  ? 'The question board will update as soon as the backend streams the next prompt.'
                  : 'Socket state stays visible here so the candidate always knows whether the live engine is ready.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AIVisualizer
