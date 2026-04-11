// Navigation mobile — menu hamburger avec Sheet dark theme

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { LogoutButton } from '@/components/layout/logout-button'
import { LogoIcon } from '@/components/layout/logo-icon'
import {
  Menu,
  Rss,
  Search,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  CreditCard,
} from 'lucide-react'

const navSections = [
  {
    label: 'Monitor',
    items: [
      { href: '/feed', label: 'Feed', icon: Rss },
      { href: '/keywords', label: 'Keywords', icon: Search },
      { href: '/subreddits', label: 'Subreddits', icon: MessageSquare },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/templates', label: 'Templates', icon: FileText },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/billing', label: 'Billing', icon: CreditCard },
    ],
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 w-9 text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[rgba(255,255,255,0.04)]">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-56 border-r border-[rgba(255,255,255,0.06)] bg-[#0f0f12] p-4">
        <Link
          href="/feed"
          className="mb-6 flex items-center gap-2 px-3 text-[0.95rem] font-bold tracking-tight text-[#fafafa]"
          onClick={() => setOpen(false)}
        >
          <LogoIcon size={24} />
          SubHuntr
        </Link>

        <nav className="flex flex-1 flex-col">
          {navSections.map((section) => (
            <div key={section.label} className="mb-2">
              <div className="px-3 pb-1 pt-4 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[#52525b]">
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
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
          ))}
        </nav>

        <div className="mt-4">
          <LogoutButton />
        </div>
      </SheetContent>
    </Sheet>
  )
}
