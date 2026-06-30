'use client'

import { useState, useEffect } from 'react'
import { Trophy, Search, Loader2, X, GraduationCap, Award, Calendar, ChevronRight, AlertCircle, CheckCircle2, History, Send, ClipboardList, Plus, Minus } from 'lucide-react'

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
      email: string
    }
  }
}

interface ScoreLog {
  id: string
  points: number
  reason: string
  category: string
  createdAt: string
  awardedBy: {
    name: string
  } | null
}

interface TaskSubmission {
  id: string
  status: string
  pointsAwarded: number
  submittedAt: string
  task: {
    name: string
  }
}

export default function AdminLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Detail drawer states
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [scoreLogs, setScoreLogs] = useState<ScoreLog[]>([])
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([])
  const [referralCount, setReferralCount] = useState(0)

  // Points adjustment form states
  const [adjType, setAdjType] = useState<'ADD' | 'SUBTRACT'>('ADD')
  const [adjPoints, setAdjPoints] = useState<number | ''>('')
  const [adjReason, setAdjReason] = useState('')
  const [adjSubmitting, setAdjSubmitting] = useState(false)
  const [adjError, setAdjError] = useState<string | null>(null)
  const [adjSuccess, setAdjSuccess] = useState<string | null>(null)

  const [detailTab, setDetailTab] = useState<'ANALYTICS' | 'ADJUST'>('ANALYTICS')

  const fetchLeaderboard = () => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        if (data.leaderboard) setLeaderboard(data.leaderboard)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchStudentProfile = async (studentId: string) => {
    setDetailLoading(true)
    setProfile(null)
    setScoreLogs([])
    setSubmissions([])
    setReferralCount(0)
    setAdjPoints('')
    setAdjReason('')
    setAdjError(null)
    setAdjSuccess(null)

    try {
      const res = await fetch(`/api/admin/students/${studentId}`)
      const data = await res.json()
      if (data.student) setProfile(data.student)
      if (data.scoreLogs) setScoreLogs(data.scoreLogs)
      if (data.taskSubmissions) setSubmissions(data.taskSubmissions)
      if (data.referralCount !== undefined) setReferralCount(data.referralCount)
    } catch (err) {
      console.error(err)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentProfile(selectedStudentId)
    }
  }, [selectedStudentId])

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId || !adjPoints || !adjReason) {
      setAdjError('Please enter points and reason.')
      return
    }

    setAdjSubmitting(true)
    setAdjError(null)
    setAdjSuccess(null)

    try {
      const res = await fetch(`/api/admin/students/${selectedStudentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(adjPoints),
          type: adjType,
          reason: adjReason
        })
      })
      const data = await res.json()

      if (data.error) {
        setAdjError(data.error)
      } else {
        setAdjSuccess('Points adjusted successfully!')
        setAdjPoints('')
        setAdjReason('')
        // Refresh profile data
        fetchStudentProfile(selectedStudentId)
        // Refresh leaderboard ranks
        fetchLeaderboard()
      }
    } catch {
      setAdjError('Failed to adjust points.')
    } finally {
      setAdjSubmitting(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.student.user.name.toLowerCase().includes(search.toLowerCase()) ||
    entry.student.enrollmentNo.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading leaderboard rankings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <Trophy className="w-6 h-6 text-red-400" />
          Leaderboard & Students Analytics
        </h1>
        <p className="text-sm text-slate-400 mt-1">Review student performance, view historical task submissions, and manually adjust points.</p>
      </div>

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

      {/* Leaderboard Table */}
      <div className="rounded-2xl bg-[#0b1120] border border-slate-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-550 font-semibold">
                <th className="px-5 py-4 font-semibold">Rank</th>
                <th className="px-5 py-4 font-semibold">Student</th>
                <th className="px-5 py-4 font-semibold">Team</th>
                <th className="px-5 py-4 text-right font-semibold">Project XP</th>
                <th className="px-5 py-4 text-right font-semibold">Community XP</th>
                <th className="px-5 py-4 text-right font-semibold">Referrals</th>
                <th className="px-5 py-4 text-right font-semibold">Total XP</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
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
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedStudentId(entry.student.id)}
                      className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-bold transition-all"
                    >
                      Analyze Profile <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile Drawer / Modal */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedStudentId(null)} />
          
          <div className="relative z-10 w-full max-w-xl h-full bg-[#0b1120] border-l border-slate-850 p-6 shadow-2xl flex flex-col justify-between">
            {detailLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                <p className="text-slate-400 text-sm">Fetching student analytics...</p>
              </div>
            ) : profile ? (
              <div className="flex-1 flex flex-col justify-between h-full overflow-hidden">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
                  {/* Profile Header */}
                  <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                    <div>
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Student Profile Analytics</p>
                      <h2 className="text-white font-bold text-lg leading-tight mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                        {profile.user.name}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Enrollment: {profile.enrollmentNo} {profile.batch ? `• Batch: ${profile.batch}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{profile.user.email}</p>
                    </div>
                    <button onClick={() => setSelectedStudentId(null)} className="text-slate-500 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary Scores row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-900/60 border border-slate-850 p-3.5 text-center">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Current Rank</p>
                      <p className="text-lg font-black text-red-400 font-mono mt-0.5">#{profile.leaderboard?.rank || '—'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 border border-slate-850 p-3.5 text-center">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Total Score</p>
                      <p className="text-lg font-black text-white font-mono mt-0.5">{profile.leaderboard?.totalPoints || 0} XP</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 border border-slate-850 p-3.5 text-center">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Referrals</p>
                      <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">{referralCount}</p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-slate-850 gap-6">
                    <button
                      onClick={() => setDetailTab('ANALYTICS')}
                      className={`pb-2 text-xs font-bold transition-all relative uppercase tracking-wider ${
                        detailTab === 'ANALYTICS' ? 'text-white' : 'text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      History & Logs
                      {detailTab === 'ANALYTICS' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />}
                    </button>
                    <button
                      onClick={() => setDetailTab('ADJUST')}
                      className={`pb-2 text-xs font-bold transition-all relative uppercase tracking-wider ${
                        detailTab === 'ADJUST' ? 'text-white' : 'text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      Adjust Points
                      {detailTab === 'ADJUST' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />}
                    </button>
                  </div>

                  {detailTab === 'ANALYTICS' ? (
                    <div className="space-y-6">
                      {/* Score adjustments logs */}
                      <div className="space-y-3">
                        <h4 className="text-white font-bold text-xs flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                          <History className="w-4 h-4 text-red-400" />
                          Points Adjustments History
                        </h4>
                        
                        {scoreLogs.length === 0 ? (
                          <p className="text-slate-550 text-xs italic">No points history entries found.</p>
                        ) : (
                          <div className="space-y-2">
                            {scoreLogs.map(log => (
                              <div key={log.id} className="p-3 rounded-xl bg-slate-900/40 border border-slate-850 flex items-center justify-between text-xs gap-3">
                                <div>
                                  <p className="font-semibold text-slate-300">{log.reason}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    {log.awardedBy ? `By: ${log.awardedBy.name} • ` : ''}
                                    {new Date(log.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className={`font-bold font-mono text-sm shrink-0 ${log.points >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {log.points >= 0 ? `+${log.points}` : log.points}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tasks submissions history */}
                      <div className="space-y-3">
                        <h4 className="text-white font-bold text-xs flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                          <ClipboardList className="w-4 h-4 text-red-400" />
                          Task Submissions
                        </h4>

                        {submissions.length === 0 ? (
                          <p className="text-slate-550 text-xs italic">No task submissions uploaded.</p>
                        ) : (
                          <div className="space-y-2">
                            {submissions.map(sub => (
                              <div key={sub.id} className="p-3 rounded-xl bg-slate-900/40 border border-slate-850 flex items-center justify-between text-xs gap-3">
                                <div>
                                  <p className="font-semibold text-slate-300">{sub.task.name}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    Status: <span className="font-semibold uppercase text-red-400">{sub.status}</span> • {new Date(sub.submittedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className="font-bold text-slate-400 shrink-0">
                                  {sub.status === 'APPROVED' ? `+${sub.pointsAwarded} XP` : '0 XP'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ADJUST TAB */
                    <div className="rounded-xl bg-slate-900/40 border border-slate-850 p-5 space-y-4">
                      <h4 className="text-white font-bold text-xs" style={{ fontFamily: 'var(--font-display)' }}>
                        Add / Subtract Student Points manually
                      </h4>

                      <form onSubmit={handleAdjustPoints} className="space-y-4">
                        {adjError && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{adjError}</span>
                          </div>
                        )}

                        {adjSuccess && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{adjSuccess}</span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-400 uppercase">Adjustment Type</label>
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => setAdjType('ADD')}
                              className={`py-2.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                                adjType === 'ADD'
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Score (+)
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdjType('SUBTRACT')}
                              className={`py-2.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                                adjType === 'SUBTRACT'
                                  ? 'bg-red-500/15 border-red-500/40 text-red-400'
                                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
                              }`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                              Subtract Score (-)
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-400 uppercase">Amount (XP Points)</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 50"
                            value={adjPoints}
                            onChange={e => setAdjPoints(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl bg-slate-950/40 border border-slate-800 text-white focus:outline-none focus:border-red-500 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-400 uppercase">Reason / Remarks</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Write a detailed reason for manual score adjustments..."
                            value={adjReason}
                            onChange={e => setAdjReason(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-950/40 border border-slate-800 text-white focus:outline-none focus:border-red-500 text-sm resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={adjSubmitting}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold text-xs hover:shadow-lg hover:shadow-red-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 font-bold"
                        >
                          {adjSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Submit Score Adjustment
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-550 text-xs">Failed to load student analytics.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
