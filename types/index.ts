// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  name: string | null
  image: string | null
  role: UserRole
  platformRole?: PlatformRole
  subscription?: {
    plan: SubscriptionPlan
    status: string | null
    currentPeriodEnd: Date | null
  } | null
  profile?: {
    eloRating: number
    totalWins: number
    totalLosses: number
    totalEarnings: number
    weeklyStreak: number
  } | null
}

export type UserRole = 'GUEST' | 'FREE' | 'STARTER' | 'PRO' | 'ADMIN'
export type PlatformRole = 'STUDENT' | 'TEACHER' | 'UNIVERSITY_ADMIN' | 'PLATFORM_ADMIN'
export type SubscriptionPlan = 'FREE' | 'STARTER' | 'PRO'
export type SubjectDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK' | 'SHORT_ANSWER'
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
export type RoomStatus = 'WAITING' | 'STARTING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

// ─── Subjects ────────────────────────────────────────────────────────────────

export interface Subject {
  id: string
  title: string
  description: string
  category: string
  difficulty: SubjectDifficulty
  tags: string[]
  thumbnailUrl: string | null
  isPublic: boolean
  upvoteCount: number
  enrolledCount: number
  creatorId: string
  createdAt: Date
  creator?: { name: string | null; image: string | null }
  _count?: { materials: number; questionBank: number }
}

// ─── Questions ───────────────────────────────────────────────────────────────

export interface Question {
  id: string
  questionText: string
  questionType: QuestionType
  options: string[] | null
  correctAnswer: string
  explanation: string | null
  difficulty: QuestionDifficulty
  topicTag: string | null
  timeLimitSeconds: number
}

export interface QuestionForPlayer extends Omit<Question, 'correctAnswer' | 'explanation'> {
  options: string[] | null
}

// ─── Quiz Rooms ───────────────────────────────────────────────────────────────

export interface QuizRoom {
  id: string
  subjectId: string
  hostId: string | null
  title: string
  status: RoomStatus
  maxPlayers: number
  questionCount: number
  timeLimitSeconds: number
  entryFee: number
  prizePool: number
  eloRequired: number | null
  scheduledAt: Date | null
  startedAt: Date | null
  subject?: { title: string; category: string; difficulty: SubjectDifficulty }
  players?: RoomPlayer[]
  _count?: { players: number }
}

export interface RoomPlayer {
  userId: string
  score: number
  rank: number | null
  isReady: boolean
  user?: { name: string | null; image: string | null; profile?: { eloRating: number } | null }
}

// ─── WebSocket Events ────────────────────────────────────────────────────────

export interface WSEvents {
  // Client → Server
  'room:join': { roomId: string; token: string }
  'room:ready': { roomId: string }
  'quiz:answer': { roomId: string; questionId: string; answer: string; timeSpentMs: number }
  'room:leave': { roomId: string }
  'chat:message': { roomId: string; message: string }

  // Server → Client
  'room:joined': { room: QuizRoom; players: RoomPlayer[] }
  'room:player_joined': { player: RoomPlayer }
  'room:player_left': { userId: string }
  'room:starting': { countdown: number }
  'quiz:question': { question: QuestionForPlayer; questionIndex: number; totalQuestions: number }
  'quiz:answer_confirmed': { userId: string; questionId: string; isCorrect: boolean; pointsEarned: number }
  'quiz:player_answered': { userId: string; questionId: string }
  'quiz:scores': { scores: Record<string, number> }
  'quiz:completed': { results: RoomResult[] }
  'room:error': { message: string }
}

export interface RoomResult {
  userId: string
  rank: number
  score: number
  correctAnswers: number
  prizeWon: number
  name: string | null
  image: string | null
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  hasMore: boolean
}
