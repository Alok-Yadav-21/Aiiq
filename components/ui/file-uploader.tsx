'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileText, Image as ImageIcon, FileType, Presentation, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type MaterialType = 'PDF' | 'DOCX' | 'PPTX' | 'IMAGE' | 'TEXT'
type Status = 'pending' | 'uploading' | 'done' | 'error'

interface QueuedFile {
  id: string
  file: File
  type: MaterialType
  status: Status
  message?: string
}

const ACCEPT = '.pdf,.docx,.pptx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,.gif'
const MAX_BYTES = 25 * 1024 * 1024

function detectType(file: File): MaterialType | null {
  const name = file.name.toLowerCase()
  const mime = file.type
  if (name.endsWith('.pdf') || mime === 'application/pdf') return 'PDF'
  if (name.endsWith('.docx') || mime.includes('wordprocessingml')) return 'DOCX'
  if (name.endsWith('.pptx') || mime.includes('presentationml')) return 'PPTX'
  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/.test(name)) return 'IMAGE'
  if (/\.(txt|md|csv)$/.test(name) || mime.startsWith('text/')) return 'TEXT'
  return null
}

function iconFor(type: MaterialType) {
  if (type === 'IMAGE') return ImageIcon
  if (type === 'PPTX') return Presentation
  if (type === 'PDF') return FileType
  return FileText
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result || ''))
    r.onerror = () => reject(new Error('Could not read file'))
    r.readAsText(file)
  })
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const result = String(r.result || '')
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    r.onerror = () => reject(new Error('Could not read file'))
    r.readAsDataURL(file)
  })
}

export function FileUploader({
  subjectId,
  onUploaded,
}: {
  subjectId: string
  onUploaded?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [busy, setBusy] = useState(false)

  const addFiles = useCallback((files: FileList | File[]) => {
    const next: QueuedFile[] = []
    for (const file of Array.from(files)) {
      const type = detectType(file)
      if (!type) {
        next.push({ id: crypto.randomUUID(), file, type: 'TEXT', status: 'error', message: 'Unsupported file type' })
        continue
      }
      if (file.size > MAX_BYTES) {
        next.push({ id: crypto.randomUUID(), file, type, status: 'error', message: 'File exceeds 25MB' })
        continue
      }
      next.push({ id: crypto.randomUUID(), file, type, status: 'pending' })
    }
    setQueue((q) => [...q, ...next])
    // Auto-start upload for valid files.
    void uploadAll(next.filter((f) => f.status === 'pending'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId])

  const update = (id: string, patch: Partial<QueuedFile>) =>
    setQueue((q) => q.map((f) => (f.id === id ? { ...f, ...patch } : f)))

  async function uploadOne(item: QueuedFile) {
    update(item.id, { status: 'uploading', message: undefined })
    try {
      const content = item.type === 'TEXT' ? await readAsText(item.file) : await readAsBase64(item.file)
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          type: item.type,
          content,
          fileName: item.file.name,
          mimeType: item.file.type || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      update(item.id, { status: 'done', message: json.data?.message })
    } catch (err) {
      update(item.id, { status: 'error', message: err instanceof Error ? err.message : 'Upload failed' })
    }
  }

  async function uploadAll(items: QueuedFile[]) {
    if (items.length === 0) return
    setBusy(true)
    // Upload sequentially so AI/extraction load stays predictable.
    for (const item of items) {
      // eslint-disable-next-line no-await-in-loop
      await uploadOne(item)
    }
    setBusy(false)
    onUploaded?.()
  }

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-all',
          dragging
            ? 'border-allq-purple bg-allq-purple/10'
            : 'border-white/15 hover:border-allq-purple/50 hover:bg-white/[0.03]'
        )}
      >
        <div className="h-12 w-12 rounded-xl bg-allq-purple/15 flex items-center justify-center">
          <UploadCloud className="h-6 w-6 text-allq-purple" />
        </div>
        <div>
          <p className="text-white font-semibold">Drop files here or click to upload</p>
          <p className="text-xs text-slate-400 mt-1">PDF, Word, PowerPoint, text & images — up to 25MB each</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      <AnimatePresence>
        {queue.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {queue.map((item) => {
              const Icon = iconFor(item.type)
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-slate-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{item.file.name}</p>
                    <p className={cn(
                      'text-xs truncate',
                      item.status === 'error' ? 'text-allq-red' : 'text-slate-500'
                    )}>
                      {item.message ||
                        (item.status === 'uploading' ? 'Processing…'
                          : item.status === 'done' ? 'Ready'
                          : item.status === 'pending' ? 'Queued'
                          : '')}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {item.status === 'uploading' && <Loader2 className="h-4 w-4 text-allq-purple animate-spin" />}
                    {item.status === 'done' && (
                      <span className="h-6 w-6 rounded-full bg-allq-green/15 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-allq-green" />
                      </span>
                    )}
                    {item.status === 'error' && (
                      <button
                        onClick={() => setQueue((q) => q.filter((f) => f.id !== item.id))}
                        className="h-6 w-6 rounded-full bg-allq-red/15 flex items-center justify-center hover:bg-allq-red/25"
                      >
                        <X className="h-3.5 w-3.5 text-allq-red" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {busy && <p className="text-xs text-slate-500 text-center">Uploading & extracting text… you can keep adding files.</p>}
    </div>
  )
}
