// Sidebar principale du dashboard — style dark matching landing page

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LogoutButton } from '@/components/layout/logout-button'
import {
  Rss,
  Search,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  CreditCard,
} from 'lucide-react'

const monitorItems = [
  { href: '/feed', label: 'Feed', icon: Rss },
  { href: '/keywords', label: 'Keywords', icon: Search },
  { href: '/subreddits', label: 'Subreddits', icon: MessageSquare },
]

const toolItems = [
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

const accountItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/billing', label: 'Billing', icon: CreditCard },
]

function NavSection({ label, items, pathname }: { label: string; items: typeof monitorItems; pathname: string }) {
  return (
    <div className="mb-2">
      <div className="px-3 pb-1 pt-4 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[#52525b]">
        {label}
      </div>
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-[rgba(29,158,117,0.15)] font-medium text-[#1D9E75]'
                : 'text-[#a1a1aa] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#fafafa]'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#0f0f12] p-4">
      {/* Logo */}
      <Link href="/feed" className="mb-2 flex items-center gap-2 px-3 text-[0.95rem] font-bold tracking-tight text-[#fafafa]">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1D9E75]">
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        </div>
        SubHuntr
      </Link>

      <nav className="flex flex-1 flex-col">
        <NavSection label="Monitor" items={monitorItems} pathname={pathname} />
        <NavSection label="Tools" items={toolItems} pathname={pathname} />
        <NavSection label="Account" items={accountItems} pathname={pathname} />
      </nav>

      <LogoutButton />
    </aside>
  )
}
