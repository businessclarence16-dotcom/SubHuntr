// Cron job — runs daily at 9h UTC via Vercel Cron.
// Checks each user and sends appropriate email sequences.
// Max 1 email per user per day. Dedup via email_logs table.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/send'
import {
  inactiveDay1Email,
  inactiveDay3Email,
  trialDay5Email,
  trialExpiredEmail,
  churnDay7Email,
  churnDay14Email,
} from '@/lib/email/templates'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('[Cron:Email] Unauthorized — invalid CRON_SECRET')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SupabaseServiceRoleKey || !process.env.RESEND_API_KEY) {
    console.log('[Cron:Email] Missing env vars — skipping')
    return NextResponse.json({ skipped: true, reason: 'Missing env vars' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SupabaseServiceRoleKey
  )

  console.log('[Cron:Email] ========== EMAIL CRON START ==========')

  // Fetch all users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, plan, created_at')

  if (usersError || !users) {
    console.error('[Cron:Email] Failed to fetch users:', usersError)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  console.log(`[Cron:Email] Processing ${users.length} users`)

  // Today's date boundary for "max 1 email per day" check
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  let emailsSent = 0

  for (const user of users) {
    const now = Date.now()
    const signupTime = new Date(user.created_at).getTime()
    const hoursSinceSignup = (now - signupTime) / (1000 * 60 * 60)
    const daysSinceSignup = hoursSinceSignup / 24
    const name = user.full_name || ''

    // --- Max 1 email per day per user ---
    const { count: emailsToday } = await supabase
      .from('email_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('sent_at', todayStart.toISOString())

    if ((emailsToday ?? 0) > 0) {
      console.log(`[Cron:Email] User ${user.id} already received email today — skipping`)
      continue
    }

    // --- Get user's project ---
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    const projectId = project?.id ?? null

    // --- Check if user has any scans ---
    let hasScanned = false
    if (projectId) {
      const { count: scanCount } = await supabase
        .from('scans')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
      hasScanned = (scanCount ?? 0) > 0
    }

    // ========== SEQUENCE A: Onboarding (inactive users) ==========

    // A2: 24h after signup, no scans
    if (!hasScanned && hoursSinceSignup >= 24 && hoursSinceSignup < 72) {
      const email = inactiveDay1Email(name)
      if (await sendEmail(user.id, 'onboarding_inactive_day1', user.email, email.subject, email.html)) {
        emailsSent++
        continue // max 1 per day
      }
    }

    // A3: 72h after signup, no scans
    if (!hasScanned && hoursSinceSignup >= 72 && hoursSinceSignup < 168) {
      const email = inactiveDay3Email(name)
      if (await sendEmail(user.id, 'onboarding_inactive_day3', user.email, email.subject, email.html)) {
        emailsSent++
        continue
      }
    }

    // ========== SEQUENCE B: Trial conversion ==========

    if (user.plan === 'starter') {
      // B1: Day 5 (trial ends in 2 days)
      if (daysSinceSignup >= 5 && daysSinceSignup < 6) {
        let postsFound = 0
        let highIntentCount = 0

        if (projectId) {
          const { count: totalPosts } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
          postsFound = totalPosts ?? 0

          const { count: hiPosts } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .gte('relevance_score', 7)
          highIntentCount = hiPosts ?? 0
        }

        const email = trialDay5Email(name, postsFound, highIntentCount)
        if (await sendEmail(user.id, 'trial_reminder_day5', user.email, email.subject, email.html)) {
          emailsSent++
          continue
        }
      }

      // B2: Day 8 (1 day after trial expired)
      if (daysSinceSignup >= 8 && daysSinceSignup < 9) {
        const email = trialExpiredEmail(name)
        if (await sendEmail(user.id, 'trial_expired', user.email, email.subject, email.html)) {
          emailsSent++
          continue
        }
      }
    }

    // ========== SEQUENCE C: Anti-churn ==========

    if (hasScanned && projectId) {
      // Find most recent scan
      const { data: lastScanData } = await supabase
        .from('scans')
        .select('completed_at')
        .eq('project_id', projectId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (lastScanData?.completed_at) {
        const daysSinceLastScan = (now - new Date(lastScanData.completed_at).getTime()) / (1000 * 60 * 60 * 24)

        // C1: No activity for 7 days — only if unread posts > 0
        if (daysSinceLastScan >= 7 && daysSinceLastScan < 14) {
          const { count: unreadCount } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .eq('status', 'new')

          if ((unreadCount ?? 0) > 0) {
            const email = churnDay7Email(name, unreadCount ?? 0)
            if (await sendEmail(user.id, 'churn_day7', user.email, email.subject, email.html)) {
              emailsSent++
              continue
            }
          }
        }

        // C2: No activity for 14 days
        if (daysSinceLastScan >= 14) {
          const email = churnDay14Email(name)
          if (await sendEmail(user.id, 'churn_day14', user.email, email.subject, email.html)) {
            emailsSent++
            continue
          }
        }
      }
    }
  }

  console.log(`[Cron:Email] ========== EMAIL CRON DONE — ${emailsSent} emails sent ==========`)

  return NextResponse.json({ success: true, emailsSent, usersProcessed: users.length })
}
