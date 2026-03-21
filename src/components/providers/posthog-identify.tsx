// Identifies the current user in PostHog when the dashboard loads.
// Receives userId, email, plan from server component and calls posthog.identify.

'use client'

import { useEffect, useRef } from 'react'
import { identifyUser } from '@/lib/posthog'

interface PostHogIdentifyProps {
  userId: string
  email: string
  plan: string
}

export function PostHogIdentify({ userId, email, plan }: PostHogIdentifyProps) {
  const identifiedRef = useRef(false)

  useEffect(() => {
    if (identifiedRef.current) return
    identifiedRef.current = true
    identifyUser(userId, { email, plan })
  }, [userId, email, plan])

  return null
}
