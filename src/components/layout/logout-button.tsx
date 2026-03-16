// Bouton de déconnexion — appelle la Server Action logout

'use client'

import { logout } from '@/app/(auth)/actions/auth'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="ghost" size="sm" type="submit">
        Déconnexion
      </Button>
    </form>
  )
}
