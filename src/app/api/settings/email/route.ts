// API to change user email — verifies current password first, then uses Supabase Admin
// PUT /api/settings/email { newEmail: string, currentPassword: string }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SupabaseServiceRoleKey
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SupabaseServiceRoleKey')
  }
  return createAdminClient(url, serviceKey)
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { newEmail, currentPassword } = await request.json()

  if (!newEmail || typeof newEmail !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  if (!currentPassword || typeof currentPassword !== 'string') {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 })
  }

  const trimmed = newEmail.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  if (trimmed === user.email) {
    return NextResponse.json({ error: 'Email is the same as current' }, { status: 400 })
  }

  // Verify current password before allowing email change
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  if (signInError) {
    console.log(`[Settings:Email] Password verification failed for user ${user.id}`)
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  try {
    const admin = getSupabaseAdmin()

    // Update email in Supabase Auth
    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      email: trimmed,
    })

    if (authError) {
      console.error('[Settings:Email] Auth update error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Update email in users table
    const { error: dbError } = await admin
      .from('users')
      .update({ email: trimmed, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (dbError) {
      console.error('[Settings:Email] DB update error:', dbError)
    }

    console.log(`[Settings:Email] User ${user.id} email changed to ${trimmed}`)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Settings:Email] Error:', err)
    const message = err instanceof Error ? err.message : 'Failed to update email'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
