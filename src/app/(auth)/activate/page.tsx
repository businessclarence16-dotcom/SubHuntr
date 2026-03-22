// Activation page — requires card entry before dashboard access
// Shows setup summary and redirects to Stripe Checkout

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ActivateClient } from '@/components/activate/activate-client'

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; success?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if user already has subscription — redirect to feed
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_subscription_id, plan')
    .eq('id', user.id)
    .single()

  if (profile?.stripe_subscription_id) {
    redirect('/feed')
  }

  // Get project info for the summary
  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  let keywordCount = 0
  let subredditCount = 0
  let leadsFound = 0

  if (project) {
    const { count: kw } = await supabase
      .from('keywords')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
    keywordCount = kw ?? 0

    const { count: sr } = await supabase
      .from('subreddits')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
    subredditCount = sr ?? 0

    const { count: posts } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
    leadsFound = posts ?? 0
  }

  const params = await searchParams
  const selectedPlan = params.plan || 'starter'
  const isPostPayment = params.success === 'true'

  return (
    <ActivateClient
      projectName={project?.name ?? 'My Project'}
      keywordCount={keywordCount}
      subredditCount={subredditCount}
      leadsFound={leadsFound}
      plan={selectedPlan}
      isPostPayment={isPostPayment}
    />
  )
}
