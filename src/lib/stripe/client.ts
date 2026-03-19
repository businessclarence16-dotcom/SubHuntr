// Client Stripe côté serveur — gestion des abonnements et checkout

import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient

  const secretKey = process.env.StripeSecretKey
  if (!secretKey) {
    throw new Error('StripeSecretKey is missing from environment variables')
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2026-02-25.clover',
  })

  return stripeClient
}

// Mapping plan + billing period → Stripe Price ID
export function getPriceId(plan: 'starter' | 'growth' | 'agency', billing: 'monthly' | 'annual'): string {
  const priceIds: Record<string, string | undefined> = {
    starter_monthly: process.env.StarterMonthly,
    starter_annual: process.env.StarterAnnualy,
    growth_monthly: process.env.GrowthMonthly,
    growth_annual: process.env.GrowthAnnualy,
    agency_monthly: process.env.AgencyMonthly,
    agency_annual: process.env.AgencyAnnualy,
  }

  const key = `${plan}_${billing}`
  const priceId = priceIds[key]
  if (!priceId) {
    throw new Error(`Price ID for ${plan} (${billing}) is missing from environment variables`)
  }

  return priceId
}

// Reverse lookup: Stripe Price ID → plan name
export function getPlanFromPriceId(priceId: string): 'starter' | 'growth' | 'agency' | null {
  const mapping: Record<string, 'starter' | 'growth' | 'agency'> = {}

  const envPairs: Array<[string, 'starter' | 'growth' | 'agency']> = [
    ['StarterMonthly', 'starter'],
    ['StarterAnnualy', 'starter'],
    ['GrowthMonthly', 'growth'],
    ['GrowthAnnualy', 'growth'],
    ['AgencyMonthly', 'agency'],
    ['AgencyAnnualy', 'agency'],
  ]

  for (const [envVar, plan] of envPairs) {
    const id = process.env[envVar]
    if (id) mapping[id] = plan
  }

  return mapping[priceId] ?? null
}
