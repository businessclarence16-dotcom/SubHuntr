// API Route to create a Stripe Checkout session (new subscriptions only)
// POST /api/stripe/checkout { plan: 'starter' | 'growth' | 'agency', billing: 'monthly' | 'annual' }

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

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id, stripe_subscription_id, email')
    .eq('id', user.id)
    .single()

  // Block if user already has an active subscription — use /api/stripe/change-plan instead
  if (profile?.stripe_subscription_id) {
    console.log(`[Checkout] User ${user.id} already has subscription ${profile.stripe_subscription_id}, use change-plan instead`)
    return NextResponse.json(
      { error: 'You already have an active subscription. Use plan change instead.' },
      { status: 409 }
    )
  }

  console.log(`[Checkout] User ${user.id} requesting ${plan} (${billing})`)

  const stripe = getStripe()
  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    console.log(`[Checkout] Creating Stripe customer for user ${user.id}`)
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? '',
      metadata: { userId: user.id },
    })
    customerId = customer.id

    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)

    console.log(`[Checkout] Stripe customer ${customerId} created and saved`)
  }

  const origin = request.nextUrl.origin
  const priceId = getPriceId(plan, billing)
  console.log(`[Checkout] Using price ID: ${priceId}`)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/feed?success=true`,
    cancel_url: `${origin}/activate`,
    metadata: { userId: user.id, plan, billing },
    subscription_data: {
      // Free trial only on Starter plan — Growth/Agency pay immediately
      ...(plan === 'starter' ? { trial_period_days: 7 } : {}),
      metadata: { userId: user.id, plan },
    },
  })

  console.log(`[Checkout] Session created: ${session.id}`)
  return NextResponse.json({ url: session.url })
}
