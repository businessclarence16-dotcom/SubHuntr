// Keywords page — server component that fetches keywords and plan limits

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PLAN_LIMITS } from '@/constants/plans'
import { Plan } from '@/types'
import { KeywordsClient } from '@/components/keywords/keywords-client'

export default async function KeywordsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'starter') as Plan

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!project) redirect('/onboarding')

  const { data: keywords } = await supabase
    .from('keywords')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })

  const limit = PLAN_LIMITS[plan].keywordsPerProject

  return (
    <KeywordsClient
      projectId={project.id}
      keywords={keywords ?? []}
      limit={limit}
      plan={plan}
    />
  )
}
