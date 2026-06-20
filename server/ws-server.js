/**
 * AllQ WebSocket Server
 * Real-time quiz battle engine
 * Runs on port 3001 alongside Next.js (port 3000)
 */

const { createServer } = require('http')
const { Server } = require('socket.io')
const { SignJWT, jwtVerify } = require('jose')

const PORT = parseInt(process.env.WS_PORT || '3001', 10)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'allq-dev-secret-please-change-in-production'
)
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]

// ─── In-memory Room State ─────────────────────────────────────────────────────
// In production, replace with Redis for multi-instance sync

const rooms = new Map() // roomId → RoomState
const playerSockets = new Map() // userId → socketId
const socketPlayers = new Map() // socketId → userId

function getRoomState(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      phase: 'lobby', // lobby | countdown | question | reveal | results
      players: new Map(), // userId → { name, score, ready, answered }
      questions: [],
      currentQuestionIndex: -1,
      questionTimer: null,
      countdownTimer: null,
      answers: new Map(), // questionId:userId → { answer, timeSpentMs }
    })
  }
  return rooms.get(roomId)
}

function broadcastRoomScores(io, roomId) {
  const room = rooms.get(roomId)
  if (!room) return
  const scores = {}
  room.players.forEach((player, userId) => {
    scores[userId] = player.score
  })
  io.to(roomId).emit('quiz:scores', { scores })
}

function advanceQuestion(io, roomId) {
  const room = rooms.get(roomId)
  if (!room || !room.questions.length) return

  room.currentQuestionIndex++

  if (room.currentQuestionIndex >= room.questions.length) {
    // Quiz complete
    endQuiz(io, roomId)
    return
  }

  const question = room.questions[room.currentQuestionIndex]
  room.phase = 'question'

  // Reset answered state
  room.players.forEach((player) => { player.answered = false })

  // Send question (without correct answer)
  const { correctAnswer, explanation, ...questionForPlayer } = question
  io.to(roomId).emit('quiz:question', {
    question: questionForPlayer,
    questionIndex: room.currentQuestionIndex,
    totalQuestions: room.questions.length,
  })

  // Auto-advance after time limit
  if (room.questionTimer) clearTimeout(room.questionTimer)
  room.questionTimer = setTimeout(() => {
    broadcastRoomScores(io, roomId)
    setTimeout(() => advanceQuestion(io, roomId), 2000)
  }, (question.timeLimitSeconds || 30) * 1000)
}

function endQuiz(io, roomId) {
  const room = rooms.get(roomId)
  if (!room) return

  room.phase = 'results'

  const results = Array.from(room.players.entries())
    .map(([userId, player]) => ({
      userId,
      name: player.name,
      score: player.score,
      correctAnswers: player.correctAnswers || 0,
      totalQuestions: room.questions.length,
      prizeWon: 0, // Would be calculated based on prize pool in production
    }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }))

  io.to(roomId).emit('quiz:completed', { results })
  rooms.delete(roomId)
}

// ─── Mock Questions (used when no real DB connection) ─────────────────────────

function getMockQuestions(count = 10) {
  const questions = [
    {
      id: 'q1', questionText: 'What does HTML stand for?', questionType: 'MCQ',
      options: ['HyperText Markup Language', 'High Tech Modern Language', 'Hyperlink Text Method Language', 'Home Tool Markup Language'],
      correctAnswer: 'HyperText Markup Language', difficulty: 'EASY', topicTag: 'Web Basics', timeLimitSeconds: 25,
    },
    {
      id: 'q2', questionText: 'JavaScript is a compiled language.', questionType: 'TRUE_FALSE',
      options: ['True', 'False'],
      correctAnswer: 'False', difficulty: 'EASY', topicTag: 'JavaScript', timeLimitSeconds: 20,
    },
    {
      id: 'q3', questionText: 'Which keyword declares a constant in JavaScript?', questionType: 'MCQ',
      options: ['var', 'let', 'const', 'def'],
      correctAnswer: 'const', difficulty: 'MEDIUM', topicTag: 'JavaScript', timeLimitSeconds: 25,
    },
    {
      id: 'q4', questionText: 'CSS stands for ___ Style Sheets.', questionType: 'FILL_IN_THE_BLANK',
      options: null,
      correctAnswer: 'Cascading', difficulty: 'EASY', topicTag: 'CSS', timeLimitSeconds: 30,
    },
    {
      id: 'q5', questionText: 'Which method is used to parse a JSON string?', questionType: 'MCQ',
      options: ['JSON.stringify()', 'JSON.parse()', 'JSON.decode()', 'JSON.convert()'],
      correctAnswer: 'JSON.parse()', difficulty: 'MEDIUM', topicTag: 'JavaScript', timeLimitSeconds: 25,
    },
    {
      id: 'q6', questionText: 'React is maintained by Facebook/Meta.', questionType: 'TRUE_FALSE',
      options: ['True', 'False'],
      correctAnswer: 'True', difficulty: 'EASY', topicTag: 'React', timeLimitSeconds: 20,
    },
    {
      id: 'q7', questionText: 'What does API stand for?', questionType: 'MCQ',
      options: ['Application Programming Interface', 'Advanced Processing Input', 'Automated Protocol Integration', 'Application Protocol Index'],
      correctAnswer: 'Application Programming Interface', difficulty: 'EASY', topicTag: 'General', timeLimitSeconds: 25,
    },
    {
      id: 'q8', questionText: 'Which HTTP status code means "Not Found"?', questionType: 'MCQ',
      options: ['200', '301', '404', '500'],
      correctAnswer: '404', difficulty: 'EASY', topicTag: 'HTTP', timeLimitSeconds: 25,
    },
    {
      id: 'q9', questionText: 'SQL is used for ___ relational databases.', questionType: 'FILL_IN_THE_BLANK',
      options: null,
      correctAnswer: 'querying', difficulty: 'MEDIUM', topicTag: 'Databases', timeLimitSeconds: 30,
    },
    {
      id: 'q10', questionText: 'Git is a version ___ system.', questionType: 'FILL_IN_THE_BLANK',
      options: null,
      correctAnswer: 'control', difficulty: 'EASY', topicTag: 'Git', timeLimitSeconds: 25,
    },
  ]
  return questions.slice(0, count)
}

// ─── Socket.io Server ─────────────────────────────────────────────────────────

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Auth middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '')

  if (!token) {
    // Allow unauthenticated for spectating, but mark as guest
    socket.data.userId = null
    socket.data.userName = 'Guest'
    socket.data.role = 'GUEST'
    return next()
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    socket.data.userId = payload.sub
    socket.data.email = payload.email
    socket.data.role = payload.role
    socket.data.userName = payload.name || payload.email?.split('@')[0] || 'Player'
    next()
  } catch (err) {
    socket.data.userId = null
    socket.data.userName = 'Guest'
    socket.data.role = 'GUEST'
    next()
  }
})

io.on('connection', (socket) => {
  const userId = socket.data.userId
  const userName = socket.data.userName

  if (userId) {
    playerSockets.set(userId, socket.id)
    socketPlayers.set(socket.id, userId)
  }

  // ─── Join Room ───────────────────────────────────────────────────────────────
  socket.on('room:join', async ({ roomId, token: joinToken }) => {
    if (!userId) {
      socket.emit('room:error', { message: 'Authentication required to join a room' })
      return
    }

    socket.join(roomId)
    const room = getRoomState(roomId)

    if (!room.players.has(userId)) {
      room.players.set(userId, {
        userId,
        name: userName,
        score: 0,
        ready: false,
        answered: false,
        correctAnswers: 0,
      })
    }

    const players = Array.from(room.players.values())

    socket.emit('room:joined', {
      room: { id: roomId, status: room.phase },
      players: players.map((p) => ({
        userId: p.userId,
        user: { name: p.name, image: null, profile: { eloRating: 1200 } },
        score: p.score,
        isReady: p.ready,
      })),
    })

    socket.to(roomId).emit('room:player_joined', {
      player: {
        userId,
        user: { name: userName, image: null, profile: { eloRating: 1200 } },
        score: 0,
        isReady: false,
      },
    })
  })

  // ─── Ready ───────────────────────────────────────────────────────────────────
  socket.on('room:ready', ({ roomId }) => {
    if (!userId) return

    const room = rooms.get(roomId)
    if (!room) return

    const player = room.players.get(userId)
    if (player) player.ready = true

    const allReady = Array.from(room.players.values()).every((p) => p.ready)

    if (allReady && room.players.size >= 1 && room.phase === 'lobby') {
      room.phase = 'countdown'
      let count = 5

      const countdown = setInterval(() => {
        io.to(roomId).emit('room:starting', { countdown: count })
        count--
        if (count < 0) {
          clearInterval(countdown)
          // Load questions
          room.questions = getMockQuestions(10)
          advanceQuestion(io, roomId)
        }
      }, 1000)

      room.countdownTimer = countdown
    }
  })

  // ─── Answer ──────────────────────────────────────────────────────────────────
  socket.on('quiz:answer', ({ roomId, questionId, answer, timeSpentMs }) => {
    if (!userId) return

    const room = rooms.get(roomId)
    if (!room || room.phase !== 'question') return

    const player = room.players.get(userId)
    if (!player || player.answered) return

    player.answered = true

    const question = room.questions[room.currentQuestionIndex]
    if (!question || question.id !== questionId) return

    const isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
    const totalTimeMs = question.timeLimitSeconds * 1000
    const timeRemainingMs = Math.max(0, totalTimeMs - timeSpentMs)
    const difficultyMultipliers = { EASY: 1.0, MEDIUM: 1.5, HARD: 2.0, EXPERT: 3.0 }
    const multiplier = difficultyMultipliers[question.difficulty] || 1.0

    let pointsEarned = 0
    if (isCorrect) {
      const timeRatio = timeRemainingMs / totalTimeMs
      pointsEarned = Math.round(100 * (0.5 + 0.5 * timeRatio) * multiplier)
      player.score += pointsEarned
      player.correctAnswers = (player.correctAnswers || 0) + 1
    }

    socket.emit('quiz:answer_confirmed', {
      userId,
      questionId,
      isCorrect,
      pointsEarned,
    })

    io.to(roomId).emit('quiz:player_answered', { userId, questionId })

    // Check if all players answered
    const allAnswered = Array.from(room.players.values()).every((p) => p.answered)
    if (allAnswered) {
      if (room.questionTimer) clearTimeout(room.questionTimer)
      broadcastRoomScores(io, roomId)
      setTimeout(() => advanceQuestion(io, roomId), 2500)
    }
  })

  // ─── Leave ───────────────────────────────────────────────────────────────────
  socket.on('room:leave', ({ roomId }) => {
    socket.leave(roomId)
    if (!userId) return

    const room = rooms.get(roomId)
    if (room) {
      room.players.delete(userId)
      io.to(roomId).emit('room:player_left', { userId })

      if (room.players.size === 0) {
        if (room.questionTimer) clearTimeout(room.questionTimer)
        if (room.countdownTimer) clearInterval(room.countdownTimer)
        rooms.delete(roomId)
      }
    }
  })

  // ─── Disconnect ───────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (userId) {
      playerSockets.delete(userId)
      socketPlayers.delete(socket.id)

      // Remove from all rooms
      rooms.forEach((room, roomId) => {
        if (room.players.has(userId)) {
          room.players.delete(userId)
          io.to(roomId).emit('room:player_left', { userId })
        }
      })
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`🔌 AllQ WebSocket server running on port ${PORT}`)
})

module.exports = { io, httpServer }
