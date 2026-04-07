import { useCallback, useDeferredValue, useEffect } from 'react'
import { BrainCircuit, Hash, MessageSquareText, Volume2 } from 'lucide-react'

function DynamicQuestionBoard({ question, isThinking, sessionId, questionCount }) {
  const deferredQuestion = useDeferredValue(question)

  const speakQuestion = useCallback(() => {
    if (!deferredQuestion || !window.speechSynthesis) {
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(deferredQuestion)
    utterance.rate = 1
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }, [deferredQuestion])

  useEffect(() => {
    if (!deferredQuestion) {
      return
    }

    speakQuestion()

    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [deferredQuestion, speakQuestion])

  return (
    <section className="glass-panel flex min-h-0 flex-col rounded-[24px] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-300/58">Current question</p>
          <h2 className="mt-2 text-[1.4rem] font-semibold text-slate-100 sm:text-[1.55rem]">Question</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 sm:text-sm">
            <Hash className="h-4 w-4 text-cyan-300" />
            {questionCount} prompts
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 sm:text-sm">
            <MessageSquareText className="h-4 w-4 text-emerald-300" />
            {sessionId ? 'Live session' : 'No session'}
          </div>
          <button
            type="button"
            onClick={speakQuestion}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10 sm:text-sm"
          >
            <Volume2 className="h-4 w-4 text-cyan-300" />
            Read
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-white/8 bg-carbon-950/80 p-4 sm:p-5">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300">
          <BrainCircuit className="h-4 w-4" />
          Interview question
        </div>

        <div className="flex min-h-0 flex-1 items-center rounded-[20px] border border-white/8 bg-white/3 px-4 py-4">
          {deferredQuestion ? (
            <p className="text-base leading-8 text-slate-100 sm:text-[1.05rem]">
              {deferredQuestion}
              {isThinking ? <span className="typing-cursor ml-1 text-cyan-300">|</span> : null}
            </p>
          ) : (
            <div className="grid w-full place-items-center text-center">
              <p className="text-sm text-slate-300/66">Waiting for the first question...</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default DynamicQuestionBoard
