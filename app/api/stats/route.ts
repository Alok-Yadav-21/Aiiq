import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'
import {
  getLearningStats,
  getTopicMastery,
  getRecentAttempts,
  getDailyActivity,
} from '@/lib/stats'

/**
 * Real learning statistics for the signed-in user, derived from their quiz
 * history. Everything returned here is computed — nothing is a stored counter.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getSessionFromRequest(req)
    if (!payload) return apiError('Unauthorized', 401)

    const [stats, topics, recent, activity] = await Promise.all([
      getLearningStats(payload.sub),
      getTopicMastery(payload.sub),
      getRecentAttempts(payload.sub, 5),
      getDailyActivity(payload.sub, 14),
    ])

    return apiResponse({
      stats,
      // Weakest first — the UI reads the head of this list as "revise next".
      weakestTopics: topics.slice(0, 5),
      strongestTopics: [...topics].reverse().slice(0, 5),
      topics,
      recentAttempts: recent,
      activity,
    })
  } catch (error) {
    console.error('[stats GET]', error)
    return apiError('Failed to load statistics', 500)
  }
}
