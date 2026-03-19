// API Route pour scanner Reddit — cherche des posts par keywords dans les subreddits configurés
// POST /api/reddit/scan { projectId: string }
// Utilise l'API officielle Reddit si les clés sont dispo, sinon les endpoints JSON publics.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchSubreddit, hasOfficialApiCredentials } from '@/lib/reddit/client'
import { PLAN_LIMITS } from '@/constants/plans'
import { Plan } from '@/types'

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

  // Vérifie l'intervalle minimum entre scans selon le plan
  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const userPlan = (profile?.plan ?? 'starter') as Plan
  const limits = PLAN_LIMITS[userPlan]
  const minInterval = limits.scanIntervalMinutes

  const { data: lastScan } = await supabase
    .from('scans')
    .select('started_at')
    .eq('project_id', projectId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (lastScan) {
    const elapsed = (Date.now() - new Date(lastScan.started_at).getTime()) / 60000
    if (elapsed < minInterval) {
      const wait = Math.ceil(minInterval - elapsed)
      return NextResponse.json({
        error: `Attendez encore ${wait} min avant le prochain scan (plan ${userPlan} : 1 scan / ${minInterval} min). Passez au plan supérieur pour scanner plus souvent.`,
        upgrade: true,
      }, { status: 403 })
    }
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

  const mode = hasOfficialApiCredentials() ? 'api' : 'public'
  console.log(`[Scan] Starting scan for project ${projectId} (mode: ${mode}, ${subreddits.length} subs × ${keywords.length} keywords)`)

  try {
    let postsFound = 0

    for (const sub of subreddits) {
      for (const kw of keywords) {
        try {
          const posts = await searchSubreddit(sub.name, kw.keyword)
          console.log(`[Scan] r/${sub.name} + "${kw.keyword}" → ${posts.length} results`)

          // Récupère les reddit_ids déjà connus pour ce projet en une seule requête
          const redditIds = posts.map((p) => p.reddit_id)
          const { data: existingPosts } = await supabase
            .from('posts')
            .select('reddit_id')
            .eq('project_id', projectId)
            .in('reddit_id', redditIds)

          const existingIds = new Set((existingPosts || []).map((p) => p.reddit_id))

          // Filtre les posts déjà existants
          const newPosts = posts.filter((p) => !existingIds.has(p.reddit_id))

          if (newPosts.length > 0) {
            const { error: insertError } = await supabase.from('posts').insert(
              newPosts.map((post) => ({
                project_id: projectId,
                reddit_id: post.reddit_id,
                title: post.title,
                body: post.body,
                author: post.author,
                subreddit: post.subreddit,
                url: post.url,
                score: post.score,
                num_comments: post.num_comments,
                matched_keyword: post.matched_keyword,
                relevance_score: post.relevance_score,
                reddit_created_at: post.reddit_created_at,
                found_at: new Date().toISOString(),
              }))
            )

            if (insertError) {
              console.error(`[Scan] Insert error for r/${sub.name} + "${kw.keyword}":`, insertError)
            } else {
              postsFound += newPosts.length
            }
          }
        } catch (searchError) {
          console.error(`[Scan] Error scanning r/${sub.name} for "${kw.keyword}":`, searchError)
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

    console.log(`[Scan] Completed — ${postsFound} new posts found`)

    return NextResponse.json({
      postsFound,
      scanId: scan?.id,
      mode,
    })
  } catch (error) {
    if (scan?.id) {
      await supabase
        .from('scans')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', scan.id)
    }

    console.error('[Scan] Fatal error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du scan Reddit.' },
      { status: 500 }
    )
  }
}
