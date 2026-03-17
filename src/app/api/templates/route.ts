// API Route pour le CRUD des templates de réponses
// GET /api/templates?projectId=xxx — liste les templates du projet
// POST /api/templates { projectId, name, content, isDefault? } — crée un template
// PATCH /api/templates { id, name?, content?, isDefault? } — met à jour un template
// DELETE /api/templates { id } — supprime un template

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const projectId = request.nextUrl.searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'projectId requis' }, { status: 400 })
  }

  const { data: templates, error } = await supabase
    .from('templates')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Erreur lors du chargement' }, { status: 500 })
  }

  return NextResponse.json(templates)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { projectId, name, content, isDefault } = await request.json()

  if (!projectId || !name?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'projectId, name et content requis' }, { status: 400 })
  }

  // Si isDefault, retire le default des autres templates
  if (isDefault) {
    await supabase
      .from('templates')
      .update({ is_default: false })
      .eq('project_id', projectId)
  }

  const { data: template, error } = await supabase
    .from('templates')
    .insert({
      project_id: projectId,
      name: name.trim(),
      content: content.trim(),
      is_default: isDefault ?? false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }

  return NextResponse.json(template)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id, name, content, isDefault } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 })
  }

  // Récupère le template pour vérifier la propriété
  const { data: existing } = await supabase
    .from('templates')
    .select('id, project_id')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Template non trouvé' }, { status: 404 })
  }

  // Si isDefault, retire le default des autres
  if (isDefault) {
    await supabase
      .from('templates')
      .update({ is_default: false })
      .eq('project_id', existing.project_id)
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (name !== undefined) updates.name = name.trim()
  if (content !== undefined) updates.content = content.trim()
  if (isDefault !== undefined) updates.is_default = isDefault

  const { data: template, error } = await supabase
    .from('templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }

  return NextResponse.json(template)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 })
  }

  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
