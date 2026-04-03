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
    <div className="min-h-screen bg-[#09090b]" style={{ overflow: 'hidden', maxWidth: '100vw' }}>
      {/* Sidebar — fixed on desktop, hidden on mobile */}
      <div className="hidden md:block" style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: 224, zIndex: 50, overflowY: 'auto' }}>
        <Sidebar />
      </div>

      {/* Zone principale : header + contenu — offset by sidebar width on desktop */}
      <div className="flex flex-col md:ml-56" style={{ overflow: 'hidden', minWidth: 0 }}>
        <div className="flex h-14 items-center border-b border-[rgba(255,255,255,0.06)] px-3 backdrop-blur-xl md:px-6" style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#09090b' }}>
          {/* Menu hamburger — visible uniquement sur mobile */}
          <MobileNav />
          {/* Le header async avec user info est côté droit */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <Header />
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6" style={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>{children}</main>
      </div>
    </div>
  )
}
