import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const newPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
})

// ─── Subjects ────────────────────────────────────────────────────────────────

export const createSubjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  // Description is optional — subjects can be created quickly without one.
  description: z.string().max(500).optional().default(''),
  category: z.enum([
    'MATHEMATICS', 'SCIENCE', 'HISTORY', 'GEOGRAPHY', 'LANGUAGES',
    'TECHNOLOGY', 'ARTS', 'BUSINESS', 'MEDICINE', 'LAW', 'PHILOSOPHY', 'OTHER'
  ]),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  tags: z.array(z.string().max(30)).max(10).default([]),
  isPublic: z.boolean().default(true),
})

export const updateSubjectSchema = createSubjectSchema.partial()

// ─── Quiz Generation ──────────────────────────────────────────────────────────

export const generateQuizSchema = z.object({
  subjectId: z.string().cuid(),
  questionCount: z.number().int().min(1).max(100).default(10),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).default('MEDIUM'),
  questionTypes: z.array(z.enum(['MCQ', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'SHORT_ANSWER']))
    .default(['MCQ', 'TRUE_FALSE']),
  topicFocus: z.string().optional(),
})

// ─── Quiz Rooms ───────────────────────────────────────────────────────────────

export const createRoomSchema = z.object({
  subjectId: z.string().cuid(),
  title: z.string().min(3).max(100),
  maxPlayers: z.number().int().min(2).max(50).default(10),
  questionCount: z.number().int().min(5).max(50).default(10),
  timeLimitSeconds: z.number().int().min(60).max(3600).default(300),
  eloRequired: z.number().int().min(0).optional(),
  scheduledAt: z.string().datetime().optional(),
})

// ─── Challenges ───────────────────────────────────────────────────────────────

export const createChallengeSchema = z.object({
  receiverId: z.string().cuid(),
  subjectId: z.string().cuid().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  questionCount: z.number().int().min(5).max(50).default(10),
})

// ─── Materials Upload ─────────────────────────────────────────────────────────

export const uploadMaterialSchema = z.object({
  subjectId: z.string().cuid('Invalid subject ID'),
  type: z.enum(['PDF', 'IMAGE', 'TEXT', 'DOCX', 'PPTX']),
  content: z.string().min(1, 'File content cannot be empty'),
  fileName: z.string().min(1, 'File name is required').max(255),
  mimeType: z.string().optional(),
  audienceLevel: z.enum(['undergraduate', 'postgraduate', 'professional']).optional(),
})

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message is too long (max 4000 characters)'),
  sessionId: z.string().cuid().optional(),
  subjectId: z.string().cuid().optional(),
  audienceLevel: z.enum(['undergraduate', 'postgraduate', 'professional']).default('undergraduate'),
})

// ─── Flashcards ───────────────────────────────────────────────────────────────

export const generateFlashcardsSchema = z.object({
  count: z.number().int().min(5).max(50).default(20),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>
export type GenerateQuizInput = z.infer<typeof generateQuizSchema>
export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>
export type UploadMaterialInput = z.infer<typeof uploadMaterialSchema>
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
