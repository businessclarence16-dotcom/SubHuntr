// Activate client — shows setup summary OR post-payment polling screen

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Check, Shield, ArrowRight } from 'lucide-react'

interface ActivateClientProps {
  projectName: string
  keywordCount: number
  subredditCount: number
  leadsFound: number
  plan: string
  isPostPayment: boolean
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
  isPostPayment,
}: ActivateClientProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activating, setActivating] = useState(isPostPayment)
  const [timedOut, setTimedOut] = useState(false)

  const info = PLAN_INFO[plan] ?? PLAN_INFO.starter
  const isTrial = info.trial

  // Poll for subscription status after Stripe payment
  useEffect(() => {
    if (!isPostPayment) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/stripe/status')
        const data = await res.json()
        if (data.active) {
          clearInterval(interval)
          window.location.href = '/feed?activated=true'
        }
      } catch (err) {
        console.error('[Activate] Polling error:', err)
      }
    }, 2000)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      setTimedOut(true)
    }, 30000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isPostPayment])

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
        console.error('[Activate] Checkout failed:', data)
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error('[Activate] Network error:', err)
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  // ---- Post-payment activating screen ----
  if (activating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 py-12">
        <Link href="/" className="mb-10 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#1D9E75]">
            <span className="text-[8px] text-white">&#9679;</span>
          </div>
          <span className="text-[1.25rem] font-bold tracking-tight text-[#fafafa]">SubHuntr</span>
        </Link>

        <div
          className="w-full max-w-[480px] rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] px-10 py-10 text-center animate-fade-in-up"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.4)' }}
        >
          {!timedOut ? (
            <>
              {/* Spinner */}
              <div
                className="mx-auto mb-6 h-10 w-10 rounded-full border-[3px] border-[rgba(255,255,255,0.1)] border-t-[#1D9E75]"
                style={{ animation: 'spin 0.8s linear infinite' }}
              />
              <h2
                className="mb-2 text-[1.2rem] font-[800] text-[#fafafa]"
                style={{ letterSpacing: '-0.02em' }}
              >
                Activating your account...
              </h2>
              <p className="text-[0.85rem] text-[#a1a1aa]">
                This usually takes a few seconds.
              </p>
            </>
          ) : (
            <>
              <h2
                className="mb-2 text-[1.2rem] font-[800] text-[#fafafa]"
                style={{ letterSpacing: '-0.02em' }}
              >
                Taking longer than expected
              </h2>
              <p className="mb-6 text-[0.85rem] text-[#a1a1aa]">
                Your payment was received. If your dashboard isn&apos;t ready yet, try refreshing in a moment.
              </p>
              <button
                onClick={() => { window.location.href = '/feed' }}
                className="inline-flex h-[44px] items-center gap-2 rounded-[10px] bg-[#1D9E75] px-6 text-[0.88rem] font-bold text-white"
                style={{ boxShadow: '0 0 30px rgba(29,158,117,0.15), 0 4px 12px rgba(0,0,0,0.3)' }}
              >
                Continue to dashboard <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-4 text-[0.72rem] text-[#52525b]">
                Still having issues? <a href="mailto:contact@subhuntr.com" className="text-[#1D9E75] underline">Contact support</a>
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  // ---- Normal activate screen ----
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 py-12">
      <Link href="/" className="mb-10 flex items-center gap-2.5 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#1D9E75]">
          <span className="text-[8px] text-white">&#9679;</span>
        </div>
        <span className="text-[1.25rem] font-bold tracking-tight text-[#fafafa]">SubHuntr</span>
      </Link>

      <div
        className="w-full max-w-[480px] rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] px-10 py-10 animate-fade-in-up"
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
          className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#1D9E75] text-[0.92rem] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            boxShadow: '0 0 30px rgba(29,158,117,0.15), 0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
            animation: 'subtleGlow 3s ease-in-out infinite',
          }}
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
