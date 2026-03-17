// Composant client du Feed — bouton scan, filtres et liste de posts

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
import { Loader2, RefreshCw, ArrowUpRight, MessageSquare, ThumbsUp } from 'lucide-react'

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

export function FeedClient({ projectId, projectName, posts, keywords, subreddits }: FeedClientProps) {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [filterKeyword, setFilterKeyword] = useState<string>('all')
  const [filterSubreddit, setFilterSubreddit] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

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

  // Applique les filtres
  const filteredPosts = posts.filter((post) => {
    if (filterKeyword !== 'all' && post.matched_keyword !== filterKeyword) return false
    if (filterSubreddit !== 'all' && post.subreddit !== filterSubreddit) return false
    if (filterStatus !== 'all' && post.status !== filterStatus) return false
    return true
  })

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
        <p className={`text-sm ${scanResult.startsWith('Erreur') ? 'text-destructive' : 'text-green-600'}`}>
          {scanResult}
        </p>
      )}

      {/* Filtres */}
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
            <Card key={post.id}>
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
                    <Badge variant="outline">Pertinence : {post.relevance_score}/10</Badge>
                  )}
                  <Badge variant={post.status === 'new' ? 'default' : 'secondary'}>
                    {post.status === 'new' ? 'Nouveau' : post.status === 'replied' ? 'Répondu' : post.status === 'saved' ? 'Sauvegardé' : 'Ignoré'}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
