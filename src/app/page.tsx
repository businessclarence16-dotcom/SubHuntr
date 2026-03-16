// Landing page — redirige vers le dashboard ou affiche la page d'accueil

import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Reddit<span className="text-primary">Leads</span>
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Trouvez vos prochains clients sur Reddit. Scannez, filtrez et répondez
          aux posts pertinents automatiquement.
        </p>
        <div className="flex gap-4">
          <Link
            href="/signup"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Se connecter
          </Link>
        </div>
      </main>
    </div>
  )
}
