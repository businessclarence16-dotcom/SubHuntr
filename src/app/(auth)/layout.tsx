// Layout for public auth pages (login, signup, onboarding) — dark premium theme

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#09090b]">
      {children}
    </div>
  )
}
