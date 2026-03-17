// Page Templates — affiche et gère les templates de réponses du projet

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TemplatesClient } from '@/components/templates/templates-client'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!project) redirect('/onboarding')

  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })

  return (
    <TemplatesClient
      projectId={project.id}
      templates={templates ?? []}
    />
  )
}
