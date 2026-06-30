'use client'
import { Bell, CheckCircle2, Info, AlertTriangle, Zap } from 'lucide-react'

const notifications = [
  { id: 1, title: 'Points Awarded', message: 'You earned 50 points for your community post!', type: 'SUCCESS', time: '2 hours ago', read: false },
  { id: 2, title: 'New Challenge Available', message: 'IoT Security Audit challenge is now live. Complete by 6 PM!', type: 'INFO', time: '4 hours ago', read: false },
  { id: 3, title: 'Submission Approved', message: 'Your Day 1 project has been approved with 85/100 marks.', type: 'SUCCESS', time: '6 hours ago', read: true },
  { id: 4, title: 'Deadline Reminder', message: 'Project 2 submission deadline is in 3 hours.', type: 'WARNING', time: '8 hours ago', read: true },
  { id: 5, title: 'Badge Unlocked!', message: 'Congrats! You unlocked the "Fast Learner" badge.', type: 'SUCCESS', time: '1 day ago', read: true },
]

const typeConfig: Record<string, { icon: typeof Info; color: string }> = {
  INFO: { icon: Info, color: 'text-blue-400' }, SUCCESS: { icon: CheckCircle2, color: 'text-emerald-400' },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-400' }, ERROR: { icon: Zap, color: 'text-red-400' },
}

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
        <Bell className="w-6 h-6 inline mr-2 text-orange-400" /> Notifications
      </h1>
      <div className="space-y-3">
        {notifications.map(n => {
          const config = typeConfig[n.type]
          const Icon = config.icon
          return (
            <div key={n.id} className={`rounded-xl bg-slate-800/30 border p-5 flex items-start gap-4 transition-all ${n.read ? 'border-slate-700/40' : 'border-orange-500/30 bg-orange-500/5'}`}>
              <Icon className={`w-5 h-5 ${config.color} mt-0.5 shrink-0`} />
              <div className="flex-1">
                <p className="text-sm text-white font-medium">{n.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-slate-500 mt-1.5">{n.time}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
