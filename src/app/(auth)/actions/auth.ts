// Server Actions pour l'authentification (signup, login, logout)
// Utilisées par les formulaires côté client via useActionState

'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send'
import { welcomeEmail } from '@/lib/email/templates'

export interface AuthState {
  error: string | null
  success?: boolean
  email?: string
}

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const plan = formData.get('plan') as string | null

  if (!email || !password) {
    return { error: 'Email et mot de passe requis.' }
  }

  if (password.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères.' }
  }

  // Build redirect URL — pass selected plan to onboarding
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://subhuntr.com'
  const redirectTo = plan
    ? `${baseUrl}/onboarding?plan=${plan}`
    : `${baseUrl}/onboarding`

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || null,
      },
      emailRedirectTo: redirectTo,
    },
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  // Try auto-login immediately (works when email confirmation is disabled)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // Send welcome email in background (simplified — no project info yet)
  const { data: { user: newUser } } = await supabase.auth.getUser()
  if (newUser) {
    const welcome = welcomeEmail({ name: fullName || '' })
    sendEmail(newUser.id, 'onboarding_welcome', email, welcome.subject, welcome.html).catch(() => {})
  }

  if (!signInError) {
    // Auto-login succeeded — redirect to onboarding
    redirect(plan ? `/onboarding?plan=${plan}` : '/onboarding')
  }

  // Auto-login failed (email confirmation is enabled) — show "check your inbox"
  return { error: null, success: true, email }
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email et mot de passe requis.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Email ou mot de passe incorrect.' }
  }

  redirect('/feed')
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
