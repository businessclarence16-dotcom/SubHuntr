// Composant client de la landing page SubHuntr — toute l'interactivité (demo feed, FAQ, billing toggle, etc.)

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import '@/app/landing.css'

const DEMO_POSTS = [
  { score: 9, cls: 's9', title: 'Best CRM for a small B2B SaaS? Salesforce is overkill', sub: 'r/SaaS', time: 'just now', comments: 14, comp: 'Salesforce', tip: 'Hey! I built [YOUR PRODUCT] specifically for small B2B teams who find Salesforce too heavy...' },
  { score: 8, cls: 's8', title: "Looking for a Mailchimp alternative that doesn't cost $300/mo", sub: 'r/Entrepreneur', time: '1m', comments: 31, comp: 'Mailchimp', tip: 'We switched from Mailchimp 6 months ago to [YOUR PRODUCT]. Cut our costs by 60% and...' },
  { score: 9, cls: 's9', title: 'What project management tool do you actually use daily?', sub: 'r/startups', time: '2m', comments: 48, comp: null, tip: 'Been using [YOUR PRODUCT] daily for 8 months. The thing I love most is...' },
  { score: 7, cls: 's7', title: 'Switched from HubSpot — need email marketing recommendations', sub: 'r/SaaS', time: '4m', comments: 19, comp: 'HubSpot', tip: 'I made the same switch! Ended up going with [YOUR PRODUCT] because...' },
  { score: 8, cls: 's8', title: 'Any good Intercom alternatives for a bootstrapped startup?', sub: 'r/SaaS', time: '1m', comments: 27, comp: 'Intercom', tip: "Check out [YOUR PRODUCT] — we're a bootstrapped team too and it's been..." },
  { score: 9, cls: 's9', title: 'Recommend a simple invoicing tool? FreshBooks is too complex', sub: 'r/smallbusiness', time: '2m', comments: 33, comp: 'FreshBooks', tip: 'I had the exact same frustration. Tried [YOUR PRODUCT] and the setup took...' },
  { score: 7, cls: 's7', title: 'Best analytics tool that respects privacy? GA4 is terrible', sub: 'r/webdev', time: '4m', comments: 56, comp: 'Google Analytics', tip: 'We ditched GA4 last year for [YOUR PRODUCT]. Privacy-first, way simpler dashboard...' },
  { score: 8, cls: 's8', title: "Need a Notion alternative — it's become too bloated", sub: 'r/Entrepreneur', time: '3m', comments: 41, comp: 'Notion', tip: 'I felt the same about Notion. Moved our team to [YOUR PRODUCT] and productivity...' },
]

const MONTHLY_PRICES = [29, 79, 199]
const ANNUAL_PRICES = [23, 63, 159]
const ANNUAL_TOTALS = ['$276', '$756', '$1,908']

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.5 5.5l-1-1L7 8l-1.5-1.5-1 1L7 10l4.5-4.5z" />
    </svg>
  )
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [spVisible, setSpVisible] = useState(false)
  const [spDismissed, setSpDismissed] = useState(false)

  // Demo feed state
  const [feedBadge, setFeedBadge] = useState(3)
  const [kpiPosts, setKpiPosts] = useState(47)
  const [demoPosts, setDemoPosts] = useState<Array<{ post: typeof DEMO_POSTS[0]; id: number; visible: boolean; entering: boolean }>>([])
  const postIndexRef = useRef(4)
  const idCounterRef = useRef(0)
  const [showToast, setShowToast] = useState(false)
  const demoRef = useRef<HTMLDivElement>(null)
  const demoInitializedRef = useRef(false)

  // Reveal on scroll
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('vis')
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )
    document.querySelectorAll('.landing .rv').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // Social proof banner
  useEffect(() => {
    const timer = setTimeout(() => setSpVisible(true), 4000)
    return () => { clearTimeout(timer) }
  }, [])

  // Demo feed — init + interval
  const addPost = useCallback(() => {
    const idx = postIndexRef.current % DEMO_POSTS.length
    postIndexRef.current++
    const id = ++idCounterRef.current

    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
    setFeedBadge((b) => b + 1)
    setKpiPosts((k) => k + 1)

    setDemoPosts((prev) => {
      const newPost = { post: DEMO_POSTS[idx], id, visible: false, entering: true }
      const next = [newPost, ...prev].slice(0, 5)
      return next
    })

    setTimeout(() => {
      setDemoPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, visible: true, entering: false } : p))
      )
    }, 600)
  }, [])

  useEffect(() => {
    if (!demoRef.current) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !demoInitializedRef.current) {
          demoInitializedRef.current = true
          // Init with first 4 posts
          const initial = DEMO_POSTS.slice(0, 4).map((post, i) => {
            const id = ++idCounterRef.current
            return { post, id, visible: false, entering: false }
          })
          setDemoPosts(initial)
          // Stagger visibility
          initial.forEach((item, i) => {
            setTimeout(() => {
              setDemoPosts((prev) =>
                prev.map((p) => (p.id === item.id ? { ...p, visible: true } : p))
              )
            }, 800 + i * 200)
          })
          // Start adding posts
          const interval = setInterval(addPost, 3500)
          return () => clearInterval(interval)
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(demoRef.current)
    return () => obs.disconnect()
  }, [addPost])

  const prices = annual ? ANNUAL_PRICES : MONTHLY_PRICES

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="landing">
      {/* NAV */}
      <nav>
        <div className="ctn">
          <Link href="/" className="logo">
            <div className="logo-mark"></div> SubHuntr
          </Link>
          <ul className="nav-links">
            <li><a href="#how" onClick={(e) => handleSmoothScroll(e, 'how')}>How it works</a></li>
            <li><a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')}>Features</a></li>
            <li><a href="#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')}>Pricing</a></li>
            <li><a href="#faq" onClick={(e) => handleSmoothScroll(e, 'faq')}>FAQ</a></li>
          </ul>
          <div className="nav-r">
            <Link href="/login" className="nav-login">Log in</Link>
            <Link href="/signup" className="nav-cta">Start free trial</Link>
          </div>
          <button
            className="mob-tog"
            aria-label="Menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h14M3 10h14M3 14h14" /></svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div className={`mob-overlay${menuOpen ? ' open' : ''}`}>
        <button className="mob-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>
        <a href="#how" className="mob-link" onClick={(e) => handleSmoothScroll(e, 'how')}>How it works</a>
        <a href="#features" className="mob-link" onClick={(e) => handleSmoothScroll(e, 'features')}>Features</a>
        <a href="#pricing" className="mob-link" onClick={(e) => handleSmoothScroll(e, 'pricing')}>Pricing</a>
        <a href="#faq" className="mob-link" onClick={(e) => handleSmoothScroll(e, 'faq')}>FAQ</a>
        <Link href="/login" className="mob-login" onClick={() => setMenuOpen(false)}>Log in</Link>
        <Link href="/signup" className="mob-cta" onClick={() => setMenuOpen(false)}>Start free trial</Link>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"><div className="hero-grad"></div><div className="hero-lines"></div></div>
        <div className="ctn">
          <div className="urg"><span className="dot"></span> <span>GummySearch is dead. Their 2,000+ users need a new home.</span></div>
          <h1>Someone on Reddit just asked<br />for a tool like yours.<br /><span className="gr">Will you answer — or your competitor?</span></h1>
          <p className="hero-desc">SubHuntr scans subreddits every 2 minutes for high-intent buyers. Every post is <strong>scored 1–10</strong>. You get alerted instantly. You reply first. <strong>You close.</strong></p>
          <div className="hero-act">
            <Link href="/signup" className="btn-p">
              Start hunting leads — free for 7 days{' '}
              <svg className="arrow" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7.5h9M8.5 3.5l4 4-4 4" /></svg>
            </Link>
            <a href="#how" className="btn-g" onClick={(e) => handleSmoothScroll(e, 'how')}>See it in action</a>
          </div>
          <div className="hero-meta">Credit card required · Cancel anytime · 3-min setup</div>
          <div className="trust-b">
            <span className="tb"><CheckIcon /> Real-time Reddit data</span>
            <span className="tb"><CheckIcon /> No fake votes or bots</span>
            <span className="tb"><CheckIcon /> Setup in 3 minutes</span>
            <span className="tb"><CheckIcon /> 52+ templates</span>
          </div>

          {/* DEMO */}
          <div className="hero-demo" ref={demoRef}>
            <div className="demo-w">
              <div className="demo-bar">
                <div className="demo-dots"><span className="demo-dot"></span><span className="demo-dot"></span><span className="demo-dot"></span></div>
                <div className="demo-url">app.subhuntr.com</div>
              </div>
              <div className="demo-body">
                <div className="demo-sb">
                  <div className="demo-sb-l">Monitor</div>
                  <div className="demo-sb-i act"><span className="ico">◉</span> Feed <span className="demo-bdg">{feedBadge}</span></div>
                  <div className="demo-sb-i"><span className="ico">⌕</span> Keywords</div>
                  <div className="demo-sb-i"><span className="ico">▣</span> Subreddits</div>
                  <div className="demo-sb-l">Tools</div>
                  <div className="demo-sb-i"><span className="ico">⎘</span> Templates</div>
                  <div className="demo-sb-i"><span className="ico">⌗</span> Analytics</div>
                  <div className="demo-sb-l">Account</div>
                  <div className="demo-sb-i"><span className="ico">⚙</span> Settings</div>
                  <div className="demo-sb-i"><span className="ico">⊡</span> Billing</div>
                </div>
                <div className="demo-feed">
                  <div className="demo-fh">
                    <div className="demo-ft">Lead Feed</div>
                    <div className="demo-ff">
                      <span className="demo-fi act">All</span>
                      <span className="demo-fi">High-intent</span>
                      <span className="demo-fi">Unread</span>
                    </div>
                  </div>
                  <div className="demo-kpi">
                    <div><strong>{kpiPosts}</strong> today</div>
                    <div><strong>12</strong> high-intent</div>
                    <div><strong>8</strong> unread</div>
                  </div>
                  <div className="demo-posts">
                    <div className={`demo-toast${showToast ? ' show' : ''}`}>↑ New high-intent lead</div>
                    {demoPosts.map((item) => (
                      <div
                        key={item.id}
                        className={`demo-post${item.visible ? ' visible' : ''}${item.entering ? ' entering' : ''}`}
                      >
                        <div className="demo-tip">
                          <div className="demo-tip-h">📝 Template preview</div>
                          <div className="demo-tip-txt">&quot;{item.post.tip}&quot;</div>
                        </div>
                        <div className={`demo-sc ${item.post.cls}`}>{item.post.score}</div>
                        <div className="demo-post-b">
                          <div className="demo-post-t">{item.post.title}</div>
                          <div className="demo-post-m">
                            <span className="sub">{item.post.sub}</span>
                            <span>{item.post.time === 'just now' ? 'just now' : `${item.post.time} ago`}</span>
                            <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '1px 6px', borderRadius: '9px', fontSize: '0.55rem', fontWeight: 600 }}>{'\uD83D\uDD25'} Just posted</span>
                            <span>{item.post.comments} comments</span>
                            {item.post.comp && <span className="comp">{item.post.comp}</span>}
                          </div>
                        </div>
                        <button className="demo-post-btn">Reply</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="sec ba" id="ba">
        <div className="ctn">
          <div className="ba-header">
            <div className="slbl green rv">Before vs After</div>
            <div className="stl rv">Stop searching manually.<br />Start closing automatically.</div>
            <p className="sdsc rv">See how SubHuntr transforms your Reddit lead generation workflow.</p>
          </div>
          <div className="ba-grid rv">
            <div className="ba-card before">
              <div className="ba-label"><span>✗</span> Without SubHuntr</div>
              <ul className="ba-list">
                <li><span className="icon">✗</span> 30 min/day manually searching Reddit</li>
                <li><span className="icon">✗</span> Miss 90% of relevant posts</li>
                <li><span className="icon">✗</span> Reply hours or days too late</li>
                <li><span className="icon">✗</span> No idea which posts are worth replying to</li>
                <li><span className="icon">✗</span> Can&apos;t track if replies drive results</li>
              </ul>
            </div>
            <div className="ba-arrow">→</div>
            <div className="ba-card after">
              <div className="ba-label"><span>✓</span> With SubHuntr</div>
              <ul className="ba-list">
                <li><span className="icon">✓</span> Automatic 24/7 monitoring — zero effort</li>
                <li><span className="icon">✓</span> Every relevant post caught in real time</li>
                <li><span className="icon">✓</span> Alerts within minutes — reply first</li>
                <li><span className="icon">✓</span> AI scores 1–10 so you focus on hot leads</li>
                <li><span className="icon">✓</span> UTM tracking proves ROI per reply</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN + HOW */}
      <section className="sec ph" id="how">
        <div className="ctn">
          <div className="ph-top rv">
            <div className="slbl red">The problem</div>
            <div className="stl">Right now, someone is asking Reddit<br />for an alternative to your competitor</div>
            <p className="sdsc">They&apos;ll get 30 replies in 2 hours. None will be from you — because you didn&apos;t know the post existed.</p>
            <div className="pain-g">
              <div className="pain-c"><div className="pain-n">2.5M+</div><h3>&quot;Best tool for...&quot; posts/month</h3><p>People declaring buying intent — begging to be sold to.</p></div>
              <div className="pain-c"><div className="pain-n">73%</div><h3>Go unanswered by companies</h3><p>First reply wins. Most companies show up too late.</p></div>
              <div className="pain-c"><div className="pain-n">$0.18</div><h3>CPC vs $8+ on LinkedIn</h3><p>One reply beats a $500 ad campaign.</p></div>
            </div>
          </div>
          <div className="flow-arr rv">↓</div>
          <div className="how-f">
            <div className="how-l">
              <div className="slbl green rv">The solution</div>
              <div className="stl rv">3 minutes to set up.<br />Leads while you sleep.</div>
              <p className="sdsc rv">Tell SubHuntr what you sell. We monitor Reddit 24/7 and alert you instantly.</p>
            </div>
            <div className="how-r">
              <div className="step rv"><div className="step-n">01</div><h3>Paste your URL — we figure out the rest</h3><p>Auto-detects your product, suggests competitors. No forms, no config.</p><span className="step-tag">~30s</span></div>
              <div className="step rv"><div className="step-n">02</div><h3>Pick your hunting grounds</h3><p>High-intent keywords + target subreddits. We suggest both.</p><span className="step-tag">~1 min</span></div>
              <div className="step rv"><div className="step-n">03</div><h3>Get alerted. Reply first. Close.</h3><p>Score 7+? Instant alert via email, Slack, or Discord. Pick a template, post — done.</p><span className="step-tag">Every 2–15 min</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="sec feat-s" id="features">
        <div className="ctn">
          <div className="feat-hd">
            <div className="slbl green rv">Features</div>
            <div className="stl rv">Built to make Reddit<br />your unfair advantage</div>
            <p className="sdsc rv">No bots. No fake upvotes. Just speed, scoring, and templates that convert.</p>
          </div>
          <div className="feat-g rv">
            <div className="ft w"><div className="ft-ico">📡</div><h3>Real-time monitoring</h3><p>Scans every 2–15 min. Reddit official API + RSS fallback.</p><span className="ft-tag">Core</span></div>
            <div className="ft"><div className="ft-ico">🧠</div><h3>AI intent scoring</h3><p>Every post scored 1–10. Filter for 7+ to find ready buyers.</p><span className="ft-tag">Core</span></div>
            <div className="ft"><div className="ft-ico">📝</div><h3>52+ reply templates</h3><p>Alternative, Reco, Story, Advice. Auto-fills your product info.</p><span className="ft-tag">Core</span></div>
            <div className="ft"><div className="ft-ico">🔔</div><h3>Alerts everywhere</h3><p>Email, Slack, Discord, webhooks. Score thresholds per channel.</p><span className="ft-tag">Growth+</span></div>
            <div className="ft"><div className="ft-ico">📊</div><h3>Analytics + competitor intel</h3><p>UTM tracking. Reddit CPC vs ads. Competitor sentiment — strike when users complain.</p><span className="ft-tag">Growth+</span></div>
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section className="sec proof" id="proof">
        <div className="ctn">
          <div className="proof-hd">
            <div className="slbl green rv">Proof</div>
            <div className="stl rv">They replied first. They closed.</div>
            <p className="sdsc rv">Real results from early access users.</p>
          </div>
          <div className="tg">
            <div className="tc rv">
              <div className="tc-res">3 customers</div><div className="tc-rl">In the first 7 days</div>
              <div className="tc-txt">&quot;I used to spend 30 min every morning manually searching Reddit. SubHuntr replaced all of that. Closed 3 paying users in week one.&quot;</div>
              <div className="tc-a"><div className="tc-av" style={{ background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" fill="#52525b" viewBox="0 0 16 16"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z"/></svg></div><div><div className="tc-nm">Founder of a B2B CRM</div><div className="tc-ro">Early access user</div></div></div>
            </div>
            <div className="tc rv">
              <div className="tc-res">12x cheaper</div><div className="tc-rl">Than Google Ads CPA</div>
              <div className="tc-txt">&quot;CPA from Reddit: $6.40. Google Ads: $78. We shifted 40% of our paid budget to SubHuntr.&quot;</div>
              <div className="tc-a"><div className="tc-av" style={{ background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" fill="#52525b" viewBox="0 0 16 16"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z"/></svg></div><div><div className="tc-nm">Head of Growth at a SaaS startup</div><div className="tc-ro">Early access user</div></div></div>
            </div>
            <div className="tc rv">
              <div className="tc-res">47 leads/wk</div><div className="tc-rl">High-intent (score 7+)</div>
              <div className="tc-txt">&quot;Every time someone complains about Intercom, I get an alert. Like having a sales rep on Reddit 24/7.&quot;</div>
              <div className="tc-a"><div className="tc-av" style={{ background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" fill="#52525b" viewBox="0 0 16 16"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z"/></svg></div><div><div className="tc-nm">Solo founder, developer tools</div><div className="tc-ro">Early access user</div></div></div>
            </div>
          </div>
          <div className="comp-lbl rv">How we compare to alternatives</div>
          <table className="ct rv">
            <thead><tr><th></th><th>SubHuntr</th><th>Launch Club</th><th>Redreach</th></tr></thead>
            <tbody>
              <tr><td>Starting price</td><td className="y">$29/mo</td><td>$199-499/mo</td><td>$19/mo</td></tr>
              <tr><td>Self-service</td><td className="y">✓</td><td className="n">✗</td><td className="y">✓</td></tr>
              <tr><td>AI intent scoring</td><td className="y">✓</td><td className="n">✗</td><td className="n">✗</td></tr>
              <tr><td>Competitor tracking</td><td className="y">✓</td><td className="y">✓</td><td className="n">✗</td></tr>
              <tr><td>52+ templates</td><td className="y">✓</td><td className="n">✗</td><td className="n">✗</td></tr>
              <tr><td>UTM tracking</td><td className="y">✓</td><td className="n">✗</td><td className="n">✗</td></tr>
              <tr><td>Ethical / no fake votes</td><td className="y">✓</td><td className="n">✗</td><td className="y">✓</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* PRICING */}
      <section className="sec pricing" id="pricing">
        <div className="ctn">
          <div className="pr-hd">
            <div className="slbl green rv">Pricing</div>
            <div className="stl rv">One Reddit reply can pay<br />for a full year of SubHuntr</div>
          </div>
          <p className="pr-desc rv">7-day free trial on Starter. Upgrade anytime. Cancel anytime.</p>
          <div className="pr-tog rv">
            <span>Monthly</span>
            <div className={`tog${annual ? ' on' : ''}`} onClick={() => setAnnual(!annual)}></div>
            <span>Annual</span>
            <span className="pr-save">-20%</span>
          </div>
          <div className="pr-grid">
            <div className="plan rv">
              <div className="pn">Starter</div>
              <div className="ps">Solo founders testing the waters</div>
              <div className="pp"><span className="c">$</span><span className="pv">{prices[0]}</span><span className="p">/mo</span></div>
              <div className="pa" style={{ display: annual ? 'block' : 'none' }}>Billed {ANNUAL_TOTALS[0]}/year</div>
              <Link href="/signup?plan=starter" className="pc">Start 7-day free trial</Link>
              <ul className="pl">
                <li>5 keywords</li>
                <li>15 subreddits</li>
                <li>15-min scan</li>
                <li>1 project</li>
                <li>Email alerts</li>
                <li className="off">Slack / Discord</li>
                <li className="off">Competitor tracking</li>
                <li className="off">Analytics</li>
                <li className="off">CSV export</li>
              </ul>
            </div>
            <div className="plan pop rv">
              <div className="plan-badge">Most popular</div>
              <div className="pn">Growth</div>
              <div className="ps">Teams serious about Reddit leads</div>
              <div className="pp"><span className="c">$</span><span className="pv">{prices[1]}</span><span className="p">/mo</span></div>
              <div className="pa" style={{ display: annual ? 'block' : 'none' }}>Billed {ANNUAL_TOTALS[1]}/year</div>
              <Link href="/signup?plan=growth" className="pc">Subscribe — ${prices[1]}/mo</Link>
              <ul className="pl">
                <li>25 keywords</li>
                <li>75 subreddits</li>
                <li>5-min scan</li>
                <li>3 projects</li>
                <li>Slack + Discord</li>
                <li>Competitor tracking</li>
                <li>Analytics</li>
                <li className="off">CSV export</li>
                <li className="off">Priority support</li>
              </ul>
            </div>
            <div className="plan rv">
              <div className="pn">Agency</div>
              <div className="ps">Agencies managing multiple clients</div>
              <div className="pp"><span className="c">$</span><span className="pv">{prices[2]}</span><span className="p">/mo</span></div>
              <div className="pa" style={{ display: annual ? 'block' : 'none' }}>Billed {ANNUAL_TOTALS[2]}/year</div>
              <Link href="/signup?plan=agency" className="pc">Subscribe — ${prices[2]}/mo</Link>
              <ul className="pl">
                <li>Unlimited keywords</li>
                <li>Unlimited subreddits</li>
                <li>2-min scan</li>
                <li>10 projects</li>
                <li>Everything in Growth</li>
                <li>CSV export</li>
                <li>Priority support</li>
              </ul>
            </div>
            <div className="plan rv">
              <div className="pn">Enterprise</div>
              <div className="ps">For large teams with custom needs</div>
              <div className="pp" style={{ fontSize: '2.2rem' }}>Custom</div>
              <div style={{ marginBottom: 22 }}></div>
              <a href="mailto:contact@subhuntr.com" className="pc">Contact sales</a>
              <ul className="pl">
                <li>Unlimited everything</li>
                <li>Real-time scanning (1 min)</li>
                <li>API access</li>
                <li>Dedicated support</li>
                <li>Custom integrations</li>
                <li>SLA guarantee</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec faq" id="faq">
        <div className="ctn">
          <div className="faq-hd">
            <div className="slbl green rv">FAQ</div>
            <div className="stl rv">Quick answers</div>
          </div>
          <div className="faq-list">
            {[
              { q: 'Does SubHuntr post on Reddit for me?', a: 'No. We find and score posts. You reply using our 52+ templates. Authentic replies convert better and won\'t get your account banned.' },
              { q: 'Does this violate Reddit\'s Terms of Service?', a: 'No. We use Reddit\'s official API and public RSS feeds. We never automate posting, voting, or any action on your behalf.' },
              { q: 'What\'s included in the free trial?', a: 'Full access for 7 days. Credit card required. Cancel before the trial ends — you won\'t be charged.' },
              { q: 'How is this different from Launch Club?', a: 'Launch Club ($199-499/mo) uses fake accounts and vote manipulation. SubHuntr is self-service, ethical, and starts at $29/mo.' },
            ].map((faq, i) => (
              <div key={i} className={`faq-i rv${openFaq === i ? ' open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="faq-q">
                  <span>{faq.q}</span>
                  <svg className="faq-ch" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4" /></svg>
                </div>
                <div className="faq-a">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final">
        <div className="final-gl"></div>
        <div className="ctn">
          <h2 className="rv">While you read this page,<br /><span className="gr">12 people asked Reddit for your product.</span></h2>
          <p className="rv">Stop letting competitors answer first.</p>
          <Link href="/signup" className="btn-p rv" style={{ padding: '13px 32px', fontSize: '.95rem' }}>
            Start hunting — 7 days free{' '}
            <svg className="arrow" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </Link>
          <div className="final-urg rv"><strong>GummySearch</strong> shut down Nov 2025. Their users need a new tool. Be ready.</div>
        </div>
      </section>

      {/* SOCIAL PROOF BANNER */}
      {!spDismissed && (
        <div className={`sp-banner${spVisible ? ' show' : ''}`}>
          <span className="sp-dot"></span>
          <span>Monitoring <span className="sp-num">2.5M+</span> Reddit posts monthly</span>
          <button className="sp-close" onClick={() => setSpDismissed(true)} aria-label="Close">×</button>
        </div>
      )}

      {/* FOOTER */}
      <footer>
        <div className="ctn">
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <Link href="/" className="logo" style={{ fontSize: '.85rem' }}>
              <div className="logo-mark" style={{ width: '20px', height: '20px' }}></div> SubHuntr
            </Link>
            <ul className="fl">
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="fc">© 2026 SubHuntr</div>
        </div>
      </footer>
    </div>
  )
}
