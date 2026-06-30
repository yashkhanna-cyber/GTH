'use client'

import { useState, useEffect } from 'react'
import { useUser } from './layout'
import { Trophy, Target, Zap, Users, ArrowUpRight, Clock, CheckCircle2, BarChart3, Loader2, Megaphone, Info, AlertTriangle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface TaskData {
  id: string
  title: string
  points: number
  deadline: string | null
  type: string
}

export default function DashboardPage() {
  const { user } = useUser()
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [activities, setActivities] = useState<{ action: string; time: string; type: string }[]>([
    { action: 'Welcome to GTH TechVerse 2026!', time: 'Just now', type: 'system' }
  ])

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(data => {
        if (data.tasks) {
          setTasks(data.tasks.slice(0, 3)) // Get top 3 tasks
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingTasks(false))

    // Fetch dynamic notifications as recent activities
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.notifications && data.notifications.length > 0) {
          const mapped = data.notifications.slice(0, 4).map((n: any) => ({
            action: n.message,
            time: n.time,
            type: n.type
          }))
          setActivities(mapped)
        }
      })
      .catch(err => console.error(err))

    // Fetch announcements
    fetch('/api/announcements')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.announcements) {
          setAnnouncements(data.announcements.slice(0, 2)) // Get top 2 latest announcements
        }
      })
      .catch(err => console.error(err))
  }, [])

  const totalPoints = user?.student?.leaderboard?.totalPoints ?? 0
  const rank = user?.student?.leaderboard?.rank ? `#${user.student.leaderboard.rank}` : 'N/A'

  const quickStats = [
    { label: 'Total Points', value: totalPoints.toLocaleString(), icon: Trophy, color: 'from-red-500 to-amber-500', change: 'Updated real-time' },
    { label: 'Current Rank', value: rank, icon: Target, color: 'from-purple-500 to-indigo-500', change: 'Overall rank' },
    { label: 'Challenges', value: tasks.length.toString(), icon: Zap, color: 'from-cyan-500 to-blue-500', change: 'Tasks published' },
    { label: 'Team', value: user?.student?.team?.name || 'No Team', icon: Users, color: 'from-emerald-500 to-green-500', change: 'Your assigned team' },
  ]

  const typeStyles: Record<string, { color: string; border: string; bg: string; icon: typeof Info }> = {
    INFO: { color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5', icon: Info },
    SUCCESS: { color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', icon: CheckCircle2 },
    WARNING: { color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5', icon: AlertTriangle },
    ERROR: { color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5', icon: Zap }
  }

  return (
    <div className="space-y-6">
      {/* Announcements Banner Section */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((ann) => {
            const style = typeStyles[ann.type] || typeStyles.INFO
            const AlertIcon = style.icon
            return (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl border ${style.border} ${style.bg} flex items-start gap-3 transition-all hover:bg-slate-800/20 relative overflow-hidden group`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className={`p-2 rounded-xl bg-slate-900/60 border border-slate-800 ${style.color}`}>
                  <AlertIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold ${style.color}`}>{ann.title}</span>
                    <span className="text-[9px] text-slate-500 font-mono">• {new Date(ann.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-350 mt-1 leading-relaxed">{ann.message}</p>
                </div>
                <Megaphone className="w-4 h-4 text-slate-500 shrink-0 self-center opacity-40 group-hover:scale-110 transition-transform" />
              </div>
            )
          })}
        </div>
      )}
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-red-700 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-lg">
            TechVerse is underway! Build projects, complete tasks, and compete on the leaderboard.
          </p>
          <div className="flex gap-3 mt-5">
            <Link href="/dashboard/projects" className="px-5 py-2.5 bg-white text-red-700 rounded-xl text-sm font-semibold hover:bg-white/90 transition-all">
              View Projects
            </Link>
            <Link href="/dashboard/leaderboard" className="px-5 py-2.5 bg-white/15 text-white rounded-xl text-sm font-semibold hover:bg-white/25 transition-all border border-white/20">
              Leaderboard
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <div key={stat.label} className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/40 hover:border-slate-600/50 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              <BarChart3 className="w-5 h-5 inline mr-2 text-red-400" />
              Recent Activity
            </h2>
          </div>
          <div className="space-y-3">
            {activities.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-700/20 transition-all">
                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{item.action}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              <Clock className="w-5 h-5 inline mr-2 text-purple-400" />
              Upcoming Tasks
            </h2>
            <Link href="/dashboard/tasks" className="text-xs text-red-400 hover:text-red-300 font-medium">View All</Link>
          </div>
          
          {loadingTasks ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              No tasks assigned yet.
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, i) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/20 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{task.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-400 uppercase tracking-wider">
                    {task.type}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link href="/dashboard/tasks" className="block w-full mt-4 py-2.5 rounded-xl border border-slate-700/40 text-center text-sm text-slate-400 hover:text-white hover:bg-slate-700/30 transition-all font-medium">
            View All Tasks
          </Link>
        </div>
      </div>
    </div>
  )
}
