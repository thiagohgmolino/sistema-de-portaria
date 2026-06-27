'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import type { UserRole } from '@/types/database'
import {
  LayoutDashboard, Users, Building2, UserCheck, Truck, CalendarDays,
  Package, DoorOpen, ClipboardList, LogOut, Shield, ChevronRight, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'sindico', 'portaria', 'morador'] },
  { href: '/portaria/nova-entrada', label: 'Nova entrada', icon: DoorOpen, roles: ['admin', 'portaria'] },
  { href: '/portaria/dentro-agora', label: 'Dentro agora', icon: Users, roles: ['admin', 'portaria', 'sindico'] },
  { href: '/portaria/eventos-hoje', label: 'Eventos hoje', icon: CalendarDays, roles: ['admin', 'portaria', 'sindico'] },
  { href: '/unidades', label: 'Unidades', icon: Building2, roles: ['admin', 'sindico'] },
  { href: '/moradores', label: 'Moradores', icon: Users, roles: ['admin', 'sindico'] },
  { href: '/visitantes', label: 'Visitantes', icon: UserCheck, roles: ['admin', 'portaria', 'sindico'] },
  { href: '/prestadores', label: 'Prestadores', icon: Truck, roles: ['admin', 'portaria', 'sindico'] },
  { href: '/areas-comuns', label: 'Áreas comuns', icon: Building2, roles: ['admin', 'sindico'] },
  { href: '/eventos', label: 'Eventos', icon: CalendarDays, roles: ['admin', 'sindico'] },
  { href: '/encomendas', label: 'Encomendas', icon: Package, roles: ['admin', 'portaria', 'sindico'] },
  { href: '/morador/meus-eventos', label: 'Meus eventos', icon: CalendarDays, roles: ['morador'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useProfile()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleItems = navItems.filter(item =>
    profile?.role ? item.roles.includes(profile.role) : false
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="bg-blue-600 p-1.5 rounded-md">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Portaria Inteligente</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
              {active && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        {profile && (
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-gray-900 truncate">{profile.nome}</p>
            <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 w-full"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 bg-white border rounded-md p-1.5 shadow-sm"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white border-r shadow-xl transition-transform',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 bg-white border-r">
        <SidebarContent />
      </div>
    </>
  )
}
