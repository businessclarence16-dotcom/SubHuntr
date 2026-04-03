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
  apiAccess: boolean
  dedicatedSupport: boolean
  customIntegrations: boolean
  sla: boolean
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
    apiAccess: false,
    dedicatedSupport: false,
    customIntegrations: false,
    sla: false,
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
    apiAccess: false,
    dedicatedSupport: false,
    customIntegrations: false,
    sla: false,
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
    apiAccess: false,
    dedicatedSupport: false,
    customIntegrations: false,
    sla: false,
  },
  enterprise: {
    projects: Infinity,
    keywordsPerProject: Infinity,
    subreddits: Infinity,
    scanIntervalMinutes: 1,
    csvExport: true,
    slackDiscord: true,
    competitorTracking: true,
    analytics: 'full',
    prioritySupport: true,
    apiAccess: true,
    dedicatedSupport: true,
    customIntegrations: true,
    sla: true,
  },
}

// Available auto-scan intervals (in hours) per plan
export const AUTO_SCAN_INTERVALS: Record<Plan, number[]> = {
  starter: [6, 12, 24],
  growth: [2, 4, 6, 12, 24],
  agency: [1, 2, 4, 6, 12, 24],
  enterprise: [1, 2, 4, 6, 12, 24],
}

// Cooldown entre scans en secondes
export const SCAN_COOLDOWN_SECONDS: Record<Plan, number> = {
  starter: 900,    // 15 minutes
  growth: 300,     // 5 minutes
  agency: 120,     // 2 minutes
  enterprise: 60,  // 1 minute
}

export const PLAN_PRICES: Record<Plan, number> = {
  starter: 29,
  growth: 79,
  agency: 199,
  enterprise: 0,
}

export const PLAN_LABELS: Record<Plan, string> = {
  starter: 'Starter',
  growth: 'Growth',
  agency: 'Agency',
  enterprise: 'Enterprise',
}
