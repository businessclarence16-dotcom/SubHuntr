// API for notification preferences — auto-scan toggle, interval, min score
// GET  → current preferences
// PUT  → update preferences (validates interval against plan)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AUTO_SCAN_INTERVALS } from '@/constants/plans'
import { Plan } from '@/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('id, auto_scan_enabled, auto_scan_interval_hours, notify_min_score')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'No active project' }, { status: 404 })
  }

  return NextResponse.json({
    auto_scan_enabled: project.auto_scan_enabled ?? false,
    auto_scan_interval_hours: project.auto_scan_interval_hours ?? 12,
    notify_min_score: project.notify_min_score ?? 7,
  })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json()
  const { auto_scan_enabled, auto_scan_interval_hours, notify_min_score } = body

  // Get user plan
  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const userPlan = (profile?.plan ?? 'starter') as Plan
  const allowedIntervals = AUTO_SCAN_INTERVALS[userPlan] ?? [12, 24]

  // Validate interval is allowed for plan
  if (auto_scan_interval_hours !== undefined && !allowedIntervals.includes(auto_scan_interval_hours)) {
    return NextResponse.json(
      { error: `Upgrade your plan to use ${auto_scan_interval_hours}h scan interval` },
      { status: 403 }
    )
  }

  // Validate min score
  if (notify_min_score !== undefined && (notify_min_score < 1 || notify_min_score > 10)) {
    return NextResponse.json({ error: 'Invalid minimum score' }, { status: 400 })
  }

  // Get active project
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'No active project' }, { status: 404 })
  }

  // Build update object with only provided fields
  const update: Record<string, unknown> = {}
  if (auto_scan_enabled !== undefined) update.auto_scan_enabled = auto_scan_enabled
  if (auto_scan_interval_hours !== undefined) update.auto_scan_interval_hours = auto_scan_interval_hours
  if (notify_min_score !== undefined) update.notify_min_score = notify_min_score

  const { error } = await supabase
    .from('projects')
    .update(update)
    .eq('id', project.id)

  if (error) {
    console.error('[Notifications] Update error:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
