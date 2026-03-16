// Page de connexion — formulaire email/password avec Server Action

'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login, type AuthState } from '@/app/(auth)/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const initialState: AuthState = { error: null }

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Connexion</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte SubHuntr
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jean@exemple.com"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
            />
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? 'Connexion...' : 'Se connecter'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="text-primary underline">
              S&apos;inscrire
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
