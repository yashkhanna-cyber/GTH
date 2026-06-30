'use client'
import { useState, useEffect } from 'react'
import { Users, Trophy, FileCheck, Zap, BarChart3, TrendingUp, Activity, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  PENDING: 'text-yellow-400 bg-yellow-500/15',
  APPROVED: 'text-emerald-400 bg-emerald-500/15',
  REJECTED: 'text-red-400 bg-red-500/15',
}

interface StatsData {
  totalStudents: number
  activeTeams: number
  submissions: number
  activeChallenges: number
  totalPoints: number
  attendanceRate: string
}

interface Submission {
  student: string
  project: string
  time: string
  status: string
}

export default function AdminOverview() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats)
        if (data.recentSubmissions) setRecentSubmissions(data.recentSubmissions)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading admin dashboard statistics...</p>
      </div>
    )
  }

  const statCards = stats ? [
    { label: 'Total Students', value: stats.totalStudents.toString(), icon: Users, color: 'from-blue-500 to-indigo-500', change: 'Total enrolled' },
    { label: 'Active Teams', value: stats.activeTeams.toString(), icon: Trophy, color: 'from-orange-500 to-amber-500', change: 'Teams formed' },
    { label: 'Submissions', value: stats.submissions.toString(), icon: FileCheck, color: 'from-emerald-500 to-green-500', change: 'Files uploaded' },
    { label: 'Active Challenges', value: stats.activeChallenges.toString(), icon: Zap, color: 'from-purple-500 to-indigo-500', change: 'Bootcamp tasks' },
    { label: 'Total Points Given', value: stats.totalPoints.toLocaleString(), icon: BarChart3, color: 'from-cyan-500 to-blue-500', change: 'Distributed XP' },
    { label: 'Attendance Rate', value: stats.attendanceRate, icon: Activity, color: 'from-pink-500 to-rose-500', change: 'Overall present' },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Admin Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">TechVerse 2026 — Day 2 Overview</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/40 group hover:border-slate-600/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-emerald-400 mt-1 font-medium">{s.change}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Recent Submissions</h2>
            <Link href="/admin/projects" className="text-xs text-orange-400 hover:text-orange-300 font-medium">View All</Link>
          </div>
          <div className="space-y-3">
            {recentSubmissions.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No recent submissions found.</p>
            ) : (
              recentSubmissions.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/20 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {s.student.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{s.student} — {s.project}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.time}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${statusColors[s.status]}`}>{s.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6">
          <h2 className="text-lg font-bold text-white mb-5" style={{ fontFamily: 'var(--font-display)' }}>Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add Points', href: '/admin/points', icon: Trophy, color: 'from-orange-500 to-amber-500' },
              { label: 'Review Submissions', href: '/admin/projects', icon: FileCheck, color: 'from-emerald-500 to-green-500' },
              { label: 'Mark Attendance', href: '/admin/attendance', icon: Clock, color: 'from-blue-500 to-indigo-500' },
              { label: 'Announcements', href: '/admin/announcements', icon: Zap, color: 'from-purple-500 to-indigo-500' },
            ].map(a => (
              <Link key={a.label} href={a.href} className="p-4 rounded-xl bg-slate-700/20 border border-slate-700/30 hover:border-slate-600/50 transition-all text-center group">
                <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <a.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-white font-medium">{a.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
