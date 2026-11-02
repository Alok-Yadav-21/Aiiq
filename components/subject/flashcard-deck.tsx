'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import {
  Layers, Sparkles, ChevronLeft, ChevronRight, RotateCcw,
  Shuffle, Check, Loader2, RefreshCw,
} from 'lucide-react'

type Card = {
  id: string
  term: string
  definition: string
  example: string | null
  topicTag: string | null
}

export function FlashcardDeck({
  subjectId,
  hasMaterials,
}: {
  subjectId: string
  hasMaterials: boolean
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [order, setOrder] = useState<number[] | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['flashcards', subjectId],
    queryFn: async () => {
      const res = await fetch(`/api/subjects/${subjectId}/flashcards`)
      if (!res.ok) throw new Error('Failed to load flashcards')
      return res.json().then((j) => j.data)
    },
  })

  const generate = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/subjects/${subjectId}/flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 20 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Generation failed')
      return json.data
    },
    onSuccess: (d) => {
      queryClient.setQueryData(['flashcards', subjectId], d)
      setIndex(0)
      setFlipped(false)
      setKnown(new Set())
      setOrder(null)
      toast.success('Flashcards ready', `${d.total} cards generated from your material.`)
    },
    onError: (e: Error) => toast.error('Could not generate flashcards', e.message),
  })

  const cards: Card[] = data?.flashcards ?? []

  const sequence = useMemo(
    () => order ?? cards.map((_, i) => i),
    [order, cards],
  )
  const card = cards[sequence[index]]

  const next = useCallback(() => {
    setFlipped(false)
    setIndex((i) => (i + 1) % Math.max(sequence.length, 1))
  }, [sequence.length])

  const prev = useCallback(() => {
    setFlipped(false)
    setIndex((i) => (i - 1 + sequence.length) % Math.max(sequence.length, 1))
  }, [sequence.length])

  // Space flips, arrows navigate — the shortcuts people expect from flashcards.
  useEffect(() => {
    if (!card) return
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        setFlipped((f) => !f)
      }
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [card, next, prev])

  /* ─── Empty states ─────────────────────────────────────────────────────── */

  if (isLoading) {
    return <div className="skeleton h-72 rounded-[1.25rem]" />
  }

  if (cards.length === 0) {
    return (
      <div className="surface-card p-10 text-center">
        <span className="h-12 w-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
          <Layers className="h-5 w-5 text-gold-700" />
        </span>
        <h3 className="font-bold text-ink mb-1.5">No flashcards yet</h3>
        <p className="text-sm text-ink-muted mb-6 max-w-sm mx-auto leading-relaxed">
          {hasMaterials
            ? 'Generate a deck of term-and-definition cards drawn straight from your uploaded material.'
            : 'Upload study material first — flashcards are built only from what you provide.'}
        </p>
        <Button
          onClick={() => generate.mutate()}
          loading={generate.isPending}
          disabled={!hasMaterials}
        >
          <Sparkles className="h-4 w-4" /> Generate flashcards
        </Button>
      </div>
    )
  }

  const knownCount = known.size
  const progress = (knownCount / cards.length) * 100

  return (
    <div>
      {/* Deck header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div>
          <p className="label-eyebrow mb-1">
            Card {index + 1} of {cards.length}
          </p>
          <p className="text-xs text-ink-faint">
            {knownCount} marked as known
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const shuffled = [...Array(cards.length).keys()].sort(() => Math.random() - 0.5)
              setOrder(shuffled)
              setIndex(0)
              setFlipped(false)
            }}
          >
            <Shuffle className="h-3.5 w-3.5" /> Shuffle
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => generate.mutate()}
            loading={generate.isPending}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 rounded-full bg-black/[0.06] overflow-hidden mb-5">
        <motion.div
          className="h-full bg-success rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Card */}
      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full text-left"
        aria-label={flipped ? 'Show term' : 'Show definition'}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${card.id}-${flipped}`}
            initial={{ opacity: 0, rotateX: flipped ? -8 : 8 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'surface-card p-8 sm:p-10 min-h-[260px] flex flex-col justify-center',
              flipped && 'bg-gold-50/60',
            )}
          >
            {card.topicTag && (
              <span className="label-eyebrow mb-4">{card.topicTag}</span>
            )}

            {!flipped ? (
              <>
                <p className="text-xl sm:text-2xl font-black text-ink tracking-tight leading-snug">
                  {card.term}
                </p>
                <p className="text-xs text-ink-faint mt-5">
                  Click, or press Space, to reveal
                </p>
              </>
            ) : (
              <>
                <p className="text-base text-ink leading-relaxed">{card.definition}</p>
                {card.example && (
                  <p className="text-sm text-ink-secondary leading-relaxed mt-4 pt-4 border-t border-line-warm">
                    <span className="label-eyebrow block mb-1.5">Example</span>
                    {card.example}
                  </p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </button>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 mt-5">
        <Button variant="ghost" onClick={prev} disabled={cards.length < 2}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        <Button
          variant={known.has(card.id) ? 'secondary' : 'primary'}
          onClick={() => {
            setKnown((prevSet) => {
              const s = new Set(prevSet)
              if (s.has(card.id)) s.delete(card.id)
              else s.add(card.id)
              return s
            })
            next()
          }}
        >
          {known.has(card.id) ? (
            <><RotateCcw className="h-4 w-4" /> Review again</>
          ) : (
            <><Check className="h-4 w-4" /> I know this</>
          )}
        </Button>

        <Button variant="ghost" onClick={next} disabled={cards.length < 2}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
