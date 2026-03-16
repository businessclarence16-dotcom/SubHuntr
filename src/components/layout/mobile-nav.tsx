// Navigation mobile — menu hamburger avec Sheet (panneau latéral)

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { LogoutButton } from '@/components/layout/logout-button'
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

const navItems = [
  { href: '/feed', label: 'Feed', icon: Rss },
  { href: '/keywords', label: 'Keywords', icon: Search },
  { href: '/subreddits', label: 'Subreddits', icon: MessageSquare },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/billing', label: 'Billing', icon: CreditCard },
]

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-56 p-4">
        <Link
          href="/feed"
          className="mb-6 block px-3 text-lg font-bold"
          onClick={() => setOpen(false)}
        >
          Sub<span className="text-primary">Huntr</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-4">
          <LogoutButton />
        </div>
      </SheetContent>
    </Sheet>
  )
}
