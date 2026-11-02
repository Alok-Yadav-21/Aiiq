'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { MessageSquare, Send, Loader2, User } from 'lucide-react'
import { RichText } from '@/components/ui/rich-text'

type Msg = { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  'Explain the main idea in simple terms',
  'What are the most examinable points here?',
  'Give me an analogy for the hardest concept',
]

export function AskPanel({
  subjectId,
  subjectTitle,
  hasMaterials,
}: {
  subjectId: string
  subjectTitle: string
  hasMaterials: boolean
}) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streaming])

  async function send(text: string) {
    const question = text.trim()
    if (!question || streaming) return

    setMessages((m) => [...m, { role: 'user', content: question }, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, subjectId, sessionId }),
      })

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Chat is unavailable right now')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        // SSE frames are separated by a blank line; keep any partial tail.
        const frames = buffer.split('\n\n')
        buffer = frames.pop() ?? ''

        for (const frame of frames) {
          const line = frame.split('\n').find((l) => l.startsWith('data: '))
          if (!line) continue
          try {
            const evt = JSON.parse(line.slice(6))
            if (evt.error) throw new Error(evt.error)
            if (evt.delta) {
              setMessages((m) => {
                const copy = [...m]
                copy[copy.length - 1] = {
                  role: 'assistant',
                  content: copy[copy.length - 1].content + evt.delta,
                }
                return copy
              })
            }
            if (evt.done && evt.sessionId) setSessionId(evt.sessionId)
          } catch {
            /* partial frame — wait for more bytes */
          }
        }
      }
    } catch (err) {
      // Drop the empty assistant bubble so the transcript isn't left dangling.
      setMessages((m) => {
        const copy = [...m]
        if (copy.length && copy[copy.length - 1].role === 'assistant' && !copy[copy.length - 1].content) {
          copy.pop()
        }
        return copy
      })
      toast.error('Could not get an answer', err instanceof Error ? err.message : 'Please try again')
    } finally {
      setStreaming(false)
    }
  }

  if (!hasMaterials) {
    return (
      <div className="surface-card p-10 text-center">
        <span className="h-12 w-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-5 w-5 text-gold-700" />
        </span>
        <h3 className="font-bold text-ink mb-1.5">Ask about this material</h3>
        <p className="text-sm text-ink-muted max-w-sm mx-auto leading-relaxed">
          Upload study material first. Answers are drawn from your own documents,
          so there is nothing to ask about yet.
        </p>
      </div>
    )
  }

  return (
    <div className="surface-card flex flex-col h-[560px] overflow-hidden">
      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <span className="h-12 w-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mb-4">
              <MessageSquare className="h-5 w-5 text-gold-700" />
            </span>
            <h3 className="font-bold text-ink mb-1.5">Ask about {subjectTitle}</h3>
            <p className="text-sm text-ink-muted max-w-sm mb-6 leading-relaxed">
              Answers come from your uploaded material — not from the open internet.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-[13px] text-ink-secondary surface-sunken px-4 py-2.5 hover:border-gold-300 hover:text-ink transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex gap-3', m.role === 'user' && 'justify-end')}
            >
              {m.role === 'assistant' && (
                <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-gold-light to-gold-deep flex items-center justify-center flex-shrink-0 text-[10px] font-black text-white">
                  AI
                </span>
              )}
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap',
                  m.role === 'user'
                    ? 'bg-gold-deep text-white'
                    : 'surface-sunken text-ink-secondary',
                )}
              >
                {m.content ? (
                  m.role === 'assistant' ? <RichText>{m.content}</RichText> : m.content
                ) : (
                  <span className="flex items-center gap-2 text-ink-faint">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                  </span>
                )}
              </div>
              {m.role === 'user' && (
                <span className="h-7 w-7 rounded-lg surface-sunken flex items-center justify-center flex-shrink-0">
                  <User className="h-3.5 w-3.5 text-ink-muted" />
                </span>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="border-t border-line-warm p-4 flex items-end gap-2.5"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          rows={1}
          placeholder="Ask a question about this material…"
          className="input-light flex-1 px-4 py-2.5 text-sm resize-none max-h-32"
          disabled={streaming}
        />
        <Button type="submit" size="icon" disabled={!input.trim() || streaming}>
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
