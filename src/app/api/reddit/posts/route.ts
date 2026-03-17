// API Route pour mettre à jour le statut d'un post (new, replied, skipped, saved)
// PATCH /api/reddit/posts { postId: string, status: string }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
