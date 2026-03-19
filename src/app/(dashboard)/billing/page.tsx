// Page Billing — plan, subscription management, upgrade/downgrade

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BillingClient } from '@/components/billing/billing-client'
import { Plan } from '@/types'
import { getStripe } from '@/lib/stripe/client'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('plan, stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  // Fetch subscription details from Stripe if the user has one
  let subscriptionInfo: {
    status: string
    currentPeriodEnd: string | null
    trialEnd: string | null
    cancelAtPeriodEnd: boolean
  } | null = null

  if (profile?.stripe_subscription_id) {
    try {
      const stripe = getStripe()
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      subscriptionInfo = {
        status: sub.status,
        currentPeriodEnd: sub.cancel_at
          ? new Date(sub.cancel_at * 1000).toISOString()
          : null,
        trialEnd: sub.trial_end
          ? new Date(sub.trial_end * 1000).toISOString()
          : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      }
    } catch (err) {
      console.error('[Billing] Failed to retrieve subscription:', err)
    }
  }

  return (
    <BillingClient
      plan={(profile?.plan ?? 'starter') as Plan}
      stripeCustomerId={profile?.stripe_customer_id ?? null}
      stripeSubscriptionId={profile?.stripe_subscription_id ?? null}
      subscriptionInfo={subscriptionInfo}
    />
  )
}
