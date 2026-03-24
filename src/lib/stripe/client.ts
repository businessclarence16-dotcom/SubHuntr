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
    starter_monthly: process.env.starter_monthly,
    starter_annual: process.env.starter_yearly,
    growth_monthly: process.env.growth_monthly,
    growth_annual: process.env.growth_yearly,
    agency_monthly: process.env.agency_monthly,
    agency_annual: process.env.agency_yearly,
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
    ['starter_monthly', 'starter'],
    ['starter_yearly', 'starter'],
    ['growth_monthly', 'growth'],
    ['growth_yearly', 'growth'],
    ['agency_monthly', 'agency'],
    ['agency_yearly', 'agency'],
  ]

  for (const [envVar, plan] of envPairs) {
    const id = process.env[envVar]
    if (id) mapping[id] = plan
  }

  return mapping[priceId] ?? null
}
