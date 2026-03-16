// Feed — affiche les posts Reddit trouvés et permet de lancer un scan

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedClient } from '@/components/feed/feed-client'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Récupère le premier projet actif de l'utilisateur
  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!project) {
    redirect('/onboarding')
  }

  // Récupère les posts du projet
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('project_id', project.id)
    .order('found_at', { ascending: false })
    .limit(50)

  // Récupère les keywords pour les filtres
  const { data: keywords } = await supabase
    .from('keywords')
    .select('keyword')
    .eq('project_id', project.id)
    .eq('is_active', true)

  // Récupère les subreddits pour les filtres
  const { data: subreddits } = await supabase
    .from('subreddits')
    .select('name')
    .eq('project_id', project.id)
    .eq('is_active', true)

  return (
    <FeedClient
      projectId={project.id}
      projectName={project.name}
      posts={posts ?? []}
      keywords={keywords?.map((k) => k.keyword) ?? []}
      subreddits={subreddits?.map((s) => s.name) ?? []}
    />
  )
}
