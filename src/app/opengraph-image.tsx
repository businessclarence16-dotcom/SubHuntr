// OG Image — generated dynamically by Next.js (1200x630)
// This file auto-generates /opengraph-image for social sharing

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'SubHuntr — Find Buyers on Reddit Before Your Competitors Do'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#09090b',
          padding: '60px',
        }}
      >
        {/* Left side — text */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, paddingRight: '40px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'white' }} />
            </div>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#fafafa', letterSpacing: '-0.02em' }}>SubHuntr</span>
          </div>

          {/* Title */}
          <div style={{ fontSize: '48px', fontWeight: 800, color: '#fafafa', lineHeight: 1.15, letterSpacing: '-0.035em', marginBottom: '16px' }}>
            Find Buyers on Reddit Before Your Competitors Do
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: '20px', color: '#a1a1aa', lineHeight: 1.5 }}>
            AI-powered Reddit lead generation. From $29/mo.
          </div>
        </div>

        {/* Right side — mini feed mockup */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '400px', gap: '10px' }}>
          {[
            { score: '9', color: '#34d399', title: 'Best CRM for small B2B SaaS?', sub: 'r/SaaS' },
            { score: '8', color: '#34d399', title: 'Looking for a Mailchimp alternative', sub: 'r/Entrepreneur' },
            { score: '9', color: '#34d399', title: 'What PM tool do you use daily?', sub: 'r/startups' },
          ].map((post, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#131316',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(29,158,117,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: post.color,
                }}
              >
                {post.score}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.title}
                </div>
                <div style={{ fontSize: '11px', color: '#1D9E75', marginTop: '2px' }}>{post.sub}</div>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'white',
                  background: '#1D9E75',
                  padding: '4px 12px',
                  borderRadius: '6px',
                }}
              >
                Reply
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
