// Page d'inscription — formulaire email/password avec Server Action

'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup, type AuthState } from '@/app/(auth)/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const initialState: AuthState = { error: null }

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState)

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Créer un compte</CardTitle>
        <CardDescription>
          Commencez à trouver des leads sur Reddit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="Jean Dupont"
            />
          </div>

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
              placeholder="6 caractères minimum"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? 'Création...' : "S'inscrire"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary underline">
              Se connecter
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
