// Middleware Supabase pour rafraîchir la session auth à chaque requête
// Ce fichier est utilisé par le middleware Next.js (src/middleware.ts)
// Also enforces subscription requirement for dashboard routes.

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

  const pathname = request.nextUrl.pathname

  // 1. Public routes — no auth required
  const isPublicPage =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/contact' ||
    pathname === '/api/stripe/webhook' ||
    pathname === '/api/cron/emails' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'

  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Redirect logged-in users away from auth/landing pages
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')
  if (user && (isAuthPage || pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  // 3. Routes that require auth but NOT a subscription
  const noSubscriptionRequired =
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/activate') ||
    pathname.startsWith('/api/stripe/checkout') ||
    pathname.startsWith('/api/stripe/portal') ||
    pathname.startsWith('/api/')

  // 4. Dashboard routes require active subscription — redirect to /activate if none
  if (user && !isPublicPage && !noSubscriptionRequired) {
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      const url = request.nextUrl.clone()
      url.pathname = '/activate'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
