// Middleware Supabase pour rafraîchir la session auth à chaque requête
// Ce fichier est utilisé par le middleware Next.js (src/middleware.ts)

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Rafraîchit la session — ne pas retirer cette ligne
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirige vers /login si l'utilisateur n'est pas connecté
  // et essaie d'accéder à une page protégée du dashboard
  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')
  const isApiWebhook =
    request.nextUrl.pathname === '/api/stripe/webhook'
  const isLegalPage =
    request.nextUrl.pathname === '/privacy' ||
    request.nextUrl.pathname === '/terms' ||
    request.nextUrl.pathname === '/contact'
  const isSeoFile =
    request.nextUrl.pathname === '/sitemap.xml' ||
    request.nextUrl.pathname === '/robots.txt'
  const isPublicPage =
    isAuthPage || request.nextUrl.pathname === '/' || isApiWebhook || isLegalPage || isSeoFile

  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirige vers /feed si l'utilisateur est déjà connecté
  // et essaie d'accéder à login/signup ou à la landing page
  if (user && (isAuthPage || request.nextUrl.pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
