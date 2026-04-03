// Bouton de déconnexion — style danger subtil au hover

'use client'

import { logout } from '@/app/(auth)/actions/auth'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  return (
    <div className="mt-auto border-t border-[rgba(255,255,255,0.06)] pb-4 pt-2">
      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-sm text-[#a1a1aa] transition-colors duration-200 hover:bg-[rgba(239,68,68,0.08)] hover:text-[#ef4444]"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </form>
    </div>
  )
}
