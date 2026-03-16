// Server actions pour l'onboarding — création de projet, keywords et subreddits

'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const name = formData.get('name') as string
  const url = formData.get('url') as string
  const description = formData.get('description') as string

  if (!name?.trim()) {
    return { error: 'Le nom du projet est requis.' }
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: name.trim(),
      url: url?.trim() || null,
      description: description?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: 'Erreur lors de la création du projet.' }
  }

  return { projectId: project.id }
}

export async function addKeywords(projectId: string, keywords: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const validKeywords = keywords
    .map((k) => k.trim())
    .filter((k) => k.length > 0)

  if (validKeywords.length === 0) {
    return { error: 'Ajoutez au moins un keyword.' }
  }

  const rows = validKeywords.map((keyword) => ({
    project_id: projectId,
    keyword,
  }))

  const { error } = await supabase.from('keywords').insert(rows)

  if (error) {
    return { error: 'Erreur lors de l\'ajout des keywords.' }
  }

  return { success: true }
}

export async function addSubreddits(projectId: string, subreddits: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const validSubreddits = subreddits
    .map((s) => s.trim().replace(/^r\//, ''))
    .filter((s) => s.length > 0)

  if (validSubreddits.length === 0) {
    return { error: 'Ajoutez au moins un subreddit.' }
  }

  const rows = validSubreddits.map((name) => ({
    project_id: projectId,
    name,
  }))

  const { error } = await supabase.from('subreddits').insert(rows)

  if (error) {
    return { error: 'Erreur lors de l\'ajout des subreddits.' }
  }

  return { success: true }
}
