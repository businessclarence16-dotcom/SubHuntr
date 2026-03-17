// Dialog de réponse — permet de rédiger et envoyer une réponse à un post Reddit

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Copy, Check } from 'lucide-react'

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
        setError(data.error || 'Erreur lors de l\'envoi')
        return
      }

      onReplySent()
      onOpenChange(false)
      setContent(getDefaultTemplate(post))
    } catch {
      setError('Erreur réseau')
    } finally {
      setSending(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Répondre au post</DialogTitle>
          <DialogDescription className="line-clamp-1">
            {post.title} — r/{post.subreddit}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrivez votre réponse..."
            rows={8}
            className="resize-none"
          />

          <p className="text-xs text-muted-foreground">
            Copiez votre réponse et collez-la directement sur Reddit.
            Le post s&apos;ouvrira dans un nouvel onglet.
          </p>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? 'Copié !' : 'Copier'}
          </Button>
          <Button onClick={handleSend} disabled={sending || !content.trim()}>
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder & ouvrir Reddit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Template par défaut pour les réponses
function getDefaultTemplate(post: { author: string }) {
  return `Hey${post.author !== '[deleted]' ? ` u/${post.author}` : ''},

J'ai vu ton post et je pense pouvoir t'aider !

[Votre suggestion ici]

N'hésite pas si tu as des questions.`
}
