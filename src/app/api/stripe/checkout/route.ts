// API Route to create a Stripe Checkout session
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

  console.log(`[Checkout] User ${user.id} requesting ${plan} (${billing})`)

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  const stripe = getStripe()
  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    console.log(`[Checkout] Creating Stripe customer for user ${user.id}`)
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? '',
      metadata: { userId: user.id },
    })
    customerId = customer.id

    // Store stripe_customer_id on user
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)

    console.log(`[Checkout] Stripe customer ${customerId} created and saved`)
  }

  // Create Checkout session with metadata on BOTH session and subscription
  const origin = request.nextUrl.origin
  const priceId = getPriceId(plan, billing)
  console.log(`[Checkout] Using price ID: ${priceId}`)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/billing?success=true`,
    cancel_url: `${origin}/billing?canceled=true`,
    // Metadata on the checkout session
    metadata: { userId: user.id, plan, billing },
    // Metadata on the subscription itself (so webhooks can read it)
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId: user.id, plan },
    },
  })

  console.log(`[Checkout] Session created: ${session.id}`)
  return NextResponse.json({ url: session.url })
}
