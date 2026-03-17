// Webhook Stripe — gère les événements d'abonnement
// POST /api/stripe/webhook (appelé par Stripe)

import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Client Supabase admin (pas de RLS) pour les webhooks
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Variables Supabase admin manquantes')
  }

  return createClient(url, serviceKey)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET manquante')
    return NextResponse.json({ error: 'Configuration webhook manquante' }, { status: 500 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Erreur vérification signature webhook:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const plan = session.metadata?.plan

      if (userId && plan) {
        await supabase
          .from('users')
          .update({
            plan,
            stripe_subscription_id: session.subscription as string,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      // Trouve l'utilisateur par customer ID
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (user) {
        // Détermine le plan par le price ID
        const priceId = subscription.items.data[0]?.price.id
        let plan = 'starter'
        if (priceId === process.env.STRIPE_GROWTH_PRICE_ID) plan = 'growth'
        if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) plan = 'agency'

        // Si l'abonnement est annulé, revient à starter
        if (subscription.cancel_at_period_end || subscription.status !== 'active') {
          plan = 'starter'
        }

        await supabase
          .from('users')
          .update({
            plan,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (user) {
        await supabase
          .from('users')
          .update({
            plan: 'starter',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
