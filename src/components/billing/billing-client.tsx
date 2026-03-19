// Billing client — full subscription management with premium dark theme

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, Loader2, CreditCard, FileText, X as XIcon, CheckCircle, AlertTriangle } from 'lucide-react'
import { Plan } from '@/types'

interface SubscriptionInfo {
  status: string
  currentPeriodEnd: string | null
  trialEnd: string | null
  cancelAtPeriodEnd: boolean
}

interface BillingClientProps {
  plan: Plan
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  subscriptionInfo: SubscriptionInfo | null
}

const planDefs = [
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

const cardStyle: React.CSSProperties = {
  background: '#131316',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
  boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 30px 80px rgba(0,0,0,.6), 0 0 120px rgba(29,158,117,0.08)',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

export function BillingClient({ plan, stripeCustomerId, stripeSubscriptionId, subscriptionInfo }: BillingClientProps) {
  const router = useRouter()
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const searchParams = useSearchParams()

  const planOrder: Plan[] = ['starter', 'growth', 'agency', 'enterprise']
  const hasSubscription = !!stripeSubscriptionId

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  // Decide: new checkout or change existing subscription
  async function handlePlanAction(targetPlan: 'starter' | 'growth' | 'agency') {
    setLoading(targetPlan)
    try {
      if (hasSubscription) {
        // Change existing subscription
        const res = await fetch('/api/stripe/change-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: targetPlan, billing: annual ? 'annual' : 'monthly' }),
        })
        const data = await res.json()
        if (data.success) {
          router.refresh()
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 5000)
        }
      } else {
        // New checkout
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: targetPlan, billing: annual ? 'annual' : 'monthly' }),
        })
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
          return
        }
      }
    } catch {
      // ignore
    }
    setLoading(null)
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
    } catch {
      // ignore
    }
    setPortalLoading(false)
  }

  // Subscription status display
  function getStatusDisplay() {
    if (!subscriptionInfo) return null
    const { status, currentPeriodEnd, trialEnd, cancelAtPeriodEnd } = subscriptionInfo

    if (cancelAtPeriodEnd && currentPeriodEnd) {
      return { label: 'Canceled', detail: `Ends on ${formatDate(currentPeriodEnd)}`, color: '#ef4444' }
    }
    if (status === 'trialing' && trialEnd) {
      return { label: `Trialing (${daysUntil(trialEnd)} days left)`, detail: `Trial ends on ${formatDate(trialEnd)} — you won't be charged until then`, color: '#f59e0b' }
    }
    if (status === 'active' && currentPeriodEnd) {
      return { label: 'Active', detail: `Next billing date: ${formatDate(currentPeriodEnd)}`, color: '#1D9E75' }
    }
    if (status === 'past_due') {
      return { label: 'Past due', detail: 'Please update your payment method', color: '#ef4444' }
    }
    return { label: status.charAt(0).toUpperCase() + status.slice(1), detail: null, color: '#a1a1aa' }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      {/* ── Success banner ── */}
      {showSuccess && (
        <div
          className="animate-fade-in-up"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 20px',
            marginBottom: 24,
            background: 'rgba(29,158,117,0.1)',
            border: '1px solid rgba(29,158,117,0.25)',
            borderRadius: 12,
            color: '#34d399',
            fontSize: '.88rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={18} />
          Your plan has been updated successfully!
          <button
            onClick={() => setShowSuccess(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', padding: 2 }}
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: 14 }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.15, color: '#fafafa', margin: 0 }}>
          Billing
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '.92rem', marginTop: 6 }}>
          Manage your subscription and plan
        </p>
      </div>

      {/* ── Current Plan section ── */}
      <div
        className="animate-fade-in-up"
        style={{ ...cardStyle, padding: '24px 28px', marginBottom: 14, animationDelay: '0.03s' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#fafafa', margin: 0 }}>Current Plan</h2>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(29,158,117,0.12)',
                  color: '#1D9E75',
                  fontSize: '.72rem',
                  fontWeight: 700,
                  padding: '3px 12px',
                  borderRadius: 100,
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                {plan}
              </span>
              {statusDisplay && (
                <span
                  style={{
                    fontSize: '.72rem',
                    fontWeight: 600,
                    color: statusDisplay.color,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusDisplay.color, display: 'inline-block' }} />
                  {statusDisplay.label}
                </span>
              )}
            </div>
            {statusDisplay?.detail && (
              <p style={{ fontSize: '.78rem', color: '#a1a1aa', margin: 0 }}>
                {statusDisplay.detail}
              </p>
            )}
            {!hasSubscription && (
              <p style={{ fontSize: '.78rem', color: '#52525b', margin: 0 }}>
                No active subscription — choose a plan below to get started
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Manage Subscription section ── */}
      {hasSubscription && (
        <div
          className="animate-fade-in-up"
          style={{
            ...cardStyle,
            padding: '18px 28px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            animationDelay: '0.05s',
          }}
        >
          <p style={{ fontSize: '.85rem', fontWeight: 600, color: '#fafafa', margin: 0 }}>
            Manage Subscription
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={openPortal}
              disabled={portalLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, fontSize: '.78rem', fontWeight: 600,
                background: 'rgba(255,255,255,0.05)', color: '#fafafa',
                border: '1px solid rgba(255,255,255,0.06)', cursor: portalLoading ? 'wait' : 'pointer',
                transition: 'all .2s',
              }}
            >
              <CreditCard size={14} />
              Change payment method
            </button>
            <button
              onClick={openPortal}
              disabled={portalLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, fontSize: '.78rem', fontWeight: 600,
                background: 'rgba(255,255,255,0.05)', color: '#fafafa',
                border: '1px solid rgba(255,255,255,0.06)', cursor: portalLoading ? 'wait' : 'pointer',
                transition: 'all .2s',
              }}
            >
              <FileText size={14} />
              View invoices
            </button>
            <button
              onClick={() => setShowCancelDialog(true)}
              disabled={portalLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, fontSize: '.78rem', fontWeight: 600,
                background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer',
                transition: 'all .2s',
              }}
            >
              Cancel subscription
            </button>
          </div>
        </div>
      )}

      {/* ── Monthly / Annual toggle ── */}
      <div
        className="animate-fade-in-up"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, marginBottom: 40, fontSize: '.82rem', color: '#a1a1aa',
          animationDelay: '0.07s',
        }}
      >
        <span style={{ color: !annual ? '#fafafa' : '#a1a1aa', fontWeight: !annual ? 600 : 400 }}>Monthly</span>
        <button
          type="button"
          onClick={() => setAnnual(!annual)}
          style={{
            width: 42, height: 22,
            background: annual ? '#1D9E75' : '#131316',
            border: annual ? '1px solid #1D9E75' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: 100, position: 'relative', cursor: 'pointer', transition: 'all .2s',
          }}
        >
          <div
            style={{
              position: 'absolute', width: 16, height: 16,
              background: '#fff', borderRadius: '50%',
              top: 2, left: annual ? 22 : 2, transition: 'left .2s',
            }}
          />
        </button>
        <span style={{ color: annual ? '#fafafa' : '#a1a1aa', fontWeight: annual ? 600 : 400 }}>Annual</span>
        {annual && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '.68rem',
            color: '#1D9E75', background: 'rgba(29,158,117,0.08)',
            padding: '2px 7px', borderRadius: 4,
          }}>
            Save 20%
          </span>
        )}
      </div>

      {/* ── Plan cards grid ── */}
      <div
        className="animate-fade-in-up"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, animationDelay: '0.1s' }}
      >
        {planDefs.map((p) => {
          const isCurrent = p.id === plan
          const currentIdx = planOrder.indexOf(plan)
          const thisIdx = planOrder.indexOf(p.id)
          const isUpgrade = thisIdx > currentIdx && p.id !== 'enterprise'
          const isDowngrade = thisIdx < currentIdx && p.id !== 'enterprise'
          const price = annual ? p.annualPrice : p.monthlyPrice
          const isCustom = 'isCustom' in p && p.isCustom

          return (
            <div
              key={p.id}
              style={{
                background: '#131316',
                border: p.popular
                  ? '1px solid #1D9E75'
                  : isCurrent ? '1px solid rgba(29,158,117,0.3)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '28px 24px', position: 'relative',
                transition: 'all .3s',
                boxShadow: p.popular ? '0 0 50px rgba(29,158,117,0.08)' : 'none',
              }}
              onMouseEnter={(e) => { if (!p.popular) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => {
                if (!p.popular) {
                  e.currentTarget.style.borderColor = isCurrent ? 'rgba(29,158,117,0.3)' : 'rgba(255,255,255,0.06)'
                }
              }}
            >
              {/* Badge */}
              {p.popular && (
                <div style={{
                  position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                  background: '#1D9E75', color: '#fff', padding: '2px 12px', borderRadius: 100,
                  fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
                }}>
                  Popular
                </div>
              )}
              {isCurrent && !p.popular && (
                <div style={{
                  position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(29,158,117,0.15)', color: '#1D9E75', padding: '2px 12px', borderRadius: 100,
                  fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
                }}>
                  Current
                </div>
              )}

              <p style={{ fontWeight: 700, fontSize: '1rem', color: '#fafafa', marginBottom: 2 }}>{p.name}</p>
              <p style={{ fontSize: '.75rem', color: '#52525b', marginBottom: 18 }}>{p.subtitle}</p>

              {/* Price */}
              {isCustom ? (
                <>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: '#fafafa' }}>Custom</span>
                  </div>
                  <div style={{ marginBottom: 22 }} />
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: '2.6rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: '#fafafa' }}>
                      <span style={{ fontSize: '1.3rem', color: '#a1a1aa', verticalAlign: 'top' }}>$</span>
                      {price}
                    </span>
                    <span style={{ fontSize: '.82rem', color: '#52525b', fontWeight: 400 }}>/mo</span>
                  </div>
                  {annual ? (
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.72rem', color: '#52525b', marginBottom: 22 }}>
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
                    display: 'block', width: '100%', padding: 10, borderRadius: 8,
                    fontWeight: 600, fontSize: '.85rem', textAlign: 'center',
                    background: 'rgba(255,255,255,0.05)', color: '#fafafa',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer', marginBottom: 20, transition: 'all .2s', textDecoration: 'none',
                  }}
                >
                  Contact sales
                </a>
              ) : isCurrent ? (
                <button
                  disabled
                  style={{
                    display: 'block', width: '100%', padding: 10, borderRadius: 8,
                    fontWeight: 600, fontSize: '.85rem', textAlign: 'center',
                    background: 'rgba(255,255,255,0.05)', color: '#a1a1aa',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'not-allowed', marginBottom: 20,
                  }}
                >
                  Current plan
                </button>
              ) : isUpgrade ? (
                <button
                  onClick={() => handlePlanAction(p.id as 'starter' | 'growth' | 'agency')}
                  disabled={loading === p.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    width: '100%', padding: 10, borderRadius: 8, fontWeight: 600, fontSize: '.85rem',
                    textAlign: 'center',
                    background: p.popular ? '#1D9E75' : 'rgba(255,255,255,0.05)',
                    color: p.popular ? '#fff' : '#fafafa',
                    border: p.popular ? '1px solid #1D9E75' : '1px solid rgba(255,255,255,0.06)',
                    cursor: loading === p.id ? 'wait' : 'pointer', marginBottom: 20, transition: 'all .2s',
                  }}
                >
                  {loading === p.id && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {loading === p.id ? 'Processing...' : (
                    p.id === 'starter' && !hasSubscription
                      ? 'Start 7-day free trial'
                      : `Upgrade to ${p.name} — $${price}/mo`
                  )}
                </button>
              ) : isDowngrade ? (
                <button
                  onClick={() => handlePlanAction(p.id as 'starter' | 'growth' | 'agency')}
                  disabled={loading === p.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    width: '100%', padding: 10, borderRadius: 8, fontWeight: 600, fontSize: '.85rem',
                    textAlign: 'center',
                    background: 'transparent', color: '#a1a1aa',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: loading === p.id ? 'wait' : 'pointer', marginBottom: 20, transition: 'all .2s',
                  }}
                >
                  {loading === p.id && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {loading === p.id ? 'Processing...' : `Downgrade to ${p.name}`}
                </button>
              ) : (
                <div style={{ marginBottom: 20 }} />
              )}

              {/* Features list */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, padding: 0, margin: 0 }}>
                {p.features.map((f) => (
                  <li key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '.78rem', color: f.on ? '#a1a1aa' : '#52525b' }}>
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

      <p className="animate-fade-in-up" style={{ textAlign: 'center', fontSize: '.82rem', color: '#52525b', marginTop: 32, animationDelay: '0.15s' }}>
        7-day free trial on Starter. Upgrade anytime.
      </p>

      {/* ── Cancel subscription confirmation dialog ── */}
      {showCancelDialog && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 100, padding: 24,
          }}
          onClick={() => setShowCancelDialog(false)}
        >
          <div
            style={{ ...cardStyle, padding: 32, maxWidth: 440, width: '100%', borderColor: 'rgba(239,68,68,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <AlertTriangle size={20} style={{ color: '#ef4444' }} />
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fafafa', margin: 0 }}>Cancel subscription</h3>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '.85rem', lineHeight: 1.6, marginBottom: 24 }}>
              Are you sure? You&apos;ll lose access to premium features at the end of your billing period.
              Your data will be preserved.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCancelDialog(false)}
                style={{
                  padding: '10px 20px', borderRadius: 10, fontSize: '.85rem', fontWeight: 600,
                  background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
                }}
              >
                Keep my plan
              </button>
              <button
                onClick={() => { setShowCancelDialog(false); openPortal() }}
                style={{
                  padding: '10px 20px', borderRadius: 10, fontSize: '.85rem', fontWeight: 600,
                  background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all .2s',
                }}
              >
                Cancel subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
