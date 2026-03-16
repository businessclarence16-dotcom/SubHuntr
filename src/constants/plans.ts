// Définition des plans et de leurs limites

import { Plan } from '@/types'

export interface PlanLimits {
  projects: number
  keywordsPerProject: number
  subreddits: number
  scansPerDay: number
  aiRepliesPerMonth: number
  csvExport: boolean
  analytics: 'basic' | 'full' | 'full_api'
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    projects: 1,
    keywordsPerProject: 3,
    subreddits: 3,
    scansPerDay: 1,
    aiRepliesPerMonth: 10,
    csvExport: false,
    analytics: 'basic',
  },
  pro: {
    projects: 5,
    keywordsPerProject: 20,
    subreddits: 20,
    scansPerDay: 12,
    aiRepliesPerMonth: 100,
    csvExport: true,
    analytics: 'full',
  },
  business: {
    projects: Infinity,
    keywordsPerProject: Infinity,
    subreddits: Infinity,
    scansPerDay: Infinity,
    aiRepliesPerMonth: Infinity,
    csvExport: true,
    analytics: 'full_api',
  },
}

export const PLAN_PRICES: Record<Plan, number> = {
  free: 0,
  pro: 29,
  business: 79,
}
