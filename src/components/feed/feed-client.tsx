// Feed client — main lead feed with scan, filters, post cards, and reply dialog
// Premium dark theme matching landing page .demo-w style

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  RefreshCw,
  ArrowUpRight,
  MessageSquare,
  Search,
  Reply,
  Check,
  Bookmark,
  SkipForward,
  Target,
  Inbox,
  Zap,
} from 'lucide-react'
import { ReplyDialog } from '@/components/feed/reply-dialog'
import { UpgradeNudge } from '@/components/shared/upgrade-nudge'
import { trackEvent } from '@/lib/posthog'

interface Post {
  id: string
  title: string
  body: string | null
  author: string
  subreddit: string
  url: string
  score: number
  num_comments: number
  matched_keyword: string
  relevance_score: number | null
  status: string
  reddit_created_at: string
  found_at: string
}

interface FeedClientProps {
  projectId: string
  projectName: string
  posts: Post[]
  keywords: string[]
  subreddits: string[]
}

type QuickFilter = 'fresh' | 'all' | 'high-intent' | 'new' | 'saved'
type SortOption = 'date' | 'score' | 'relevance' | 'comments'

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isFresh(dateStr: string): boolean {
  return (Date.now() - new Date(dateStr).getTime()) < 6 * 60 * 60 * 1000 // < 6h
}

function freshnessBadge(dateStr: string): { label: string; emoji: string } | null {
  const ageMs = Date.now() - new Date(dateStr).getTime()
  if (ageMs < 15 * 60 * 1000) return { label: 'Just posted', emoji: '\uD83D\uDD25' }
  if (ageMs < 60 * 60 * 1000) return { label: 'Fresh', emoji: '\u26A1' }
  if (ageMs < 6 * 60 * 60 * 1000) return { label: 'Recent', emoji: '\uD83D\uDD52' }
  return null
}

export function FeedClient({ projectId, projectName, posts: initialPosts, keywords, subreddits }: FeedClientProps) {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('fresh')
  const [filterKeyword, setFilterKeyword] = useState<string>('all')
  const [filterSubreddit, setFilterSubreddit] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [updatingPost, setUpdatingPost] = useState<string | null>(null)
  const [replyPost, setReplyPost] = useState<Post | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  // Welcome banner for first-time users
  useEffect(() => {
    const completed = localStorage.getItem('subhuntr_onboarding_completed')
    const dismissed = localStorage.getItem('subhuntr_welcome_dismissed')
    if (completed && !dismissed) {
      setShowWelcome(true)
    }
  }, [])

  function dismissWelcome() {
    setShowWelcome(false)
    localStorage.setItem('subhuntr_welcome_dismissed', 'true')
  }

  // KPI counts
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const postsToday = posts.filter((p) => new Date(p.found_at) >= todayStart).length
  const highIntent = posts.filter((p) => (p.relevance_score ?? 0) >= 7).length
  const unread = posts.filter((p) => p.status === 'new').length
  const toReply = posts.filter((p) => p.status === 'new' || p.status === 'saved').length

  async function handleScan() {
    setScanning(true)
    setScanResult(null)
    trackEvent('scan_triggered', { projectId })

    try {
      const res = await fetch('/api/reddit/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setScanResult(`Error: ${data.error}`)
        if (data.upgrade) setShowUpgrade(true)
      } else {
        const modeNote = data.mode === 'public' ? ' (public API — official API pending)' : ''
        setScanResult(`Scan complete! ${data.postsFound} new post(s) found.${modeNote}`)
        router.refresh()
      }
    } catch {
      setScanResult('Network error during scan.')
    } finally {
      setScanning(false)
    }
  }

  async function updatePostStatus(postId: string, status: string) {
    setUpdatingPost(postId)
    try {
      const res = await fetch('/api/reddit/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, status }),
      })

      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, status } : p))
        )
      }
    } finally {
      setUpdatingPost(null)
    }
  }

  // Count fresh posts for the badge
  const freshCount = posts.filter((p) => isFresh(p.reddit_created_at)).length

  // Apply filters
  const filteredPosts = posts
    .filter((post) => {
      // Quick filter
      if (quickFilter === 'fresh' && !isFresh(post.reddit_created_at)) return false
      if (quickFilter === 'high-intent' && (post.relevance_score ?? 0) < 7) return false
      if (quickFilter === 'new' && post.status !== 'new') return false
      if (quickFilter === 'saved' && post.status !== 'saved') return false
      // Dropdowns
      if (filterKeyword !== 'all' && post.matched_keyword !== filterKeyword) return false
      if (filterSubreddit !== 'all' && post.subreddit !== filterSubreddit) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score
        case 'relevance':
          return (b.relevance_score ?? 0) - (a.relevance_score ?? 0)
        case 'comments':
          return b.num_comments - a.num_comments
        case 'date':
        default:
          return new Date(b.reddit_created_at).getTime() - new Date(a.reddit_created_at).getTime()
      }
    })

  const quickFilters: { key: QuickFilter; label: string }[] = [
    { key: 'fresh', label: `Fresh (${freshCount})` },
    { key: 'all', label: 'All posts' },
    { key: 'high-intent', label: 'High-intent (7+)' },
    { key: 'new', label: 'Unread' },
    { key: 'saved', label: 'Saved' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome banner for first-time users */}
      {showWelcome && (
        <div className="animate-fade-in-up flex items-start justify-between rounded-[12px] border border-[rgba(29,158,117,0.2)] bg-[rgba(29,158,117,0.08)] px-5 py-4">
          <div className="flex-1">
            <p className="text-[0.88rem] font-semibold text-[#fafafa]">
              {'\uD83C\uDF89'} Welcome to your Lead Feed!
            </p>
            <p className="mt-1 text-[0.82rem] text-[#a1a1aa]">
              Posts are scored 1-10 by buying intent. Click Reply to use a template, then post on Reddit.
            </p>
          </div>
          <button
            onClick={dismissWelcome}
            className="ml-4 shrink-0 rounded-[8px] border border-[rgba(255,255,255,0.06)] px-3 py-1.5 text-[0.78rem] font-medium text-[#a1a1aa] hover:border-[rgba(255,255,255,0.1)] hover:text-[#fafafa]"
            style={{ transition: 'all 0.2s' }}
          >
            Got it
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className="text-[clamp(1.5rem,3vw,2rem)] font-[800] text-[#fafafa]"
            style={{ letterSpacing: '-0.035em', lineHeight: '1.15' }}
          >
            Lead Feed
          </h1>
          {/* KPI bar — matches .demo-kpi */}
          <div className="mt-2 flex flex-wrap gap-4 text-[0.75rem] text-[#52525b]">
            <span><strong className="font-mono font-semibold text-[#fafafa]">{postsToday}</strong> posts today</span>
            <span><strong className="font-mono font-semibold text-[#34d399]">{highIntent}</strong> high-intent</span>
            <span><strong className="font-mono font-semibold text-[#fafafa]">{unread}</strong> unread</span>
            <span><strong className="font-mono font-semibold text-[#f59e0b]">{toReply}</strong> to reply</span>
          </div>
        </div>
        {/* Scan button — matches .btn-p */}
        <button
          onClick={handleScan}
          disabled={scanning}
          className="inline-flex h-[42px] shrink-0 items-center gap-2 rounded-[10px] bg-[#1D9E75] px-5 text-[0.85rem] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
          {scanning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {scanning ? 'Scanning...' : 'Scan now'}
        </button>
      </div>

      {scanResult && (
        <p className={`text-[0.82rem] ${scanResult.startsWith('Error') ? 'text-[#ef4444]' : 'text-[#34d399]'}`}>
          {scanResult}
        </p>
      )}

      {showUpgrade && (
        <UpgradeNudge
          feature="more daily scans"
          description="Your current plan has reached its daily scan limit."
          compact
        />
      )}

      {/* Quick filters + dropdowns */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Quick filter pills */}
        <div className="flex gap-1">
          {quickFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setQuickFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-[0.78rem] font-medium ${
                quickFilter === f.key
                  ? 'bg-[rgba(255,255,255,0.06)] text-[#fafafa]'
                  : 'text-[#52525b] hover:text-[#a1a1aa]'
              }`}
              style={{ transition: 'all 0.15s' }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Dropdown filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterKeyword} onValueChange={(v) => setFilterKeyword(v ?? 'all')}>
            <SelectTrigger className="h-9 w-[160px] rounded-[10px] border-[rgba(255,255,255,0.06)] bg-[#09090b] text-[0.78rem]">
              <SelectValue placeholder="Keyword" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All keywords</SelectItem>
              {keywords.map((kw) => (
                <SelectItem key={kw} value={kw}>{kw}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSubreddit} onValueChange={(v) => setFilterSubreddit(v ?? 'all')}>
            <SelectTrigger className="h-9 w-[160px] rounded-[10px] border-[rgba(255,255,255,0.06)] bg-[#09090b] text-[0.78rem]">
              <SelectValue placeholder="Subreddit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subreddits</SelectItem>
              {subreddits.map((sub) => (
                <SelectItem key={sub} value={sub}>r/{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy((v as SortOption) ?? 'date')}>
            <SelectTrigger className="h-9 w-[150px] rounded-[10px] border-[rgba(255,255,255,0.06)] bg-[#09090b] text-[0.78rem]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most recent</SelectItem>
              <SelectItem value="score">Top score</SelectItem>
              <SelectItem value="relevance">Most relevant</SelectItem>
              <SelectItem value="comments">Most comments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Post list */}
      {filteredPosts.length === 0 ? (
        /* Empty state */
        <div
          className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] py-16 text-center"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.3)' }}
        >
          <Search className="mx-auto mb-4 h-10 w-10 text-[#52525b]" />
          <h3
            className="mb-2 text-[1.1rem] font-[700] text-[#fafafa]"
            style={{ letterSpacing: '-0.02em' }}
          >
            {posts.length === 0
              ? 'No posts yet'
              : quickFilter === 'fresh'
                ? 'No fresh leads right now'
                : 'No posts match your filters'}
          </h3>
          {posts.length === 0 ? (
            <div className="space-y-3">
              <p className="text-[0.82rem] text-[#a1a1aa]">
                Run your first scan or adjust your settings:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/keywords"
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[rgba(255,255,255,0.06)] px-4 py-2 text-[0.82rem] font-medium text-[#a1a1aa] hover:border-[rgba(255,255,255,0.1)] hover:text-[#fafafa]"
                  style={{ transition: 'all 0.2s' }}
                >
                  <Target className="h-3.5 w-3.5" /> Add keywords
                </Link>
                <Link
                  href="/subreddits"
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[rgba(255,255,255,0.06)] px-4 py-2 text-[0.82rem] font-medium text-[#a1a1aa] hover:border-[rgba(255,255,255,0.1)] hover:text-[#fafafa]"
                  style={{ transition: 'all 0.2s' }}
                >
                  <Inbox className="h-3.5 w-3.5" /> Add subreddits
                </Link>
              </div>
            </div>
          ) : quickFilter === 'fresh' ? (
            <div className="space-y-3">
              <p className="text-[0.82rem] text-[#a1a1aa]">
                SubHuntr scans every few minutes — check back soon.
              </p>
              <button
                onClick={() => setQuickFilter('all')}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-[rgba(255,255,255,0.06)] px-4 py-2 text-[0.82rem] font-medium text-[#a1a1aa] hover:border-[rgba(255,255,255,0.1)] hover:text-[#fafafa]"
                style={{ transition: 'all 0.2s' }}
              >
                View all posts
              </button>
            </div>
          ) : (
            <p className="text-[0.82rem] text-[#a1a1aa]">
              Try broader keywords, add more subreddits, or run a new scan.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredPosts.map((post, i) => {
            const score = post.relevance_score ?? 0
            const isReplied = post.status === 'replied'
            const isSkipped = post.status === 'skipped'

            return (
              <div
                key={post.id}
                className="animate-fade-in-up group flex items-center gap-3 rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#131316] px-4 py-3 hover:border-[rgba(255,255,255,0.1)] hover:bg-[#18181c]"
                style={{
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  animationDelay: `${Math.min(i * 0.04, 0.4)}s`,
                  opacity: isReplied ? 0.7 : isSkipped ? 0.5 : 1,
                }}
              >
                {/* Score badge — matches .demo-sc */}
                <div
                  className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px] font-mono text-[0.8rem] font-bold ${
                    score >= 8
                      ? 'bg-[rgba(29,158,117,0.15)] text-[#34d399]'
                      : score >= 5
                        ? 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'
                        : 'bg-[rgba(255,255,255,0.05)] text-[#52525b]'
                  }`}
                >
                  {score || '—'}
                </div>

                {/* Content — matches .demo-post-b */}
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[0.82rem] font-semibold text-[#fafafa]"
                    title={post.title}
                  >
                    {post.title}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.68rem] text-[#52525b]">
                    <span className="font-medium text-[#1D9E75]">r/{post.subreddit}</span>
                    <span>{timeAgo(post.reddit_created_at)}</span>
                    {freshnessBadge(post.reddit_created_at) && (
                      <span className="rounded-full bg-[rgba(245,158,11,0.1)] px-2 py-0.5 text-[0.6rem] font-semibold text-[#f59e0b]">
                        {freshnessBadge(post.reddit_created_at)!.emoji} {freshnessBadge(post.reddit_created_at)!.label}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="h-2.5 w-2.5" /> {post.num_comments}
                    </span>
                    <span
                      className="rounded-[5px] bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 font-mono text-[0.6rem]"
                    >
                      {post.matched_keyword}
                    </span>
                    {isReplied && (
                      <span className="inline-flex items-center gap-0.5 font-medium text-[#1D9E75]">
                        <Check className="h-2.5 w-2.5" /> Replied
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-7 items-center gap-1 rounded-[6px] border border-[rgba(255,255,255,0.06)] px-2.5 text-[0.65rem] font-semibold text-[#a1a1aa] hover:border-[rgba(255,255,255,0.1)] hover:text-[#fafafa]"
                    style={{ transition: 'all 0.15s' }}
                  >
                    <ArrowUpRight className="h-3 w-3" /> Open
                  </a>
                  {!isReplied && (
                    <button
                      onClick={() => setReplyPost(post)}
                      disabled={updatingPost === post.id}
                      className="flex h-7 items-center gap-1 rounded-[6px] bg-[#1D9E75] px-2.5 text-[0.65rem] font-semibold text-white hover:bg-[#17805f] disabled:opacity-50"
                      style={{ transition: 'all 0.15s' }}
                    >
                      <Reply className="h-3 w-3" /> Reply
                    </button>
                  )}
                  {post.status !== 'saved' && post.status !== 'replied' && (
                    <button
                      onClick={() => updatePostStatus(post.id, 'saved')}
                      disabled={updatingPost === post.id}
                      className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#52525b] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#a1a1aa] disabled:opacity-50"
                      style={{ transition: 'all 0.15s' }}
                      title="Save"
                    >
                      <Bookmark className="h-3 w-3" />
                    </button>
                  )}
                  {post.status !== 'skipped' && post.status !== 'replied' && (
                    <button
                      onClick={() => updatePostStatus(post.id, 'skipped')}
                      disabled={updatingPost === post.id}
                      className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#52525b] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#a1a1aa] disabled:opacity-50"
                      style={{ transition: 'all 0.15s' }}
                      title="Skip"
                    >
                      <SkipForward className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reply dialog */}
      {replyPost && (
        <ReplyDialog
          open={!!replyPost}
          onOpenChange={(open) => { if (!open) setReplyPost(null) }}
          post={replyPost}
          onReplySent={() => {
            setPosts((prev) =>
              prev.map((p) => (p.id === replyPost.id ? { ...p, status: 'replied' } : p))
            )
            window.open(replyPost.url, '_blank')
          }}
        />
      )}
    </div>
  )
}
