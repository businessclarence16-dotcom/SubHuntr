// Sidebar principale du dashboard — navigation avec icônes et état actif

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

const navItems = [
  { href: '/feed', label: 'Feed', icon: Rss },
  { href: '/keywords', label: 'Keywords', icon: Search },
  { href: '/subreddits', label: 'Subreddits', icon: MessageSquare },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/billing', label: 'Billing', icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-muted/30 p-4">
      <Link href="/feed" className="mb-6 px-3 text-lg font-bold">
        Sub<span className="text-primary">Huntr</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
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

      <LogoutButton />
    </aside>
  )
}
