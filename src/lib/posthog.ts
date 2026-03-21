// PostHog analytics helpers — safe to call even if PostHog is not initialized.
// Import and call these from client components to track events.

import posthog from 'posthog-js'

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    posthog.capture(event, properties)
  } catch {
    // PostHog not initialized — ignore
  }
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    posthog.identify(userId, properties)
  } catch {
    // PostHog not initialized — ignore
  }
}
