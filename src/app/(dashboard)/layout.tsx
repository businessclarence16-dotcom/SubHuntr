// Layout dashboard — dark theme avec sidebar, header backdrop blur, nav mobile

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex max-w-full min-h-screen overflow-hidden bg-[#09090b]">
      {/* Sidebar — visible uniquement sur desktop */}
      <div className="hidden shrink-0 md:block">
        <Sidebar />
      </div>

      {/* Zone principale : header + contenu */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="sticky top-0 z-40 flex h-14 items-center border-b border-[rgba(255,255,255,0.06)] bg-[rgba(9,9,11,0.6)] px-4 backdrop-blur-xl md:px-6">
          {/* Menu hamburger — visible uniquement sur mobile */}
          <MobileNav />
          {/* Le header async avec user info est côté droit */}
          <div className="min-w-0 flex-1">
            <Header />
          </div>
        </div>

        <main className="min-w-0 max-w-full flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
