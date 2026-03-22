// API route for polling subscription status after Stripe checkout
// Returns { active: boolean } — used by /activate to detect when webhook has processed

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ active: false })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ active: !!profile?.stripe_subscription_id })
}
