// Client Stripe côté serveur — gestion des abonnements et checkout

import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is missing from environment variables')
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2026-02-25.clover',
  })

  return stripeClient
}

// Mapping plan + billing period → Stripe Price ID
export function getPriceId(plan: 'starter' | 'growth' | 'agency', billing: 'monthly' | 'annual'): string {
  const priceIds: Record<string, string | undefined> = {
    starter_monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    starter_annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
    growth_monthly: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID,
    growth_annual: process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID,
    agency_monthly: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID,
    agency_annual: process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID,
  }

  const key = `${plan}_${billing}`
  const priceId = priceIds[key]
  if (!priceId) {
    throw new Error(`STRIPE_${plan.toUpperCase()}_${billing.toUpperCase()}_PRICE_ID is missing from environment variables`)
  }

  return priceId
}

// Reverse lookup: Stripe Price ID → plan name
export function getPlanFromPriceId(priceId: string): 'starter' | 'growth' | 'agency' | null {
  const mapping: Record<string, 'starter' | 'growth' | 'agency'> = {}

  const envPairs: Array<[string, 'starter' | 'growth' | 'agency']> = [
    ['STRIPE_STARTER_MONTHLY_PRICE_ID', 'starter'],
    ['STRIPE_STARTER_ANNUAL_PRICE_ID', 'starter'],
    ['STRIPE_GROWTH_MONTHLY_PRICE_ID', 'growth'],
    ['STRIPE_GROWTH_ANNUAL_PRICE_ID', 'growth'],
    ['STRIPE_AGENCY_MONTHLY_PRICE_ID', 'agency'],
    ['STRIPE_AGENCY_ANNUAL_PRICE_ID', 'agency'],
  ]

  for (const [envVar, plan] of envPairs) {
    const id = process.env[envVar]
    if (id) mapping[id] = plan
  }

  return mapping[priceId] ?? null
}
