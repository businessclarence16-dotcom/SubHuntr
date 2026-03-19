// API Route to delete a user account
// POST /api/account/delete — requires authenticated user

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SupabaseServiceRoleKey

  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL or SupabaseServiceRoleKey is missing')
  }

  return createAdminClient(url, serviceKey)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { confirmation } = await request.json()

  if (confirmation !== 'DELETE') {
    return NextResponse.json({ error: 'Invalid confirmation' }, { status: 400 })
  }

  console.log(`[Account] Deleting user ${user.id}`)

  const admin = getSupabaseAdmin()

  // Delete from users table first (CASCADE will handle projects, keywords, etc.)
  const { error: dbError } = await admin
    .from('users')
    .delete()
    .eq('id', user.id)

  if (dbError) {
    console.error(`[Account] Failed to delete user row:`, dbError)
    return NextResponse.json({ error: 'Failed to delete account data' }, { status: 500 })
  }

  // Delete auth user
  const { error: authError } = await admin.auth.admin.deleteUser(user.id)

  if (authError) {
    console.error(`[Account] Failed to delete auth user:`, authError)
    return NextResponse.json({ error: 'Failed to delete auth account' }, { status: 500 })
  }

  console.log(`[Account] User ${user.id} deleted successfully`)
  return NextResponse.json({ success: true })
}
