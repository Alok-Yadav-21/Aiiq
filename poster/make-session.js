/** Create a fresh, un-started quiz session so the poster can show the live runner. */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'student@aiiq.test' } })
  const subject = await prisma.subject.findFirst({
    where: { creatorId: user.id, title: { contains: 'Cell Biology' } },
  })
  const qs = await prisma.questionBank.findMany({
    where: { subjectId: subject.id, isActive: true },
    take: 6,
    orderBy: { createdAt: 'asc' },
  })

  const session = await prisma.quizSession.create({
    data: {
      subjectId: subject.id,
      userId: user.id,
      questionCount: qs.length,
      questionIds: qs.map((q) => q.id),
      durationSeconds: qs.reduce((s, q) => s + q.timeLimitSeconds, 0),
      maxScore: qs.length * 100,
    },
  })
  console.log(session.id)
}
main().finally(() => prisma.$disconnect())
