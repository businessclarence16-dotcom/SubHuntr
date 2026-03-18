// Header du dashboard — backdrop blur, avatar, plan badge pill

import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogoutButton } from '@/components/layout/logout-button'
import Link from 'next/link'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let plan = 'starter'
  let fullName = ''
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('plan, full_name')
      .eq('id', user.id)
      .single()
    plan = profile?.plan ?? 'starter'
    fullName = profile?.full_name ?? ''
  }

  const email = user?.email ?? ''
  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  const planColors: Record<string, string> = {
    starter: 'bg-[rgba(29,158,117,0.15)] text-[#1D9E75]',
    growth: 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]',
    agency: 'bg-[rgba(139,92,246,0.15)] text-[#8b5cf6]',
  }

  return (
    <header className="flex h-14 items-center justify-end px-6">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-[rgba(255,255,255,0.04)]">
          <Avatar className="h-8 w-8 border border-[rgba(255,255,255,0.06)]">
            <AvatarFallback className="bg-[#18181c] text-xs text-[#a1a1aa]">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-none text-[#fafafa]">{fullName || email}</p>
            <p className="text-xs text-[#52525b]">{email}</p>
          </div>
          <span className={`ml-1 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${planColors[plan] ?? planColors.starter}`}>
            {plan}
          </span>
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
