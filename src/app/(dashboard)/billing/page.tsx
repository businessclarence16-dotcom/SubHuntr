// Page Billing — plan actuel et upgrade

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BillingClient } from '@/components/billing/billing-client'
import { Plan } from '@/types'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  return (
    <BillingClient
      plan={(profile?.plan ?? 'starter') as Plan}
    />
  )
}
