// Client Reddit — utilise l'API officielle (snoowrap) si les clés sont disponibles,
// sinon les endpoints JSON publics de Reddit (search.json + fallback new.json).
// Les endpoints JSON fournissent le body (selftext) des posts, contrairement au RSS.

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

// ---------- Rate limiter (1 req / 6 sec for public JSON endpoints — ~10 req/min) ----------

let lastRequestTime = 0

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < 6000) {
    const waitMs = 6000 - elapsed
    console.log(`[Reddit] Rate limit: waiting ${waitMs}ms before next request`)
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
  lastRequestTime = Date.now()

  console.log(`[Reddit] Fetching: ${url}`)

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SubHuntr/1.0 (Reddit monitoring tool; https://subhuntr.com)',
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  })

  console.log(`[Reddit] Response status: ${response.status} ${response.statusText}`)
  return response
}

// ---------- Relevance scoring ----------

const SELF_PROMO_PHRASES = [
  'i built', 'i created', 'i made', 'i launched', 'i developed',
  'we built', 'we created', 'we made', 'we launched', 'we developed',
  'check out my', 'check out our',
  'introducing my', 'introducing our',
  'just launched', 'just released', 'just shipped',
  "here's my", 'here is my',
  "i'm building", "we're building",
  'my new tool', 'my new app', 'my new saas',
  'our new tool', 'our new app', 'our new saas',
  'feedback on my', 'feedback on our',
  'roast my', 'rate my',
  'show hn', 'show reddit',
]

const JOB_PHRASES = [
  "we're hiring", 'we are hiring', 'job opening', 'job posting',
  'hiring a', 'hiring an', 'looking to hire',
  'freelancer needed', 'developer needed', 'designer needed',
  'for hire', 'available for work',
]

const STRONG_INTENT_PHRASES = [
  'looking for a tool', 'looking for a software', 'looking for a platform',
  'looking for a solution', 'looking for a service', 'looking for an app',
  'looking for recommendations', 'looking for suggestion',
  'need a tool', 'need a software', 'need a platform', 'need a solution',
  'need an alternative', 'need help finding',
  'recommend a tool', 'recommend a software', 'recommend a platform',
  'recommend me', 'recommendations for',
  'alternative to', 'alternatives to', 'replacement for',
  'help me find', 'help me choose',
  'switched from', 'switching from', 'moving away from', 'migrating from',
  'looking to replace', 'want to replace',
  'what tool do you', 'what software do you', 'what app do you',
  'what do you use for', 'what are you using for',
  'can anyone suggest', 'can anyone recommend', 'can you recommend',
  'does anyone know of', 'does anyone have experience with',
  'suggestions for a', 'suggest a tool', 'suggest a software',
  'what are the best tools', 'what are the best apps',
  'i need something that', 'i need something to',
  'is there a tool', 'is there a software', 'is there an app',
  'is there anything that', 'is there any tool',
  'any good tools', 'any good software', 'any good apps',
]

// Flexible strong intent: title must contain a starter AND an ender (not necessarily adjacent)
const STRONG_STARTERS = [
  'looking for', 'need a', 'need an', 'searching for', 'trying to find',
  'want a', 'want an', 'in need of', 'hunting for',
]
const STRONG_ENDERS = [
  'tool', 'software', 'platform', 'solution', 'app', 'service',
  'recommendation', 'recommendations', 'suggestion', 'suggestions', 'alternative', 'alternatives',
]

const MEDIUM_INTENT_PHRASES = [
  'best tool', 'best software', 'best platform', 'best app', 'best service',
  'best way to', 'best option', 'best solution',
  'better than', 'better alternative',
  'anyone using', 'anyone tried', 'anyone have experience',
  'which tool', 'which software', 'which platform',
  'should i use', 'should i switch', 'should i try',
  'what is the best', "what's the best", 'whats the best',
  'worth it', 'worth trying', 'worth switching',
  'how do you handle', 'how do you manage',
  'frustrated with', 'hate using', 'disappointed with',
  'too expensive', 'overpriced', 'cheaper alternative',
  'looking for',
  'any alternative', 'any replacement',
  'tired of', 'fed up with', 'sick of',
  'wish there was', 'wish i had',
  'how to automate', 'how to streamline',
]

// "best [X]" where X is a category word → medium intent minimum
const BEST_CATEGORY_WORDS = [
  'crm', 'cms', 'erp', 'saas', 'tool', 'app', 'software', 'platform', 'service',
  'solution', 'plugin', 'extension', 'framework', 'library', 'api', 'integration',
  'automation', 'dashboard', 'analytics', 'monitoring', 'deployment', 'hosting',
  'email', 'scheduling', 'invoicing', 'accounting', 'project management',
  'time tracking', 'customer support', 'helpdesk', 'live chat',
]

const WEAK_INTENT_PHRASES = [
  ' vs ', 'versus', 'compared to', 'comparison',
  'difference between',
  'is it good', 'is it worth', 'thoughts on',
  'review of', 'experience with', 'opinion on',
  'pros and cons', 'advantages of',
]

const HIGH_VALUE_SUBREDDITS = new Set([
  'saas', 'entrepreneur', 'startups', 'smallbusiness', 'indiehackers',
  'webdev', 'marketing', 'growthhacking', 'growmybusiness', 'digitalnomad',
  'freelance', 'productivity', 'sideproject', 'advancedentrepreneur',
])

function calculateRelevanceScore(
  title: string,
  body: string | null,
  keyword: string,
  createdUtc: number,
  numComments: number,
  subreddit?: string,
): number {
  const titleLower = title.toLowerCase()
  const bodyLower = (body || '').toLowerCase()
  const keywordLower = keyword.toLowerCase()

  // 0. Anti-spam filter — self-promo and job posts are NOT leads
  if (
    SELF_PROMO_PHRASES.some((p) => titleLower.includes(p)) ||
    JOB_PHRASES.some((p) => titleLower.includes(p))
  ) {
    return 1
  }

  let score = 0

  // 1. Buying intent in TITLE (0-5 points) — most important signal
  // First try exact phrase match
  let titleIntentScore = 0
  if (STRONG_INTENT_PHRASES.some((p) => titleLower.includes(p))) {
    titleIntentScore = 5
  } else if (MEDIUM_INTENT_PHRASES.some((p) => titleLower.includes(p))) {
    titleIntentScore = 3
  } else if (WEAK_INTENT_PHRASES.some((p) => titleLower.includes(p))) {
    titleIntentScore = 2
  }

  // Flexible strong intent: starter + ender anywhere in title (handles "looking for CRM/tool recommendations")
  if (titleIntentScore < 5) {
    const hasStarter = STRONG_STARTERS.some((s) => titleLower.includes(s))
    const hasEnder = STRONG_ENDERS.some((e) => titleLower.includes(e))
    if (hasStarter && hasEnder) {
      titleIntentScore = Math.max(titleIntentScore, 5)
    }
  }

  // "best" + category word → at least medium intent
  if (titleIntentScore < 3 && titleLower.includes('best')) {
    const hasCategoryWord = BEST_CATEGORY_WORDS.some((w) => titleLower.includes(w))
    if (hasCategoryWord) {
      titleIntentScore = Math.max(titleIntentScore, 3)
    }
  }

  score += titleIntentScore

  // 2. Buying intent in BODY (+0-2 points)
  if (bodyLower.length > 0) {
    if (STRONG_INTENT_PHRASES.some((p) => bodyLower.includes(p))) {
      score += 2
    } else if (MEDIUM_INTENT_PHRASES.some((p) => bodyLower.includes(p))) {
      score += 1
    }
  }

  // 3. Question format (+1 point) — questions = someone seeking help
  if (titleLower.includes('?')) {
    score += 1
  }

  // 4. Keyword match in title (+1 point)
  if (titleLower.includes(keywordLower)) {
    score += 1
  }

  // 5. Freshness — compensates for missing RSS body (+0-2 points)
  const ageInHours = (Date.now() / 1000 - createdUtc) / 3600
  if (ageInHours < 1) {
    score += 2
  } else if (ageInHours < 3) {
    score += 1.5
  } else if (ageInHours < 6) {
    score += 1
  } else if (ageInHours < 12) {
    score += 0.5
  }

  // 6. Engagement — signals real interest (+0-1.5 points)
  if (numComments >= 20) {
    score += 1.5
  } else if (numComments >= 10) {
    score += 1
  } else if (numComments >= 5) {
    score += 0.5
  }

  // 7. High-value subreddit bonus (+0.5 points)
  if (subreddit && HIGH_VALUE_SUBREDDITS.has(subreddit.toLowerCase())) {
    score += 0.5
  }

  return Math.max(1, Math.min(10, Math.round(score)))
}

// ---------- JSON client with fallback ----------

interface RedditJsonChild {
  kind: string
  data: {
    id: string
    name: string
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
}

function parseJsonResponse(
  data: RedditJsonResponse,
  keyword: string,
  subredditName: string,
): RedditPost[] {
  if (!data?.data?.children || !Array.isArray(data.data.children)) {
    return []
  }

  const oneDayAgo = Date.now() / 1000 - 86400

  return data.data.children
    .filter((child) => child.kind === 't3')
    .filter((child) => child.data.created_utc > oneDayAgo)
    .map((child) => {
      const post = child.data
      const body = post.selftext || null
      const subreddit = post.subreddit || subredditName

      const relevance = calculateRelevanceScore(
        post.title,
        body,
        keyword,
        post.created_utc,
        post.num_comments,
        subreddit,
      )

      return {
        reddit_id: post.id,
        title: post.title,
        body,
        author: post.author || '[deleted]',
        subreddit,
        url: `https://www.reddit.com${post.permalink}`,
        score: post.score || 0,
        num_comments: post.num_comments || 0,
        matched_keyword: keyword,
        relevance_score: relevance,
        reddit_created_at: new Date(post.created_utc * 1000).toISOString(),
        status: 'new' as const,
      }
    })
}

async function searchSubredditJson(
  subredditName: string,
  keyword: string,
): Promise<RedditPost[]> {
  const query = encodeURIComponent(keyword)
  const sub = encodeURIComponent(subredditName)

  // Strategy 1: search.json on www.reddit.com (includes body via selftext)
  const url1 = `https://www.reddit.com/r/${sub}/search.json?q=${query}&restrict_sr=1&sort=new&t=day&limit=25`
  console.log(`[Reddit] [JSON] Strategy 1: search.json — r/${subredditName} for "${keyword}"`)

  try {
    const res1 = await rateLimitedFetch(url1)
    if (res1.ok) {
      const data = await res1.json() as RedditJsonResponse
      const posts = parseJsonResponse(data, keyword, subredditName)
      console.log(`[Reddit] [JSON] Strategy 1 → ${posts.length} posts after 24h filter`)
      return posts
    }
    console.log(`[Reddit] [JSON] Strategy 1 failed: ${res1.status} — trying fallback`)
  } catch (err) {
    console.error(`[Reddit] [JSON] Strategy 1 error:`, err)
  }

  // Wait before fallback (rate limit)
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Strategy 2: new.json fallback + client-side keyword filter
  const url2 = `https://www.reddit.com/r/${sub}/new.json?limit=25`
  console.log(`[Reddit] [JSON] Strategy 2: new.json + keyword filter — r/${subredditName}`)

  try {
    const res2 = await rateLimitedFetch(url2)
    if (res2.ok) {
      const data = await res2.json() as RedditJsonResponse
      const allPosts = parseJsonResponse(data, keyword, subredditName)
      console.log(`[Reddit] [JSON] Strategy 2 → ${allPosts.length} posts before keyword filter`)

      // Client-side keyword filter since /new doesn't filter by keyword
      const keywordLower = keyword.toLowerCase()
      const filtered = allPosts.filter((p) => {
        const text = `${p.title} ${p.body || ''}`.toLowerCase()
        return text.includes(keywordLower)
      })
      console.log(`[Reddit] [JSON] Strategy 2 → ${filtered.length} posts after keyword filter "${keyword}"`)
      return filtered
    }
    console.log(`[Reddit] [JSON] Strategy 2 failed: ${res2.status}`)
  } catch (err) {
    console.error(`[Reddit] [JSON] Strategy 2 error:`, err)
  }

  console.error(`[Reddit] [JSON] All strategies failed for r/${subredditName} + "${keyword}"`)
  return []
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
      post.subreddit.display_name,
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
 * Uses snoowrap if API credentials are available, otherwise public JSON endpoints with fallback.
 */
export async function searchSubreddit(
  subredditName: string,
  keyword: string,
): Promise<RedditPost[]> {
  const mode = hasOfficialApiCredentials() ? 'snoowrap' : 'json'
  console.log(`[Reddit] searchSubreddit("${subredditName}", "${keyword}") — mode: ${mode}`)

  try {
    if (mode === 'snoowrap') {
      return await searchSubredditSnoowrap(subredditName, keyword)
    }
    return await searchSubredditJson(subredditName, keyword)
  } catch (err) {
    console.error(`[Reddit] searchSubreddit failed for r/${subredditName} + "${keyword}":`, err)
    return []
  }
}
