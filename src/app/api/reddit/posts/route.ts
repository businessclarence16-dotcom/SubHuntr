// API Route pour les posts Reddit
// GET /api/reddit/posts?projectId=xxx&limit=3 — récupère les meilleurs posts
// PATCH /api/reddit/posts { postId: string, status: string } — met à jour le statut

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const projectId = request.nextUrl.searchParams.get('projectId')
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '3', 10), 50)

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  // Verify project belongs to user
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, subreddit, relevance_score, url')
    .eq('project_id', projectId)
    .order('relevance_score', { ascending: false, nullsFirst: false })
    .limit(limit)

  return NextResponse.json({ posts: posts ?? [] })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { postId, status } = await request.json()

  if (!postId || !status) {
    return NextResponse.json({ error: 'postId et status requis' }, { status: 400 })
  }

  const validStatuses = ['new', 'replied', 'skipped', 'saved']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  // Vérifie que le post appartient à un projet de l'utilisateur
  const { data: post } = await supabase
    .from('posts')
    .select('id, project_id, projects!inner(user_id)')
    .eq('id', postId)
    .single()

  if (!post || (post as Record<string, unknown>).projects === null) {
    return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 })
  }

  const { error } = await supabase
    .from('posts')
    .update({ status })
    .eq('id', postId)

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
