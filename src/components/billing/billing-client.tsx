// Billing client — pricing plans with premium dark theme matching landing page

'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Plan } from '@/types'

interface BillingClientProps {
  plan: Plan
}

const plans = [
  {
    id: 'starter' as const,
    name: 'Starter',
    monthlyPrice: 29,
    annualPrice: 23,
    subtitle: 'For individuals getting started',
    features: [
      { text: '1 project', on: true },
      { text: '5 keywords', on: true },
      { text: '15 subreddits', on: true },
      { text: 'Scan every 15 min', on: true },
      { text: 'Email alerts only', on: true },
      { text: 'Competitor tracking', on: false },
      { text: 'CSV export', on: false },
    ],
  },
  {
    id: 'growth' as const,
    name: 'Growth',
    monthlyPrice: 79,
    annualPrice: 63,
    subtitle: 'For scaling your Reddit acquisition',
    popular: true,
    features: [
      { text: '3 projects', on: true },
      { text: '25 keywords / project', on: true },
      { text: '75 subreddits', on: true },
      { text: 'Scan every 5 min', on: true },
      { text: 'Slack & Discord alerts', on: true },
      { text: 'Competitor tracking', on: true },
      { text: 'Full analytics', on: true },
    ],
  },
  {
    id: 'agency' as const,
    name: 'Agency',
    monthlyPrice: 199,
    annualPrice: 159,
    subtitle: 'For agencies and power users',
    features: [
      { text: '10 projects', on: true },
      { text: 'Unlimited keywords', on: true },
      { text: 'Unlimited subreddits', on: true },
      { text: 'Scan every 2 min', on: true },
      { text: 'Slack & Discord alerts', on: true },
      { text: 'Competitor tracking', on: true },
      { text: 'CSV export + Priority support', on: true },
    ],
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    monthlyPrice: 0,
    annualPrice: 0,
    subtitle: 'For large teams with custom needs',
    isCustom: true,
    features: [
      { text: 'Unlimited everything', on: true },
      { text: 'Real-time scanning (1 min)', on: true },
      { text: 'API access', on: true },
      { text: 'Dedicated support', on: true },
      { text: 'Custom integrations', on: true },
      { text: 'SLA guarantee', on: true },
    ],
  },
]

export function BillingClient({ plan }: BillingClientProps) {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const planOrder: Plan[] = ['starter', 'growth', 'agency', 'enterprise']

  async function handleCheckout(targetPlan: 'starter' | 'growth' | 'agency') {
    setLoading(targetPlan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, billing: annual ? 'annual' : 'monthly' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoading(null)
    }
  }

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: 14 }}>
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.15,
            color: '#fafafa',
            margin: 0,
          }}
        >
          Billing
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '.92rem', marginTop: 6 }}>
          Manage your subscription and plan
        </p>
      </div>

      {/* ── Monthly / Annual toggle ── */}
      <div
        className="animate-fade-in-up"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 40,
          fontSize: '.82rem',
          color: '#a1a1aa',
          animationDelay: '0.05s',
        }}
      >
        <span style={{ color: !annual ? '#fafafa' : '#a1a1aa', fontWeight: !annual ? 600 : 400 }}>Monthly</span>
        <button
          type="button"
          onClick={() => setAnnual(!annual)}
          style={{
            width: 42,
            height: 22,
            background: annual ? '#1D9E75' : '#131316',
            border: annual ? '1px solid #1D9E75' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: 100,
            position: 'relative',
            cursor: 'pointer',
            transition: 'all .2s',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 16,
              height: 16,
              background: '#fff',
              borderRadius: '50%',
              top: 2,
              left: annual ? 22 : 2,
              transition: 'left .2s',
            }}
          />
        </button>
        <span style={{ color: annual ? '#fafafa' : '#a1a1aa', fontWeight: annual ? 600 : 400 }}>Annual</span>
        {annual && (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '.68rem',
              color: '#1D9E75',
              background: 'rgba(29,158,117,0.08)',
              padding: '2px 7px',
              borderRadius: 4,
            }}
          >
            Save 20%
          </span>
        )}
      </div>

      {/* ── Plan cards grid ── */}
      <div
        className="animate-fade-in-up"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          animationDelay: '0.1s',
        }}
      >
        {plans.map((p) => {
          const isCurrent = p.id === plan
          const currentIdx = planOrder.indexOf(plan)
          const thisIdx = planOrder.indexOf(p.id)
          const isUpgrade = thisIdx > currentIdx && p.id !== 'enterprise'
          const price = annual ? p.annualPrice : p.monthlyPrice
          const isCustom = 'isCustom' in p && p.isCustom

          return (
            <div
              key={p.id}
              style={{
                background: '#131316',
                border: p.popular
                  ? '1px solid #1D9E75'
                  : isCurrent
                    ? '1px solid rgba(29,158,117,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '28px 24px',
                position: 'relative',
                transition: 'all .3s',
                boxShadow: p.popular ? '0 0 50px rgba(29,158,117,0.08)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!p.popular) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                if (!p.popular) {
                  e.currentTarget.style.borderColor = isCurrent
                    ? 'rgba(29,158,117,0.3)'
                    : 'rgba(255,255,255,0.06)'
                }
              }}
            >
              {/* Popular badge */}
              {p.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: -9,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1D9E75',
                    color: '#fff',
                    padding: '2px 12px',
                    borderRadius: 100,
                    fontSize: '.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                  }}
                >
                  Popular
                </div>
              )}

              {/* Plan name */}
              <p style={{ fontWeight: 700, fontSize: '1rem', color: '#fafafa', marginBottom: 2 }}>
                {p.name}
              </p>
              <p style={{ fontSize: '.75rem', color: '#52525b', marginBottom: 18 }}>
                {p.subtitle}
              </p>

              {/* Price */}
              {isCustom ? (
                <>
                  <div style={{ marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: '2.2rem',
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                        color: '#fafafa',
                      }}
                    >
                      Custom
                    </span>
                  </div>
                  <div style={{ marginBottom: 22 }} />
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: '2.6rem',
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                        color: '#fafafa',
                      }}
                    >
                      <span style={{ fontSize: '1.3rem', color: '#a1a1aa', verticalAlign: 'top' }}>$</span>
                      {price}
                    </span>
                    <span style={{ fontSize: '.82rem', color: '#52525b', fontWeight: 400 }}>/mo</span>
                  </div>
                  {annual ? (
                    <p
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '.72rem',
                        color: '#52525b',
                        marginBottom: 22,
                      }}
                    >
                      ${price * 12}/year — billed annually
                    </p>
                  ) : (
                    <div style={{ marginBottom: 22 }} />
                  )}
                </>
              )}

              {/* CTA button */}
              {isCustom ? (
                <a
                  href="mailto:contact@subhuntr.com"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '.85rem',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fafafa',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    marginBottom: 20,
                    transition: 'all .2s',
                    textDecoration: 'none',
                  }}
                >
                  Contact sales
                </a>
              ) : isCurrent ? (
                <button
                  disabled
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '.85rem',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#a1a1aa',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'not-allowed',
                    marginBottom: 20,
                  }}
                >
                  Current Plan
                </button>
              ) : isUpgrade ? (
                <button
                  onClick={() => handleCheckout(p.id as 'starter' | 'growth' | 'agency')}
                  disabled={loading === p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '.85rem',
                    textAlign: 'center',
                    background: p.popular ? '#1D9E75' : 'rgba(255,255,255,0.05)',
                    color: p.popular ? '#fff' : '#fafafa',
                    border: p.popular ? '1px solid #1D9E75' : '1px solid rgba(255,255,255,0.06)',
                    cursor: loading === p.id ? 'wait' : 'pointer',
                    marginBottom: 20,
                    transition: 'all .2s',
                  }}
                >
                  {loading === p.id && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {loading === p.id ? 'Redirecting...' : `Upgrade to ${p.name}`}
                </button>
              ) : (
                <div style={{ marginBottom: 20 }} />
              )}

              {/* Features list */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, padding: 0, margin: 0 }}>
                {p.features.map((f) => (
                  <li
                    key={f.text}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      fontSize: '.78rem',
                      color: f.on ? '#a1a1aa' : '#52525b',
                    }}
                  >
                    {f.on ? (
                      <Check size={13} style={{ color: '#1D9E75', flexShrink: 0 }} />
                    ) : (
                      <span style={{ color: '#52525b', opacity: 0.3, fontSize: '.72rem', flexShrink: 0 }}>—</span>
                    )}
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <p
        className="animate-fade-in-up"
        style={{
          textAlign: 'center',
          fontSize: '.82rem',
          color: '#52525b',
          marginTop: 32,
          animationDelay: '0.15s',
        }}
      >
        Payment will be available at launch. All plans include a 7-day free trial.
      </p>
    </div>
  )
}
