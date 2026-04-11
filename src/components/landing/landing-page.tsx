// Composant client de la landing page SubHuntr — toute l'interactivité (demo feed, FAQ, billing toggle, etc.)

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { LogoIcon } from '@/components/layout/logo-icon'
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
const ANNUAL_PRICES = [24, 65, 165]
const ANNUAL_TOTALS = ['$288', '$780', '$1,980']

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [annual, setAnnual] = useState(false)
  const [priceSwitching, setPriceSwitching] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
            <LogoIcon size={24} /> SubHuntr
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
            className={`mob-tog${menuOpen ? ' open' : ''}`}
            aria-label="Menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div className={`mob-overlay${menuOpen ? ' open' : ''}`}>
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
          <h1>Find <span className="gr">buyers</span> on Reddit.<br />Reply before your competitors.</h1>
          <p className="hero-desc">SubHuntr scans Reddit 24/7 and scores every post by buying intent (1 to 10). Get alerted when hot leads drop. Reply with proven templates. Close before anyone else sees the post.</p>
          <div className="hero-act">
            <Link href="/signup" className="btn-p">
              Start hunting leads, free for 7 days{' '}
              <svg className="arrow" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7.5h9M8.5 3.5l4 4-4 4" /></svg>
            </Link>
            <a href="#how" className="btn-g" onClick={(e) => handleSmoothScroll(e, 'how')}>See it in action</a>
          </div>
          <div className="hero-stats">
            <strong>336</strong> posts scanned · <strong>11</strong> high-intent leads found · <strong>&lt;30s</strong> per scan
          </div>
          <p className="hero-trust">Credit card required · Cancel anytime · Setup in 3 minutes</p>

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

      {/* PROBLEM */}
      <section className="sec problem-s" id="problem">
        <div className="ctn">
          <div className="ph-top rv">
            <div className="slbl red">The problem</div>
            <div className="stl">97% of Reddit posts are noise.<br />The 3% that matter? You&apos;re missing them.</div>
            <p className="sdsc">Every day, real buyers ask Reddit for tools like yours. By the time you see the post, your competitors already replied.</p>
            <div className="pain-g">
              <div className="pain-c"><div className="pain-n">2.5M+</div><h3>Buying-intent posts per month</h3><p>People literally asking to be sold to.</p></div>
              <div className="pain-c"><div className="pain-n">73%</div><h3>Go unanswered by the right companies</h3><p>First reply wins. Most show up too late.</p></div>
              <div className="pain-c"><div className="pain-n">$0.18</div><h3>Effective CPC vs $8+ on LinkedIn Ads</h3><p>One Reddit reply beats a $500 ad campaign.</p></div>
            </div>
            <div className="ba-mini">
              <div className="ba-mini-col ba-mini-without">
                <div className="ba-mini-label">Without SubHuntr</div>
                <ul>
                  <li><span className="ba-ic ba-ic-x">✗</span>You spend 2 hours scrolling Reddit and find nothing</li>
                  <li><span className="ba-ic ba-ic-x">✗</span>You miss 90% of high intent posts</li>
                  <li><span className="ba-ic ba-ic-x">✗</span>Someone else replies first and gets the customer</li>
                </ul>
              </div>
              <div className="ba-mini-col ba-mini-with">
                <div className="ba-mini-label">With SubHuntr</div>
                <ul>
                  <li><span className="ba-ic ba-ic-v">✓</span>AI scans 14+ subreddits in under 30 seconds</li>
                  <li><span className="ba-ic ba-ic-v">✓</span>Every post scored 1 to 10 so you skip the noise</li>
                  <li><span className="ba-ic ba-ic-v">✓</span>You get notified and reply with proven templates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="sec how-s" id="how">
        <div className="ctn">
          <div className="how-hd rv">
            <div className="slbl green">How it works</div>
            <div className="stl">3 minutes to set up.<br />Leads while you sleep.</div>
            <p className="sdsc">Tell SubHuntr what you sell. We monitor Reddit and alert you instantly.</p>
          </div>
          <div className="how-grid">
            <div className="step-card rv"><div className="step-num">01</div><h3>Paste your URL, we figure out the rest</h3><p>Auto-detects your product, suggests competitors. No forms, no config.</p><span className="step-tag">~30s</span></div>
            <div className="step-card rv"><div className="step-num">02</div><h3>Pick your hunting grounds</h3><p>High-intent keywords and target subreddits. We suggest both.</p><span className="step-tag">~1 min</span></div>
            <div className="step-card rv"><div className="step-num">03</div><h3>Get alerted. Reply first. Close.</h3><p>Score 7+? Instant alert via email, Slack, or Discord. Pick a template, post, done.</p><span className="step-tag">Every 2 to 15 min</span></div>
          </div>
        </div>
      </section>

      {/* FEATURES — bento grid */}
      <section className="sec feat-s" id="features">
        <div className="ctn">
          <div className="feat-hd">
            <div className="slbl green rv">Features</div>
            <div className="stl rv">Built to make Reddit<br />your #1 acquisition channel</div>
            <p className="sdsc rv">No bots. No fake upvotes. Just speed, scoring, and templates that convert.</p>
          </div>
          <div className="bento-grid rv">
            <div className="bento-card bento-large">
              <h3>AI Intent Scoring</h3>
              <p>Every post scored 1-10. Filter for 7+ to find ready buyers instantly. No manual reading, no guessing.</p>
              <span className="bento-tag">Core</span>
            </div>
            <div className="bento-card">
              <h3>52+ Reply Templates</h3>
              <p>Alternative, Recommendation, Story, Advice. Auto-fills your product info.</p>
              <span className="bento-tag">Core</span>
            </div>
            <div className="bento-card">
              <h3>Auto-scan every 1-6h</h3>
              <p>Set your frequency per plan. Get email digests when high-intent leads drop.</p>
              <span className="bento-tag">All plans</span>
            </div>
            <div className="bento-card">
              <h3>Real-time Alerts</h3>
              <p>Email, Slack, Discord, webhooks. Set score thresholds per channel.</p>
              <span className="bento-tag">Growth+</span>
            </div>
            <div className="bento-card">
              <h3>Competitor Tracking</h3>
              <p>Monitor when users complain about rivals. Strike at the perfect moment.</p>
              <span className="bento-tag">Growth+</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section className="sec proof" id="proof">
        <div className="ctn">
          <div className="proof-hd">
            <div className="slbl green rv">Real results</div>
            <div className="stl rv">Numbers don&apos;t lie</div>
          </div>
          <div className="real-data rv">
            <div className="rd-card">
              <div className="rd-num">336</div>
              <div className="rd-desc">Posts scanned across 14 subreddits in one session</div>
            </div>
            <div className="rd-card">
              <div className="rd-num">11</div>
              <div className="rd-desc">High-intent leads found (score 7+). A 3% hit rate.</div>
            </div>
            <div className="rd-card">
              <div className="rd-num">&lt;30s</div>
              <div className="rd-desc">Average scan time for 40 keyword-subreddit combinations</div>
            </div>
          </div>
          <p className="founder-note rv">
            &ldquo;I built SubHuntr because I was spending hours on Reddit looking for people who needed my SaaS. Now it takes 30 seconds.&rdquo;
            <span className="founder-name">Loris, solo founder</span>
          </p>
          <div className="comp-hd rv">
            <h3 className="comp-title">How we compare to alternatives</h3>
            <p className="comp-sub">Transparent comparison. We show their strengths too.</p>
          </div>

          {/* Desktop table */}
          <table className="comp-tbl rv">
            <thead>
              <tr>
                <th className="comp-th-feat"></th>
                <th className="comp-th-hl"><span className="comp-th-name comp-green">SubHuntr</span><span className="comp-th-badge">✦ Best value</span></th>
                <th><span className="comp-th-name">Redreach</span></th>
                <th><span className="comp-th-name">Launch Club</span></th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Starting price</td><td className="comp-th-hl"><strong className="comp-green">$29/mo</strong></td><td>$19/mo</td><td><span className="comp-expensive">$199-499/mo</span></td></tr>
              <tr><td>Self-service</td><td className="comp-th-hl"><span className="comp-y">✓</span></td><td><span className="comp-y">✓</span></td><td><span className="comp-n">✗</span></td></tr>
              <tr><td>AI intent scoring</td><td className="comp-th-hl"><span className="comp-y">✓ (1-10)</span></td><td><span className="comp-n">✗</span></td><td><span className="comp-n">✗</span></td></tr>
              <tr><td>Reply templates</td><td className="comp-th-hl"><span className="comp-y">✓ (52+)</span></td><td><span className="comp-n">✗</span></td><td><span className="comp-n">✗</span></td></tr>
              <tr><td>Real-time alerts</td><td className="comp-th-hl"><span className="comp-y">✓</span></td><td><span className="comp-muted">Basic</span></td><td><span className="comp-n">✗</span></td></tr>
              <tr><td>Done-for-you</td><td className="comp-th-hl"><span className="comp-n">✗</span></td><td><span className="comp-n">✗</span></td><td><span className="comp-y">✓</span></td></tr>
              <tr><td>Ethical</td><td className="comp-th-hl"><span className="comp-y">✓</span></td><td><span className="comp-y">✓</span></td><td><span className="comp-n">✗</span><span className="comp-warn">Uses fake accounts</span></td></tr>
              <tr className="comp-last"><td>Competitor tracking</td><td className="comp-th-hl"><span className="comp-y">✓</span></td><td><span className="comp-n">✗</span></td><td><span className="comp-y">✓</span></td></tr>
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="comp-mob rv">
            {[
              { name: 'SubHuntr', price: '$29/mo', hl: true, rows: [['Self-service','✓'],['AI intent scoring','✓ (1-10)'],['Reply templates','✓ (52+)'],['Real-time alerts','✓'],['Done-for-you','✗'],['Ethical','✓'],['Competitor tracking','✓']] },
              { name: 'Redreach', price: '$19/mo', hl: false, rows: [['Self-service','✓'],['AI intent scoring','✗'],['Reply templates','✗'],['Real-time alerts','Basic'],['Done-for-you','✗'],['Ethical','✓'],['Competitor tracking','✗']] },
              { name: 'Launch Club', price: '$199-499/mo', hl: false, rows: [['Self-service','✗'],['AI intent scoring','✗'],['Reply templates','✗'],['Real-time alerts','✗'],['Done-for-you','✓'],['Ethical','✗'],['Competitor tracking','✓']], warn: 'Uses fake accounts' },
            ].map((col) => (
              <div key={col.name} className={`comp-mc${col.hl ? ' comp-mc-hl' : ''}`}>
                <div className="comp-mc-hd">
                  <span className={`comp-mc-name${col.hl ? ' comp-green' : ''}`}>{col.name}</span>
                  {col.hl && <span className="comp-mc-badge">✦ Best value</span>}
                </div>
                <div className={`comp-mc-price${col.hl ? ' comp-green' : ''}`}>{col.price}</div>
                <ul className="comp-mc-list">
                  {col.rows.map(([feat, val]) => (
                    <li key={feat}>
                      <span className={val.startsWith('✓') ? 'comp-y' : val.startsWith('✗') ? 'comp-n' : 'comp-muted'}>{val}</span>
                      <span className="comp-mc-feat">{feat}</span>
                    </li>
                  ))}
                </ul>
                {col.warn && <p className="comp-mc-warn">{col.warn}</p>}
              </div>
            ))}
          </div>
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
            <div className={`tog${annual ? ' on' : ''}`} onClick={() => { setPriceSwitching(true); setAnnual(!annual); setTimeout(() => setPriceSwitching(false), 200) }}></div>
            <span>Annual</span>
            <span className="pr-save">-20%</span>
          </div>
          <div className="pr-grid">
            <div className="plan rv">
              <div className="pn">Starter</div>
              <div className="ps">Solo founders testing the waters</div>
              <div className="pp"><span className="c">$</span><span className={`pv${priceSwitching ? ' switching' : ''}`}>{prices[0]}</span><span className="p">/mo</span></div>
              <div className="pa" style={{ display: annual ? 'block' : 'none' }}>Billed {ANNUAL_TOTALS[0]}/year · <span style={{ color: '#1D9E75' }}>2 months free</span></div>
              <Link href="/signup?plan=starter" className="pc">Start 7-day free trial</Link>
              <ul className="pl">
                <li>5 keywords</li>
                <li>15 subreddits</li>
                <li>Auto-scan every 6h</li>
                <li>Manual scan every 15min</li>
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
              <div className="pp"><span className="c">$</span><span className={`pv${priceSwitching ? ' switching' : ''}`}>{prices[1]}</span><span className="p">/mo</span></div>
              <div className="pa" style={{ display: annual ? 'block' : 'none' }}>Billed {ANNUAL_TOTALS[1]}/year · <span style={{ color: '#1D9E75' }}>2 months free</span></div>
              <Link href="/signup?plan=growth" className="pc">Subscribe at ${prices[1]}/mo</Link>
              <ul className="pl">
                <li>25 keywords</li>
                <li>75 subreddits</li>
                <li>Auto-scan every 2h</li>
                <li>Manual scan every 5min</li>
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
              <div className="pp"><span className="c">$</span><span className={`pv${priceSwitching ? ' switching' : ''}`}>{prices[2]}</span><span className="p">/mo</span></div>
              <div className="pa" style={{ display: annual ? 'block' : 'none' }}>Billed {ANNUAL_TOTALS[2]}/year · <span style={{ color: '#1D9E75' }}>2 months free</span></div>
              <Link href="/signup?plan=agency" className="pc">Subscribe at ${prices[2]}/mo</Link>
              <ul className="pl">
                <li>Unlimited keywords</li>
                <li>Unlimited subreddits</li>
                <li>Auto-scan every 1h</li>
                <li>Manual scan every 2min</li>
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

      {/* FAQ — split layout */}
      <section className="sec faq" id="faq">
        <div className="ctn">
          <div className="faq-split">
            <div className="faq-left">
              <div className="slbl green rv">FAQ</div>
              <div className="stl rv">Quick answers</div>
              <p className="faq-left-sub rv">Still have questions?</p>
              <a href="mailto:contact@subhuntr.com" className="faq-left-email rv">contact@subhuntr.com</a>
            </div>
            <div className="faq-right">
              <div className="faq-list">
                {[
                  { q: 'Does SubHuntr post on Reddit for me?', a: 'No. We find and score posts. You reply using our 52+ templates. Authentic replies convert better and won\'t get your account banned.' },
                  { q: 'Does this violate Reddit\'s Terms of Service?', a: 'No. We use Reddit\'s official API and public RSS feeds. We never automate posting, voting, or any action on your behalf.' },
                  { q: 'What\'s included in the free trial?', a: 'Full access for 7 days. Credit card required. Cancel before the trial ends and you won\'t be charged.' },
                  { q: 'How is this different from Launch Club?', a: 'Launch Club ($199 to $499/mo) uses fake accounts and vote manipulation. SubHuntr is self-service, ethical, and starts at $29/mo.' },
                  { q: 'How does SubHuntr score posts from 1 to 10?', a: 'The AI analyzes each post for purchase intent signals like comparison requests, alternative searches, budget mentions, and urgency markers. A post asking "best CRM for small teams under $50/mo" scores 8 or 9. A generic discussion about CRM trends scores 2 or 3.' },
                  { q: 'Do I need a Reddit account to use SubHuntr?', a: 'No. SubHuntr scans Reddit independently. You only need a Reddit account if you want to reply to the leads you find, which you do directly on Reddit.' },
                  { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your billing page in one click. No questions, no retention flows, no hidden fees. If you cancel mid cycle, you keep access until the end of your billing period.' },
                  { q: 'What happens after the 7 day free trial?', a: 'If SubHuntr is not for you, just cancel before day 7 and you will not be charged. Otherwise your Starter plan activates automatically at $29/mo.' },
                ].map((faq, i) => (
                  <div key={i} className={`faq-i${openFaq === i ? ' open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <div className="faq-q">
                      <span>{faq.q}</span>
                      <svg className="faq-ch" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4" /></svg>
                    </div>
                    <div className="faq-a">{faq.a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final">
        <div className="ctn">
          <h2 className="rv">Your competitors are already on Reddit.<br />Are you?</h2>
          <p className="rv">GummySearch shut down in November 2025. 2,000+ founders lost their Reddit monitoring tool. SubHuntr is the replacement.</p>
          <Link href="/signup" className="btn-p rv">
            Start hunting, 7 days free{' '}
            <svg className="arrow" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="ctn">
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <Link href="/" className="logo" style={{ fontSize: '.85rem' }}>
              <LogoIcon size={20} /> SubHuntr
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
