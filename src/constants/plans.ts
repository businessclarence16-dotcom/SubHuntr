// Définition des plans et de leurs limites

import { Plan } from '@/types'

export interface PlanLimits {
  projects: number
  keywordsPerProject: number
  subreddits: number
  scanIntervalMinutes: number
  csvExport: boolean
  slackDiscord: boolean
  competitorTracking: boolean
  analytics: 'basic' | 'full'
  prioritySupport: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  starter: {
    projects: 1,
    keywordsPerProject: 5,
    subreddits: 15,
    scanIntervalMinutes: 15,
    csvExport: false,
    slackDiscord: false,
    competitorTracking: false,
    analytics: 'basic',
    prioritySupport: false,
  },
  growth: {
    projects: 3,
    keywordsPerProject: 25,
    subreddits: 75,
    scanIntervalMinutes: 5,
    csvExport: false,
    slackDiscord: true,
    competitorTracking: true,
    analytics: 'full',
    prioritySupport: false,
  },
  agency: {
    projects: 10,
    keywordsPerProject: Infinity,
    subreddits: Infinity,
    scanIntervalMinutes: 2,
    csvExport: true,
    slackDiscord: true,
    competitorTracking: true,
    analytics: 'full',
    prioritySupport: true,
  },
}

export const PLAN_PRICES: Record<Plan, number> = {
  starter: 29,
  growth: 79,
  agency: 149,
}

export const PLAN_LABELS: Record<Plan, string> = {
  starter: 'Starter',
  growth: 'Growth',
  agency: 'Agency',
}
