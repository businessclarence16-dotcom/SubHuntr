// Layout pour les pages protégées du dashboard (nécessite authentification)
// Sidebar fixe à gauche (desktop) + header en haut + nav mobile

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar — visible uniquement sur desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Zone principale : header + contenu */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b px-4 md:px-6">
          {/* Menu hamburger — visible uniquement sur mobile */}
          <MobileNav />
          {/* Le header async avec user info est côté droit */}
          <div className="flex-1">
            <Header />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
