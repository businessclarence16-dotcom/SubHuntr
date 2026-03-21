// Helper to send an email via Resend and log it to email_logs table.
// Skips if already sent (dedup by user_id + email_type).

import { getResend, FROM_EMAIL } from '@/lib/email/client'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = process.env.SupabaseServiceRoleKey
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SupabaseServiceRoleKey
    )
  : null

export async function sendEmail(
  userId: string,
  emailType: string,
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    console.log(`[Email] Skipping "${emailType}" — RESEND_API_KEY not configured`)
    return false
  }

  if (!supabaseAdmin) {
    console.log(`[Email] Skipping "${emailType}" — SupabaseServiceRoleKey not configured`)
    return false
  }

  // Check if already sent
  const { data: existing } = await supabaseAdmin
    .from('email_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('email_type', emailType)
    .maybeSingle()

  if (existing) {
    console.log(`[Email] Already sent "${emailType}" to user ${userId} — skipping`)
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error(`[Email] Failed to send "${emailType}" to ${to}:`, error)
      return false
    }

    // Log the sent email
    await supabaseAdmin
      .from('email_logs')
      .insert({ user_id: userId, email_type: emailType, sent_at: new Date().toISOString() })

    console.log(`[Email] Sent "${emailType}" to ${to}`)
    return true
  } catch (err) {
    console.error(`[Email] Error sending "${emailType}":`, err)
    return false
  }
}
