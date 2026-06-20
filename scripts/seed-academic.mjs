/**
 * Seed a sample academic structure so you can try the teacher-support flow
 * before the admin console (Phase 5) exists.
 *
 *   node scripts/seed-academic.mjs
 *
 * Creates: University → Faculty → Department → Programme → AcademicYear → Module.
 * Safe to run multiple times (skips entities that already exist by name).
 */
import { PrismaClient } from '@prisma/client'

process.env.DATABASE_URL ||= 'postgresql://allq_user:allq_pass@localhost:5433/allq_db?schema=public&sslmode=disable'
const prisma = new PrismaClient()

try {
  const university = await prisma.university.upsert({
    where: { name: 'Demo University' },
    update: {},
    create: { name: 'Demo University', domain: 'demo.ac.uk' },
  })

  const faculty = await prisma.faculty.upsert({
    where: { universityId_name: { universityId: university.id, name: 'Faculty of Science' } },
    update: {},
    create: { universityId: university.id, name: 'Faculty of Science' },
  })

  const department = await prisma.department.upsert({
    where: { universityId_name: { universityId: university.id, name: 'Data Science' } },
    update: { facultyId: faculty.id },
    create: { universityId: university.id, facultyId: faculty.id, name: 'Data Science', code: 'DS' },
  })

  const programme = await prisma.programme.upsert({
    where: { departmentId_name: { departmentId: department.id, name: 'BSc Data Science' } },
    update: {},
    create: { universityId: university.id, departmentId: department.id, name: 'BSc Data Science', degreeLevel: 'BSc' },
  })

  const year = await prisma.academicYear.upsert({
    where: { universityId_name: { universityId: university.id, name: '2025/2026' } },
    update: { isCurrent: true },
    create: { universityId: university.id, name: '2025/2026', isCurrent: true },
  })

  const existingModule = await prisma.module.findFirst({ where: { departmentId: department.id, name: 'Machine Learning' } })
  const mod = existingModule || await prisma.module.create({
    data: { universityId: university.id, departmentId: department.id, programmeId: programme.id, academicYearId: year.id, name: 'Machine Learning', code: 'ML101' },
  })

  console.log('✅ Seeded academic structure:')
  console.log('   University :', university.name, `(${university.id})`)
  console.log('   Faculty    :', faculty.name)
  console.log('   Department :', department.name)
  console.log('   Programme  :', programme.name)
  console.log('   Year       :', year.name)
  console.log('   Module     :', mod.name)
} finally {
  await prisma.$disconnect()
}
