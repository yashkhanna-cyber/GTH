'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Award, Search, Loader2 } from 'lucide-react'

interface LeaderboardEntry {
  id: string
  rank: number
  totalPoints: number
  projectScore: number
  communityScore: number
  innovationScore: number
  referralScore: number
  student: {
    id: string
    enrollmentNo: string
    team: {
      name: string
    } | null
    user: {
      name: string
      avatar: string | null
    }
  }
}

export default function StudentLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard)
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.student.user.name.toLowerCase().includes(search.toLowerCase()) ||
    entry.student.enrollmentNo.toLowerCase().includes(search.toLowerCase())
  )

  const rankColors = ['from-yellow-400 to-amber-500', 'from-slate-350 to-slate-450', 'from-red-700 to-amber-700']
  const rankIcons = [Trophy, Medal, Award]

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading leaderboard rankings...</p>
      </div>
    )
  }

  // Top 3 Podium
  const topThree = leaderboard.slice(0, 3)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5" style={{ fontFamily: 'var(--font-display)' }}>
          <Trophy className="w-6 h-6 text-red-400" />
          Leaderboard
        </h1>
        <p className="text-sm text-slate-400 mt-1">Real-time Top 100 rankings for GTH TechVerse 2026.</p>
      </div>

      {/* Podium for top 3 */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto my-8 items-end">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="text-center p-5 rounded-2xl bg-slate-800/20 border border-slate-700/30 space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-slate-350 to-slate-450 flex items-center justify-center text-white shadow-lg">
                <Medal className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 mx-auto rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-xs">
                {getInitials(topThree[1].student.user.name)}
              </div>
              <div>
                <p className="text-white font-bold text-xs truncate max-w-[100px] mx-auto">{topThree[1].student.user.name}</p>
                <p className="text-[9px] text-slate-500 truncate max-w-[90px] mx-auto">
                  {topThree[1].student.team?.name || 'No Team'}
                </p>
              </div>
              <p className="text-sm font-black text-slate-300 font-mono">{topThree[1].totalPoints} XP</p>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="text-center p-6 rounded-2xl bg-slate-800/35 border border-slate-700/50 space-y-2.5 ring-1 ring-red-500/20 scale-105">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white shadow-lg">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="w-12 h-12 mx-auto rounded-lg bg-red-500/15 flex items-center justify-center text-red-400 font-bold text-sm">
                {getInitials(topThree[0].student.user.name)}
              </div>
              <div>
                <p className="text-white font-bold text-sm truncate max-w-[120px] mx-auto">{topThree[0].student.user.name}</p>
                <p className="text-[10px] text-slate-550 truncate max-w-[100px] mx-auto">
                  {topThree[0].student.team?.name || 'No Team'}
                </p>
              </div>
              <p className="text-base font-black text-red-400 font-mono">{topThree[0].totalPoints} XP</p>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="text-center p-5 rounded-2xl bg-slate-800/20 border border-slate-700/30 space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-red-700 to-amber-700 flex items-center justify-center text-white shadow-lg">
                <Award className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 mx-auto rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-xs">
                {getInitials(topThree[2].student.user.name)}
              </div>
              <div>
                <p className="text-white font-bold text-xs truncate max-w-[100px] mx-auto">{topThree[2].student.user.name}</p>
                <p className="text-[9px] text-slate-500 truncate max-w-[90px] mx-auto">
                  {topThree[2].student.team?.name || 'No Team'}
                </p>
              </div>
              <p className="text-sm font-black text-slate-400 font-mono">{topThree[2].totalPoints} XP</p>
            </div>
          )}
        </div>
      )}

      {/* Search Input */}
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-800/30 border border-slate-700/30">
        <Search className="w-4 h-4 text-slate-550" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by student name or enrollment..."
          className="bg-transparent text-sm text-white placeholder-slate-550 outline-none w-full"
        />
      </div>

      {/* Rankings Table */}
      <div className="rounded-2xl bg-slate-800/15 border border-slate-700/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                <th className="px-5 py-4 font-semibold">Rank</th>
                <th className="px-5 py-4 font-semibold">Student</th>
                <th className="px-5 py-4 font-semibold">Team</th>
                <th className="px-5 py-4 text-right font-semibold">Projects</th>
                <th className="px-5 py-4 text-right font-semibold">Tasks / Community</th>
                <th className="px-5 py-4 text-right font-semibold">Referrals</th>
                <th className="px-5 py-4 text-right font-semibold">Total XP</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-800/50 hover:bg-slate-900/10 transition-colors">
                  <td className="px-5 py-3.5 font-bold font-mono text-slate-400">
                    {entry.rank <= 3 ? (
                      <span className="inline-flex w-6 h-6 rounded bg-red-500/10 text-red-400 items-center justify-center text-[10px]">
                        {entry.rank}
                      </span>
                    ) : (
                      <span>{entry.rank}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-[10px]">
                        {getInitials(entry.student.user.name)}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-xs leading-tight">{entry.student.user.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{entry.student.enrollmentNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">
                    {entry.student.team?.name || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-350">{entry.projectScore} XP</td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-350">{entry.communityScore} XP</td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-350">{entry.referralScore} XP</td>
                  <td className="px-5 py-3.5 text-right font-bold text-red-400 font-mono">{entry.totalPoints} XP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
