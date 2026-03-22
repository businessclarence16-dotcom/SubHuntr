// Onboarding wizard — 4 steps: Product → Keywords → Subreddits → First scan
// Premium dark theme matching landing page styles exactly

'use client'

import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createProject, addKeywords, addSubreddits } from '@/app/(auth)/actions/onboarding'
import { trackEvent } from '@/lib/posthog'
import {
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Rocket,
  Globe,
  Check,
  Lightbulb,
} from 'lucide-react'

const SUGGESTED_KEYWORDS = [
  'best alternative to',
  'looking for a tool',
  'recommend a',
  'switched from',
  'better than',
  'anyone using',
  'need help with',
  'what do you use for',
]

const DEFAULT_KEYWORDS = SUGGESTED_KEYWORDS.slice(0, 4)

const SUGGESTED_SUBREDDITS = [
  'SaaS',
  'Entrepreneur',
  'startups',
  'smallbusiness',
  'webdev',
  'marketing',
  'indiehackers',
  'growmybusiness',
  'digitalnomad',
  'freelance',
]

const DEFAULT_SUBREDDITS = SUGGESTED_SUBREDDITS.slice(0, 4)

const SUBREDDIT_MEMBERS: Record<string, string> = {
  SaaS: '400k',
  Entrepreneur: '2.1M',
  startups: '1.2M',
  smallbusiness: '500k',
  webdev: '1.8M',
  marketing: '800k',
  indiehackers: '150k',
  growmybusiness: '180k',
  digitalnomad: '900k',
  freelance: '1.1M',
}

const MOCK_PREVIEW_POSTS: TopPost[] = [
  { id: 'mock-1', title: 'Best CRM for a small B2B SaaS? Salesforce is overkill', subreddit: 'SaaS', relevance_score: 9, url: '#' },
  { id: 'mock-2', title: 'Looking for a Mailchimp alternative that doesn\'t cost $300/mo', subreddit: 'Entrepreneur', relevance_score: 8, url: '#' },
  { id: 'mock-3', title: 'Any good Intercom alternatives for a bootstrapped startup?', subreddit: 'startups', relevance_score: 7, url: '#' },
]

const stepLabels = ['Your product', 'Keywords', 'Subreddits', 'First scan']

// Shared input style matching .roi-input from landing.css
const inputClass =
  'h-11 w-full rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[#09090b] px-4 text-[0.88rem] text-[#fafafa] placeholder:text-[#52525b] focus:border-[#1D9E75] focus:outline-none'

const inputTransition = { transition: 'border-color 0.2s' }

// Chip style matching landing .tb / pill style — border-radius: 100px
const chipBase =
  'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[0.82rem] font-medium cursor-pointer select-none'

const chipIdle =
  'border-[rgba(255,255,255,0.06)] bg-[#131316] text-[#a1a1aa] hover:border-[rgba(255,255,255,0.1)] hover:text-[#fafafa]'

const chipActive =
  'border-[#1D9E75] bg-[rgba(29,158,117,0.15)] text-[#1D9E75]'

// Extract domain from URL for "Product detected" feedback
function extractDomain(url: string): string | null {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

interface ScanStep {
  label: string
  status: 'done' | 'scanning' | 'pending'
  detail?: string
}

interface TopPost {
  id: string
  title: string
  subreddit: string
  relevance_score: number | null
  url: string
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [step, setStep] = useState(1)

  // Read plan from URL or cookie on mount
  useEffect(() => {
    const planFromUrl = searchParams.get('plan')
    if (planFromUrl) {
      setSelectedPlan(planFromUrl)
      return
    }
    // Check cookie
    const match = document.cookie.match(/(?:^|; )selected_plan=([^;]*)/)
    if (match) {
      setSelectedPlan(match[1])
    }
  }, [searchParams])
  const [animDir, setAnimDir] = useState<'right' | 'left'>('right')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1 — Project (simplified: just URL, name auto-detected)
  const [projectUrl, setProjectUrl] = useState('')
  const [projectId, setProjectId] = useState('')

  // Step 2 — Keywords (pre-select defaults)
  const [keywords, setKeywords] = useState<string[]>([...DEFAULT_KEYWORDS])
  const [keywordInput, setKeywordInput] = useState('')

  // Step 3 — Subreddits (pre-select defaults)
  const [subredditsList, setSubredditsList] = useState<string[]>([...DEFAULT_SUBREDDITS])
  const [subredditInput, setSubredditInput] = useState('')

  // Step 4 — Scan
  const [scanSteps, setScanSteps] = useState<ScanStep[]>([])
  const [scanComplete, setScanComplete] = useState(false)
  const [scanPostsFound, setScanPostsFound] = useState(0)
  const [scanError, setScanError] = useState(false)
  const [topPosts, setTopPosts] = useState<TopPost[]>([])
  const scanStartedRef = useRef(false)

  const goForward = useCallback((nextStep: number) => {
    setAnimDir('right')
    setError('')
    setStep(nextStep)
  }, [])

  const goBack = useCallback((prevStep: number) => {
    setAnimDir('left')
    setError('')
    setStep(prevStep)
  }, [])

  // ---- Step 1: Create project (auto-detect name from URL) ----
  async function handleCreateProject() {
    setLoading(true)
    setError('')
    const domain = extractDomain(projectUrl)
    const autoName = domain
      ? domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
      : 'My Project'

    const formData = new FormData()
    formData.set('name', autoName)
    formData.set('url', projectUrl)
    formData.set('description', '')

    const result = await createProject(formData)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }
    if (result.projectId) {
      setProjectId(result.projectId)
      trackEvent('onboarding_step_completed', { step: 1 })
      goForward(2)
    }
  }

  // ---- Skip setup — create defaults and go to feed ----
  async function handleSkip() {
    setLoading(true)
    setError('')

    // Step 1: Create project with defaults if not done yet
    let pid = projectId
    if (!pid) {
      const domain = extractDomain(projectUrl)
      const autoName = domain
        ? domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
        : 'My Project'
      const formData = new FormData()
      formData.set('name', autoName)
      formData.set('url', projectUrl || '')
      formData.set('description', '')
      const result = await createProject(formData)
      if (result.error || !result.projectId) {
        setError(result.error || 'Failed to create project')
        setLoading(false)
        return
      }
      pid = result.projectId
    }

    // Step 2: Add default keywords
    await addKeywords(pid, [...DEFAULT_KEYWORDS])

    // Step 3: Add default subreddits
    await addSubreddits(pid, [...DEFAULT_SUBREDDITS])

    setLoading(false)

    // Mark onboarding completed and go to feed
    localStorage.setItem('subhuntr_onboarding_completed', 'true')
    document.cookie = 'selected_plan=; path=/; max-age=0'
    router.push('/feed')
  }

  // ---- Step 2: Keywords ----
  function handleAddKeyword() {
    const keyword = keywordInput.trim()
    if (keyword && !keywords.includes(keyword)) {
      setKeywords([...keywords, keyword])
      setKeywordInput('')
    }
  }

  function toggleSuggestedKeyword(kw: string) {
    if (keywords.includes(kw)) {
      setKeywords(keywords.filter((k) => k !== kw))
    } else {
      setKeywords([...keywords, kw])
    }
  }

  async function handleSaveKeywords() {
    setLoading(true)
    setError('')
    const result = await addKeywords(projectId, keywords)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }
    trackEvent('onboarding_step_completed', { step: 2, keywords_count: keywords.length })
    goForward(3)
  }

  // ---- Step 3: Subreddits ----
  function handleAddSubreddit() {
    const sub = subredditInput.trim().replace(/^r\//, '')
    if (sub && !subredditsList.includes(sub)) {
      setSubredditsList([...subredditsList, sub])
      setSubredditInput('')
    }
  }

  function toggleSuggestedSubreddit(sub: string) {
    if (subredditsList.includes(sub)) {
      setSubredditsList(subredditsList.filter((s) => s !== sub))
    } else {
      setSubredditsList([...subredditsList, sub])
    }
  }

  async function handleFinish() {
    setLoading(true)
    setError('')
    const result = await addSubreddits(projectId, subredditsList)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    // Go to step 4 (scan) instead of redirecting
    trackEvent('onboarding_step_completed', { step: 3, subreddits_count: subredditsList.length })
    goForward(4)
  }

  // ---- Step 4: Run scan ----
  useEffect(() => {
    if (step !== 4 || scanStartedRef.current) return
    scanStartedRef.current = true

    // Build initial scan steps
    const initialSteps: ScanStep[] = [
      { label: 'Project created', status: 'done' },
      { label: `Keywords configured (${keywords.length} keywords)`, status: 'done' },
      { label: `Subreddits configured (${subredditsList.length} subreddits)`, status: 'done' },
      ...subredditsList.map((sub) => ({
        label: `Scanning r/${sub}...`,
        status: 'pending' as const,
      })),
    ]
    setScanSteps(initialSteps)

    // Animate subreddit steps to "scanning" sequentially
    subredditsList.forEach((_, i) => {
      setTimeout(() => {
        setScanSteps((prev) =>
          prev.map((s, j) =>
            j === 3 + i ? { ...s, status: 'scanning' } : s
          )
        )
      }, 800 * (i + 1))
    })

    // Fire the actual scan
    async function runScan() {
      try {
        const res = await fetch('/api/reddit/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        })
        const data = await res.json()

        if (!res.ok) {
          // Still complete — just show 0 posts
          setScanPostsFound(0)
          setScanError(true)
        } else {
          setScanPostsFound(data.postsFound ?? 0)
        }

        // Mark all subreddit steps as done
        setScanSteps((prev) =>
          prev.map((s) =>
            s.status === 'scanning' || s.status === 'pending'
              ? { ...s, status: 'done', label: s.label.replace('...', ' — done') }
              : s
          )
        )

        // Fetch top posts for preview
        if (data.postsFound > 0) {
          try {
            const postsRes = await fetch(`/api/reddit/posts?projectId=${projectId}&limit=3`)
            const postsData = await postsRes.json()
            if (postsData.posts) {
              setTopPosts(postsData.posts)
            }
          } catch {
            // Non-critical — just skip preview
          }
        }

        trackEvent('onboarding_step_completed', { step: 4, posts_found: data.postsFound ?? 0 })
        setScanComplete(true)
      } catch {
        setScanError(true)
        trackEvent('onboarding_step_completed', { step: 4, posts_found: 0, error: true })
        setScanComplete(true)
        setScanSteps((prev) =>
          prev.map((s) =>
            s.status === 'scanning' || s.status === 'pending'
              ? { ...s, status: 'done' }
              : s
          )
        )
      }
    }

    runScan()
  }, [step, projectId, keywords.length, subredditsList])

  function handleGoToFeed() {
    // Mark onboarding as completed for welcome banner
    localStorage.setItem('subhuntr_onboarding_completed', 'true')

    // Clear the plan cookie
    document.cookie = 'selected_plan=; path=/; max-age=0'

    // Redirect to /activate with plan param — card required before dashboard
    const planParam = selectedPlan ? `?plan=${selectedPlan}` : '?plan=starter'
    router.push(`/activate${planParam}`)
  }

  // URL detection for product feedback
  const detectedDomain = projectUrl.length > 4 ? extractDomain(projectUrl) : null

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar with logo */}
      <div className="flex items-center gap-2 p-6">
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

      {/* Progress bar */}
      <div className="mx-auto w-full max-w-2xl px-6">
        <div className="flex items-center gap-3">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1
            const isCompleted = step > stepNum
            const isCurrent = step === stepNum
            return (
              <div key={label} className="flex flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isCompleted
                        ? 'bg-[#1D9E75] text-white'
                        : isCurrent
                          ? 'border-2 border-[#1D9E75] text-[#1D9E75]'
                          : 'border border-[rgba(255,255,255,0.1)] text-[#52525b]'
                    }`}
                    style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : stepNum}
                  </div>
                  <span
                    className={`hidden text-[0.75rem] font-medium sm:inline ${
                      isCurrent ? 'text-[#fafafa]' : isCompleted ? 'text-[#a1a1aa]' : 'text-[#52525b]'
                    }`}
                    style={{ transition: 'color 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  >
                    {label}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                  <div
                    className="h-full rounded-full bg-[#1D9E75]"
                    style={{
                      width: isCompleted ? '100%' : isCurrent ? '50%' : '0%',
                      transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        {step <= 3 ? (
          <div
            key={step}
            className={`w-full max-w-[640px] ${
              animDir === 'right' ? 'animate-slide-in-right' : 'animate-fade-in-up'
            }`}
          >
            {/* Card — matches .demo-w */}
            <div
              className="stagger-children rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] p-8"
              style={{
                boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 20px 50px rgba(0,0,0,0.5), 0 0 80px rgba(29,158,117,0.05)',
              }}
            >
              {error && (
                <div className="mb-6 rounded-[10px] border border-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-[0.82rem] text-[#ef4444]">
                  {error}
                </div>
              )}

              {/* ====== STEP 1 — Your product (simplified: just URL) ====== */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2
                      className="text-[clamp(1.3rem,3vw,1.5rem)] font-[800] text-[#fafafa]"
                      style={{ letterSpacing: '-0.035em', lineHeight: '1.15' }}
                    >
                      What&apos;s your product URL?
                    </h2>
                    <p className="mt-2 text-[0.88rem] text-[#a1a1aa]" style={{ lineHeight: '1.7' }}>
                      We&apos;ll auto-detect your product and find relevant Reddit conversations.
                    </p>
                  </div>

                  {/* Website URL */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="url" className="text-[0.82rem] font-semibold text-[#fafafa]">
                      Website URL
                    </label>
                    <div className="relative">
                      <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52525b]" />
                      <input
                        id="url"
                        type="url"
                        placeholder="https://yourproduct.com"
                        value={projectUrl}
                        onChange={(e) => setProjectUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCreateProject()
                          }
                        }}
                        className={`${inputClass} !pl-10`}
                        style={inputTransition}
                      />
                    </div>
                    {detectedDomain && (
                      <p className="flex items-center gap-1.5 text-[0.78rem] text-[#1D9E75]">
                        <Check className="h-3 w-3" /> Got it — {detectedDomain}
                      </p>
                    )}
                  </div>

                  {/* Continue + Skip */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={loading}
                      className="text-[0.78rem] text-[#52525b] hover:text-[#a1a1aa]"
                      style={{ transition: 'color 0.15s' }}
                    >
                      Skip setup
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateProject}
                      disabled={loading}
                      className="inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-[#1D9E75] px-7 text-[0.92rem] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>Continue <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ====== STEP 2 — Keywords ====== */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2
                      className="text-[clamp(1.3rem,3vw,1.5rem)] font-[800] text-[#fafafa]"
                      style={{ letterSpacing: '-0.035em', lineHeight: '1.15' }}
                    >
                      Pick your intent keywords
                    </h2>
                    <p className="mt-2 text-[0.88rem] text-[#a1a1aa]" style={{ lineHeight: '1.7' }}>
                      These are phrases people use when looking for tools like yours.
                    </p>
                  </div>

                  {/* Tip box */}
                  <div className="flex items-start gap-3 rounded-[10px] border border-[rgba(29,158,117,0.15)] bg-[rgba(29,158,117,0.06)] px-4 py-3">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#1D9E75]" />
                    <p className="text-[0.8rem] text-[#a1a1aa]">
                      Keywords like &quot;best [tool]&quot; and &quot;alternative to [competitor]&quot; work best for finding buyers.
                    </p>
                  </div>

                  {/* Suggested keywords */}
                  <div className="space-y-3">
                    <label
                      className="text-[0.65rem] font-semibold uppercase text-[#52525b]"
                      style={{ letterSpacing: '0.1em' }}
                    >
                      Suggested keywords
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_KEYWORDS.map((kw) => {
                        const selected = keywords.includes(kw)
                        return (
                          <button
                            key={kw}
                            type="button"
                            onClick={() => toggleSuggestedKeyword(kw)}
                            className={`${chipBase} ${selected ? chipActive : chipIdle} ${selected ? 'animate-chip-pop' : ''}`}
                            style={{ borderRadius: '100px', transition: 'all 0.2s' }}
                          >
                            {selected && <Check className="h-3 w-3" />}
                            {kw}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Custom keywords */}
                  <div className="space-y-3">
                    <label
                      className="text-[0.65rem] font-semibold uppercase text-[#52525b]"
                      style={{ letterSpacing: '0.1em' }}
                    >
                      Custom keywords
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. best CRM tool"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddKeyword()
                          }
                        }}
                        className={inputClass}
                        style={inputTransition}
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        disabled={!keywordInput.trim()}
                        className="flex h-11 items-center gap-1.5 rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[#09090b] px-4 text-[0.82rem] font-medium text-[#a1a1aa] hover:border-[#1D9E75] hover:text-[#1D9E75] disabled:opacity-30"
                        style={{ transition: 'all 0.2s' }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                    {keywords.filter((kw) => !SUGGESTED_KEYWORDS.includes(kw)).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {keywords
                          .filter((kw) => !SUGGESTED_KEYWORDS.includes(kw))
                          .map((kw) => (
                            <span
                              key={kw}
                              className={`animate-chip-pop ${chipBase} ${chipActive}`}
                              style={{ borderRadius: '100px', transition: 'all 0.2s' }}
                            >
                              {kw}
                              <button
                                type="button"
                                onClick={() => setKeywords(keywords.filter((k) => k !== kw))}
                                className="text-[#1D9E75]/60 hover:text-[#1D9E75]"
                                style={{ transition: 'color 0.15s' }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Estimated matches */}
                  <div className="text-right">
                    <span className="text-[0.78rem] text-[#a1a1aa]">
                      {keywords.length > 0
                        ? `Great choices! These keywords match ~${keywords.length * 10} posts/week on Reddit`
                        : 'Select at least 1 keyword'}
                    </span>
                  </div>

                  {/* Navigation */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      {/* Back — matches .btn-g */}
                      <button
                        type="button"
                        onClick={() => goBack(1)}
                        className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-transparent px-5 text-[0.88rem] font-medium text-[#a1a1aa] hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)] hover:text-[#fafafa]"
                        style={{ transition: 'all 0.2s' }}
                      >
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                      {/* Continue — matches .btn-p */}
                      <button
                        type="button"
                        onClick={handleSaveKeywords}
                        disabled={keywords.length === 0 || loading}
                        className="inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-[#1D9E75] px-7 text-[0.92rem] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>Continue <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleSkip}
                        disabled={loading}
                        className="text-[0.75rem] text-[#52525b] hover:text-[#a1a1aa]"
                        style={{ transition: 'color 0.15s' }}
                      >
                        Skip setup → Go to dashboard
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ====== STEP 3 — Subreddits ====== */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2
                      className="text-[clamp(1.3rem,3vw,1.5rem)] font-[800] text-[#fafafa]"
                      style={{ letterSpacing: '-0.035em', lineHeight: '1.15' }}
                    >
                      Choose your hunting grounds
                    </h2>
                    <p className="mt-2 text-[0.88rem] text-[#a1a1aa]" style={{ lineHeight: '1.7' }}>
                      Select subreddits where your audience hangs out.
                    </p>
                  </div>

                  {/* Suggested subreddits */}
                  <div className="space-y-3">
                    <label
                      className="text-[0.65rem] font-semibold uppercase text-[#52525b]"
                      style={{ letterSpacing: '0.1em' }}
                    >
                      Suggested subreddits
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_SUBREDDITS.map((sub) => {
                        const selected = subredditsList.includes(sub)
                        const members = SUBREDDIT_MEMBERS[sub]
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => toggleSuggestedSubreddit(sub)}
                            className={`${chipBase} ${selected ? chipActive : chipIdle} ${selected ? 'animate-chip-pop' : ''}`}
                            style={{ borderRadius: '100px', transition: 'all 0.2s' }}
                          >
                            {selected && <Check className="h-3 w-3" />}
                            r/{sub}
                            {members && (
                              <span className="text-[0.68rem] opacity-50">· {members}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Custom subreddits */}
                  <div className="space-y-3">
                    <label
                      className="text-[0.65rem] font-semibold uppercase text-[#52525b]"
                      style={{ letterSpacing: '0.1em' }}
                    >
                      Custom subreddits
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[0.88rem] text-[#52525b]">r/</span>
                        <input
                          type="text"
                          placeholder="subreddit name"
                          value={subredditInput}
                          onChange={(e) => setSubredditInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddSubreddit()
                            }
                          }}
                          className={`${inputClass} !pl-8`}
                          style={inputTransition}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSubreddit}
                        disabled={!subredditInput.trim()}
                        className="flex h-11 items-center gap-1.5 rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[#09090b] px-4 text-[0.82rem] font-medium text-[#a1a1aa] hover:border-[#1D9E75] hover:text-[#1D9E75] disabled:opacity-30"
                        style={{ transition: 'all 0.2s' }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                    {subredditsList.filter((sub) => !SUGGESTED_SUBREDDITS.includes(sub)).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {subredditsList
                          .filter((sub) => !SUGGESTED_SUBREDDITS.includes(sub))
                          .map((sub) => (
                            <span
                              key={sub}
                              className={`animate-chip-pop ${chipBase} ${chipActive}`}
                              style={{ borderRadius: '100px', transition: 'all 0.2s' }}
                            >
                              r/{sub}
                              <button
                                type="button"
                                onClick={() => setSubredditsList(subredditsList.filter((s) => s !== sub))}
                                className="text-[#1D9E75]/60 hover:text-[#1D9E75]"
                                style={{ transition: 'color 0.15s' }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Scan info */}
                  <div className="text-right">
                    <span className="text-[0.78rem] text-[#a1a1aa]">
                      SubHuntr will scan these subreddits every 15 minutes on your plan
                    </span>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2">
                    {/* Back — matches .btn-g */}
                    <button
                      type="button"
                      onClick={() => goBack(2)}
                      className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-transparent px-5 text-[0.88rem] font-medium text-[#a1a1aa] hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)] hover:text-[#fafafa]"
                      style={{ transition: 'all 0.2s' }}
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    {/* Launch — matches .btn-p with extra glow */}
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={subredditsList.length === 0 || loading}
                      className="inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-[#1D9E75] px-7 text-[0.92rem] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Rocket className="h-4 w-4" />
                          Launch first scan
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={loading}
                      className="text-[0.75rem] text-[#52525b] hover:text-[#a1a1aa]"
                      style={{ transition: 'color 0.15s' }}
                    >
                      Skip setup → Go to dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step indicator */}
            <p className="mt-4 text-center text-[0.75rem] text-[#52525b]">
              Step {step} of 4 — This takes about 2 minutes
            </p>
          </div>
        ) : (
          /* ====== STEP 4 — Live scan screen ====== */
          <div className="w-full max-w-[540px] animate-fade-in-up text-center">
            {/* Radar animation */}
            {!scanComplete && (
              <div className="relative mx-auto mb-8 h-20 w-20">
                <div className="absolute inset-0 rounded-full bg-[rgba(29,158,117,0.15)]" />
                <div className="absolute inset-0 animate-radar-pulse rounded-full bg-[#1D9E75]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Rocket className="h-8 w-8 text-[#1D9E75]" />
                </div>
              </div>
            )}

            {/* Title */}
            <h2
              className="mb-2 text-[clamp(1.3rem,3vw,1.6rem)] font-[800] text-[#fafafa]"
              style={{ letterSpacing: '-0.035em' }}
            >
              {scanComplete
                ? scanPostsFound > 0
                  ? `\uD83C\uDF89 Your first scan found ${scanPostsFound} lead${scanPostsFound !== 1 ? 's' : ''}!`
                  : 'Here\u2019s what leads look like in SubHuntr'
                : 'Scanning Reddit for your first leads...'}
            </h2>
            <p className="mb-8 text-[0.88rem] text-[#a1a1aa]">
              {scanComplete
                ? scanPostsFound > 0
                  ? 'Here are your top matches. Head to your feed to see all results.'
                  : 'These are examples. SubHuntr scans every 15 minutes \u2014 real leads will appear soon.'
                : 'This usually takes 15-30 seconds'}
            </p>

            {/* Scan progress steps */}
            <div className="mx-auto mb-8 max-w-[400px] space-y-2 text-left">
              {scanSteps.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-[8px] px-3 py-2 text-[0.82rem] animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i * 0.15, 1)}s` }}
                >
                  {s.status === 'done' ? (
                    <Check className="h-4 w-4 shrink-0 text-[#1D9E75]" />
                  ) : s.status === 'scanning' ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#f59e0b]" />
                  ) : (
                    <div className="h-4 w-4 shrink-0 rounded-full border border-[rgba(255,255,255,0.1)]" />
                  )}
                  <span
                    className={
                      s.status === 'done'
                        ? 'text-[#a1a1aa]'
                        : s.status === 'scanning'
                          ? 'text-[#fafafa]'
                          : 'text-[#52525b]'
                    }
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Top posts preview (real or mock examples) */}
            {scanComplete && (topPosts.length > 0 || scanPostsFound === 0) && (
              <div className="mx-auto mb-8 max-w-[400px] space-y-2">
                <p className="mb-3 text-left text-[0.72rem] font-semibold uppercase text-[#52525b]" style={{ letterSpacing: '0.1em' }}>
                  {scanPostsFound > 0 ? 'Top matches' : 'Example leads'}
                </p>
                {(topPosts.length > 0 ? topPosts : MOCK_PREVIEW_POSTS).map((post, idx) => {
                  const score = post.relevance_score ?? 0
                  return (
                    <div
                      key={post.id}
                      className="flex items-center gap-3 rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[#131316] px-4 py-3 text-left animate-fade-in-up"
                      style={{ animationDelay: `${0.15 * idx}s` }}
                    >
                      <div
                        className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[6px] font-mono text-[0.75rem] font-bold ${
                          score >= 8
                            ? 'bg-[rgba(29,158,117,0.15)] text-[#34d399]'
                            : score >= 5
                              ? 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'
                              : 'bg-[rgba(255,255,255,0.05)] text-[#52525b]'
                        }`}
                      >
                        {score || '—'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.78rem] font-semibold text-[#fafafa]">{post.title}</p>
                        <p className="text-[0.68rem] text-[#1D9E75]">r/{post.subreddit}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Go to feed button */}
            {scanComplete && (
              <button
                type="button"
                onClick={handleGoToFeed}
                className="inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-[#1D9E75] px-8 text-[0.92rem] font-bold text-white animate-fade-in-up"
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
                Go to your feed <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {/* Error fallback */}
            {scanComplete && scanError && (
              <p className="mt-4 text-[0.78rem] text-[#52525b]">
                Scan encountered an issue, but your project is ready. You can scan again from your feed.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
