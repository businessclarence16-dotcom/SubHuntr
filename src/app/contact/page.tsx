// Contact page — public, dark theme matching the rest of the site

import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#a1a1aa]">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-2 text-[0.82rem] text-[#52525b] hover:text-[#a1a1aa]"
          style={{ transition: 'color 0.15s' }}
        >
          ← Back to home
        </Link>

        <h1
          className="mb-2 text-[clamp(1.8rem,4vw,2.5rem)] font-[800] text-[#fafafa]"
          style={{ letterSpacing: '-0.035em', lineHeight: '1.15' }}
        >
          Contact us
        </h1>
        <p className="mb-10 text-[0.88rem]">Have a question, feedback, or need help? We&apos;re here.</p>

        <div
          className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] p-8"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.3)' }}
        >
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[10px] bg-[rgba(29,158,117,0.1)]">
            <svg width="24" height="24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <h2 className="mb-2 text-[1.1rem] font-bold text-[#fafafa]">Email us</h2>
          <a
            href="mailto:contact@subhuntr.com"
            className="mb-4 inline-block text-[1rem] font-semibold text-[#1D9E75] hover:text-[#34d399]"
            style={{ transition: 'color 0.15s' }}
          >
            contact@subhuntr.com
          </a>
          <p className="text-[0.88rem]">We typically respond within 24 hours.</p>
        </div>

        <div className="mt-8 space-y-4 text-[0.88rem]">
          <div
            className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] p-6"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.3)' }}
          >
            <h3 className="mb-1 font-bold text-[#fafafa]">Billing issues</h3>
            <p>Need to update your payment method, get an invoice, or cancel? Go to <Link href="/billing" className="font-semibold text-[#1D9E75] hover:text-[#34d399]" style={{ transition: 'color 0.15s' }}>Billing</Link> in your dashboard, or email us.</p>
          </div>

          <div
            className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#131316] p-6"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.3)' }}
          >
            <h3 className="mb-1 font-bold text-[#fafafa]">Enterprise inquiries</h3>
            <p>Looking for custom integrations, SLA, or dedicated support? Email us at <a href="mailto:contact@subhuntr.com" className="font-semibold text-[#1D9E75] hover:text-[#34d399]" style={{ transition: 'color 0.15s' }}>contact@subhuntr.com</a> with &quot;Enterprise&quot; in the subject.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
