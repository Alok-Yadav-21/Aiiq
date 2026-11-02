'use client'

import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { FileText, Sparkles, Clock, RefreshCw, Lightbulb } from 'lucide-react'
import { RichText } from '@/components/ui/rich-text'

type Summary = {
  title: string
  overview: string
  keyPoints: string[]
  conceptMap: { concept: string; description: string }[]
  studyTips: string[]
  estimatedReadTime: number
}

export function StudyNotes({
  subjectId,
  hasMaterials,
}: {
  subjectId: string
  hasMaterials: boolean
}) {
  const { toast } = useToast()

  const summarise = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/subjects/${subjectId}/summarise`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not summarise')
      return json.data as { summary: Summary; materialCount: number; totalWords: number }
    },
    onError: (e: Error) => toast.error('Could not generate notes', e.message),
  })

  const data = summarise.data
  const summary = data?.summary

  if (!summary) {
    return (
      <div className="surface-card p-10 text-center">
        <span className="h-12 w-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-5 w-5 text-gold-700" />
        </span>
        <h3 className="font-bold text-ink mb-1.5">Study notes</h3>
        <p className="text-sm text-ink-muted mb-6 max-w-sm mx-auto leading-relaxed">
          {hasMaterials
            ? 'Condense everything you have uploaded into an overview, the key points, and a concept map.'
            : 'Upload study material first — notes are written only from what you provide.'}
        </p>
        <Button
          onClick={() => summarise.mutate()}
          loading={summarise.isPending}
          disabled={!hasMaterials}
        >
          <Sparkles className="h-4 w-4" /> Generate notes
        </Button>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Overview */}
      <div className="surface-card p-7">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <p className="label-eyebrow mb-2">Overview</p>
            <h3 className="text-xl font-black text-ink tracking-tight">{summary.title}</h3>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Clock className="h-3.5 w-3.5" />
              {summary.estimatedReadTime} min read
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => summarise.mutate()}
              loading={summarise.isPending}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-ink-secondary leading-relaxed"><RichText>{summary.overview}</RichText></p>
        {data && (
          <p className="text-[11px] text-ink-faint mt-4 pt-4 border-t border-line-soft">
            From {data.materialCount} {data.materialCount === 1 ? 'material' : 'materials'}
            {data.totalWords > 0 && ` · ${data.totalWords.toLocaleString()} words`}
          </p>
        )}
      </div>

      {/* Key points */}
      {summary.keyPoints?.length > 0 && (
        <div className="surface-card p-7">
          <p className="label-eyebrow mb-4">Key points</p>
          <ul className="space-y-3">
            {summary.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm text-ink-secondary leading-relaxed">
                <span className="text-[11px] font-bold text-gold-700 tabular-nums pt-0.5 flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span><RichText>{point}</RichText></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Concept map */}
      {summary.conceptMap?.length > 0 && (
        <div className="surface-card p-7">
          <p className="label-eyebrow mb-4">Concepts</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {summary.conceptMap.map((c) => (
              <div key={c.concept} className="surface-sunken p-4">
                <p className="text-sm font-bold text-ink mb-1">{c.concept}</p>
                <p className="text-xs text-ink-secondary leading-relaxed"><RichText>{c.description}</RichText></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study tips */}
      {summary.studyTips?.length > 0 && (
        <div className="surface-card p-7">
          <p className="label-eyebrow mb-4 flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-gold-deep" /> How to study this
          </p>
          <ul className="space-y-2.5">
            {summary.studyTips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-ink-secondary leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-deep mt-1.5 flex-shrink-0" />
                <span><RichText>{tip}</RichText></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
