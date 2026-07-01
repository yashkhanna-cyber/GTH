'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Award, Search, Loader2, Users } from 'lucide-react'

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

interface TeamEntry {
  rank: number
  teamName: string
  totalPoints: number
  memberCount: number
  members: {
    name: string
    avatar: string | null
  }[]
}

export default function StudentLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [teams, setTeams] = useState<TeamEntry[]>([])
  const [activeTab, setActiveTab] = useState<'individual' | 'teams'>('individual')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard)
        }
        if (data.teamsLeaderboard) {
          setTeams(data.teamsLeaderboard)
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  // Clear search on tab change
  const handleTabChange = (tab: 'individual' | 'teams') => {
    setActiveTab(tab)
    setSearch('')
  }

  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.student.user.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredTeams = teams.filter(t =>
    t.teamName.toLowerCase().includes(search.toLowerCase())
  )

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

  const topThree = leaderboard.slice(0, 3)
  const topTeams = teams.slice(0, 3)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5" style={{ fontFamily: 'var(--font-display)' }}>
            <Trophy className="w-6 h-6 text-red-400" />
            Leaderboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time rankings for GTH TechVerse 2026.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => handleTabChange('individual')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'individual' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Individual Rankings
          </button>
          <button
            onClick={() => handleTabChange('teams')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'teams' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Team Rankings
          </button>
        </div>
      </div>

      {activeTab === 'individual' ? (
        <>
          {/* Individual Podium */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto my-8 items-end">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="text-center p-5 rounded-2xl bg-slate-800/20 border border-slate-700/30 space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-slate-350 to-slate-450 flex items-center justify-center text-white shadow-lg">
                    <Medal className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 mx-auto rounded-lg overflow-hidden border border-slate-700 bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-xs">
                    {topThree[1].student.user.avatar ? (
                      <img src={topThree[1].student.user.avatar} alt={topThree[1].student.user.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(topThree[1].student.user.name)
                    )}
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
                  <div className="w-12 h-12 mx-auto rounded-lg overflow-hidden border border-slate-650 bg-red-500/15 flex items-center justify-center text-red-400 font-bold text-sm">
                    {topThree[0].student.user.avatar ? (
                      <img src={topThree[0].student.user.avatar} alt={topThree[0].student.user.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(topThree[0].student.user.name)
                    )}
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
                  <div className="w-10 h-10 mx-auto rounded-lg overflow-hidden border border-slate-700 bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-xs">
                    {topThree[2].student.user.avatar ? (
                      <img src={topThree[2].student.user.avatar} alt={topThree[2].student.user.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(topThree[2].student.user.name)
                    )}
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
            <Search className="w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name..."
              className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
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
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-[10px]">
                            {entry.student.user.avatar ? (
                              <img src={entry.student.user.avatar} alt={entry.student.user.name} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(entry.student.user.name)
                            )}
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
                      <td className="px-5 py-3.5 text-right font-mono text-slate-400">{entry.projectScore} XP</td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-400">{entry.communityScore} XP</td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-400">{entry.referralScore} XP</td>
                      <td className="px-5 py-3.5 text-right font-bold text-red-400 font-mono">{entry.totalPoints} XP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Teams Podium */}
          {topTeams.length > 0 && (
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto my-8 items-end">
              {/* 2nd Place Team */}
              {topTeams[1] && (
                <div className="text-center p-5 rounded-2xl bg-slate-800/20 border border-slate-700/30 space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-slate-350 to-slate-450 flex items-center justify-center text-white shadow-lg">
                    <Medal className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 mx-auto rounded-lg overflow-hidden border border-slate-700 bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-xs">
                    {topTeams[1].teamName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold text-xs truncate max-w-[100px] mx-auto">{topTeams[1].teamName}</p>
                    <p className="text-[9px] text-slate-500 truncate max-w-[90px] mx-auto">
                      {topTeams[1].memberCount} Members
                    </p>
                  </div>
                  <p className="text-sm font-black text-slate-300 font-mono">{topTeams[1].totalPoints} XP</p>
                </div>
              )}

              {/* 1st Place Team */}
              {topTeams[0] && (
                <div className="text-center p-6 rounded-2xl bg-slate-800/35 border border-slate-700/50 space-y-2.5 ring-1 ring-red-500/20 scale-105">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white shadow-lg">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div className="w-12 h-12 mx-auto rounded-lg overflow-hidden border border-slate-650 bg-red-500/15 flex items-center justify-center text-red-400 font-bold text-sm">
                    {topTeams[0].teamName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm truncate max-w-[120px] mx-auto">{topTeams[0].teamName}</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[100px] mx-auto">
                      {topTeams[0].memberCount} Members
                    </p>
                  </div>
                  <p className="text-base font-black text-red-400 font-mono">{topTeams[0].totalPoints} XP</p>
                </div>
              )}

              {/* 3rd Place Team */}
              {topTeams[2] && (
                <div className="text-center p-5 rounded-2xl bg-slate-800/20 border border-slate-700/30 space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-red-700 to-amber-700 flex items-center justify-center text-white shadow-lg">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 mx-auto rounded-lg overflow-hidden border border-slate-700 bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-xs">
                    {topTeams[2].teamName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold text-xs truncate max-w-[100px] mx-auto">{topTeams[2].teamName}</p>
                    <p className="text-[9px] text-slate-500 truncate max-w-[90px] mx-auto">
                      {topTeams[2].memberCount} Members
                    </p>
                  </div>
                  <p className="text-sm font-black text-slate-400 font-mono">{topTeams[2].totalPoints} XP</p>
                </div>
              )}
            </div>
          )}

          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by team name..."
              className="bg-transparent text-sm text-white placeholder-slate-550 outline-none w-full"
            />
          </div>

          {/* Teams Table */}
          <div className="rounded-2xl bg-slate-800/15 border border-slate-700/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                    <th className="px-5 py-4 font-semibold">Rank</th>
                    <th className="px-5 py-4 font-semibold">Team Name</th>
                    <th className="px-5 py-4 font-semibold">Members Count</th>
                    <th className="px-5 py-4 font-semibold">Top Members</th>
                    <th className="px-5 py-4 text-right font-semibold">Total Team XP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((t) => (
                    <tr key={t.teamName} className="border-b border-slate-800/50 hover:bg-slate-900/10 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-400">
                        {t.rank <= 3 ? (
                          <span className="inline-flex w-6 h-6 rounded bg-red-500/10 text-red-400 items-center justify-center text-[10px]">
                            {t.rank}
                          </span>
                        ) : (
                          <span>{t.rank}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-white">
                        {t.teamName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {t.memberCount} Students
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex -space-x-2 overflow-hidden">
                          {t.members.map((m, idx) => (
                            <div key={idx} className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-red-500/10 flex items-center justify-center text-[8px] text-red-400 font-bold overflow-hidden" title={m.name}>
                              {m.avatar ? (
                                <img src={m.avatar} alt={m.name} className="h-full w-full object-cover" />
                              ) : (
                                m.name.split(' ').map(n => n[0]).join('').substring(0, 1).toUpperCase()
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-red-400 font-mono">{t.totalPoints} XP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
