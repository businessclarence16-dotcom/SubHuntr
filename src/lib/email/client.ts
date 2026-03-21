// Resend email client — singleton initialized with RESEND_API_KEY.
// Returns null if the API key is not configured (safe for dev).

import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export const FROM_EMAIL = 'SubHuntr <noreply@subhuntr.com>'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://subhuntr.com'
