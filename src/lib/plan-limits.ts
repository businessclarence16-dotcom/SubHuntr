// Utilitaire pour vérifier les limites du plan de l'utilisateur
// Utilisé côté serveur dans les API routes pour bloquer les actions au-delà des limites

import { SupabaseClient } from '@supabase/supabase-js'
import { PLAN_LIMITS } from '@/constants/plans'
import { Plan } from '@/types'

interface LimitCheck {
  allowed: boolean
  message?: string
  current?: number
  limit?: number
}

export async function checkKeywordLimit(
  supabase: SupabaseClient,
  projectId: string,
  userPlan: Plan
): Promise<LimitCheck> {
  const limits = PLAN_LIMITS[userPlan]
  if (limits.keywordsPerProject === Infinity) return { allowed: true }

  const { count } = await supabase
    .from('keywords')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const current = count ?? 0
  if (current >= limits.keywordsPerProject) {
    return {
      allowed: false,
      message: `Limite de ${limits.keywordsPerProject} keywords atteinte (plan ${userPlan}). Passez au plan supérieur.`,
      current,
      limit: limits.keywordsPerProject,
    }
  }

  return { allowed: true, current, limit: limits.keywordsPerProject }
}

export async function checkSubredditLimit(
  supabase: SupabaseClient,
  projectId: string,
  userPlan: Plan
): Promise<LimitCheck> {
  const limits = PLAN_LIMITS[userPlan]
  if (limits.subreddits === Infinity) return { allowed: true }

  const { count } = await supabase
    .from('subreddits')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const current = count ?? 0
  if (current >= limits.subreddits) {
    return {
      allowed: false,
      message: `Limite de ${limits.subreddits} subreddits atteinte (plan ${userPlan}). Passez au plan supérieur.`,
      current,
      limit: limits.subreddits,
    }
  }

  return { allowed: true, current, limit: limits.subreddits }
}

export async function checkProjectLimit(
  supabase: SupabaseClient,
  userId: string,
  userPlan: Plan
): Promise<LimitCheck> {
  const limits = PLAN_LIMITS[userPlan]
  if (limits.projects === Infinity) return { allowed: true }

  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const current = count ?? 0
  if (current >= limits.projects) {
    return {
      allowed: false,
      message: `Limite de ${limits.projects} projet(s) atteinte (plan ${userPlan}). Passez au plan supérieur.`,
      current,
      limit: limits.projects,
    }
  }

  return { allowed: true, current, limit: limits.projects }
}

export async function checkScanLimit(
  supabase: SupabaseClient,
  projectId: string,
  userPlan: Plan
): Promise<LimitCheck> {
  const limits = PLAN_LIMITS[userPlan]
  if (limits.scansPerDay === Infinity) return { allowed: true }

  // Compte les scans des dernières 24h
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('scans')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('started_at', yesterday)

  const current = count ?? 0
  if (current >= limits.scansPerDay) {
    return {
      allowed: false,
      message: `Limite de ${limits.scansPerDay} scan(s) par jour atteinte (plan ${userPlan}). Passez au plan supérieur.`,
      current,
      limit: limits.scansPerDay,
    }
  }

  return { allowed: true, current, limit: limits.scansPerDay }
}
