// API Route to change plan — upgrades immediately with proration, downgrades at period end
// POST /api/stripe/change-plan { plan: 'starter' | 'growth' | 'agency', billing: 'monthly' | 'annual' }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, getPriceId } from '@/lib/stripe/client'
import Stripe from 'stripe'

const PLAN_ORDER: Record<string, number> = { starter: 1, growth: 2, agency: 3 }

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { plan: newPlan, billing } = await request.json()

  if (!newPlan || !['starter', 'growth', 'agency'].includes(newPlan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  if (!billing || !['monthly', 'annual'].includes(billing)) {
    return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('plan, stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active subscription to change' }, { status: 400 })
  }

  const currentPlan = profile.plan ?? 'starter'
  const currentRank = PLAN_ORDER[currentPlan] ?? 1
  const newRank = PLAN_ORDER[newPlan] ?? 1
  const isUpgrade = newRank > currentRank

  console.log(`[ChangePlan] User ${user.id}: ${currentPlan} → ${newPlan} (${billing}) — ${isUpgrade ? 'UPGRADE' : 'DOWNGRADE'}`)

  try {
    const stripe = getStripe()
    const newPriceId = getPriceId(newPlan, billing)

    // Retrieve the current subscription
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id) as Stripe.Subscription
    const currentItemId = subscription.items.data[0]?.id

    if (!currentItemId) {
      return NextResponse.json({ error: 'Could not find subscription item' }, { status: 500 })
    }

    if (isUpgrade) {
      // UPGRADE: apply immediately + prorate
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        items: [{ id: currentItemId, price: newPriceId }],
        proration_behavior: 'always_invoice',
      })

      // Update plan in Supabase immediately (webhook will also do this as backup)
      await supabase
        .from('users')
        .update({ plan: newPlan, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      console.log(`[ChangePlan] Upgrade complete — ${currentPlan} → ${newPlan}`)

      return NextResponse.json({
        success: true,
        type: 'upgrade',
        message: `Upgraded to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)}. Prorated charge applied.`,
      })
    } else {
      // DOWNGRADE: apply at end of billing period, no proration/refund
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        items: [{ id: currentItemId, price: newPriceId }],
        proration_behavior: 'none',
      })

      // Do NOT update plan in Supabase yet — user keeps current plan until period ends
      // The webhook invoice.payment_succeeded will sync the plan at renewal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const periodEndUnix = (subscription as any).current_period_end as number | undefined
      const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const formattedDate = periodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

      console.log(`[ChangePlan] Downgrade scheduled — ${currentPlan} → ${newPlan} on ${formattedDate}`)

      return NextResponse.json({
        success: true,
        type: 'downgrade',
        message: `Your plan will change to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} on ${formattedDate}. You keep ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} features until then.`,
        effectiveDate: periodEnd.toISOString(),
        newPlan,
      })
    }
  } catch (err) {
    console.error(`[ChangePlan] Error:`, err)
    const message = err instanceof Error ? err.message : 'Failed to change plan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
