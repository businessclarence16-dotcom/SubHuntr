// API Route to change plan — cancels current subscription and creates new Stripe Checkout
// POST /api/stripe/change-plan { plan: 'starter' | 'growth' | 'agency', billing: 'monthly' | 'annual' }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, getPriceId } from '@/lib/stripe/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { plan, billing } = await request.json()

  if (!plan || !['starter', 'growth', 'agency'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  if (!billing || !['monthly', 'annual'].includes(billing)) {
    return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active subscription to change' }, { status: 400 })
  }

  console.log(`[ChangePlan] User ${user.id} changing to ${plan} (${billing})`)

  try {
    const stripe = getStripe()

    // Cancel the current subscription immediately
    await stripe.subscriptions.cancel(profile.stripe_subscription_id)
    console.log(`[ChangePlan] Canceled subscription ${profile.stripe_subscription_id}`)

    // Clear subscription in DB (webhook will also handle this, but clear it now for the checkout guard)
    await supabase
      .from('users')
      .update({ stripe_subscription_id: null, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    // Create a new Stripe Checkout session for the new plan — NO trial (not first subscription)
    const origin = request.nextUrl.origin
    const priceId = getPriceId(plan, billing)
    console.log(`[ChangePlan] Creating checkout for price ${priceId}`)

    const session = await stripe.checkout.sessions.create({
      customer: profile.stripe_customer_id!,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?success=true`,
      cancel_url: `${origin}/billing`,
      allow_promotion_codes: true,
      metadata: { userId: user.id, plan, billing },
      subscription_data: {
        metadata: { userId: user.id, plan },
        // No trial_period_days — this is a plan change, not first subscription
      },
    })

    console.log(`[ChangePlan] Checkout session created: ${session.id}`)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error(`[ChangePlan] Error:`, err)
    const message = err instanceof Error ? err.message : 'Failed to change plan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
