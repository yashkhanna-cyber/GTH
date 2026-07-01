'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, User, Users, Trophy, FolderKanban, FileCheck, Upload,
  Zap, ClipboardList, CalendarCheck, Award, Share2, BadgeCheck, Bell,
  Calendar, BarChart3, Menu, X, LogOut, Sparkles, ChevronRight, Search,
  Sun, Moon
} from 'lucide-react'

interface UserData {
  id: string; email: string; name: string; role: string; avatar?: string;
  student?: { id: string; enrollmentNo: string; team?: { name: string }; leaderboard?: { totalPoints: number; rank: number } };
}

const UserContext = createContext<{ user: UserData | null; loading: boolean }>({ user: null, loading: true })
export const useUser = () => useContext(UserContext)

const sidebarLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/dashboard/tasks', icon: ClipboardList },
  { name: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck },
  { name: 'Referrals', href: '/dashboard/referrals', icon: Share2 },
  { name: 'Certificates', href: '/dashboard/certificates', icon: BadgeCheck },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.error) { router.push('/login'); return }
        setUser(data.user)
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ user, loading }}>
      <div className={`min-h-screen ${darkMode ? 'bg-[#0f172a]' : 'bg-slate-50'} flex`}>
        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 z-50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${darkMode ? 'bg-[#0b1120] border-r border-slate-800/50' : 'bg-white border-r border-slate-200'}`}>
          {/* Logo */}
          <div className="p-5 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-9 px-2 rounded-lg bg-white flex items-center gap-1.5 shadow-sm border border-slate-100">
                <img src="/gth-logo.jpg" alt="GTH Logo" className="h-5.5 object-contain" />
                <div className="w-px h-4 bg-slate-200" />
                <img src="/geeta-logo.png" alt="Geeta University" className="h-5.5 object-contain" />
              </div>
              <div className="min-w-0">
                <span className={`font-bold text-xs block leading-tight truncate ${darkMode ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-display)' }}>GTH TechVerse</span>
                <span className="text-red-400 text-[8px] font-semibold tracking-[0.1em] uppercase">Student Portal</span>
              </div>
            </Link>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
            {sidebarLinks.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? `${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`
                      : `${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`
                  }`}
                >
                  <link.icon className="w-4.5 h-4.5" />
                  {link.name}
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
                </Link>
              )
            })}
          </nav>

          {/* Bottom */}
          <div className={`p-3 border-t ${darkMode ? 'border-slate-800/50' : 'border-slate-200'}`}>
            <button onClick={handleLogout} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all cursor-pointer ${
              darkMode ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
            }`}>
              <LogOut className="w-4.5 h-4.5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Bar */}
          <header className={`sticky top-0 z-30 px-6 py-4 flex items-center justify-between backdrop-blur-xl ${
            darkMode ? 'bg-[#0f172a]/80 border-b border-slate-800/50' : 'bg-white/80 border-b border-slate-200'
          }`}>
            <div className="flex items-center gap-4">
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              </button>
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-700/30 w-64">
                <Search className="w-4 h-4 text-slate-500" />
                <input placeholder="Search..." className="bg-transparent text-sm text-slate-300 placeholder-slate-500 outline-none w-full" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                darkMode ? 'bg-slate-800/50 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <Link href="/dashboard/notifications" className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                darkMode ? 'bg-slate-800/50 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}>
                <Bell className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0f172a]" />
              </Link>

              <div className="flex items-center gap-2.5 pl-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="hidden sm:block">
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.student?.enrollmentNo || user?.role}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </UserContext.Provider>
  )
}
