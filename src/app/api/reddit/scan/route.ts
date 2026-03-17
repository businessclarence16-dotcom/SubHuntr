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

  // Vérifie si les credentials Reddit sont configurées
  const hasRedditCredentials = !!(
    process.env.REDDIT_CLIENT_ID &&
    process.env.REDDIT_CLIENT_SECRET &&
    process.env.REDDIT_USERNAME &&
    process.env.REDDIT_PASSWORD
  )

  try {
    let postsFound = 0

    if (hasRedditCredentials) {
      // --- Mode API Reddit réelle ---
      const reddit = getRedditClient()

      for (const sub of subreddits) {
        for (const kw of keywords) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const results = await (reddit.getSubreddit(sub.name) as any).search({
              query: kw.keyword,
              time: 'week',
              sort: 'new',
              limit: 25,
            })

            for (const post of results as unknown as RedditPost[]) {
              const { data: existing } = await supabase
                .from('posts')
                .select('id')
                .eq('reddit_id', post.id)
                .eq('project_id', projectId)
                .single()

              if (existing) continue

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
            console.error(`Erreur scan r/${sub.name} pour "${kw.keyword}":`, searchError)
          }
        }
      }
    } else {
      // --- Mode mock (pas de clés Reddit configurées) ---
      const mockPosts = generateMockPosts(keywords, subreddits)

      for (const post of mockPosts) {
        const { data: existing } = await supabase
          .from('posts')
          .select('id')
          .eq('reddit_id', post.reddit_id)
          .eq('project_id', projectId)
          .single()

        if (existing) continue

        await supabase.from('posts').insert({
          ...post,
          project_id: projectId,
          found_at: new Date().toISOString(),
        })

        postsFound++
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

    return NextResponse.json({
      postsFound,
      scanId: scan?.id,
      mock: !hasRedditCredentials,
    })
  } catch (error) {
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

// Génère des posts mock réalistes à partir des keywords et subreddits du projet
function generateMockPosts(
  keywords: { keyword: string }[],
  subreddits: { name: string }[]
) {
  const mockTitles = [
    'Looking for a tool to help with {keyword}',
    'Best way to handle {keyword} for my startup?',
    'Anyone have experience with {keyword}?',
    'Need recommendations: {keyword} solutions',
    'How do you guys deal with {keyword}?',
    'Struggling with {keyword} — any advice?',
    'Just discovered a great approach for {keyword}',
    'Is there a service that does {keyword} automatically?',
  ]

  const mockBodies = [
    'I\'ve been searching for a while and can\'t find anything that really works well. Would love some suggestions from the community.',
    'We\'re a small team and this is becoming a real pain point. Budget is around $50-100/month.',
    'Tried a few tools already but none of them quite fit our needs. Open to both free and paid options.',
    'This has been on my todo list for months. Finally decided to ask here. What do you all use?',
    'Our current process is completely manual and it\'s eating up hours every week. There has to be a better way.',
  ]

  const mockAuthors = ['startup_founder', 'marketing_mike', 'saas_sarah', 'indie_hacker_42', 'growth_guru', 'techie_tom', 'product_pete']

  const posts = []
  let counter = 0

  for (const sub of subreddits) {
    for (const kw of keywords) {
      // Génère 2-3 posts par combinaison keyword/subreddit
      const numPosts = 2 + Math.floor(Math.random() * 2)

      for (let i = 0; i < numPosts; i++) {
        counter++
        const title = mockTitles[(counter + i) % mockTitles.length].replace('{keyword}', kw.keyword)
        const body = mockBodies[(counter + i) % mockBodies.length]
        const author = mockAuthors[(counter + i) % mockAuthors.length]
        const daysAgo = Math.floor(Math.random() * 7)
        const redditDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

        posts.push({
          reddit_id: `mock_${counter}_${i}_${Date.now()}`,
          title,
          body,
          author,
          subreddit: sub.name,
          url: `https://reddit.com/r/${sub.name}/comments/mock${counter}${i}`,
          score: Math.floor(Math.random() * 200) + 1,
          num_comments: Math.floor(Math.random() * 50),
          matched_keyword: kw.keyword,
          relevance_score: 5 + Math.floor(Math.random() * 5) + 1,
          status: 'new',
          reddit_created_at: redditDate.toISOString(),
        })
      }
    }
  }

  return posts
}
