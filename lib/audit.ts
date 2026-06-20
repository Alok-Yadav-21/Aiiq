import { prisma } from '@/lib/prisma'

/**
 * Record a sensitive action in the audit log. Best-effort — never throws so it
 * can't break the main request flow.
 */
export async function audit(params: {
  userId?: string | null
  action: string
  resource?: string
  resourceId?: string
  ipAddress?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        resource: params.resource ?? null,
        resourceId: params.resourceId ?? null,
        ipAddress: params.ipAddress ?? null,
        metadata: (params.metadata as object) ?? undefined,
      },
    })
  } catch (err) {
    console.error('[audit] failed:', err)
  }
}
