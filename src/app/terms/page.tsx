// Terms of Service page — public, dark theme matching the rest of the site

import Link from 'next/link'

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mb-10 text-[0.82rem] text-[#52525b]">Last updated: March 20, 2026</p>

        <div className="space-y-8 text-[0.88rem] leading-relaxed">
          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">Service description</h2>
            <p>SubHuntr is a SaaS tool that monitors publicly available Reddit posts to help you find potential customers. We use Reddit&apos;s public RSS feeds to detect posts matching your configured keywords and subreddits.</p>
          </section>

          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">Your responsibilities</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>You are responsible for all replies you post on Reddit. SubHuntr provides templates and suggestions — you decide what to post.</li>
              <li>You must comply with Reddit&apos;s Terms of Service and each subreddit&apos;s rules when replying.</li>
              <li>Do not use SubHuntr for spam, vote manipulation, or any activity that violates Reddit&apos;s policies.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">Billing</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Plans are billed monthly or annually, depending on your selection.</li>
              <li>The Starter plan includes a 7-day free trial. A credit card is required.</li>
              <li>Growth and Agency plans are billed immediately upon subscription.</li>
              <li>Payments are processed securely by Stripe.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">Cancellation</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>You can cancel your subscription at any time from the Billing page.</li>
              <li>When you cancel, you retain access until the end of your current billing period.</li>
              <li>No refunds for partial billing periods.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">No guarantee of results</h2>
            <p>SubHuntr helps you discover Reddit posts and draft replies. We do not guarantee any specific business results, leads, or conversions. Results depend on your product, your replies, and market conditions.</p>
          </section>

          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">Limitation of liability</h2>
            <p>SubHuntr is provided &quot;as is&quot; without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">Changes to terms</h2>
            <p>We may update these terms from time to time. Continued use of SubHuntr after changes constitutes acceptance. We&apos;ll notify you by email for significant changes.</p>
          </section>

          <section>
            <h2 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">Contact</h2>
            <p>Questions? Email us at <a href="mailto:contact@subhuntr.com" className="font-semibold text-[#1D9E75] hover:text-[#34d399]" style={{ transition: 'color 0.15s' }}>contact@subhuntr.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
