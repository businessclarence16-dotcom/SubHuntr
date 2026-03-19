// Client Reddit — utilise l'API officielle (snoowrap) si les clés sont disponibles,
// sinon les endpoints JSON publics de Reddit comme fallback.
// Pas besoin de clés API pour le mode public.

import Snoowrap from 'snoowrap'

// ---------- Types ----------

export interface RedditPost {
  reddit_id: string
  title: string
  body: string | null
  author: string
  subreddit: string
  url: string
  score: number
  num_comments: number
  matched_keyword: string
  relevance_score: number
  reddit_created_at: string
  status: 'new'
}

// ---------- Rate limiter (1 req / 2 sec for public endpoints) ----------

let lastRequestTime = 0

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < 2000) {
    const waitMs = 2000 - elapsed
    console.log(`[Reddit] Rate limit: waiting ${waitMs}ms before next request`)
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
  lastRequestTime = Date.now()

  console.log(`[Reddit] Fetching: ${url}`)

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': 'SubHuntr/1.0 (by /u/SubHuntr)',
        'Accept': 'application/json',
      },
    })
  } catch (fetchError) {
    console.error(`[Reddit] Fetch failed for ${url}:`, fetchError)
    throw fetchError
  }

  console.log(`[Reddit] Response status: ${response.status} ${response.statusText}`)

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '(could not read body)')
    console.error(`[Reddit] Error response body (first 500 chars): ${errorBody.slice(0, 500)}`)
    throw new Error(`Reddit API error: ${response.status} ${response.statusText} — ${errorBody.slice(0, 200)}`)
  }

  return response
}

// ---------- Relevance scoring ----------

const BUYING_INTENT_WORDS = [
  'best', 'alternative', 'recommend', 'looking for', 'switched from',
  'better than', 'suggestion', 'suggestions', 'compared to', 'vs',
  'which one', 'should i use', 'need help', 'any good', 'worth it',
  'replacement', 'migrate', 'moving from', 'help me choose',
]

function calculateRelevanceScore(
  title: string,
  body: string | null,
  keyword: string,
  createdUtc: number,
  numComments: number,
): number {
  const lowerTitle = title.toLowerCase()
  const lowerBody = (body || '').toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  const combined = `${lowerTitle} ${lowerBody}`

  let score = 0

  // Title contains exact keyword → +3
  if (lowerTitle.includes(lowerKeyword)) score += 3

  // Body contains keyword → +2
  if (lowerBody.includes(lowerKeyword)) score += 2

  // Buying intent words → +2
  const hasBuyingIntent = BUYING_INTENT_WORDS.some((word) => combined.includes(word))
  if (hasBuyingIntent) score += 2

  // Freshness scoring — ultra-recent posts get more points
  const ageMinutes = (Date.now() / 1000 - createdUtc) / 60
  if (ageMinutes < 30) score += 3        // < 30 min → +3
  else if (ageMinutes < 60) score += 2   // < 1h → +2
  else if (ageMinutes < 120) score += 1  // < 2h → +1

  // Many comments (> 10) → +1
  if (numComments > 10) score += 1

  // Subreddit is relevant (keyword in subreddit name or title+body match) → +1
  // Already covered by title/body checks, so give +1 baseline for being in a tracked sub
  score += 1

  return Math.min(Math.max(score, 1), 10)
}

// ---------- Public JSON client ----------

interface RedditJsonChild {
  data: {
    id: string
    title: string
    selftext: string
    author: string
    subreddit: string
    permalink: string
    url: string
    score: number
    num_comments: number
    created_utc: number
  }
}

interface RedditJsonResponse {
  data?: {
    children?: RedditJsonChild[]
  }
  error?: number
  message?: string
}

async function searchSubredditPublic(
  subredditName: string,
  keyword: string,
): Promise<RedditPost[]> {
  const query = encodeURIComponent(keyword)
  const sub = encodeURIComponent(subredditName)
  const url = `https://www.reddit.com/r/${sub}/search.json?q=${query}&sort=new&restrict_sr=on&limit=25&t=day`

  console.log(`[Reddit] Searching r/${subredditName} for "${keyword}"`)
  console.log(`[Reddit] URL: ${url}`)

  const response = await rateLimitedFetch(url)

  let rawText: string
  try {
    rawText = await response.text()
  } catch (err) {
    console.error(`[Reddit] Failed to read response body:`, err)
    return []
  }

  console.log(`[Reddit] Raw response (first 500 chars): ${rawText.slice(0, 500)}`)

  let json: RedditJsonResponse
  try {
    json = JSON.parse(rawText) as RedditJsonResponse
  } catch (err) {
    console.error(`[Reddit] Failed to parse JSON:`, err)
    console.error(`[Reddit] Body was: ${rawText.slice(0, 1000)}`)
    return []
  }

  if (json.error) {
    console.error(`[Reddit] API error: ${json.error} — ${json.message}`)
    return []
  }

  if (!json.data?.children) {
    console.warn(`[Reddit] No data.children in response. Keys: ${Object.keys(json).join(', ')}`)
    return []
  }

  console.log(`[Reddit] Got ${json.data.children.length} posts from r/${subredditName} for "${keyword}"`)

  // Filter to posts less than 24 hours old — niche subreddits need a wider window
  const oneDayAgo = Date.now() / 1000 - 86400
  const freshChildren = json.data.children.filter((child) => child.data.created_utc > oneDayAgo)
  console.log(`[Reddit] After 24h freshness filter: ${freshChildren.length}/${json.data.children.length} posts`)

  return freshChildren.map((child) => {
    const post = child.data
    const relevance = calculateRelevanceScore(
      post.title,
      post.selftext || null,
      keyword,
      post.created_utc,
      post.num_comments,
    )

    return {
      reddit_id: post.id,
      title: post.title,
      body: post.selftext || null,
      author: post.author || '[deleted]',
      subreddit: post.subreddit || subredditName,
      url: `https://reddit.com${post.permalink}`,
      score: post.score,
      num_comments: post.num_comments,
      matched_keyword: keyword,
      relevance_score: relevance,
      reddit_created_at: new Date(post.created_utc * 1000).toISOString(),
      status: 'new' as const,
    }
  })
}

// ---------- Snoowrap client (when API keys are available) ----------

let snoowrapClient: Snoowrap | null = null

function getSnoowrapClient(): Snoowrap {
  if (snoowrapClient) return snoowrapClient

  snoowrapClient = new Snoowrap({
    userAgent: 'SubHuntr/1.0 (by /u/SubHuntr)',
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    username: process.env.REDDIT_USERNAME!,
    password: process.env.REDDIT_PASSWORD!,
  })

  snoowrapClient.config({
    requestDelay: 1000,
    continueAfterRatelimitError: true,
  })

  return snoowrapClient
}

interface SnoowrapPost {
  id: string
  title: string
  selftext: string
  author: { name: string }
  subreddit: { display_name: string }
  url: string
  permalink: string
  score: number
  num_comments: number
  created_utc: number
}

async function searchSubredditSnoowrap(
  subredditName: string,
  keyword: string,
): Promise<RedditPost[]> {
  const reddit = getSnoowrapClient()

  console.log(`[Reddit] [Snoowrap] Searching r/${subredditName} for "${keyword}"`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = await (reddit.getSubreddit(subredditName) as any).search({
    query: keyword,
    time: 'day',
    sort: 'new',
    limit: 25,
  })

  console.log(`[Reddit] [Snoowrap] Got ${(results as unknown[]).length} posts from r/${subredditName}`)

  // Filter to posts less than 24 hours old — niche subreddits need a wider window
  const oneDayAgo = Date.now() / 1000 - 86400
  const freshResults = (results as unknown as SnoowrapPost[]).filter((post) => post.created_utc > oneDayAgo)
  console.log(`[Reddit] [Snoowrap] After 24h freshness filter: ${freshResults.length}/${(results as unknown[]).length} posts`)

  return freshResults.map((post) => {
    const relevance = calculateRelevanceScore(
      post.title,
      post.selftext || null,
      keyword,
      post.created_utc,
      post.num_comments,
    )

    return {
      reddit_id: post.id,
      title: post.title,
      body: post.selftext || null,
      author: post.author?.name || '[deleted]',
      subreddit: post.subreddit?.display_name || subredditName,
      url: `https://reddit.com${post.permalink || `/r/${subredditName}/comments/${post.id}`}`,
      score: post.score,
      num_comments: post.num_comments,
      matched_keyword: keyword,
      relevance_score: relevance,
      reddit_created_at: new Date(post.created_utc * 1000).toISOString(),
      status: 'new' as const,
    }
  })
}

// ---------- Public API ----------

/** Returns true if snoowrap credentials are fully configured */
export function hasOfficialApiCredentials(): boolean {
  return !!(
    process.env.REDDIT_CLIENT_ID &&
    process.env.REDDIT_CLIENT_SECRET &&
    process.env.REDDIT_USERNAME &&
    process.env.REDDIT_PASSWORD
  )
}

/**
 * Search a subreddit for posts matching a keyword.
 * Uses snoowrap if API credentials are available, otherwise public JSON endpoints.
 */
export async function searchSubreddit(
  subredditName: string,
  keyword: string,
): Promise<RedditPost[]> {
  const mode = hasOfficialApiCredentials() ? 'snoowrap' : 'public'
  console.log(`[Reddit] searchSubreddit("${subredditName}", "${keyword}") — mode: ${mode}`)

  try {
    if (mode === 'snoowrap') {
      return await searchSubredditSnoowrap(subredditName, keyword)
    }
    return await searchSubredditPublic(subredditName, keyword)
  } catch (err) {
    console.error(`[Reddit] searchSubreddit failed for r/${subredditName} + "${keyword}":`, err)
    return []
  }
}
