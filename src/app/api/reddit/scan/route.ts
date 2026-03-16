// API Route pour scanner Reddit — cherche des posts par keywords dans les subreddits configurés
// POST /api/reddit/scan { projectId: string }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRedditClient } from '@/lib/reddit/client'

interface RedditPost {
  id: string
  title: string
  selftext: string
  author: { name: string }
  subreddit: { display_name: string }
  url: string
  score: number
  num_comments: number
  created_utc: number
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { projectId } = await request.json()

  if (!projectId) {
    return NextResponse.json({ error: 'projectId requis' }, { status: 400 })
  }

  // Vérifie que le projet appartient à l'utilisateur
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 })
  }

  // Récupère les keywords et subreddits actifs du projet
  const [{ data: keywords }, { data: subreddits }] = await Promise.all([
    supabase.from('keywords').select('keyword').eq('project_id', projectId).eq('is_active', true),
    supabase.from('subreddits').select('name').eq('project_id', projectId).eq('is_active', true),
  ])

  if (!keywords?.length || !subreddits?.length) {
    return NextResponse.json(
      { error: 'Ajoutez au moins un keyword et un subreddit avant de scanner.' },
      { status: 400 }
    )
  }

  // Crée un enregistrement de scan
  const { data: scan } = await supabase
    .from('scans')
    .insert({ project_id: projectId, status: 'running' })
    .select('id')
    .single()

  try {
    const reddit = getRedditClient()
    let postsFound = 0

    // Pour chaque subreddit, cherche les posts récents qui matchent un keyword
    for (const sub of subreddits) {
      for (const kw of keywords) {
        try {
          // Cherche dans le subreddit avec le keyword
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const results = await (reddit.getSubreddit(sub.name) as any).search({
            query: kw.keyword,
            time: 'week',
            sort: 'new',
            limit: 25,
          })

          for (const post of results as unknown as RedditPost[]) {
            // Vérifie que le post n'existe pas déjà en base
            const { data: existing } = await supabase
              .from('posts')
              .select('id')
              .eq('reddit_id', post.id)
              .eq('project_id', projectId)
              .single()

            if (existing) continue

            // Calcule un score de pertinence simple (1-10)
            const titleMatch = post.title.toLowerCase().includes(kw.keyword.toLowerCase())
            const bodyMatch = post.selftext?.toLowerCase().includes(kw.keyword.toLowerCase())
            let relevanceScore = 5
            if (titleMatch) relevanceScore += 3
            if (bodyMatch) relevanceScore += 2
            relevanceScore = Math.min(relevanceScore, 10)

            await supabase.from('posts').insert({
              project_id: projectId,
              reddit_id: post.id,
              title: post.title,
              body: post.selftext || null,
              author: post.author?.name || '[deleted]',
              subreddit: post.subreddit?.display_name || sub.name,
              url: `https://reddit.com${post.url || `/r/${sub.name}/comments/${post.id}`}`,
              score: post.score,
              num_comments: post.num_comments,
              matched_keyword: kw.keyword,
              relevance_score: relevanceScore,
              reddit_created_at: new Date(post.created_utc * 1000).toISOString(),
              found_at: new Date().toISOString(),
            })

            postsFound++
          }
        } catch (searchError) {
          // Continue avec le prochain keyword/subreddit si une recherche échoue
          console.error(`Erreur scan r/${sub.name} pour "${kw.keyword}":`, searchError)
        }
      }
    }

    // Met à jour le scan
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        posts_found: postsFound,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scan?.id)

    return NextResponse.json({ postsFound, scanId: scan?.id })
  } catch (error) {
    // Marque le scan comme échoué
    if (scan?.id) {
      await supabase
        .from('scans')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', scan.id)
    }

    console.error('Erreur lors du scan Reddit:', error)
    return NextResponse.json(
      { error: 'Erreur lors du scan Reddit. Vérifiez vos credentials Reddit.' },
      { status: 500 }
    )
  }
}
