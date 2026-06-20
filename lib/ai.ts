import { GoogleGenAI, type Part } from '@google/genai'
import { createHash } from 'crypto'

// ─── Model & client (Google Gemini — free tier) ──────────────────────────────────

// gemini-2.5-flash is fast, free-tier eligible, supports JSON output + vision. Override via env.
// (gemini-2.0-flash free quota is 0 on some accounts, so 2.5-flash is the safer default.)
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

// Disable "thinking" so the entire token budget goes to the JSON answer (faster, no truncation).
const NO_THINKING = { thinkingConfig: { thinkingBudget: 0 } }

function apiKey(): string | undefined {
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
}

let _client: GoogleGenAI | null = null
function getClient(): GoogleGenAI {
  const key = apiKey()
  if (!key) throw new AINotConfiguredError()
  if (!_client) _client = new GoogleGenAI({ apiKey: key })
  return _client
}

export class AINotConfiguredError extends Error {
  constructor() {
    super('AI_NOT_CONFIGURED')
    this.name = 'AINotConfiguredError'
  }
}

export function isAIConfigured(): boolean {
  return !!apiKey()
}

// Cap source text fed to the model to bound cost/latency.
const MAX_SOURCE_CHARS = 120_000

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GeneratedQuestion {
  questionText: string
  questionType: 'MCQ' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK' | 'SHORT_ANSWER'
  options: string[] | null
  correctAnswer: string
  explanation: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
  topicTag: string
  timeLimitSeconds: number
  fingerprint: string
  sourceChunk?: string
  confidenceScore?: number
}

export interface Flashcard {
  term: string
  definition: string
  example?: string
  topicTag: string
}

export interface KeyConcept {
  concept: string
  description: string
}

export interface StudyNotes {
  overview: string
  sections: { heading: string; points: string[] }[]
  summary: string
}

export interface DocumentSummary {
  title: string
  overview: string
  keyPoints: string[]
  conceptMap: { concept: string; description: string }[]
  studyTips: string[]
  estimatedReadTime: number
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AdaptiveNarration {
  headline: string
  weakTopics: { topic: string; wrongCount: number; suggestion: string }[]
  strongTopics: string[]
  nextStepMessage: string
  recommendedFocusQuestions: string[]
}

// ─── Fingerprinting & rate limit ─────────────────────────────────────────────────

export function fingerprintQuestion(questionText: string): string {
  const normalised = questionText.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
  return createHash('sha256').update(normalised).digest('hex').slice(0, 16)
}

export function fingerprintFile(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
export function checkRateLimit(userId: string, maxPerMinute = 10): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= maxPerMinute) return false
  entry.count++
  return true
}

// ─── Core JSON generation helper ─────────────────────────────────────────────────

type UserContent = string | Part[]

function extractJson(raw: string): string {
  // responseMimeType:application/json returns clean JSON, but strip code fences just in case.
  let t = raw.trim()
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  return t
}

async function generateJSON<T>(opts: { system: string; user: UserContent; maxTokens?: number }): Promise<T> {
  const client = getClient()
  const res = await client.models.generateContent({
    model: MODEL,
    contents: opts.user,
    config: {
      systemInstruction: opts.system,
      responseMimeType: 'application/json',
      maxOutputTokens: opts.maxTokens ?? 8192,
      temperature: 0.6,
      ...NO_THINKING,
    },
  })
  const text = res.text
  if (!text) throw new Error('Empty AI response')
  return JSON.parse(extractJson(text)) as T
}

const GROUNDING = `You are AllQ's study-material generator. You create learning resources STRICTLY from the SOURCE MATERIAL provided by the user.

Absolute rules:
- Use ONLY the facts, terms, definitions, and ideas that appear in the SOURCE MATERIAL. Never introduce outside knowledge, unrelated topics, or general trivia.
- Every item you produce must be directly answerable from the SOURCE MATERIAL alone.
- If the material is too short or thin for the requested quantity, produce FEWER high-quality items rather than inventing content. Never pad with generic content.
- Write clear, accurate, exam-ready material. Use **bold** for key terms inside explanations and definitions.
- Return ONLY valid JSON in the exact shape requested — no prose, no markdown code fences.`

function clampSource(text: string): string {
  return text.slice(0, MAX_SOURCE_CHARS)
}

const TIME_BY_DIFFICULTY: Record<string, number> = { EASY: 20, MEDIUM: 30, HARD: 45, EXPERT: 60 }

// ─── Quiz Generation (grounded, type-strict) ─────────────────────────────────────

export async function generateQuizFromText(
  text: string,
  questionCount: number,
  difficulty: string,
  questionTypes: string[],
  existingFingerprints: Set<string> = new Set(),
  topicFocus?: string,
): Promise<GeneratedQuestion[]> {
  const source = clampSource(text)
  const types = questionTypes.length ? questionTypes : ['MCQ']

  const typeRules = `Allowed question types (use ONLY these, distributed as evenly as the material allows): ${types.join(', ')}.
- MCQ: exactly 4 options, exactly 1 correct; "options" is an array of 4 strings; "correctAnswer" must be one of them. Distractors must be plausible.
- TRUE_FALSE: "options" is exactly ["True","False"]; "correctAnswer" is "True" or "False".
- FILL_IN_THE_BLANK: use ___ in the questionText for the blank; "options" is null; "correctAnswer" is the missing text.
- SHORT_ANSWER (Questions & Answers): "options" is null; "correctAnswer" is a concise model answer (1-3 sentences).`

  const user = `${topicFocus ? `Focus on this topic within the material: "${topicFocus}".\n` : ''}Generate up to ${questionCount} questions from the SOURCE MATERIAL below.
Target difficulty: ${difficulty} (you may vary slightly for realism).
${typeRules}
For each question include a "sourceChunk": a short (<=15 word) quote from the material supporting the answer.

Return JSON of this exact shape:
{"questions":[{"questionText":string,"questionType":"MCQ"|"TRUE_FALSE"|"FILL_IN_THE_BLANK"|"SHORT_ANSWER","options":string[]|null,"correctAnswer":string,"explanation":string,"difficulty":"EASY"|"MEDIUM"|"HARD"|"EXPERT","topicTag":string,"sourceChunk":string}]}

SOURCE MATERIAL:
"""
${source}
"""`

  const parsed = await generateJSON<{ questions: Omit<GeneratedQuestion, 'fingerprint' | 'timeLimitSeconds'>[] }>({
    system: GROUNDING,
    user,
    maxTokens: 8192,
  })

  const allowed = new Set(types)
  const deduped: GeneratedQuestion[] = []
  for (const q of parsed.questions || []) {
    if (!allowed.has(q.questionType)) continue // strict type enforcement
    const fp = fingerprintQuestion(q.questionText)
    if (existingFingerprints.has(fp)) continue
    existingFingerprints.add(fp)
    deduped.push({
      ...q,
      options: q.options ?? null,
      timeLimitSeconds: TIME_BY_DIFFICULTY[q.difficulty] ?? 30,
      fingerprint: fp,
      confidenceScore: 0.9,
    })
    if (deduped.length >= questionCount) break
  }
  return deduped
}

// ─── Flashcards (grounded) ───────────────────────────────────────────────────────

export async function generateFlashcards(text: string, count = 20): Promise<Flashcard[]> {
  const source = clampSource(text)
  const user = `Create up to ${count} spaced-repetition flashcards from the SOURCE MATERIAL below. Each card covers one distinct, high-value concept from the material.
- term: the key concept/term/definition target (<= 6 words)
- definition: a clear explanation drawn from the material (1-2 sentences)
- example: a concrete example from the material, or null
- topicTag: 2-3 word category
No duplicate concepts.

Return JSON: {"flashcards":[{"term":string,"definition":string,"example":string|null,"topicTag":string}]}

SOURCE MATERIAL:
"""
${source}
"""`
  const parsed = await generateJSON<{ flashcards: Flashcard[] }>({ system: GROUNDING, user, maxTokens: 8192 })
  return (parsed.flashcards || []).slice(0, count).map((f) => ({ ...f, example: f.example ?? undefined }))
}

// ─── Key Concepts (grounded) ─────────────────────────────────────────────────────

export async function generateKeyConcepts(text: string, count = 12): Promise<KeyConcept[]> {
  const source = clampSource(text)
  const user = `Extract up to ${count} of the most important key concepts from the SOURCE MATERIAL below. For each: a short concept name and a 1-sentence description, both grounded in the material.

Return JSON: {"concepts":[{"concept":string,"description":string}]}

SOURCE MATERIAL:
"""
${source}
"""`
  const parsed = await generateJSON<{ concepts: KeyConcept[] }>({ system: GROUNDING, user, maxTokens: 4096 })
  return (parsed.concepts || []).slice(0, count)
}

// ─── Study Notes (grounded) ──────────────────────────────────────────────────────

export async function generateStudyNotes(text: string): Promise<StudyNotes> {
  const source = clampSource(text)
  const user = `Write concise, well-structured study notes from the SOURCE MATERIAL below.
- overview: 2-3 sentence plain-English overview
- sections: 3-7 sections, each {heading, points: 3-6 bullet strings} (use **bold** for key terms)
- summary: 2-3 sentence recap of the most exam-critical takeaways
Everything must come from the material.

Return JSON: {"overview":string,"sections":[{"heading":string,"points":string[]}],"summary":string}

SOURCE MATERIAL:
"""
${source}
"""`
  return generateJSON<StudyNotes>({ system: GROUNDING, user, maxTokens: 8192 })
}

// ─── Document Summary (used by /summarise) ───────────────────────────────────────

export async function summariseDocument(text: string, title: string): Promise<DocumentSummary> {
  const source = clampSource(text)
  const user = `Summarise the SOURCE MATERIAL below for a student studying "${title}".
Return JSON: {"title":string,"overview":string,"keyPoints":string[5-8],"conceptMap":[{"concept":string,"description":string}](6-10),"studyTips":string[3-4],"estimatedReadTime":integer}
Everything must be grounded in the material.

SOURCE MATERIAL:
"""
${source}
"""`
  return generateJSON<DocumentSummary>({ system: GROUNDING, user, maxTokens: 4096 })
}

// ─── Adaptive narration (quiz results) ───────────────────────────────────────────

export async function generateAdaptiveNarration(
  quizTitle: string,
  answers: Array<{ questionText: string; topicTag: string; isCorrect: boolean; difficulty: string; correctAnswer: string; selectedAnswer: string }>,
): Promise<AdaptiveNarration> {
  const correct = answers.filter((a) => a.isCorrect).length
  const total = answers.length
  const accuracy = total ? Math.round((correct / total) * 100) : 0
  const topicPerf: Record<string, { correct: number; total: number }> = {}
  for (const a of answers) {
    if (!topicPerf[a.topicTag]) topicPerf[a.topicTag] = { correct: 0, total: 0 }
    topicPerf[a.topicTag].total++
    if (a.isCorrect) topicPerf[a.topicTag].correct++
  }
  const user = `Analyse this student's quiz performance and produce an encouraging but honest report.
Quiz: "${quizTitle}"  Score: ${correct}/${total} (${accuracy}%)
Topic breakdown:
${Object.entries(topicPerf).map(([t, s]) => `- ${t}: ${s.correct}/${s.total}`).join('\n')}
Wrong answers:
${answers.filter((a) => !a.isCorrect).map((a) => `- Q: "${a.questionText.slice(0, 80)}" | Correct: "${a.correctAnswer}" | Student: "${a.selectedAnswer}" | Topic: ${a.topicTag}`).join('\n') || '(none — perfect score)'}

Rules: name actual topics; weakTopics only for <70% accuracy; suggestions must be actionable; recommendedFocusQuestions target weak areas.
Return JSON: {"headline":string,"weakTopics":[{"topic":string,"wrongCount":integer,"suggestion":string}],"strongTopics":string[],"nextStepMessage":string,"recommendedFocusQuestions":string[]}`
  return generateJSON<AdaptiveNarration>({ system: 'You are an adaptive learning coach. Be specific and encouraging. Return only valid JSON.', user, maxTokens: 4096 })
}

// ─── Per-question explanation ────────────────────────────────────────────────────

export async function generateExplanation(
  questionText: string,
  correctAnswer: string,
  userAnswer: string,
  context: string,
): Promise<string> {
  const client = getClient()
  const res = await client.models.generateContent({
    model: MODEL,
    contents: `Question: ${questionText}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}
Context from study material: ${context.slice(0, 1500)}

Write a clear 2-3 sentence explanation: state why "${correctAnswer}" is correct, gently clarify any misconception, and cite a relevant concept from the context. Use **bold** for key terms. Ground it in the context.`,
    config: { maxOutputTokens: 400, temperature: 0.4, ...NO_THINKING },
  })
  return res.text || 'See the study material for the explanation.'
}

// ─── Vision (image OCR via Gemini) ───────────────────────────────────────────────

export async function extractTextFromImage(
  base64Image: string,
  mimeType = 'image/jpeg',
): Promise<{ text: string; hasDiagrams: boolean; confidence: 'high' | 'medium' | 'low' }> {
  const media = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'].includes(mimeType)
    ? mimeType
    : 'image/jpeg'

  const parsed = await generateJSON<{
    text: string
    hasDiagrams: boolean
    diagramDescriptions: string[]
    confidence: 'high' | 'medium' | 'low'
    isStudyContent: boolean
  }>({
    system: 'You are a study-material digitiser. Extract text accurately and return ONLY valid JSON.',
    user: [
      { inlineData: { mimeType: media, data: base64Image } },
      {
        text: `Extract ALL text from this image accurately, preserving structure with newlines. Identify whether it contains diagrams/charts/equations, describe each briefly, and rate your extraction confidence (high/medium/low). If the image is NOT study material (e.g. a selfie or random photo), set isStudyContent to false and text to "".
Return JSON: {"text":string,"hasDiagrams":boolean,"diagramDescriptions":string[],"confidence":"high"|"medium"|"low","isStudyContent":boolean}`,
      },
    ],
    maxTokens: 4096,
  })

  if (!parsed.isStudyContent) throw new Error('IMAGE_NOT_STUDY_CONTENT')

  let fullText = parsed.text || ''
  if (parsed.hasDiagrams && parsed.diagramDescriptions?.length) {
    fullText += '\n\n[Diagram descriptions:]\n' + parsed.diagramDescriptions.join('\n')
  }
  return { text: fullText, hasDiagrams: parsed.hasDiagrams || false, confidence: parsed.confidence || 'medium' }
}

// ─── Chat (grounded, streaming) ──────────────────────────────────────────────────

function chatSystem(documentContext: string, audienceLevel: string): string {
  return `You are AllQ's AI study assistant — an expert tutor for ${audienceLevel} students.
Ground every answer in the STUDY MATERIAL below. Use **bold** for key terms, short paragraphs, and lists where helpful.
At the end of each answer add a "📌 Source:" line quoting a relevant <=15 word excerpt. If the answer is not in the material, say "⚠️ This isn't covered in your uploaded material." then answer briefly from general knowledge.
Keep responses under 250 words unless asked for more.

STUDY MATERIAL:
"""
${clampSource(documentContext).slice(0, 60_000)}
"""`
}

function toGeminiContents(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role !== 'system')
    .slice(-12)
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
}

export async function chatWithMemory(
  messages: ChatMessage[],
  documentContext: string,
  audienceLevel: 'undergraduate' | 'postgraduate' | 'professional' = 'undergraduate',
): Promise<string> {
  const client = getClient()
  const res = await client.models.generateContent({
    model: MODEL,
    contents: toGeminiContents(messages),
    config: { systemInstruction: chatSystem(documentContext, audienceLevel), maxOutputTokens: 1000, temperature: 0.5, ...NO_THINKING },
  })
  return res.text || 'I was unable to generate a response. Please try again.'
}

export async function streamChat(
  messages: ChatMessage[],
  documentContext: string,
  audienceLevel: 'undergraduate' | 'postgraduate' | 'professional' = 'undergraduate',
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()
  const client = getClient()
  const stream = await client.models.generateContentStream({
    model: MODEL,
    contents: toGeminiContents(messages),
    config: { systemInstruction: chatSystem(documentContext, audienceLevel), maxOutputTokens: 1000, temperature: 0.5, ...NO_THINKING },
  })

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.text
          if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta, done: false })}\n\n`))
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: '', done: true })}\n\n`))
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : 'stream error', done: true })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })
}

export async function extractTextFromContent(text: string): Promise<string> {
  return text.trim().replace(/\s+/g, ' ')
}
