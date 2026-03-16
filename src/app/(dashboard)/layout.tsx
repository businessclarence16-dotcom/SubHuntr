// Layout pour les pages protégées du dashboard (nécessite authentification)
// La sidebar complète sera améliorée à l'étape 4 (Layout dashboard)

import Link from 'next/link'
import { LogoutButton } from '@/components/layout/logout-button'

const navItems = [
  { href: '/feed', label: 'Feed' },
  { href: '/keywords', label: 'Keywords' },
  { href: '/subreddits', label: 'Subreddits' },
  { href: '/templates', label: 'Templates' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/settings', label: 'Settings' },
  { href: '/billing', label: 'Billing' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar temporaire — sera améliorée à l'étape 4 */}
      <aside className="flex w-56 flex-col border-r bg-muted/30 p-4">
        <Link href="/feed" className="mb-6 text-lg font-bold">
          Sub<span className="text-primary">Huntr</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
