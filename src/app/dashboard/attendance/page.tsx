'use client'
import { CalendarCheck, CheckCircle2, XCircle, Clock } from 'lucide-react'

const attendance = [
  { date: 'July 15, 2026', day: 'Day 1', status: 'PRESENT', time: '8:45 AM' },
  { date: 'July 16, 2026', day: 'Day 2', status: 'PRESENT', time: '9:02 AM' },
  { date: 'July 17, 2026', day: 'Day 3', status: 'UPCOMING', time: '-' },
]

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  PRESENT: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Present' },
  ABSENT: { icon: XCircle, color: 'text-red-400', label: 'Absent' },
  LATE: { icon: Clock, color: 'text-yellow-400', label: 'Late' },
  UPCOMING: { icon: Clock, color: 'text-slate-500', label: 'Upcoming' },
}

export default function AttendancePage() {
  const presentCount = attendance.filter(a => a.status === 'PRESENT').length
  const totalCount = attendance.filter(a => a.status !== 'UPCOMING').length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
        <CalendarCheck className="w-6 h-6 inline mr-2 text-orange-400" /> Attendance
      </h1>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <p className="text-3xl font-black text-emerald-400" style={{ fontFamily: 'var(--font-display)' }}>{totalCount > 0 ? Math.round(presentCount / totalCount * 100) : 0}%</p>
          <p className="text-xs text-slate-400 mt-1">Attendance Rate</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/40 text-center">
          <p className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>{presentCount}/{attendance.length}</p>
          <p className="text-xs text-slate-400 mt-1">Days Present</p>
        </div>
        <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-center">
          <p className="text-3xl font-black text-orange-400" style={{ fontFamily: 'var(--font-display)' }}>0</p>
          <p className="text-xs text-slate-400 mt-1">Days Absent</p>
        </div>
      </div>
      <div className="space-y-3">
        {attendance.map(a => {
          const config = statusConfig[a.status]
          const Icon = config.icon
          return (
            <div key={a.date} className="rounded-xl bg-slate-800/30 border border-slate-700/40 p-5 flex items-center gap-4">
              <Icon className={`w-5 h-5 ${config.color}`} />
              <div className="flex-1"><p className="text-sm text-white font-medium">{a.day} — {a.date}</p><p className="text-xs text-slate-500">Checked in: {a.time}</p></div>
              <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
