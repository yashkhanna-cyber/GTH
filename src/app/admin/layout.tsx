'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Trophy, FolderKanban, FileCheck, Zap,
  CalendarCheck, UserCog, Megaphone, BadgeCheck, Share2, BarChart3,
  Settings, ScrollText, Menu, X, LogOut, Sparkles, ChevronRight, Shield,
  ClipboardList
} from 'lucide-react'

const adminLinks = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Students', href: '/admin/students', icon: Users },
  { name: 'Points', href: '/admin/points', icon: Trophy },
  { name: 'Leaderboard', href: '/admin/leaderboard', icon: BarChart3 },
  { name: 'Projects', href: '/admin/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/admin/tasks', icon: ClipboardList },
  { name: 'Attendance', href: '/admin/attendance', icon: CalendarCheck },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { name: 'Certificates', href: '/admin/certificates', icon: BadgeCheck },
  { name: 'Referrals', href: '/admin/referrals', icon: Share2 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.error || data.user?.role !== 'ADMIN') router.push('/login')
    }).catch(() => router.push('/login'))
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 z-50 flex flex-col bg-[#0b1120] border-r border-slate-800/50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-5 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-sm block leading-tight" style={{ fontFamily: 'var(--font-display)' }}>GTH Admin</span>
              <span className="text-red-400 text-[9px] font-semibold tracking-[0.15em] uppercase">Control Panel</span>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {adminLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link key={link.href} href={link.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-red-500/10 text-red-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}>
                <link.icon className="w-4.5 h-4.5" />{link.name}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-slate-800/50">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-4.5 h-4.5" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800/50">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5 text-slate-400" /></button>
          <div />
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">AD</div>
            <div className="hidden sm:block"><p className="text-sm font-semibold text-white">Admin</p><p className="text-xs text-slate-500">Super Admin</p></div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
