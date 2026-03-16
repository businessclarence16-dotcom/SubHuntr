// Layout pour les pages protégées du dashboard (nécessite authentification)
// La sidebar et le header seront ajoutés à l'étape 4 (Layout dashboard)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar — à implémenter Phase 1 étape 4 */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
