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
    />
  )
}
