// Client Stripe côté serveur — gestion des abonnements et checkout

import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY manquante dans .env.local')
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2026-02-25.clover',
  })

  return stripeClient
}

// Mapping plan → Stripe Price ID
export function getPriceId(plan: 'pro' | 'business'): string {
  const priceIds: Record<string, string | undefined> = {
    pro: process.env.STRIPE_PRO_PRICE_ID,
    business: process.env.STRIPE_BUSINESS_PRICE_ID,
  }

  const priceId = priceIds[plan]
  if (!priceId) {
    throw new Error(`STRIPE_${plan.toUpperCase()}_PRICE_ID manquante dans .env.local`)
  }

  return priceId
}
