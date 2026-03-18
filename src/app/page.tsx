// Landing page SubHuntr — publique, redirige vers /feed si connecté

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/landing/landing-page'

export const metadata = {
  title: 'SubHuntr — Find Buyers on Reddit Before Your Competitors Do',
  description: 'Monitor Reddit for high-intent buyers. Score leads 1-10, get instant alerts, reply with proven templates. From $29/mo.',
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/feed')
  }

  return <LandingPage />
}
