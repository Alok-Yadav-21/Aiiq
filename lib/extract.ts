/**
 * Document text extraction.
 *
 * Turns uploaded study files (PDF, DOCX, PPTX, TXT) into plain text so the AI
 * layer can generate quizzes/flashcards/notes grounded ONLY in that text.
 * Images are handled separately via Claude vision in lib/ai.ts.
 */

export interface ExtractResult {
  text: string
  /** Pages (PDF) or slides (PPTX) when known, else null. */
  pageCount: number | null
  wordCount: number
}

function clean(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

// ─── PDF ────────────────────────────────────────────────────────────────────

export async function extractPdf(buffer: Buffer): Promise<ExtractResult> {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    const text = clean(result.text || '')
    return { text, pageCount: result.total ?? null, wordCount: countWords(text) }
  } finally {
    await parser.destroy().catch(() => {})
  }
}

// ─── DOCX ───────────────────────────────────────────────────────────────────

export async function extractDocx(buffer: Buffer): Promise<ExtractResult> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  const text = clean(result.value || '')
  return { text, pageCount: null, wordCount: countWords(text) }
}

// ─── PPTX ───────────────────────────────────────────────────────────────────

export async function extractPptx(buffer: Buffer): Promise<ExtractResult> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(buffer)

  // Slide XML files live at ppt/slides/slideN.xml — sort numerically.
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0', 10)
      const nb = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0', 10)
      return na - nb
    })

  const slideTexts: string[] = []
  for (let i = 0; i < slidePaths.length; i++) {
    const xml = await zip.files[slidePaths[i]].async('string')
    // Pull text out of <a:t>…</a:t> runs (PowerPoint's text run element).
    const runs = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) =>
      decodeXmlEntities(m[1]),
    )
    const slideText = runs.join(' ').trim()
    if (slideText) slideTexts.push(`Slide ${i + 1}: ${slideText}`)
  }

  const text = clean(slideTexts.join('\n\n'))
  return { text, pageCount: slidePaths.length, wordCount: countWords(text) }
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

// ─── Plain text ───────────────────────────────────────────────────────────────

export function extractPlainText(content: string): ExtractResult {
  const text = clean(content)
  return { text, pageCount: null, wordCount: countWords(text) }
}
