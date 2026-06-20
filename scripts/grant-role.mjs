/**
 * Grant a platform role to a user (admin bootstrap / setup tool).
 *
 * Usage:
 *   node scripts/grant-role.mjs <email> <ROLE> [universityId]
 *   ROLE = STUDENT | TEACHER | UNIVERSITY_ADMIN | PLATFORM_ADMIN
 *
 * Examples:
 *   node scripts/grant-role.mjs alok35229@gmail.com PLATFORM_ADMIN
 *   node scripts/grant-role.mjs admin@uni.ac.uk UNIVERSITY_ADMIN <universityId>
 */
import { PrismaClient } from '@prisma/client'

const [, , email, role, universityId] = process.argv
const ROLES = ['STUDENT', 'TEACHER', 'UNIVERSITY_ADMIN', 'PLATFORM_ADMIN']

if (!email || !role || !ROLES.includes(role)) {
  console.error('Usage: node scripts/grant-role.mjs <email> <ROLE> [universityId]')
  console.error('ROLE must be one of:', ROLES.join(', '))
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://allq_user:allq_pass@localhost:5433/allq_db?schema=public&sslmode=disable'
}

const prisma = new PrismaClient()
try {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`No user found with email ${email}. Register/sign up first, then run this.`)
    process.exit(1)
  }
  if (role === 'UNIVERSITY_ADMIN' && !universityId) {
    console.error('UNIVERSITY_ADMIN requires a universityId argument (the university they manage).')
    process.exit(1)
  }
  await prisma.user.update({
    where: { email },
    data: { platformRole: role, managedUniversityId: role === 'UNIVERSITY_ADMIN' ? universityId : (role === 'PLATFORM_ADMIN' ? user.managedUniversityId : null) },
  })
  console.log(`✅ ${email} is now ${role}${universityId ? ` (university ${universityId})` : ''}.`)
  console.log('Note: they must sign out and back in for the new role to take effect (it is baked into the session token).')
} finally {
  await prisma.$disconnect()
}
