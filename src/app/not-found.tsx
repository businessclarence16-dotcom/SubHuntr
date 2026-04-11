// Custom 404 page — dark theme matching the rest of the site

import Link from 'next/link'
import { LogoIcon } from '@/components/layout/logo-icon'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 text-center">
      {/* Logo */}
      <div className="mb-12 flex items-center gap-2">
        <LogoIcon size={24} />
        <span
          className="text-[0.95rem] font-bold text-[#fafafa]"
          style={{ letterSpacing: '-0.02em' }}
        >
          SubHuntr
        </span>
      </div>

      {/* 404 */}
      <div
        className="mb-4 font-mono text-[clamp(4rem,10vw,8rem)] font-bold text-[#1D9E75]"
        style={{ letterSpacing: '-0.05em', lineHeight: 1 }}
      >
        404
      </div>

      <h1
        className="mb-3 text-[clamp(1.5rem,3vw,2rem)] font-[800] text-[#fafafa]"
        style={{ letterSpacing: '-0.035em', lineHeight: '1.15' }}
      >
        Page not found
      </h1>

      <p className="mb-8 max-w-md text-[0.88rem] text-[#a1a1aa]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-[#1D9E75] px-7 text-[0.88rem] font-bold text-white"
          style={{
            boxShadow: '0 0 30px rgba(29,158,117,0.15), 0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
          }}
        >
          Back to home
        </Link>
        <Link
          href="/feed"
          className="inline-flex h-[46px] items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.06)] px-7 text-[0.88rem] font-medium text-[#a1a1aa] hover:border-[rgba(255,255,255,0.1)] hover:text-[#fafafa]"
          style={{ transition: 'all 0.2s' }}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
