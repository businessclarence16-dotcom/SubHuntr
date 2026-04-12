// API Route pour scanner Reddit
// GET  /api/reddit/scan?projectId=xxx → cooldown status
// POST /api/reddit/scan { projectId: string } → lance un scan

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SCAN_COOLDOWN_SECONDS } from '@/constants/plans'
import { Plan } from '@/types'
import { runScan } from '@/lib/reddit/scan'
import { SupabaseClient } from '@supabase/supabase-js'

const STUCK_SCAN_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

// Auto-expire scans stuck in "running" for more than 5 minutes
async function expireStuckScans(supabase: SupabaseClient, projectId: string) {
  const cutoff = new Date(Date.now() - STUCK_SCAN_TIMEOUT_MS).toISOString()
  const { data: stuck } = await supabase
    .from('scans')
    .select('id')
    .eq('project_id', projectId)
    .eq('status', 'running')
    .lt('started_at', cutoff)

  if (stuck && stuck.length > 0) {
    const ids = stuck.map((s) => s.id)
    await supabase
      .from('scans')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .in('id', ids)
    console.log(`[Scan] Auto-expired ${ids.length} stuck scan(s): ${ids.join(', ')}`)
  }
}

// GET — check cooldown status for a project
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const projectId = request.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  // Auto-expire stuck scans before checking cooldown
  await expireStuckScans(supabase, projectId)

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const userPlan = (profile?.plan ?? 'starter') as Plan
  const cooldownSeconds = SCAN_COOLDOWN_SECONDS[userPlan] ?? 900

  const { data: lastScan } = await supabase
    .from('scans')
    .select('completed_at')
    .eq('project_id', projectId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  let remainingSeconds = 0
  if (lastScan?.completed_at) {
    const elapsed = (Date.now() - new Date(lastScan.completed_at).getTime()) / 1000
    if (elapsed < cooldownSeconds) {
      remainingSeconds = Math.ceil(cooldownSeconds - elapsed)
    }
  }

  return NextResponse.json({ remainingSeconds, cooldownSeconds })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { projectId } = await request.json()

  if (!projectId) {
    return NextResponse.json({ error: 'projectId requis' }, { status: 400 })
  }

  // Vérifie que le projet appartient à l'utilisateur
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 })
  }

  // Vérifie l'intervalle minimum entre scans selon le plan
  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const userPlan = (profile?.plan ?? 'starter') as Plan
  const cooldownSeconds = SCAN_COOLDOWN_SECONDS[userPlan] ?? 900

  // Auto-expire stuck scans before checking
  await expireStuckScans(supabase, projectId)

  // Block if a scan is still genuinely running (started < 5 min ago)
  const { data: runningScan } = await supabase
    .from('scans')
    .select('id')
    .eq('project_id', projectId)
    .eq('status', 'running')
    .limit(1)
    .single()

  if (runningScan) {
    return NextResponse.json({
      error: 'cooldown',
      remainingSeconds: 30,
      message: 'A scan is already running. Please wait.',
    }, { status: 429 })
  }

  // Check cooldown based on last completed scan
  const { data: lastScan } = await supabase
    .from('scans')
    .select('completed_at')
    .eq('project_id', projectId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  if (lastScan?.completed_at) {
    const elapsedSeconds = (Date.now() - new Date(lastScan.completed_at).getTime()) / 1000
    if (elapsedSeconds < cooldownSeconds) {
      const remainingSeconds = Math.ceil(cooldownSeconds - elapsedSeconds)
      const minutes = Math.floor(remainingSeconds / 60)
      const seconds = remainingSeconds % 60
      const timeStr = minutes > 0 ? `${minutes}m ${String(seconds).padStart(2, '0')}s` : `${seconds}s`
      return NextResponse.json({
        error: 'cooldown',
        remainingSeconds,
        message: `Next scan available in ${timeStr}`,
      }, { status: 429 })
    }
  }

  // Check keywords and subreddits exist
  const [{ data: keywords }, { data: subreddits }] = await Promise.all([
    supabase.from('keywords').select('keyword').eq('project_id', projectId).eq('is_active', true),
    supabase.from('subreddits').select('name').eq('project_id', projectId).eq('is_active', true),
  ])

  if (!keywords?.length || !subreddits?.length) {
    return NextResponse.json(
      { error: 'Ajoutez au moins un keyword et un subreddit avant de scanner.' },
      { status: 400 }
    )
  }

  try {
    console.log(`[Scan] User: ${user.id} (plan: ${userPlan})`)
    const result = await runScan(supabase, projectId)

    return NextResponse.json({
      postsFound: result.postsFound,
      scanId: result.scanId,
      mode: result.mode,
      cooldownSeconds,
    })
  } catch (error) {
    console.error('[Scan] Fatal error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du scan Reddit.' },
      { status: 500 }
    )
  }
}
