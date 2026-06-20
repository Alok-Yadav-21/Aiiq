import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest, getPlanLimits } from '@/lib/auth'
import { extractTextFromImage, fingerprintFile, isAIConfigured } from '@/lib/ai'
import { extractPdf, extractDocx, extractPptx } from '@/lib/extract'
import { apiResponse, apiError } from '@/lib/utils'

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024   // 25 MB
const MIN_IMAGE_DIMENSION = 100                 // pixels — reject tiny/corrupt images
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'text/plain', 'text/markdown', 'text/csv',
])

// ─── Image quality validator ──────────────────────────────────────────────────

async function validateImage(buffer: Buffer): Promise<{ width: number; height: number; isBlurry: boolean }> {
  try {
    const sharp = (await import('sharp')).default
    const meta = await sharp(buffer).metadata()
    const width = meta.width || 0
    const height = meta.height || 0

    if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
      throw new Error(`Image is too small (${width}×${height}px). Please upload a higher quality image.`)
    }

    // Simple blur proxy: very small file size relative to dimensions suggests high compression / low quality
    const pixelCount = width * height
    const bytesPerPixel = buffer.length / pixelCount
    const isBlurry = bytesPerPixel < 0.02  // very low bytes-per-pixel → highly compressed → likely blurry

    return { width, height, isBlurry }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Image validation failed'
    if (msg.includes('too small') || msg.includes('quality')) throw err
    throw new Error('Could not read the image file. Please ensure it is a valid JPEG, PNG, or WebP.')
  }
}

// ─── POST /api/materials ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    // ── Parse body ─────────────────────────────────────────────────────────────
    let body: {
      subjectId?: string
      type?: string
      content?: string        // base64 for binary files, plain text for TEXT type
      fileName?: string
      mimeType?: string
      audienceLevel?: string
    }
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid request body', 400)
    }

    const { subjectId, type, content, fileName, mimeType, audienceLevel } = body

    // ── Input validation ───────────────────────────────────────────────────────
    if (!subjectId || typeof subjectId !== 'string') return apiError('subjectId is required', 400)
    if (!type || !['PDF', 'IMAGE', 'TEXT', 'DOCX', 'PPTX'].includes(type)) {
      return apiError('type must be one of: PDF, IMAGE, TEXT, DOCX, PPTX', 400)
    }
    // Images require AI vision (Claude) to extract text.
    if (type === 'IMAGE' && !isAIConfigured()) {
      return apiError('Image uploads need AI to be configured. Add a free GOOGLE_API_KEY, or upload a PDF/DOCX/PPTX/TXT instead.', 503)
    }
    if (!fileName || typeof fileName !== 'string') return apiError('fileName is required', 400)
    if (!content || content.trim().length === 0) return apiError('File content is empty. Please upload a non-empty file.', 400)

    // Check MIME type
    const detectedMime = mimeType || ''
    if (detectedMime && !ALLOWED_MIME_TYPES.has(detectedMime)) {
      return apiError(`File type "${detectedMime}" is not supported. Allowed: PDF, DOCX, images, plain text.`, 415)
    }

    // ── Subject access check ───────────────────────────────────────────────────
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, creatorId: payload.sub },
    })
    if (!subject) return apiError('Subject not found or access denied', 404)

    // ── Plan limits ────────────────────────────────────────────────────────────
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: payload.sub },
    })
    const limits = getPlanLimits(subscription?.plan || 'FREE')
    const planName = subscription?.plan || 'FREE'

    const existingCount = await prisma.subjectMaterial.count({ where: { subjectId } })
    if (existingCount >= limits.maxUploadsPerSubject) {
      return apiError(
        `Your ${planName} plan allows ${limits.maxUploadsPerSubject} upload(s) per subject. Upgrade to add more.`,
        403
      )
    }

    // Daily upload cap (per user, rolling 24h).
    if (limits.maxUploadsPerDay !== Infinity) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const todayCount = await prisma.subjectMaterial.count({
        where: { uploadedById: payload.sub, createdAt: { gte: since } },
      })
      if (todayCount >= limits.maxUploadsPerDay) {
        return apiError(
          `Your ${planName} plan allows ${limits.maxUploadsPerDay} uploads per day. You've reached today's limit — try again tomorrow or upgrade for more.`,
          429
        )
      }
    }

    // ── Process by file type ───────────────────────────────────────────────────
    let extractedText = ''
    let fileBuffer: Buffer | null = null
    let fileHash: string | null = null
    let wordCount = 0
    let processedMimeType = detectedMime || 'text/plain'

    if (type === 'TEXT') {
      // Plain text: no conversion needed
      extractedText = content.trim()
      if (extractedText.length === 0) {
        return apiError('Text content is empty. Please enter some study material.', 400)
      }
      wordCount = extractedText.split(/\s+/).filter(Boolean).length
    } else {
      // Binary files: decode base64
      try {
        fileBuffer = Buffer.from(content, 'base64')
      } catch {
        return apiError('Invalid file encoding. Expected base64.', 400)
      }

      if (fileBuffer.length === 0) {
        return apiError('The uploaded file is empty. Please check your file and try again.', 400)
      }
      if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
        return apiError(`File too large (${Math.round(fileBuffer.length / 1024 / 1024)}MB). Maximum is 25MB.`, 413)
      }

      // Duplicate file detection
      fileHash = fingerprintFile(fileBuffer)
      const duplicate = await prisma.subjectMaterial.findFirst({
        where: { subjectId, fileHash },
      })
      if (duplicate) {
        return apiError(
          `This file has already been uploaded to this subject as "${duplicate.fileName}". No need to upload again.`,
          409
        )
      }

      if (type === 'DOCX') {
        const r = await extractDocx(fileBuffer).catch(() => null)
        if (!r || r.text.length < 20) {
          return apiError('Could not extract meaningful text from the Word document. Is it empty, image-only, or password-protected?', 422)
        }
        extractedText = r.text
        processedMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        wordCount = r.wordCount
      } else if (type === 'PPTX') {
        const r = await extractPptx(fileBuffer).catch(() => null)
        if (!r || r.text.length < 20) {
          return apiError('Could not extract text from the PowerPoint. Is it empty or image-only?', 422)
        }
        extractedText = r.text
        processedMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        wordCount = r.wordCount
      } else if (type === 'IMAGE') {
        // Validate image quality
        const imgMeta = await validateImage(fileBuffer)
        if (imgMeta.isBlurry) {
          // Don't hard-reject, but warn and proceed — blurry may still be usable
          console.warn(`[materials] Low-quality image uploaded: ${fileName} (${imgMeta.width}×${imgMeta.height})`)
        }

        // Use GPT-4o vision for text + diagram extraction
        const base64 = fileBuffer.toString('base64')
        try {
          const vision = await extractTextFromImage(base64, mimeType || 'image/jpeg')
          extractedText = vision.text
          if (extractedText.length < 5) {
            return apiError(
              'No readable text found in this image. Please upload a clearer image or use a different format.',
              422
            )
          }
        } catch (visionErr: unknown) {
          const msg = visionErr instanceof Error ? visionErr.message : ''
          if (msg === 'IMAGE_NOT_STUDY_CONTENT') {
            return apiError(
              'This image does not appear to be study material. Please upload notes, textbooks, or diagrams.',
              422
            )
          }
          // Fallback: store without text extraction
          console.error('[materials] Vision extraction failed:', visionErr)
          extractedText = ''
        }

        processedMimeType = mimeType || 'image/jpeg'
        wordCount = extractedText.split(/\s+/).filter(Boolean).length
      } else if (type === 'PDF') {
        // Real server-side PDF text extraction (pdf-parse).
        const r = await extractPdf(fileBuffer).catch((err) => {
          console.error('[materials] PDF extraction failed:', err)
          return null
        })
        if (!r || r.text.length < 20) {
          return apiError('Could not extract text from this PDF. It may be a scanned/image-only PDF — try uploading the pages as images instead.', 422)
        }
        extractedText = r.text
        processedMimeType = 'application/pdf'
        wordCount = r.wordCount
      }
    }

    // ── Persist material ───────────────────────────────────────────────────────
    const material = await prisma.subjectMaterial.create({
      data: {
        subjectId,
        uploadedById: payload.sub,
        // MaterialType enum is PDF | IMAGE | TEXT; DOCX/PPTX are stored as TEXT.
        type: (type === 'DOCX' || type === 'PPTX') ? 'TEXT' : (type as 'PDF' | 'IMAGE' | 'TEXT'),
        status: 'READY',
        fileName,
        fileSize: fileBuffer?.length ?? Buffer.byteLength(content, 'utf8'),
        mimeType: processedMimeType,
        extractedText: extractedText || null,
        wordCount: wordCount || null,
        fileHash: fileHash ?? null,
        processingNotes: audienceLevel ? `audience:${audienceLevel}` : null,
      },
    })

    // ── Chunk text for RAG retrieval ───────────────────────────────────────────
    if (extractedText && extractedText.length > 0) {
      const chunkSize = 400       // words per chunk
      const overlapSize = 50      // overlap for context continuity
      const words = extractedText.split(/\s+/).filter(Boolean)
      const chunks: string[] = []

      for (let i = 0; i < words.length; i += chunkSize - overlapSize) {
        const chunk = words.slice(i, i + chunkSize).join(' ')
        if (chunk.trim().length > 0) chunks.push(chunk)
        if (i + chunkSize >= words.length) break
      }

      if (chunks.length > 0) {
        await prisma.materialChunk.createMany({
          data: chunks.map((chunk, index) => ({
            materialId: material.id,
            content: chunk,
            chunkIndex: index,
            tokenCount: chunk.split(/\s+/).length,
          })),
        })
      }
    }

    return apiResponse(
      {
        id: material.id,
        fileName: material.fileName,
        type: material.type,
        status: material.status,
        wordCount: material.wordCount,
        hasText: !!extractedText,
        message: extractedText
          ? `"${fileName}" uploaded successfully. ${wordCount.toLocaleString()} words extracted.`
          : `"${fileName}" uploaded. Text extraction will complete shortly.`,
      },
      201
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[materials POST]', msg)

    // Surface actionable errors to the client
    if (
      msg.includes('password-protected') ||
      msg.includes('valid .docx') ||
      msg.includes('too small') ||
      msg.includes('not study material') ||
      msg.includes('No readable text')
    ) {
      return apiError(msg, 422)
    }

    return apiError('Failed to upload material. Please try again.', 500)
  }
}
