// API to change user email — uses Supabase Admin to update auth + users table
// PUT /api/settings/email { email: string }

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

  const { email } = await request.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const trimmed = email.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  if (trimmed === user.email) {
    return NextResponse.json({ error: 'Email is the same as current' }, { status: 400 })
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
      // Auth email was already changed, just log the DB error
    }

    console.log(`[Settings:Email] User ${user.id} email changed to ${trimmed}`)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Settings:Email] Error:', err)
    const message = err instanceof Error ? err.message : 'Failed to update email'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
