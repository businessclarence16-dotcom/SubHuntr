// Composant client du Feed — bouton scan, filtres, tri et liste de posts avec actions

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ThumbsUp,
  Bookmark,
  SkipForward,
  Reply,
  ArrowDownUp,
} from 'lucide-react'
import { ReplyDialog } from '@/components/feed/reply-dialog'
import { UpgradeNudge } from '@/components/shared/upgrade-nudge'

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

type SortOption = 'date' | 'score' | 'relevance' | 'comments'

export function FeedClient({ projectId, projectName, posts: initialPosts, keywords, subreddits }: FeedClientProps) {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [filterKeyword, setFilterKeyword] = useState<string>('all')
  const [filterSubreddit, setFilterSubreddit] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [updatingPost, setUpdatingPost] = useState<string | null>(null)
  const [replyPost, setReplyPost] = useState<Post | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  async function handleScan() {
    setScanning(true)
    setScanResult(null)

    try {
      const res = await fetch('/api/reddit/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setScanResult(`Erreur : ${data.error}`)
        if (data.upgrade) setShowUpgrade(true)
      } else {
        const mockNote = data.mock ? ' (mode demo — configurez les clés Reddit pour des vrais posts)' : ''
        setScanResult(`Scan terminé ! ${data.postsFound} nouveau(x) post(s) trouvé(s).${mockNote}`)
        router.refresh()
      }
    } catch {
      setScanResult('Erreur réseau lors du scan.')
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

  // Applique les filtres
  const filteredPosts = posts
    .filter((post) => {
      if (filterKeyword !== 'all' && post.matched_keyword !== filterKeyword) return false
      if (filterSubreddit !== 'all' && post.subreddit !== filterSubreddit) return false
      if (filterStatus !== 'all' && post.status !== filterStatus) return false
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

  const statusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nouveau'
      case 'replied': return 'Répondu'
      case 'saved': return 'Sauvegardé'
      case 'skipped': return 'Ignoré'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feed</h1>
          <p className="text-sm text-muted-foreground">
            {projectName} — {posts.length} post(s) trouvé(s)
          </p>
        </div>
        <Button onClick={handleScan} disabled={scanning}>
          {scanning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {scanning ? 'Scan en cours...' : 'Lancer un scan'}
        </Button>
      </div>

      {scanResult && (
        <p className={`text-sm ${scanResult.startsWith('Erreur') ? 'text-destructive' : 'text-[#34d399]'}`}>
          {scanResult}
        </p>
      )}

      {showUpgrade && (
        <UpgradeNudge
          feature="plus de scans par jour"
          description="Votre plan actuel a atteint sa limite de scans quotidiens."
          compact
        />
      )}

      {/* Filtres et tri */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterKeyword} onValueChange={(v) => setFilterKeyword(v ?? 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Keyword" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les keywords</SelectItem>
            {keywords.map((kw) => (
              <SelectItem key={kw} value={kw}>{kw}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSubreddit} onValueChange={(v) => setFilterSubreddit(v ?? 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Subreddit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les subreddits</SelectItem>
            {subreddits.map((sub) => (
              <SelectItem key={sub} value={sub}>r/{sub}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="new">Nouveau</SelectItem>
            <SelectItem value="replied">Répondu</SelectItem>
            <SelectItem value="saved">Sauvegardé</SelectItem>
            <SelectItem value="skipped">Ignoré</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy((v as SortOption) ?? 'date')}>
          <SelectTrigger className="w-[180px]">
            <ArrowDownUp className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Plus récent</SelectItem>
            <SelectItem value="score">Meilleur score</SelectItem>
            <SelectItem value="relevance">Plus pertinent</SelectItem>
            <SelectItem value="comments">Plus commenté</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des posts */}
      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {posts.length === 0
                ? 'Aucun post trouvé. Lancez un scan pour commencer !'
                : 'Aucun post ne correspond aux filtres.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <Card key={post.id} className={post.status === 'skipped' ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base leading-snug">
                      {post.title}
                    </CardTitle>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>r/{post.subreddit}</span>
                      <span>·</span>
                      <span>u/{post.author}</span>
                      <span>·</span>
                      <span>{new Date(post.reddit_created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="ghost" size="icon">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                {post.body && (
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {post.body}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{post.matched_keyword}</Badge>
                  {post.relevance_score && (
                    <span className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 font-mono text-xs font-bold ${
                      post.relevance_score >= 7
                        ? 'bg-[rgba(29,158,117,0.15)] text-[#34d399]'
                        : post.relevance_score >= 5
                          ? 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'
                          : 'bg-[rgba(255,255,255,0.06)] text-[#52525b]'
                    }`}>
                      {post.relevance_score}/10
                    </span>
                  )}
                  <Badge variant={post.status === 'new' ? 'default' : 'secondary'}>
                    {statusLabel(post.status)}
                  </Badge>
                  <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> {post.score}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {post.num_comments}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2 border-t pt-3">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={updatingPost === post.id}
                    onClick={() => setReplyPost(post)}
                  >
                    <Reply className="mr-1 h-3 w-3" />
                    Répondre
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingPost === post.id || post.status === 'saved'}
                    onClick={() => updatePostStatus(post.id, 'saved')}
                  >
                    <Bookmark className="mr-1 h-3 w-3" />
                    Sauvegarder
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={updatingPost === post.id || post.status === 'skipped'}
                    onClick={() => updatePostStatus(post.id, 'skipped')}
                  >
                    <SkipForward className="mr-1 h-3 w-3" />
                    Ignorer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de réponse */}
      {replyPost && (
        <ReplyDialog
          open={!!replyPost}
          onOpenChange={(open) => { if (!open) setReplyPost(null) }}
          post={replyPost}
          onReplySent={() => {
            setPosts((prev) =>
              prev.map((p) => (p.id === replyPost.id ? { ...p, status: 'replied' } : p))
            )
            // Ouvre le post Reddit dans un nouvel onglet
            window.open(replyPost.url, '_blank')
          }}
        />
      )}
    </div>
  )
}
