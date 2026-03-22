// Activate client — shows setup summary and redirects to Stripe Checkout

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Check, Shield } from 'lucide-react'

interface ActivateClientProps {
  projectName: string
  keywordCount: number
  subredditCount: number
  leadsFound: number
  plan: string
}

const PLAN_INFO: Record<string, { label: string; price: number; trial: boolean }> = {
  starter: { label: 'Starter', price: 29, trial: true },
  growth: { label: 'Growth', price: 79, trial: false },
  agency: { label: 'Agency', price: 199, trial: false },
}

export function ActivateClient({
  projectName,
  keywordCount,
  subredditCount,
  leadsFound,
  plan,
}: ActivateClientProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const info = PLAN_INFO[plan] ?? PLAN_INFO.starter
  const isTrial = info.trial

  async function handleActivate() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing: 'monthly' }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[#1D9E75]">
          <span className="text-[8px] text-white">&#9679;</span>
        </div>
        <span className="text-[0.95rem] font-bold tracking-tight text-[#fafafa]">SubHuntr</span>
      </Link>

      {/* Card */}
      <div
        className="stagger-children w-full max-w-[480px] rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] p-8"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.4)' }}
      >
        <h1
          className="mb-2 text-center text-[1.4rem] font-[800] text-[#fafafa]"
          style={{ letterSpacing: '-0.03em', lineHeight: '1.2' }}
        >
          {isTrial ? "You're all set! Activate your free trial" : `You're all set! Subscribe to ${info.label}`}
        </h1>
        <p className="mb-6 text-center text-[0.85rem] text-[#a1a1aa]">
          {isTrial ? 'Start your 7-day free trial. Cancel anytime.' : `Get full access to SubHuntr ${info.label}. Cancel anytime.`}
        </p>

        {/* Setup summary */}
        <div className="mb-6 space-y-2.5">
          <div className="flex items-center gap-2.5 text-[0.82rem]">
            <Check className="h-4 w-4 shrink-0 text-[#1D9E75]" />
            <span className="text-[#a1a1aa]">Project: <span className="font-medium text-[#fafafa]">{projectName}</span></span>
          </div>
          <div className="flex items-center gap-2.5 text-[0.82rem]">
            <Check className="h-4 w-4 shrink-0 text-[#1D9E75]" />
            <span className="text-[#a1a1aa]"><span className="font-medium text-[#fafafa]">{keywordCount}</span> keywords configured</span>
          </div>
          <div className="flex items-center gap-2.5 text-[0.82rem]">
            <Check className="h-4 w-4 shrink-0 text-[#1D9E75]" />
            <span className="text-[#a1a1aa]"><span className="font-medium text-[#fafafa]">{subredditCount}</span> subreddits monitored</span>
          </div>
          <div className="flex items-center gap-2.5 text-[0.82rem]">
            <Check className="h-4 w-4 shrink-0 text-[#1D9E75]" />
            <span className="text-[#a1a1aa]"><span className="font-medium text-[#fafafa]">{leadsFound}</span> leads found in your first scan</span>
          </div>
        </div>

        {/* What's included */}
        <div className="mb-6 rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
          <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-wider text-[#52525b]">
            {isTrial ? 'Included in your trial' : `Included in ${info.label}`}
          </p>
          <p className="text-[0.82rem] leading-relaxed text-[#a1a1aa]">
            Full access to your Lead Feed, AI scoring, reply templates, and real-time Reddit monitoring.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleActivate}
          disabled={loading}
          className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#1D9E75] text-[0.92rem] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed animate-glow-pulse"
          style={{ transition: 'all 0.2s' }}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isTrial ? (
            'Start free trial — $0 for 7 days'
          ) : (
            `Subscribe — $${info.price}/mo`
          )}
        </button>

        {error && (
          <p className="mt-3 text-center text-[0.78rem] text-[#ef4444]">{error}</p>
        )}

        <p className="mt-3 text-center text-[0.78rem] text-[#52525b]">
          {isTrial ? `Then $${info.price}/mo. Cancel anytime before the trial ends.` : 'Cancel anytime from your settings.'}
        </p>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.72rem] text-[#52525b]">
          <Shield className="h-3 w-3" /> Secured by Stripe. We never see your card details.
        </p>
      </div>
    </div>
  )
}
