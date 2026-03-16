// Types TypeScript partagés pour l'ensemble de l'application RedditLeads

export type Plan = 'free' | 'pro' | 'business'

export type PostStatus = 'new' | 'replied' | 'skipped' | 'saved'

export type ScanStatus = 'running' | 'completed' | 'failed'

export interface User {
  id: string
  email: string
  full_name: string | null
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  url: string | null
  description: string | null
  is_active: boolean
  created_at: string
}

export interface Keyword {
  id: string
  project_id: string
  keyword: string
  is_active: boolean
  created_at: string
}

export interface Subreddit {
  id: string
  project_id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface Post {
  id: string
  project_id: string
  reddit_id: string
  title: string
  body: string | null
  author: string
  subreddit: string
  url: string
  score: number
  num_comments: number
  matched_keyword: string
  relevance_score: number | null
  status: PostStatus
  reddit_created_at: string
  found_at: string
}

export interface Reply {
  id: string
  post_id: string
  user_id: string
  content: string
  template_id: string | null
  is_sent: boolean
  sent_at: string | null
  tracking_clicks: number
  created_at: string
}

export interface Template {
  id: string
  project_id: string
  name: string
  content: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Scan {
  id: string
  project_id: string
  status: ScanStatus
  posts_found: number
  started_at: string
  completed_at: string | null
}
