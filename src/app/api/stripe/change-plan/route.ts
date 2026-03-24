// API Route to change plan on an existing Stripe subscription
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

  // Get user profile with subscription ID
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active subscription to change' }, { status: 400 })
  }

  console.log(`[ChangePlan] User ${user.id} changing to ${plan} (${billing})`)

  const stripe = getStripe()

  // Retrieve current subscription to get the item ID
  const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
  const itemId = subscription.items.data[0]?.id

  if (!itemId) {
    console.error(`[ChangePlan] No subscription item found for ${profile.stripe_subscription_id}`)
    return NextResponse.json({ error: 'Subscription item not found' }, { status: 500 })
  }

  const newPriceId = getPriceId(plan, billing)
  console.log(`[ChangePlan] Updating item ${itemId} to price ${newPriceId}`)

  // Update the subscription with the new price — end any active trial immediately
  await stripe.subscriptions.update(profile.stripe_subscription_id, {
    items: [{ id: itemId, price: newPriceId }],
    metadata: { userId: user.id, plan },
    proration_behavior: 'create_prorations',
    trial_end: 'now',
  })

  // Update plan in Supabase immediately
  const { error } = await supabase
    .from('users')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    console.error(`[ChangePlan] Failed to update Supabase:`, error)
    return NextResponse.json({ error: 'Plan changed in Stripe but failed to update database' }, { status: 500 })
  }

  console.log(`[ChangePlan] User ${user.id} successfully changed to ${plan}`)
  return NextResponse.json({ success: true })
}
