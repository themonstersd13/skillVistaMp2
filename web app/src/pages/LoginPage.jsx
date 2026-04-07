import { ShieldCheck, Sparkles, Webcam, Waves } from 'lucide-react'
import LoginPanel from '../components/auth/LoginPanel'

const portalHighlights = [
  {
    icon: ShieldCheck,
    title: 'JWT-gated interview access',
    description:
      'Candidates enter only with faculty-issued tokens and the portal keeps auth state in a browser session.',
  },
  {
    icon: Webcam,
    title: 'Mandatory hardware verification',
    description:
      'Camera and microphone checks happen before the interview starts so the live WebSocket session begins on verified devices.',
  },
  {
    icon: Waves,
    title: 'Realtime audio answer pipeline',
    description:
      'Answers are recorded through MediaRecorder and delivered to the backend as secure blobs when the candidate stops speaking.',
  },
]

function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 text-slate-100 sm:px-8 lg:px-12">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel relative overflow-hidden rounded-[32px] border border-white/10 p-8 sm:p-10 lg:p-12">
          <div className="absolute inset-0 grid-fade opacity-30" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-2 text-xs font-medium uppercase tracking-[0.32em] text-cyan-300">
                <Sparkles className="h-4 w-4" />
                SKILLVISTA Candidate Terminal
              </div>

              <div className="max-w-2xl space-y-5">
                <p className="font-mono text-sm uppercase tracking-[0.4em] text-slate-300/70">
                  Adaptive mock interviews for engineers
                </p>
                <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                  A distraction-free interview arena that streams every prompt live from the backend.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-300/82 sm:text-lg">
                  This portal holds no hardcoded question bank. Once authenticated, it becomes a secure terminal for your
                  camera, microphone, and live session link to the AI interview engine.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {portalHighlights.map((highlight) => {
                const HighlightIcon = highlight.icon

                return (
                  <article
                    key={highlight.title}
                  className="rounded-3xl border border-white/8 bg-white/4 p-5 transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="mb-4 inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-300/12 p-3 text-cyan-300">
                      <HighlightIcon className="h-5 w-5" />
                    </div>
                    <h2 className="mb-2 text-lg font-semibold text-slate-100">{highlight.title}</h2>
                    <p className="text-sm leading-7 text-slate-300/72">{highlight.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <aside className="flex items-center">
          <LoginPanel />
        </aside>
      </div>
    </main>
  )
}

export default LoginPage
