// Reusable scan logic — shared between manual scans and auto-scan cron.
// Searches Reddit for posts matching project keywords × subreddits, deduplicates, and inserts new posts.

import { SupabaseClient } from '@supabase/supabase-js'
import { searchSubreddit, hasOfficialApiCredentials } from '@/lib/reddit/client'

export interface ScanResult {
  scanId: string | null
  postsFound: number
  totalFetched: number
  totalDuplicates: number
  totalErrors: number
  mode: 'api' | 'public'
  /** New posts that were inserted (with relevance_score) */
  newPosts: Array<{
    title: string
    url: string
    subreddit: string
    matched_keyword: string
    relevance_score: number
    reddit_created_at: string
  }>
}

export async function runScan(
  supabase: SupabaseClient,
  projectId: string,
  logPrefix = '[Scan]',
): Promise<ScanResult> {
  // Fetch active keywords and subreddits
  const [{ data: keywords }, { data: subreddits }] = await Promise.all([
    supabase.from('keywords').select('keyword').eq('project_id', projectId).eq('is_active', true),
    supabase.from('subreddits').select('name').eq('project_id', projectId).eq('is_active', true),
  ])

  if (!keywords?.length || !subreddits?.length) {
    return { scanId: null, postsFound: 0, totalFetched: 0, totalDuplicates: 0, totalErrors: 0, mode: 'public', newPosts: [] }
  }

  // Create scan record
  const { data: scan } = await supabase
    .from('scans')
    .insert({ project_id: projectId, status: 'running' })
    .select('id')
    .single()

  const mode = hasOfficialApiCredentials() ? 'api' : 'public'
  console.log(`${logPrefix} ========== SCAN START ==========`)
  console.log(`${logPrefix} Project: ${projectId}`)
  console.log(`${logPrefix} Mode: ${mode}`)
  console.log(`${logPrefix} Keywords (${keywords.length}): ${keywords.map((k) => k.keyword).join(', ')}`)
  console.log(`${logPrefix} Subreddits (${subreddits.length}): ${subreddits.map((s) => `r/${s.name}`).join(', ')}`)

  const allNewPosts: ScanResult['newPosts'] = []
  let postsFound = 0
  let totalFetched = 0
  let totalDuplicates = 0
  let totalErrors = 0

  try {
    for (const sub of subreddits) {
      for (const kw of keywords) {
        try {
          const posts = await searchSubreddit(sub.name, kw.keyword)
          totalFetched += posts.length

          if (posts.length === 0) continue

          const redditIds = posts.map((p) => p.reddit_id)
          const { data: existingPosts, error: dedupeError } = await supabase
            .from('posts')
            .select('reddit_id')
            .eq('project_id', projectId)
            .in('reddit_id', redditIds)

          if (dedupeError) {
            console.error(`${logPrefix} Dedup query error:`, dedupeError)
          }

          const existingIds = new Set((existingPosts || []).map((p) => p.reddit_id))
          const newPosts = posts.filter((p) => !existingIds.has(p.reddit_id))
          totalDuplicates += posts.length - newPosts.length

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
              console.error(`${logPrefix} Insert error for r/${sub.name} + "${kw.keyword}":`, insertError)
              totalErrors++
            } else {
              postsFound += newPosts.length
              for (const p of newPosts) {
                allNewPosts.push({
                  title: p.title,
                  url: p.url,
                  subreddit: p.subreddit,
                  matched_keyword: p.matched_keyword,
                  relevance_score: p.relevance_score,
                  reddit_created_at: p.reddit_created_at,
                })
              }
            }
          }
        } catch (searchError) {
          totalErrors++
          console.error(`${logPrefix} Error scanning r/${sub.name} for "${kw.keyword}":`, searchError)
        }
      }
    }

    await supabase
      .from('scans')
      .update({ status: 'completed', posts_found: postsFound, completed_at: new Date().toISOString() })
      .eq('id', scan?.id)

    console.log(`${logPrefix} ========== SCAN COMPLETE — ${postsFound} new posts ==========`)
  } catch (error) {
    if (scan?.id) {
      await supabase
        .from('scans')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', scan.id)
    }
    console.error(`${logPrefix} Fatal error:`, error)
    throw error
  }

  return { scanId: scan?.id ?? null, postsFound, totalFetched, totalDuplicates, totalErrors, mode, newPosts: allNewPosts }
}
