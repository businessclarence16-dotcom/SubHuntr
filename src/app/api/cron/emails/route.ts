// Cron job — runs daily at 9h UTC via Vercel Cron.
// Checks each user and sends appropriate email sequences.
// Vercel cron config in vercel.json.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/send'
import {
  inactiveDay1Email,
  inactiveDay3Email,
  trialDay5Email,
  trialDay6Email,
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

  // Fetch all users with their metadata
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, plan, created_at')

  if (usersError || !users) {
    console.error('[Cron:Email] Failed to fetch users:', usersError)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  console.log(`[Cron:Email] Processing ${users.length} users`)

  let emailsSent = 0

  for (const user of users) {
    const now = Date.now()
    const signupTime = new Date(user.created_at).getTime()
    const hoursSinceSignup = (now - signupTime) / (1000 * 60 * 60)
    const daysSinceSignup = hoursSinceSignup / 24
    const name = user.full_name || ''

    // --- SEQUENCE A: Onboarding (inactive users) ---

    // Check if user has any scans
    const { count: scanCount } = await supabase
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', (
        await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()
      ).data?.id ?? '00000000-0000-0000-0000-000000000000')

    const hasScanned = (scanCount ?? 0) > 0

    // A2: 24h after signup, no scans
    if (!hasScanned && hoursSinceSignup >= 24 && hoursSinceSignup < 72) {
      const email = inactiveDay1Email(name)
      if (await sendEmail(user.id, 'onboarding_inactive_day1', user.email, email.subject, email.html)) {
        emailsSent++
      }
    }

    // A3: 72h after signup, no scans
    if (!hasScanned && hoursSinceSignup >= 72 && hoursSinceSignup < 168) {
      const trialDaysLeft = Math.max(0, Math.ceil(7 - daysSinceSignup))
      const email = inactiveDay3Email(name, trialDaysLeft)
      if (await sendEmail(user.id, 'onboarding_inactive_day3', user.email, email.subject, email.html)) {
        emailsSent++
      }
    }

    // --- SEQUENCE B: Trial conversion ---

    // Only for starter plan (trial users)
    if (user.plan === 'starter') {
      // B1: Day 5 (trial ends in 2 days)
      if (daysSinceSignup >= 5 && daysSinceSignup < 6) {
        // Count posts and high-intent posts
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)

        let postsFound = 0
        let highIntent = 0
        if (projects && projects.length > 0) {
          const projectIds = projects.map((p) => p.id)
          const { count: totalPosts } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .in('project_id', projectIds)
          postsFound = totalPosts ?? 0

          const { count: hiPosts } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .in('project_id', projectIds)
            .gte('relevance_score', 7)
          highIntent = hiPosts ?? 0
        }

        const email = trialDay5Email(name, postsFound, highIntent)
        if (await sendEmail(user.id, 'trial_reminder_day5', user.email, email.subject, email.html)) {
          emailsSent++
        }
      }

      // B2: Day 6 (last day)
      if (daysSinceSignup >= 6 && daysSinceSignup < 7) {
        const email = trialDay6Email(name)
        if (await sendEmail(user.id, 'trial_reminder_day6', user.email, email.subject, email.html)) {
          emailsSent++
        }
      }
    }

    // --- SEQUENCE C: Anti-churn (paying users or active trial) ---

    if (hasScanned) {
      // Find most recent scan
      const { data: lastScanData } = await supabase
        .from('scans')
        .select('completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (lastScanData?.completed_at) {
        const daysSinceLastScan = (now - new Date(lastScanData.completed_at).getTime()) / (1000 * 60 * 60 * 24)

        // C1: No activity for 7 days
        if (daysSinceLastScan >= 7 && daysSinceLastScan < 14) {
          // Count unread posts
          const { data: projects } = await supabase
            .from('projects')
            .select('id')
            .eq('user_id', user.id)

          let unreadCount = 0
          if (projects && projects.length > 0) {
            const projectIds = projects.map((p) => p.id)
            const { count } = await supabase
              .from('posts')
              .select('id', { count: 'exact', head: true })
              .in('project_id', projectIds)
              .eq('status', 'new')
            unreadCount = count ?? 0
          }

          if (unreadCount > 0) {
            const email = churnDay7Email(name, unreadCount)
            if (await sendEmail(user.id, 'churn_day7', user.email, email.subject, email.html)) {
              emailsSent++
            }
          }
        }

        // C2: No activity for 14 days
        if (daysSinceLastScan >= 14) {
          const email = churnDay14Email(name)
          if (await sendEmail(user.id, 'churn_day14', user.email, email.subject, email.html)) {
            emailsSent++
          }
        }
      }
    }
  }

  console.log(`[Cron:Email] ========== EMAIL CRON DONE — ${emailsSent} emails sent ==========`)

  return NextResponse.json({ success: true, emailsSent, usersProcessed: users.length })
}
