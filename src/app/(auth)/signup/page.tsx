// Signup page — premium dark theme matching landing page exactly
// Shows "Check your inbox" screen after successful signup

'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signup, type AuthState } from '@/app/(auth)/actions/auth'
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { trackEvent } from '@/lib/posthog'

const initialState: AuthState = { error: null }

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  )
}

function SignupContent() {
  const [state, formAction, pending] = useActionState(signup, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const trackedRef = useRef(false)

  // Track signup_started on mount
  useEffect(() => {
    trackEvent('signup_started', { plan: plan ?? 'none' })
  }, [plan])

  // Track signup_completed on success
  useEffect(() => {
    if (state.success && !trackedRef.current) {
      trackedRef.current = true
      trackEvent('signup_completed', { email: state.email, plan: plan ?? 'none' })
    }
  }, [state.success, state.email, plan])

  // Success — show "Check your inbox" screen
  if (state.success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="stagger-children w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#1D9E75]">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            <span
              className="text-[0.95rem] font-bold text-[#fafafa]"
              style={{ letterSpacing: '-0.02em' }}
            >
              SubHuntr
            </span>
          </div>

          {/* Card */}
          <div
            className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] p-8 text-center"
            style={{
              boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 20px 50px rgba(0,0,0,0.5), 0 0 80px rgba(29,158,117,0.05)',
            }}
          >
            {/* Email icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(29,158,117,0.1)]">
              <Mail className="h-8 w-8 text-[#1D9E75]" />
            </div>

            <h1
              className="mb-3 text-[clamp(1.7rem,3.5vw,2rem)] font-[800] text-[#fafafa]"
              style={{ letterSpacing: '-0.035em', lineHeight: '1.15' }}
            >
              Check your inbox
            </h1>

            <p className="mb-2 text-[0.88rem] text-[#a1a1aa]">
              We sent a confirmation link to{' '}
              <strong className="text-[#fafafa]">{state.email}</strong>.
              Click the link to activate your account.
            </p>

            <p className="mb-8 text-[0.78rem] text-[#52525b]">
              Didn&apos;t receive it? Check your spam folder or try again.
            </p>

            <Link
              href="/login"
              className="inline-flex h-[46px] items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.06)] px-8 text-[0.88rem] font-medium text-[#a1a1aa] hover:border-[rgba(255,255,255,0.1)] hover:text-[#fafafa]"
              style={{ transition: 'all 0.2s' }}
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="stagger-children w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#1D9E75]">
            <div className="h-1.5 w-1.5 rounded-full bg-white" />
          </div>
          <span
            className="text-[0.95rem] font-bold text-[#fafafa]"
            style={{ letterSpacing: '-0.02em' }}
          >
            SubHuntr
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] p-8"
          style={{
            boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 20px 50px rgba(0,0,0,0.5), 0 0 80px rgba(29,158,117,0.05)',
          }}
        >
          <div className="mb-6 text-center">
            <h1
              className="text-[clamp(1.7rem,3.5vw,2rem)] font-[800] text-[#fafafa]"
              style={{ letterSpacing: '-0.035em', lineHeight: '1.15' }}
            >
              Create your account
            </h1>
            <p className="mt-2 text-[0.88rem] text-[#a1a1aa]">Start finding Reddit leads in 3 minutes</p>
          </div>

          <form action={formAction} className="flex flex-col gap-5">
            {state.error && (
              <div className="rounded-[10px] border border-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-[0.82rem] text-[#ef4444]">
                {state.error}
              </div>
            )}

            {/* Pass plan as hidden field */}
            {plan && <input type="hidden" name="plan" value={plan} />}

            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="full_name" className="text-[0.82rem] font-semibold text-[#fafafa]">
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52525b]" />
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="John Doe"
                  className="h-11 w-full rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[#09090b] pl-10 pr-4 text-[0.88rem] text-[#fafafa] placeholder:text-[#52525b] focus:border-[#1D9E75] focus:outline-none"
                  style={{ transition: 'border-color 0.2s' }}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[0.82rem] font-semibold text-[#fafafa]">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52525b]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  className="h-11 w-full rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[#09090b] pl-10 pr-4 text-[0.88rem] text-[#fafafa] placeholder:text-[#52525b] focus:border-[#1D9E75] focus:outline-none"
                  style={{ transition: 'border-color 0.2s' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-[0.82rem] font-semibold text-[#fafafa]">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52525b]" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="6+ characters"
                  required
                  minLength={6}
                  className="h-11 w-full rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[#09090b] pl-10 pr-11 text-[0.88rem] text-[#fafafa] placeholder:text-[#52525b] focus:border-[#1D9E75] focus:outline-none"
                  style={{ transition: 'border-color 0.2s' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa]"
                  style={{ transition: 'color 0.15s' }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit — matches .btn-p */}
            <button
              type="submit"
              disabled={pending}
              className="h-[46px] w-full rounded-[10px] bg-[#1D9E75] text-[0.92rem] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow: '0 0 30px rgba(29,158,117,0.15), 0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.background = '#17805f'
                el.style.transform = 'translateY(-1px)'
                el.style.boxShadow = '0 0 40px rgba(29,158,117,0.25), 0 8px 24px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.background = '#1D9E75'
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = '0 0 30px rgba(29,158,117,0.15), 0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {pending ? 'Creating account...' : 'Create account'}
            </button>

            {/* Trial note */}
            <p className="text-center text-[0.75rem] text-[#52525b]">
              7-day free trial · Credit card required · Cancel anytime
            </p>

            <p className="text-center text-[0.82rem] text-[#a1a1aa]">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-[#1D9E75] hover:text-[#34d399]"
                style={{ transition: 'color 0.15s' }}
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
