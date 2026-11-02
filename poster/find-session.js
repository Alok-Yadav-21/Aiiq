/** Locate a good completed quiz session for the poster results screenshot. */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'student@aiiq.test' } })
  if (!user) throw new Error('test user missing')

  const sessions = await prisma.quizSession.findMany({
    where: { userId: user.id, completedAt: { not: null }, questionIds: { isEmpty: false } },
    orderBy: { completedAt: 'desc' },
    take: 5,
    include: { subject: { select: { title: true } }, attempts: { include: { answers: true } } },
  })

  for (const s of sessions) {
    const a = s.attempts[0]
    if (!a) continue
    const correct = a.answers.filter((x) => x.isCorrect).length
    console.log(
      `${s.id} | ${s.subject.title} | ${correct}/${a.answers.length} | ${s.questionIds.length} qs`,
    )
  }
  if (sessions.length === 0) console.log('NONE')
}
main().finally(() => prisma.$disconnect())
