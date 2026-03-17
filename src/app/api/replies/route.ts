// API Route pour créer une réponse à un post Reddit
// POST /api/replies { postId: string, content: string, templateId?: string }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { postId, content, templateId } = await request.json()

  if (!postId || !content?.trim()) {
    return NextResponse.json({ error: 'postId et content requis' }, { status: 400 })
  }

  // Vérifie que le post appartient à un projet de l'utilisateur
  const { data: post } = await supabase
    .from('posts')
    .select('id, project_id, projects!inner(user_id)')
    .eq('id', postId)
    .single()

  if (!post) {
    return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 })
  }

  // Crée la réponse
  const { data: reply, error } = await supabase
    .from('replies')
    .insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
      template_id: templateId || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Erreur création reply:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la réponse' }, { status: 500 })
  }

  // Met à jour le statut du post en "replied"
  await supabase
    .from('posts')
    .update({ status: 'replied' })
    .eq('id', postId)

  return NextResponse.json({ replyId: reply.id })
}
