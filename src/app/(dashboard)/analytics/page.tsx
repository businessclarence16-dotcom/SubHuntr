// Page Analytics — compteurs et stats du projet

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, MessageSquare, Reply, TrendingUp } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!project) redirect('/onboarding')

  // Récupère les stats en parallèle
  const [
    { count: totalPosts },
    { count: repliedPosts },
    { count: savedPosts },
    { count: totalScans },
    { data: topKeywords },
    { data: recentPosts },
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('project_id', project.id),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('project_id', project.id).eq('status', 'replied'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('project_id', project.id).eq('status', 'saved'),
    supabase.from('scans').select('*', { count: 'exact', head: true }).eq('project_id', project.id).eq('status', 'completed'),
    supabase.from('posts').select('matched_keyword').eq('project_id', project.id),
    supabase.from('posts').select('found_at').eq('project_id', project.id).order('found_at', { ascending: false }).limit(30),
  ])

  // Calcule le taux de réponse
  const responseRate = totalPosts ? Math.round(((repliedPosts ?? 0) / totalPosts) * 100) : 0

  // Top keywords par nombre de posts
  const keywordCounts: Record<string, number> = {}
  topKeywords?.forEach((p) => {
    keywordCounts[p.matched_keyword] = (keywordCounts[p.matched_keyword] || 0) + 1
  })
  const sortedKeywords = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Posts par jour (7 derniers jours)
  const postsPerDay: Record<string, number> = {}
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    postsPerDay[key] = 0
  }
  recentPosts?.forEach((p) => {
    const date = new Date(p.found_at)
    const key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    if (postsPerDay[key] !== undefined) {
      postsPerDay[key]++
    }
  })

  const maxPostsPerDay = Math.max(...Object.values(postsPerDay), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">{project.name}</p>
      </div>

      {/* Compteurs principaux */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Posts trouvés</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Réponses envoyées</CardTitle>
            <Reply className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repliedPosts ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de réponse</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scans effectués</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScans ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Posts par jour (graphique barres simple) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Posts trouvés (7 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2" style={{ height: '160px' }}>
              {Object.entries(postsPerDay).map(([day, count]) => (
                <div key={day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-medium">{count}</span>
                  <div
                    className="w-full rounded-t bg-primary"
                    style={{
                      height: `${Math.max((count / maxPostsPerDay) * 120, 4)}px`,
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top keywords</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedKeywords.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée. Lancez un scan !</p>
            ) : (
              <div className="space-y-3">
                {sortedKeywords.map(([keyword, count]) => {
                  const percentage = totalPosts ? Math.round((count / totalPosts) * 100) : 0
                  return (
                    <div key={keyword} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{keyword}</span>
                        <span className="text-muted-foreground">{count} posts ({percentage}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
