// Webhook Stripe — handles subscription events
// POST /api/stripe/webhook (called by Stripe)

import { NextRequest, NextResponse } from 'next/server'
import { getStripe, getPlanFromPriceId } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Supabase admin client (no RLS) for webhooks — uses SupabaseServiceRoleKey
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SupabaseServiceRoleKey

  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL or SupabaseServiceRoleKey is missing')
  }

  return createClient(url, serviceKey)
}

export async function POST(request: NextRequest) {
  console.log('=== WEBHOOK CALLED ===', new Date().toISOString())

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  console.log(`[Webhook] Signature present: ${!!signature}, Body length: ${body.length}`)

  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.StripeWebhookSecret
  if (!webhookSecret) {
    console.error('[Webhook] StripeWebhookSecret is missing from env')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`)
  const supabase = getSupabaseAdmin()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('=== CHECKOUT SESSION COMPLETED ===')
      console.log('[Webhook] Session ID:', session.id)
      console.log('[Webhook] Customer:', session.customer)
      console.log('[Webhook] Subscription:', session.subscription)
      console.log('[Webhook] Metadata:', JSON.stringify(session.metadata))
      console.log('[Webhook] Mode:', session.mode)

      // Read userId and plan from session metadata
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan
      const customerId = session.customer as string

      console.log(`[Webhook] Extracted — userId: ${userId}, plan: ${plan}, customerId: ${customerId}`)

      if (userId && plan) {
        const { error } = await supabase
          .from('users')
          .update({
            plan,
            stripe_customer_id: customerId,
            stripe_subscription_id: session.subscription as string,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) {
          console.error(`[Webhook] Failed to update user ${userId}:`, error)
        } else {
          console.log(`[Webhook] User ${userId} updated to plan: ${plan}`)
        }
      } else {
        console.warn('[Webhook] Missing userId or plan in session metadata')
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      console.log(`[Webhook] customer.subscription.updated — customer: ${customerId}, status: ${subscription.status}`)

      // Find user by stripe_customer_id
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (findError || !user) {
        console.error(`[Webhook] Could not find user for customer ${customerId}:`, findError)
        break
      }

      // Determine plan from price ID
      const priceId = subscription.items.data[0]?.price.id
      let plan: string = 'starter'

      if (priceId) {
        const detectedPlan = getPlanFromPriceId(priceId)
        if (detectedPlan) plan = detectedPlan
        console.log(`[Webhook] Price ${priceId} → plan: ${plan}`)
      }

      // Also check subscription metadata as fallback
      if (plan === 'starter' && subscription.metadata?.plan) {
        plan = subscription.metadata.plan
        console.log(`[Webhook] Using subscription metadata plan: ${plan}`)
      }

      // If subscription is canceled or not active, revert to starter
      if (subscription.cancel_at_period_end || subscription.status === 'canceled' || subscription.status === 'unpaid') {
        console.log(`[Webhook] Subscription canceled/unpaid, reverting to starter`)
        plan = 'starter'
      }

      // If trialing, keep the plan (user should have access during trial)
      if (subscription.status === 'trialing' || subscription.status === 'active') {
        console.log(`[Webhook] Subscription ${subscription.status}, keeping plan: ${plan}`)
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          plan,
          stripe_subscription_id: subscription.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error(`[Webhook] Failed to update user ${user.id}:`, updateError)
      } else {
        console.log(`[Webhook] User ${user.id} updated to plan: ${plan}`)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      console.log(`[Webhook] customer.subscription.deleted — customer: ${customerId}`)

      const { data: user, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (findError || !user) {
        console.error(`[Webhook] Could not find user for customer ${customerId}:`, findError)
        break
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          plan: 'starter',
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error(`[Webhook] Failed to reset user ${user.id}:`, updateError)
      } else {
        console.log(`[Webhook] User ${user.id} reverted to starter (subscription deleted)`)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      console.log(`[Webhook] invoice.payment_failed — customer: ${customerId}`)

      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (user) {
        // Don't reset plan yet — Stripe will retry. Just log it.
        console.log(`[Webhook] Payment failed for user ${user.id} — Stripe will retry`)
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscriptionId = (invoice as any).subscription as string | null

      console.log(`[Webhook] invoice.payment_succeeded — customer: ${customerId}, subscription: ${subscriptionId}`)

      if (subscriptionId) {
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (user) {
          // Ensure subscription ID is stored (handles edge cases)
          await supabase
            .from('users')
            .update({
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

          console.log(`[Webhook] User ${user.id} payment succeeded, subscription ${subscriptionId} confirmed`)
        }
      }
      break
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
