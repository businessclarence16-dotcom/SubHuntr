// Privacy Policy page — public, dark theme matching the rest of the site

import Link from 'next/link'

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mb-10 text-[0.82rem] text-[#52525b]">Last updated: March 20, 2026</p>

        <div className="space-y-8 text-[0.88rem] leading-relaxed">
          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">What we collect</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong className="text-[#fafafa]">Account information:</strong> email address and full name when you sign up.</li>
              <li><strong className="text-[#fafafa]">Payment information:</strong> processed securely by Stripe. We never store your card details.</li>
              <li><strong className="text-[#fafafa]">Usage data:</strong> keywords, subreddits, and projects you create within SubHuntr.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">Reddit data</h2>
            <p>SubHuntr monitors publicly available Reddit posts and comments via Reddit&apos;s public RSS feeds. We do not access private messages, private subreddits, or any non-public content.</p>
          </section>

          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">How we use your data</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>To provide and improve the SubHuntr service.</li>
              <li>To process payments and manage your subscription.</li>
              <li>To send transactional emails (account, billing, alerts).</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">What we don&apos;t do</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>We <strong className="text-[#fafafa]">never sell</strong> your personal data to third parties.</li>
              <li>We don&apos;t share your data with advertisers.</li>
              <li>We don&apos;t use your data for AI training.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">Data storage</h2>
            <p>Your data is stored securely on Supabase (PostgreSQL) with encryption at rest. Our infrastructure is hosted on Vercel.</p>
          </section>

          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">Account deletion</h2>
            <p>You can delete your account at any time from Settings. This permanently removes all your data, including projects, keywords, and saved posts.</p>
          </section>

          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">Contact</h2>
            <p>Questions about privacy? Email us at <a href="mailto:contact@subhuntr.com" className="font-semibold text-[#1D9E75] hover:text-[#34d399]" style={{ transition: 'color 0.15s' }}>contact@subhuntr.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
