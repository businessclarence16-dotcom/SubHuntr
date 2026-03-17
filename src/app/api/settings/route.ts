// API Route pour mettre à jour le profil et le projet
// PATCH /api/settings { type: 'profile' | 'project', data: {...} }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { type, data } = await request.json()

  if (type === 'profile') {
    const { fullName } = data
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName?.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour du profil' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (type === 'project') {
    const { projectId, name, url, description } = data

    if (!projectId || !name?.trim()) {
      return NextResponse.json({ error: 'projectId et name requis' }, { status: 400 })
    }

    const { error } = await supabase
      .from('projects')
      .update({
        name: name.trim(),
        url: url?.trim() || null,
        description: description?.trim() || null,
      })
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour du projet' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
}
