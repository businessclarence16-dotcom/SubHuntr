// Client Supabase côté serveur (pour les Server Components, Route Handlers, Server Actions)
// Utilise createServerClient de @supabase/ssr avec les cookies Next.js

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll est appelé depuis un Server Component où on ne peut pas
            // modifier les cookies. On ignore l'erreur car le middleware
            // s'en charge pour rafraîchir la session.
          }
        },
      },
    }
  )
}
