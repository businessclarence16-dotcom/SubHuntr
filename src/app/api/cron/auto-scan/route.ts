// Cron job — runs every hour via Vercel Cron.
// For each project with auto_scan_enabled, checks if it's time to scan
// based on auto_scan_interval_hours and last_auto_scan_at.
// If high-intent posts are found, sends a digest email via Resend.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runScan } from '@/lib/reddit/scan'
import { getResend, FROM_EMAIL } from '@/lib/email/client'
import { digestEmail } from '@/lib/email/templates'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SupabaseServiceRoleKey) {
    return NextResponse.json({ skipped: true, reason: 'Missing SupabaseServiceRoleKey' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SupabaseServiceRoleKey
  )

  console.log('[Cron:AutoScan] ========== AUTO-SCAN START ==========')

  // Fetch all projects with auto_scan_enabled
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, user_id, name, auto_scan_enabled, auto_scan_interval_hours, notify_min_score, last_auto_scan_at')
    .eq('auto_scan_enabled', true)
    .eq('is_active', true)

  if (projectsError || !projects) {
    console.error('[Cron:AutoScan] Failed to fetch projects:', projectsError)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }

  console.log(`[Cron:AutoScan] Found ${projects.length} projects with auto-scan enabled`)

  let projectsScanned = 0
  let emailsSent = 0

  for (const project of projects) {
    const intervalHours = project.auto_scan_interval_hours ?? 12
    const minScore = project.notify_min_score ?? 7

    // Check if it's time to scan
    if (project.last_auto_scan_at) {
      const elapsed = (Date.now() - new Date(project.last_auto_scan_at).getTime()) / (1000 * 60 * 60)
      if (elapsed < intervalHours) {
        console.log(`[Cron:AutoScan] Project ${project.id} — ${elapsed.toFixed(1)}h since last scan, interval is ${intervalHours}h — skipping`)
        continue
      }
    }

    console.log(`[Cron:AutoScan] Scanning project ${project.id} (${project.name})`)

    try {
      const result = await runScan(supabase, project.id, '[Cron:AutoScan]')
      projectsScanned++

      // Update last_auto_scan_at
      await supabase
        .from('projects')
        .update({ last_auto_scan_at: new Date().toISOString() })
        .eq('id', project.id)

      // Filter posts >= notify_min_score
      const highIntentPosts = result.newPosts.filter((p) => p.relevance_score >= minScore)

      if (highIntentPosts.length === 0) {
        console.log(`[Cron:AutoScan] Project ${project.id} — ${result.postsFound} new posts, 0 above score ${minScore} — no email`)
        continue
      }

      // Get user email
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', project.user_id)
        .single()

      if (!userData?.email) {
        console.error(`[Cron:AutoScan] No email found for user ${project.user_id}`)
        continue
      }

      // Send digest email
      const resend = getResend()
      if (!resend) {
        console.log(`[Cron:AutoScan] Resend not configured — skipping email`)
        continue
      }

      const email = digestEmail(highIntentPosts, minScore)

      const { error: sendError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: userData.email,
        subject: email.subject,
        html: email.html,
      })

      if (sendError) {
        console.error(`[Cron:AutoScan] Email send error for ${userData.email}:`, sendError)
      } else {
        emailsSent++
        console.log(`[Cron:AutoScan] Sent digest to ${userData.email} — ${highIntentPosts.length} posts`)
      }
    } catch (err) {
      console.error(`[Cron:AutoScan] Error scanning project ${project.id}:`, err)
    }
  }

  console.log(`[Cron:AutoScan] ========== AUTO-SCAN DONE — ${projectsScanned} scanned, ${emailsSent} emails ==========`)

  return NextResponse.json({ success: true, projectsScanned, emailsSent })
}
