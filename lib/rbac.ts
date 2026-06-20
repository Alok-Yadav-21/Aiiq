import { NextRequest } from 'next/server'
import { getSessionFromRequest, type JWTPayload } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/utils'

type ErrResponse = ReturnType<typeof apiError>

export type Role = 'STUDENT' | 'TEACHER' | 'UNIVERSITY_ADMIN' | 'PLATFORM_ADMIN'

export const ROLES: Record<Role, Role> = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  UNIVERSITY_ADMIN: 'UNIVERSITY_ADMIN',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
}

/** PLATFORM_ADMIN is a superuser — implicitly satisfies any role requirement. */
function roleSatisfies(role: string, allowed: Role[]): boolean {
  if (role === 'PLATFORM_ADMIN') return true
  return allowed.includes(role as Role)
}

type AuthResult =
  | { ok: true; payload: JWTPayload }
  | { ok: false; res: ErrResponse }

/**
 * Backend RBAC guard for API routes.
 * Returns the JWT payload when the caller is authenticated AND holds one of the
 * allowed roles (PLATFORM_ADMIN always passes). Otherwise returns a ready 401/403.
 *
 * Usage:
 *   const auth = await authorize(req, ['UNIVERSITY_ADMIN'])
 *   if (!auth.ok) return auth.res
 *   const { payload } = auth
 */
export async function authorize(req: NextRequest, allowed: Role[]): Promise<AuthResult> {
  const payload = await getSessionFromRequest(req)
  if (!payload) return { ok: false, res: apiError('Unauthorized', 401) }
  if (!roleSatisfies(payload.platformRole, allowed)) {
    return { ok: false, res: apiError('You do not have permission to perform this action.', 403) }
  }
  return { ok: true, payload }
}

/**
 * The university an admin is scoped to.
 * - PLATFORM_ADMIN → null (all universities, no isolation).
 * - UNIVERSITY_ADMIN → their managedUniversityId (must be set, else null).
 */
export async function adminUniversityScope(payload: JWTPayload): Promise<string | null> {
  if (payload.platformRole === 'PLATFORM_ADMIN') return null
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { managedUniversityId: true },
  })
  return user?.managedUniversityId ?? null
}

/**
 * Enforce that a university-admin may only touch their own university's data.
 * PLATFORM_ADMIN bypasses. Returns null when allowed, or a 403 response.
 */
export async function assertUniversityAccess(payload: JWTPayload, universityId: string): Promise<ErrResponse | null> {
  if (payload.platformRole === 'PLATFORM_ADMIN') return null
  const scope = await adminUniversityScope(payload)
  if (!scope) return apiError('Your admin account is not linked to a university.', 403)
  if (scope !== universityId) return apiError('This resource belongs to another university.', 403)
  return null
}

/**
 * Resolve the universityId an admin is acting on:
 * - UNIVERSITY_ADMIN → locked to their own university (body value, if given, must match).
 * - PLATFORM_ADMIN → must supply universityId in the body.
 */
export async function resolveScopedUniversity(
  payload: JWTPayload,
  bodyUniversityId?: string,
): Promise<{ ok: true; universityId: string } | { ok: false; res: ErrResponse }> {
  const scope = await adminUniversityScope(payload) // null for PLATFORM_ADMIN
  if (scope && bodyUniversityId && bodyUniversityId !== scope) {
    return { ok: false, res: apiError('You can only manage your own university.', 403) }
  }
  const universityId = scope ?? bodyUniversityId
  if (!universityId) return { ok: false, res: apiError('universityId is required.', 400) }
  return { ok: true, universityId }
}
