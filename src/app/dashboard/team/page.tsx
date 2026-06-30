'use client'
import { Users, Crown, Trophy, User, Settings } from 'lucide-react'

const members = [
  { name: 'Ananya Gupta', role: 'Leader', enrollment: '22CSE015', points: 2450, initial: 'AG' },
  { name: 'Kavya Sharma', role: 'Member', enrollment: '22CSE019', points: 1820, initial: 'KS' },
  { name: 'Ishita Jain', role: 'Member', enrollment: '22CSE041', points: 1520, initial: 'IJ' },
  { name: 'You', role: 'Member', enrollment: '22CSE033', points: 1250, initial: 'ME' },
]

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
        <Users className="w-6 h-6 inline mr-2 text-orange-400" /> My Team
      </h1>

      <div className="rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Alpha Coders</h2>
            <p className="text-sm text-slate-400">Formed on July 15, 2026</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-orange-400" style={{ fontFamily: 'var(--font-display)' }}>7,040</p>
            <p className="text-xs text-slate-500">Total Team Points</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 mb-4">
          <Trophy className="w-8 h-8 text-amber-400" />
          <div>
            <p className="text-sm text-white font-semibold">Team Rank: #5 out of 50</p>
            <p className="text-xs text-slate-400">Top 10% — Keep pushing!</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6">
        <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Team Members</h3>
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.enrollment} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-700/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                {m.initial}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white font-medium">{m.name}</p>
                  {m.role === 'Leader' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-xs text-slate-500">{m.enrollment}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-orange-400 font-bold font-mono">{m.points}</p>
                <p className="text-[10px] text-slate-500">points</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
