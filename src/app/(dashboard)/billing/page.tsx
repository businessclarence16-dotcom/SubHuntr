// Page Billing — plan actuel, upgrade, gestion abonnement

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BillingClient } from '@/components/billing/billing-client'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('plan, stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  return (
    <BillingClient
      plan={(profile?.plan ?? 'free') as 'free' | 'pro' | 'business'}
      hasSubscription={!!profile?.stripe_subscription_id}
    />
  )
}
