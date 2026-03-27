// Client Reddit — utilise l'API officielle (snoowrap) si les clés sont disponibles,
// sinon les flux RSS publics de Reddit (les endpoints JSON sont bloqués depuis les IP cloud).
// Ordre de fallback RSS : www search → old.reddit search → old.reddit /new + filtre côté code.

import Snoowrap from 'snoowrap'
import { XMLParser } from 'fast-xml-parser'

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

async function rateLimitedFetch(url: string, accept = 'text/xml'): Promise<Response> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < 2000) {
    const waitMs = 2000 - elapsed
    console.log(`[Reddit] Rate limit: waiting ${waitMs}ms before next request`)
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
  lastRequestTime = Date.now()

  console.log(`[Reddit] Fetching: ${url}`)

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SubHuntr/1.0 (by /u/SubHuntr)',
      'Accept': accept,
    },
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

const WEAK_INTENT_PHRASES = [
  ' vs ', 'versus', 'compared to', 'comparison',
  'difference between',
  'is it good', 'is it worth', 'thoughts on',
  'review of', 'experience with', 'opinion on',
  'pros and cons', 'advantages of',
]

function calculateRelevanceScore(
  title: string,
  body: string | null,
  keyword: string,
  createdUtc: number,
  numComments: number,
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
  if (STRONG_INTENT_PHRASES.some((p) => titleLower.includes(p))) {
    score += 5
  } else if (MEDIUM_INTENT_PHRASES.some((p) => titleLower.includes(p))) {
    score += 3
  } else if (WEAK_INTENT_PHRASES.some((p) => titleLower.includes(p))) {
    score += 2
  }

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

  // 5. Freshness — light bonus (+0-1 point), NOT the main factor
  const ageInHours = (Date.now() / 1000 - createdUtc) / 3600
  if (ageInHours < 2) {
    score += 1
  } else if (ageInHours < 6) {
    score += 0.5
  }

  // 6. Engagement — light bonus (+0-0.5 points)
  if (numComments >= 10) {
    score += 0.5
  }

  return Math.max(1, Math.min(10, Math.round(score)))
}

// ---------- RSS parser ----------

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

interface RssEntry {
  title?: string
  link?: { '@_href'?: string } | { '@_href'?: string }[]
  updated?: string
  id?: string
  author?: { name?: string } | { uri?: string; name?: string }
  content?: string
}

/** Strip HTML tags to get plain text */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Extract Reddit ID from RSS <id> tag (format: t3_xxxxx or full URL) */
function extractRedditId(idStr: string): string {
  // Format: "t3_abc123" or full URL like "https://www.reddit.com/r/.../comments/abc123/..."
  const t3Match = idStr.match(/t3_(\w+)/)
  if (t3Match) return t3Match[1]
  const urlMatch = idStr.match(/\/comments\/(\w+)/)
  if (urlMatch) return urlMatch[1]
  return idStr
}

/** Extract author name from RSS author field (format: "/u/username") */
function extractAuthor(author: RssEntry['author']): string {
  if (!author) return '[deleted]'
  const name = typeof author === 'object' ? (author.name || '') : String(author)
  return name.replace(/^\/u\//, '') || '[deleted]'
}

/** Extract subreddit name from a Reddit URL */
function extractSubredditFromUrl(url: string): string {
  const match = url.match(/\/r\/([^/]+)/)
  return match ? match[1] : ''
}

/** Extract link href from RSS entry (can be object or array) */
function extractLink(link: RssEntry['link']): string {
  if (!link) return ''
  if (Array.isArray(link)) {
    const alt = link.find((l) => l['@_href']?.includes('/comments/'))
    return alt?.['@_href'] || link[0]?.['@_href'] || ''
  }
  return link['@_href'] || ''
}

function parseRssEntries(xmlText: string): RssEntry[] {
  try {
    const parsed = xmlParser.parse(xmlText)
    const feed = parsed?.feed
    if (!feed?.entry) {
      console.log(`[Reddit] RSS: no entries found in feed`)
      return []
    }
    // entry can be a single object or an array
    const entries: RssEntry[] = Array.isArray(feed.entry) ? feed.entry : [feed.entry]
    return entries
  } catch (err) {
    console.error(`[Reddit] RSS parse error:`, err)
    return []
  }
}

function rssEntriesToPosts(
  entries: RssEntry[],
  keyword: string,
  subredditName: string,
): RedditPost[] {
  const oneDayAgo = Date.now() / 1000 - 86400

  const posts: RedditPost[] = []
  for (const entry of entries) {
    const title = typeof entry.title === 'string' ? entry.title : ''
    const url = extractLink(entry.link)
    const updatedStr = typeof entry.updated === 'string' ? entry.updated : ''
    const createdUtc = updatedStr ? new Date(updatedStr).getTime() / 1000 : 0

    // 24h freshness filter
    if (createdUtc < oneDayAgo) continue

    const idStr = typeof entry.id === 'string' ? entry.id : url
    const redditId = extractRedditId(idStr)
    const body = typeof entry.content === 'string' ? stripHtml(entry.content) : null
    const author = extractAuthor(entry.author)
    const subreddit = extractSubredditFromUrl(url) || subredditName

    // RSS doesn't provide score/comments, so default to 0
    const relevance = calculateRelevanceScore(title, body, keyword, createdUtc, 0)

    posts.push({
      reddit_id: redditId,
      title,
      body,
      author,
      subreddit,
      url: url.startsWith('http') ? url : `https://www.reddit.com${url}`,
      score: 0,
      num_comments: 0,
      matched_keyword: keyword,
      relevance_score: relevance,
      reddit_created_at: new Date(createdUtc * 1000).toISOString(),
      status: 'new',
    })
  }

  return posts
}

// ---------- RSS client with fallback chain ----------

async function searchSubredditRss(
  subredditName: string,
  keyword: string,
): Promise<RedditPost[]> {
  const query = encodeURIComponent(keyword)
  const sub = encodeURIComponent(subredditName)

  // Strategy 1: RSS search on www.reddit.com
  const url1 = `https://www.reddit.com/r/${sub}/search.rss?q=${query}&sort=new&restrict_sr=on&limit=25&t=day`
  console.log(`[Reddit] [RSS] Strategy 1: www search — r/${subredditName} for "${keyword}"`)

  try {
    const res1 = await rateLimitedFetch(url1)
    if (res1.ok) {
      const xml = await res1.text()
      console.log(`[Reddit] [RSS] Strategy 1 OK — got ${xml.length} chars`)
      const entries = parseRssEntries(xml)
      console.log(`[Reddit] [RSS] Strategy 1 parsed ${entries.length} entries`)
      if (entries.length > 0) {
        const posts = rssEntriesToPosts(entries, keyword, subredditName)
        console.log(`[Reddit] [RSS] Strategy 1 → ${posts.length} posts after 24h filter`)
        return posts
      }
      // 0 entries could mean empty results (legit) — still return empty
      return []
    }
    console.log(`[Reddit] [RSS] Strategy 1 failed: ${res1.status} — trying old.reddit.com`)
  } catch (err) {
    console.error(`[Reddit] [RSS] Strategy 1 error:`, err)
  }

  // Strategy 2: RSS search on old.reddit.com
  const url2 = `https://old.reddit.com/r/${sub}/search.rss?q=${query}&sort=new&restrict_sr=on&limit=25&t=day`
  console.log(`[Reddit] [RSS] Strategy 2: old.reddit search — r/${subredditName} for "${keyword}"`)

  try {
    const res2 = await rateLimitedFetch(url2)
    if (res2.ok) {
      const xml = await res2.text()
      console.log(`[Reddit] [RSS] Strategy 2 OK — got ${xml.length} chars`)
      const entries = parseRssEntries(xml)
      console.log(`[Reddit] [RSS] Strategy 2 parsed ${entries.length} entries`)
      if (entries.length > 0) {
        const posts = rssEntriesToPosts(entries, keyword, subredditName)
        console.log(`[Reddit] [RSS] Strategy 2 → ${posts.length} posts after 24h filter`)
        return posts
      }
      return []
    }
    console.log(`[Reddit] [RSS] Strategy 2 failed: ${res2.status} — trying /new fallback`)
  } catch (err) {
    console.error(`[Reddit] [RSS] Strategy 2 error:`, err)
  }

  // Strategy 3: RSS /new on old.reddit.com + client-side keyword filter
  const url3 = `https://old.reddit.com/r/${sub}/new.rss?limit=25`
  console.log(`[Reddit] [RSS] Strategy 3: old.reddit /new + keyword filter — r/${subredditName}`)

  try {
    const res3 = await rateLimitedFetch(url3)
    if (res3.ok) {
      const xml = await res3.text()
      console.log(`[Reddit] [RSS] Strategy 3 OK — got ${xml.length} chars`)
      const entries = parseRssEntries(xml)
      console.log(`[Reddit] [RSS] Strategy 3 parsed ${entries.length} entries`)
      const allPosts = rssEntriesToPosts(entries, keyword, subredditName)
      console.log(`[Reddit] [RSS] Strategy 3 → ${allPosts.length} posts after 24h filter`)

      // Client-side keyword filter since /new doesn't filter by keyword
      const lowerKeyword = keyword.toLowerCase()
      const filtered = allPosts.filter((p) => {
        const text = `${p.title} ${p.body || ''}`.toLowerCase()
        return text.includes(lowerKeyword)
      })
      console.log(`[Reddit] [RSS] Strategy 3 → ${filtered.length} posts after keyword filter "${keyword}"`)
      return filtered
    }
    console.log(`[Reddit] [RSS] Strategy 3 failed: ${res3.status}`)
  } catch (err) {
    console.error(`[Reddit] [RSS] Strategy 3 error:`, err)
  }

  console.error(`[Reddit] [RSS] All 3 strategies failed for r/${subredditName} + "${keyword}"`)
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
 * Uses snoowrap if API credentials are available, otherwise RSS feeds with fallback chain.
 */
export async function searchSubreddit(
  subredditName: string,
  keyword: string,
): Promise<RedditPost[]> {
  const mode = hasOfficialApiCredentials() ? 'snoowrap' : 'rss'
  console.log(`[Reddit] searchSubreddit("${subredditName}", "${keyword}") — mode: ${mode}`)

  try {
    if (mode === 'snoowrap') {
      return await searchSubredditSnoowrap(subredditName, keyword)
    }
    return await searchSubredditRss(subredditName, keyword)
  } catch (err) {
    console.error(`[Reddit] searchSubreddit failed for r/${subredditName} + "${keyword}":`, err)
    return []
  }
}
