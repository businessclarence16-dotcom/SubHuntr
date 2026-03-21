// Reply dialog — compose and copy a reply to a Reddit post
// Premium dark theme matching landing page styles

'use client'

import { useState } from 'react'
import { Loader2, Copy, Check, ArrowUpRight } from 'lucide-react'
import { trackEvent } from '@/lib/posthog'

interface ReplyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: {
    id: string
    title: string
    author: string
    subreddit: string
    url: string
  }
  onReplySent: () => void
}

export function ReplyDialog({ open, onOpenChange, post, onReplySent }: ReplyDialogProps) {
  const [content, setContent] = useState(getDefaultTemplate(post))
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSend() {
    if (!content.trim()) return

    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, content }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error sending reply')
        return
      }

      trackEvent('post_replied', { postId: post.id, subreddit: post.subreddit })
      onReplySent()
      onOpenChange(false)
      setContent(getDefaultTemplate(post))
    } catch {
      setError('Network error')
    } finally {
      setSending(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        style={{ animation: 'fadeIn 0.15s ease-out' }}
      />

      {/* Dialog card — matches .demo-w style */}
      <div
        className="animate-fade-in-up relative w-full max-w-[600px] rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] p-6"
        style={{
          boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 20px 50px rgba(0,0,0,0.5), 0 0 80px rgba(29,158,117,0.05)',
        }}
      >
        {/* Header */}
        <div className="mb-5">
          <h2
            className="text-[1.1rem] font-[700] text-[#fafafa]"
            style={{ letterSpacing: '-0.02em' }}
          >
            Reply to post
          </h2>
          <p className="mt-1 truncate text-[0.82rem] text-[#52525b]">
            {post.title} — r/{post.subreddit}
          </p>
        </div>

        {/* Textarea — matches .roi-input style */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your reply..."
          rows={8}
          className="mb-4 w-full resize-none rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[#09090b] px-4 py-3 text-[0.88rem] text-[#fafafa] placeholder:text-[#52525b] focus:border-[#1D9E75] focus:outline-none"
          style={{ transition: 'border-color 0.2s' }}
        />

        <p className="mb-4 text-[0.72rem] text-[#52525b]">
          Copy your reply and paste it directly on Reddit. The post will open in a new tab.
        </p>

        {error && (
          <div className="mb-4 rounded-[10px] border border-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-[0.82rem] text-[#ef4444]">
            {error}
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="h-[38px] rounded-[10px] px-4 text-[0.82rem] font-medium text-[#a1a1aa] hover:text-[#fafafa]"
            style={{ transition: 'color 0.15s' }}
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-transparent px-4 text-[0.82rem] font-medium text-[#a1a1aa] hover:border-[rgba(255,255,255,0.1)] hover:text-[#fafafa]"
            style={{ transition: 'all 0.2s' }}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#1D9E75]" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {/* Primary button — matches .btn-p */}
          <button
            onClick={handleSend}
            disabled={sending || !content.trim()}
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
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )}
            Copy & Open Reddit
          </button>
        </div>
      </div>
    </div>
  )
}

// Default reply template
function getDefaultTemplate(post: { author: string }) {
  return `Hey${post.author !== '[deleted]' ? ` u/${post.author}` : ''},

I saw your post and I think I can help!

[Your suggestion here]

Let me know if you have any questions.`
}
