// Page Analytics — stats and charts with premium dark theme matching landing page

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Search, Reply, TrendingUp, RefreshCw } from 'lucide-react'

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

  // Fetch stats in parallel
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

  // Response rate
  const responseRate = totalPosts ? Math.round(((repliedPosts ?? 0) / totalPosts) * 100) : 0

  // Top keywords by post count
  const keywordCounts: Record<string, number> = {}
  topKeywords?.forEach((p) => {
    keywordCounts[p.matched_keyword] = (keywordCounts[p.matched_keyword] || 0) + 1
  })
  const sortedKeywords = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Posts per day (last 7 days)
  const postsPerDay: Record<string, number> = {}
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    postsPerDay[key] = 0
  }
  recentPosts?.forEach((p) => {
    const date = new Date(p.found_at)
    const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (postsPerDay[key] !== undefined) {
      postsPerDay[key]++
    }
  })

  const maxPostsPerDay = Math.max(...Object.values(postsPerDay), 1)

  /* ── Style constants (landing page match) ── */
  const cardStyle: React.CSSProperties = {
    background: '#131316',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 30px 80px rgba(0,0,0,.6), 0 0 120px rgba(29,158,117,0.08)',
  }

  const kpis = [
    { label: 'Posts Found', value: totalPosts ?? 0, icon: Search, color: '#1D9E75' },
    { label: 'Replies Sent', value: repliedPosts ?? 0, icon: Reply, color: '#1D9E75' },
    { label: 'Response Rate', value: `${responseRate}%`, icon: TrendingUp, color: responseRate > 50 ? '#34d399' : '#f59e0b' },
    { label: 'Scans Completed', value: totalScans ?? 0, icon: RefreshCw, color: '#1D9E75' },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div className="animate-fade-in-up" style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.15,
            color: '#fafafa',
            margin: 0,
          }}
        >
          Analytics
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '.88rem', marginTop: 4 }}>
          {project.name} — Performance overview
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div
        className="animate-fade-in-up"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 28,
          animationDelay: '0.05s',
        }}
      >
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{ ...cardStyle, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '.78rem', color: '#a1a1aa', fontWeight: 500 }}>{kpi.label}</span>
              <kpi.icon size={15} style={{ color: '#52525b' }} />
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '1.8rem',
                fontWeight: 800,
                color: '#fafafa',
                letterSpacing: '-0.03em',
              }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div
        className="animate-fade-in-up"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 14,
          animationDelay: '0.1s',
        }}
      >
        {/* ── Bar Chart — Posts per day ── */}
        <div style={{ ...cardStyle, padding: '24px' }}>
          <h2 style={{ fontWeight: 700, fontSize: '.92rem', color: '#fafafa', marginBottom: 20 }}>
            Posts Found (Last 7 Days)
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
            {Object.entries(postsPerDay).map(([day, count]) => (
              <div
                key={day}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '.72rem',
                    fontWeight: 600,
                    color: '#fafafa',
                  }}
                >
                  {count}
                </span>
                <div
                  style={{
                    width: '100%',
                    borderRadius: '6px 6px 0 0',
                    background: count > 0
                      ? 'linear-gradient(to top, #1D9E75, #34d399)'
                      : 'rgba(255,255,255,0.04)',
                    height: `${Math.max((count / maxPostsPerDay) * 120, 4)}px`,
                    transition: 'height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
                <span style={{ fontSize: '.68rem', color: '#52525b' }}>{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top Keywords ── */}
        <div style={{ ...cardStyle, padding: '24px' }}>
          <h2 style={{ fontWeight: 700, fontSize: '.92rem', color: '#fafafa', marginBottom: 20 }}>
            Top Keywords
          </h2>
          {sortedKeywords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Search size={32} style={{ color: '#52525b', margin: '0 auto 12px' }} />
              <p style={{ color: '#52525b', fontSize: '.82rem' }}>No data yet. Run a scan first!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sortedKeywords.map(([keyword, count]) => {
                const percentage = totalPosts ? Math.round((count / totalPosts) * 100) : 0
                return (
                  <div key={keyword}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: '.85rem', fontWeight: 600, color: '#fafafa' }}>{keyword}</span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '.75rem',
                          color: '#a1a1aa',
                        }}
                      >
                        {count} posts ({percentage}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        width: '100%',
                        borderRadius: 100,
                        background: 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <div
                        style={{
                          height: 6,
                          borderRadius: 100,
                          background: 'linear-gradient(to right, #1D9E75, #34d399)',
                          width: `${Math.max(percentage, 2)}%`,
                          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
