import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { streamChat, checkRateLimit, type ChatMessage } from '@/lib/ai'
import { apiError } from '@/lib/utils'

// POST /api/ai/chat
// Streaming SSE chat with conversation memory.
//
// Body: { sessionId?: string, subjectId?: string, message: string, audienceLevel?: string }
// Response: text/event-stream — each SSE event: { delta: string, done: boolean }
// On done=true the last event also carries: { sessionId, messageId }

const MAX_HISTORY_MESSAGES = 20   // Keep last 20 messages in context
const MAX_TOKEN_GUARD = 6000      // Rough char limit for message history to avoid overflow

export async function POST(req: NextRequest) {
  try {
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    // Rate limit: 20 chat messages per minute
    if (!checkRateLimit(payload.sub, 20)) {
      return apiError('Too many requests. Please wait a moment before sending another message.', 429)
    }

    // ── Parse body ─────────────────────────────────────────────────────────────
    let body: {
      sessionId?: string
      subjectId?: string
      message?: string
      audienceLevel?: 'undergraduate' | 'postgraduate' | 'professional'
    }
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    const { sessionId, subjectId, message, audienceLevel = 'undergraduate' } = body

    if (!message || message.trim().length === 0) {
      return apiError('Message cannot be empty', 400)
    }

    if (message.length > 4000) {
      return apiError('Message is too long (max 4000 characters)', 400)
    }

    // ── Resolve or create chat session ─────────────────────────────────────────
    let chatSession = sessionId
      ? await prisma.chatSession.findFirst({
          where: { id: sessionId, userId: payload.sub },
        })
      : null

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: payload.sub,
          subjectId: subjectId ?? null,
          audienceLevel,
          title: message.slice(0, 60),
        },
      })
    }

    // ── Load conversation history ──────────────────────────────────────────────
    const history = await prisma.chatMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: 'asc' },
      take: MAX_HISTORY_MESSAGES,
      select: { role: true, content: true },
    })

    // Trim history to stay within token budget
    let historyText = ''
    const trimmedHistory: ChatMessage[] = []
    for (let i = history.length - 1; i >= 0; i--) {
      const candidate = history[i]
      historyText = candidate.content + historyText
      if (historyText.length > MAX_TOKEN_GUARD) break
      trimmedHistory.unshift({ role: candidate.role as ChatMessage['role'], content: candidate.content })
    }

    // Add current user message
    const allMessages: ChatMessage[] = [
      ...trimmedHistory,
      { role: 'user', content: message.trim() },
    ]

    // ── Load document context from subject ─────────────────────────────────────
    let documentContext = ''
    const targetSubjectId = subjectId ?? chatSession.subjectId ?? undefined

    if (targetSubjectId) {
      const subject = await prisma.subject.findFirst({
        where: {
          id: targetSubjectId,
          OR: [{ isPublic: true }, { creatorId: payload.sub }],
        },
        include: {
          materials: {
            where: { status: 'READY' },
            select: { extractedText: true, fileName: true },
            take: 5,
          },
        },
      })

      if (subject) {
        documentContext = subject.materials
          .map((m) => m.extractedText || '')
          .filter(Boolean)
          .join('\n\n---\n\n')
          .slice(0, 12000)
      }
    }

    // ── Persist user message ───────────────────────────────────────────────────
    const userMsg = await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'user',
        content: message.trim(),
        tokenCount: Math.ceil(message.length / 4),
      },
    })

    // ── Stream AI response ─────────────────────────────────────────────────────
    const aiStream = await streamChat(allMessages, documentContext, audienceLevel)

    // We need to intercept the stream to also persist the assistant message
    let fullResponse = ''
    const encoder = new TextEncoder()

    const transformedStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = aiStream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // Decode the SSE chunk and accumulate the delta
            const text = new TextDecoder().decode(value)
            const lines = text.split('\n').filter((l) => l.startsWith('data: '))
            for (const line of lines) {
              try {
                const json = JSON.parse(line.slice(6))
                if (json.delta) fullResponse += json.delta
              } catch { /* ignore parse errors on partial chunks */ }
            }

            controller.enqueue(value)
          }

          // Persist assistant response after stream ends
          if (fullResponse.length > 0) {
            await prisma.chatMessage.create({
              data: {
                sessionId: chatSession!.id,
                role: 'assistant',
                content: fullResponse,
                tokenCount: Math.ceil(fullResponse.length / 4),
              },
            }).catch((e) => console.error('[chat] Failed to persist assistant message:', e))
          }

          // Send final done event with session info
          const finalEvent = `data: ${JSON.stringify({
            delta: '',
            done: true,
            sessionId: chatSession!.id,
            userMessageId: userMsg.id,
          })}\n\n`
          controller.enqueue(encoder.encode(finalEvent))
        } catch (streamErr) {
          console.error('[chat stream error]', streamErr)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error', done: true })}\n\n`))
        } finally {
          reader.releaseLock()
          controller.close()
        }
      },
    })

    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ai/chat]', msg)

    if (msg.includes('rate limit') || msg.includes('429')) {
      return apiError('AI service busy. Please try again shortly.', 503)
    }
    return apiError('Chat request failed. Please try again.', 500)
  }
}

// GET /api/ai/chat?sessionId=xxx  — list sessions or fetch a specific session history
export async function GET(req: NextRequest) {
  try {
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Return full message history for a session
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId: payload.sub },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            select: { id: true, role: true, content: true, createdAt: true },
          },
        },
      })

      if (!session) return apiError('Chat session not found', 404)

      return Response.json({
        success: true,
        data: {
          sessionId: session.id,
          subjectId: session.subjectId,
          title: session.title,
          messages: session.messages,
          audienceLevel: session.audienceLevel,
          createdAt: session.createdAt,
        },
      })
    }

    // Return list of recent sessions for this user
    const sessions = await prisma.chatSession.findMany({
      where: { userId: payload.sub },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        subjectId: true,
        audienceLevel: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    })

    return Response.json({ success: true, data: { sessions } })
  } catch (error) {
    console.error('[ai/chat GET]', error)
    return apiError('Failed to load chat history', 500)
  }
}
