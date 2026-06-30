'use client'

import { useState, useEffect } from 'react'
import { Share2, Users, Award, Calendar, Loader2, Search } from 'lucide-react'

interface ReferrerLeaderboardItem {
  name: string
  email: string
  count: number
  points: number
}

interface ReferralLog {
  id: string
  referralCode: string
  pointsAwarded: number
  createdAt: string
  referrerStudent: {
    enrollmentNo: string
    user: {
      name: string
    }
  }
  newStudent: {
    enrollmentNo: string
    user: {
      name: string
    }
  }
}

export default function AdminReferralsPage() {
  const [logs, setLogs] = useState<ReferralLog[]>([])
  const [leaderboard, setLeaderboard] = useState<ReferrerLeaderboardItem[]>([])
  const [stats, setStats] = useState({ totalReferrals: 0, totalPoints: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/referrals')
      .then(r => r.json())
      .then(data => {
        if (data.referrals) setLogs(data.referrals)
        if (data.stats) {
          setStats({
            totalReferrals: data.stats.totalReferrals,
            totalPoints: data.stats.totalPoints
          })
          if (data.stats.referralLeaderboard) {
            setLeaderboard(data.stats.referralLeaderboard)
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase()
    return (
      log.referrerStudent.user.name.toLowerCase().includes(query) ||
      log.newStudent.user.name.toLowerCase().includes(query) ||
      log.referralCode.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading referrals statistics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <Share2 className="w-6 h-6 text-red-400" />
          Referrals Tracking
        </h1>
        <p className="text-sm text-slate-400 mt-1">Monitor sharing codes, referral bonuses, and referral leaderboard rankings.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-[#0b1120] border border-slate-800/60 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Referrals Made</p>
            <p className="text-2xl font-bold text-white mt-0.5">{stats.totalReferrals}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0b1120] border border-slate-800/60 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Referral XP Granted</p>
            <p className="text-2xl font-bold text-white mt-0.5">+{stats.totalPoints} XP</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Referral Leaderboard */}
        <div className="lg:col-span-1 rounded-2xl bg-[#0b1120] border border-slate-800/60 p-5 space-y-4">
          <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
            Referral Leaderboard
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {leaderboard.length === 0 ? (
              <p className="text-slate-550 text-xs text-center py-6">No referral rankings available.</p>
            ) : (
              leaderboard.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-xs text-white">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">{item.count} Refers</p>
                    <p className="text-[9px] text-emerald-400">+{item.points} XP</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Global Referral Logs */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0b1120] border border-slate-800/60 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
              Referral Logs
            </h3>
            
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search referrer, referee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 outline-none text-slate-300 placeholder-slate-550 text-xs w-full"
              />
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No referral logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                    <th className="pb-3 font-semibold">Referrer</th>
                    <th className="pb-3 font-semibold">Referee</th>
                    <th className="pb-3 font-semibold">Code Used</th>
                    <th className="pb-3 font-semibold">Referred Date</th>
                    <th className="pb-3 text-right font-semibold">XP Granted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-900/10 transition-colors">
                      <td className="py-3.5">
                        <p className="text-white font-medium">{log.referrerStudent.user.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{log.referrerStudent.enrollmentNo}</p>
                      </td>
                      <td className="py-3.5">
                        <p className="text-slate-300 font-medium">{log.newStudent.user.name}</p>
                        <p className="text-[10px] text-slate-550 font-mono">{log.newStudent.enrollmentNo}</p>
                      </td>
                      <td className="py-3.5 text-slate-400 font-mono">{log.referralCode}</td>
                      <td className="py-3.5 text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-bold text-emerald-400">+{log.pointsAwarded} XP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
