// Page Settings — profil, projet, notifications, compte

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/settings/settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Récupère le profil utilisateur
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Récupère le projet actif
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Check if project has keywords and subreddits
  let hasKeywords = false
  let hasSubreddits = false
  if (project) {
    const [{ count: kwCount }, { count: subCount }] = await Promise.all([
      supabase.from('keywords').select('id', { count: 'exact', head: true }).eq('project_id', project.id).eq('is_active', true),
      supabase.from('subreddits').select('id', { count: 'exact', head: true }).eq('project_id', project.id).eq('is_active', true),
    ])
    hasKeywords = (kwCount ?? 0) > 0
    hasSubreddits = (subCount ?? 0) > 0
  }

  return (
    <SettingsClient
      user={{
        id: user.id,
        email: user.email ?? '',
        fullName: profile?.full_name ?? '',
        plan: profile?.plan ?? 'starter',
      }}
      project={project ? {
        id: project.id,
        name: project.name,
        url: project.url ?? '',
        description: project.description ?? '',
      } : null}
      notifications={{
        autoScanEnabled: project?.auto_scan_enabled ?? false,
        autoScanIntervalHours: project?.auto_scan_interval_hours ?? 12,
        notifyMinScore: project?.notify_min_score ?? 7,
        hasKeywords,
        hasSubreddits,
      }}
    />
  )
}
