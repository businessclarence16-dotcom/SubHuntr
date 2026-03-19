// API Route pour créer une session Stripe Checkout
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

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  const stripe = getStripe()
  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? '',
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // Create Checkout session
  const origin = request.nextUrl.origin
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: getPriceId(plan, billing), quantity: 1 }],
    success_url: `${origin}/billing?success=true`,
    cancel_url: `${origin}/billing?canceled=true`,
    subscription_data: {
      trial_period_days: 7,
    },
    metadata: { supabase_user_id: user.id, plan, billing },
  })

  return NextResponse.json({ url: session.url })
}
