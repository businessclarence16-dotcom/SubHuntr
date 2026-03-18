// Subreddits client — CRUD with premium dark theme matching landing page

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plan } from '@/types'
import { UpgradeNudge } from '@/components/shared/upgrade-nudge'
import { Plus, Trash2, Inbox, Loader2 } from 'lucide-react'

interface Subreddit {
  id: string
  project_id: string
  name: string
  is_active: boolean
  created_at: string
}

interface SubredditsClientProps {
  projectId: string
  subreddits: Subreddit[]
  limit: number
  plan: Plan
}

export function SubredditsClient({ projectId, subreddits: initial, limit, plan }: SubredditsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [subreddits, setSubreddits] = useState<Subreddit[]>(initial)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [newSub, setNewSub] = useState('')
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isAtLimit = limit !== Infinity && subreddits.length >= limit

  async function handleAdd() {
    const name = newSub.trim().replace(/^r\//, '')
    if (!name) return
    setSaving(true)
    const { data, error } = await supabase
      .from('subreddits')
      .insert({ project_id: projectId, name })
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setSubreddits((prev) => [data, ...prev])
      setNewSub('')
      setAddOpen(false)
      router.refresh()
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    setTogglingId(id)
    const { error } = await supabase
      .from('subreddits')
      .update({ is_active: !currentActive })
      .eq('id', id)
    setTogglingId(null)
    if (!error) {
      setSubreddits((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !currentActive } : s))
      )
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeletingId(deleteId)
    const { error } = await supabase.from('subreddits').delete().eq('id', deleteId)
    setDeletingId(null)
    if (!error) {
      setSubreddits((prev) => prev.filter((s) => s.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className="text-[clamp(1.5rem,3vw,2rem)] font-[800] text-[#fafafa]"
            style={{ letterSpacing: '-0.035em', lineHeight: '1.15' }}
          >
            Subreddits
          </h1>
          <p className="mt-1 text-[0.88rem] text-[#a1a1aa]">
            Manage the subreddits SubHuntr monitors
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Usage bar */}
          {limit !== Infinity && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-[0.75rem] text-[#52525b]">
                <strong className="text-[#fafafa]">{subreddits.length}</strong> / {limit} subreddits
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                <div
                  className="h-full rounded-full bg-[#1D9E75]"
                  style={{
                    width: `${Math.min((subreddits.length / limit) * 100, 100)}%`,
                    transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </div>
          )}
          {/* Add button */}
          <button
            onClick={() => {
              if (isAtLimit) return
              setAddOpen(true)
            }}
            disabled={isAtLimit}
            className="inline-flex h-[40px] items-center gap-2 rounded-[10px] bg-[#1D9E75] px-5 text-[0.85rem] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              boxShadow: '0 0 30px rgba(29,158,117,0.15), 0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (isAtLimit) return
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
            <Plus className="h-4 w-4" /> Add subreddit
          </button>
        </div>
      </div>

      {isAtLimit && (
        <UpgradeNudge
          feature="more subreddits"
          description={`Your ${plan} plan allows ${limit} subreddits. Upgrade to add more.`}
          compact
        />
      )}

      {/* Subreddit list */}
      {subreddits.length === 0 ? (
        <div
          className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] py-16 text-center"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.3)' }}
        >
          <Inbox className="mx-auto mb-4 h-10 w-10 text-[#52525b]" />
          <h3
            className="mb-2 text-[1.1rem] font-[700] text-[#fafafa]"
            style={{ letterSpacing: '-0.02em' }}
          >
            No subreddits yet
          </h3>
          <p className="mb-5 text-[0.82rem] text-[#a1a1aa]">
            Add subreddits to tell SubHuntr where to look
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex h-[40px] items-center gap-2 rounded-[10px] bg-[#1D9E75] px-5 text-[0.85rem] font-bold text-white"
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
            <Plus className="h-4 w-4" /> Add your first subreddit
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {subreddits.map((sub, i) => (
            <div
              key={sub.id}
              className="animate-fade-in-up group flex items-center gap-4 rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[#131316] px-4 py-3.5 hover:border-[rgba(255,255,255,0.1)] hover:bg-[#18181c]"
              style={{
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                animationDelay: `${Math.min(i * 0.04, 0.4)}s`,
              }}
            >
              {/* Subreddit name — green r/ prefix */}
              <span className="min-w-0 flex-1 truncate text-[0.88rem] font-semibold">
                <span className="text-[#1D9E75]">r/</span>
                <span className="text-[#fafafa]">{sub.name}</span>
              </span>

              {/* Toggle */}
              <button
                onClick={() => handleToggle(sub.id, sub.is_active)}
                disabled={togglingId === sub.id}
                className="relative h-5 w-9 shrink-0 rounded-full"
                style={{
                  background: sub.is_active ? '#1D9E75' : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.2s',
                }}
              >
                <span
                  className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white"
                  style={{
                    transform: sub.is_active ? 'translateX(16px)' : 'translateX(0)',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </button>

              {/* Date */}
              <span className="hidden shrink-0 text-[0.72rem] text-[#52525b] sm:block">
                {formatDate(sub.created_at)}
              </span>

              {/* Delete */}
              <button
                onClick={() => setDeleteId(sub.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-[#52525b] opacity-0 group-hover:opacity-100 hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444]"
                style={{ transition: 'all 0.15s' }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add subreddit dialog */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm"
            onClick={() => setAddOpen(false)}
            style={{ animation: 'fadeIn 0.15s ease-out' }}
          />
          <div
            className="animate-fade-in-up relative w-full max-w-md rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] p-6"
            style={{
              boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 20px 50px rgba(0,0,0,0.5), 0 0 80px rgba(29,158,117,0.05)',
            }}
          >
            <h2
              className="mb-1 text-[1.1rem] font-[700] text-[#fafafa]"
              style={{ letterSpacing: '-0.02em' }}
            >
              Add a subreddit
            </h2>
            <p className="mb-5 text-[0.78rem] text-[#52525b]">
              SubHuntr will scan this subreddit for matching posts.
            </p>
            <div className="relative mb-5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[0.88rem] text-[#52525b]">r/</span>
              <input
                autoFocus
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAdd()
                  }
                }}
                placeholder="e.g. SaaS, Entrepreneur, startups"
                className="h-11 w-full rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[#09090b] pl-8 pr-4 text-[0.88rem] text-[#fafafa] placeholder:text-[#52525b] focus:border-[#1D9E75] focus:outline-none"
                style={{ transition: 'border-color 0.2s' }}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setAddOpen(false); setNewSub('') }}
                className="h-[38px] rounded-[10px] px-4 text-[0.82rem] font-medium text-[#a1a1aa] hover:text-[#fafafa]"
                style={{ transition: 'color 0.15s' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newSub.trim() || saving}
                className="inline-flex h-[40px] items-center gap-2 rounded-[10px] bg-[#1D9E75] px-5 text-[0.85rem] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Add subreddit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
            style={{ animation: 'fadeIn 0.15s ease-out' }}
          />
          <div
            className="animate-fade-in-up relative w-full max-w-sm rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] p-6"
            style={{
              boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <h2
              className="mb-1 text-[1.1rem] font-[700] text-[#fafafa]"
              style={{ letterSpacing: '-0.02em' }}
            >
              Delete subreddit?
            </h2>
            <p className="mb-5 text-[0.82rem] text-[#a1a1aa]">
              This subreddit will stop being monitored. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="h-[38px] rounded-[10px] px-4 text-[0.82rem] font-medium text-[#a1a1aa] hover:text-[#fafafa]"
                style={{ transition: 'color 0.15s' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId === deleteId}
                className="inline-flex h-[38px] items-center gap-2 rounded-[10px] bg-[#ef4444] px-5 text-[0.82rem] font-bold text-white hover:bg-[#dc2626] disabled:opacity-50"
                style={{ transition: 'all 0.2s' }}
              >
                {deletingId === deleteId && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
