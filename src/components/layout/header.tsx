// Header du dashboard — titre de page + menu utilisateur

import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { LogoutButton } from '@/components/layout/logout-button'
import Link from 'next/link'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Récupérer le profil utilisateur pour le plan
  let plan = 'free'
  let fullName = ''
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('plan, full_name')
      .eq('id', user.id)
      .single()
    plan = profile?.plan ?? 'free'
    fullName = profile?.full_name ?? ''
  }

  const email = user?.email ?? ''
  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <div />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-muted">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-none">{fullName || email}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <Badge variant="secondary" className="ml-1 text-xs capitalize">
            {plan}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <Link href="/settings">
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </Link>
          <Link href="/billing">
            <DropdownMenuItem>Billing</DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="p-0">
            <LogoutButton />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
