'use client'

import React, { useState, useEffect } from 'react'
import { 
  Users, Crown, Trophy, User, Sparkles, Send, Check, X, 
  Loader2, AlertCircle, Search, LogOut 
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  photo: string | null
  enrollmentNo: string
  branch: string
  batch: string
  points: number
  role: 'Leader' | 'Member'
}

interface PendingInvite {
  id: string
  teamId: string
  teamName: string
  tagline: string
  leaderName: string
}

interface EligibleStudent {
  id: string
  name: string
  email: string
  enrollmentNo: string
  branch: string
  batch: string
}

export default function TeamPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  // State for student inside a team
  const [inTeam, setInTeam] = useState(false)
  const [teamInfo, setTeamInfo] = useState<{
    id: string
    name: string
    tagline: string
    mentor: string | null
    leaderId: string
    members: TeamMember[]
    totalPoints: number
    rank: number
    totalTeams: number
  } | null>(null)

  // State for student NOT in a team
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [eligibleMembers, setEligibleMembers] = useState<EligibleStudent[]>([])
  
  // Create Team form state
  const [teamName, setTeamName] = useState('')
  const [tagline, setTagline] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch Team status
  const fetchTeamStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/team')
      const data = await res.json()
      if (data.success) {
        setInTeam(data.inTeam)
        if (data.inTeam) {
          setTeamInfo(data.team)
        } else {
          setPendingInvites(data.pendingInvitations || [])
          setEligibleMembers(data.eligibleMembers || [])
        }
      } else {
        setError(data.error || 'Failed to retrieve team status')
      }
    } catch {
      setError('Connection error. Please reload the page.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamStatus()
  }, [])

  // Create Team submission
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamName.trim() || !tagline.trim()) {
      setError('Team name and tagline are required.')
      return
    }

    // Validation: creator + selected = total size. Min 3, Max 5.
    // So selected must be 2 to 4.
    if (selectedMembers.length < 2 || selectedMembers.length > 4) {
      setError('A team must have minimum 3 and maximum 5 members. Please select between 2 and 4 team members.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: teamName.trim(),
          tagline: tagline.trim(),
          invitedStudentIds: selectedMembers
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMsg(data.message || 'Team created successfully!')
        // Reset form
        setTeamName('')
        setTagline('')
        setSelectedMembers([])
        // Refresh team status
        fetchTeamStatus()
      } else {
        setError(data.error || 'Failed to create team')
      }
    } catch {
      setError('Failed to reach server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle invitation actions (Accept/Decline)
  const handleInviteAction = async (inviteId: string, action: 'ACCEPT' | 'DECLINE') => {
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch('/api/team/invite-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, action })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMsg(data.message)
        fetchTeamStatus()
      } else {
        setError(data.error || 'Failed to record invite action')
      }
    } catch {
      setError('Network failure. Please try again.')
    }
  }

  const toggleSelectMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    )
  }

  // Filter eligible members list
  const filteredStudents = eligibleMembers.filter(s => {
    const term = searchQuery.toLowerCase()
    return (
      s.name.toLowerCase().includes(term) ||
      (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(term)) ||
      (s.branch && s.branch.toLowerCase().includes(term))
    )
  })

  // Loading indicator screen
  if (loading) {
    return (
      <div className="py-32 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span>Syncing team data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <Users className="w-6 h-6 text-orange-500" />
          My Team Dashboard
        </h1>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {inTeam && teamInfo ? (
        // ==========================================
        // UI FOR USERS IN A TEAM
        // ==========================================
        <div className="space-y-6">
          {/* Team Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-orange-600/10 via-amber-500/10 to-indigo-600/5 border border-slate-700/50 p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
              <div>
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-[0.2em] bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/10">Active Team</span>
                <h2 className="text-3xl font-black text-white mt-3" style={{ fontFamily: 'var(--font-display)' }}>{teamInfo.name}</h2>
                <p className="text-slate-400 text-sm mt-1.5 italic">"{teamInfo.tagline}"</p>
                {teamInfo.mentor ? (
                  <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-indigo-400" /> Assigned Mentor: <strong className="text-indigo-300 font-semibold">{teamInfo.mentor}</strong>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-3">Mentor: Not yet assigned by Admin</p>
                )}
              </div>
              <div className="flex gap-4 md:text-right">
                <div className="bg-slate-800/40 border border-slate-700/40 p-4 rounded-xl shrink-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Points</p>
                  <p className="text-2xl font-black text-orange-400 mt-1 font-mono">{teamInfo.totalPoints.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/40 p-4 rounded-xl shrink-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Team Rank</p>
                  <p className="text-2xl font-black text-white mt-1 font-mono">#{teamInfo.rank} <span className="text-xs text-slate-500 font-medium">/ {teamInfo.totalTeams}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Members Panel */}
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6">
            <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Team Members</h3>
            <div className="space-y-3">
              {teamInfo.members.map((m) => (
                <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-800/40 hover:bg-slate-700/10 transition-all">
                  {m.photo ? (
                    <img src={m.photo} alt={m.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-600/20 border border-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold uppercase">
                      {m.name.substring(0, 2)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-bold truncate">{m.name}</p>
                      {m.role === 'Leader' && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          <Crown className="w-2.5 h-2.5 shrink-0" /> Leader
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {m.enrollmentNo || 'No Enrollment'}
                      {m.branch && <span className="text-slate-700 mx-1.5">•</span>}
                      {m.branch}
                      {m.batch && <span className="text-slate-700 mx-1.5">•</span>}
                      {m.batch}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-orange-400 font-bold font-mono">{m.points.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">points</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Locked notice */}
            <div className="mt-6 flex items-start gap-2.5 p-3.5 bg-slate-900/40 border border-slate-850 rounded-xl">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-normal">
                <strong>Exit Policy:</strong> You have joined this team. Members cannot exit the team themselves to maintain project assignments. Please contact a bootcamp Admin if you need to make changes or leave this team.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // ==========================================
        // UI FOR USERS NOT IN A TEAM (CREATE / JOIN)
        // ==========================================
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create Team Card */}
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <Sparkles className="w-5 h-5 text-orange-400" />
                Create New Team
              </h2>
              <p className="text-xs text-slate-400 mt-1">Form a team with other registered students (min 3, max 5 members).</p>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Team Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Code Knights"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="w-full bg-slate-900/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500/40 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Team Tagline</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Crafting future solutions with code"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="w-full bg-slate-900/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500/40 transition-colors"
                />
              </div>

              {/* Members Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Invite Team Members ({selectedMembers.length} selected)</label>
                  <span className="text-[10px] text-slate-500">Need to select 2 to 4 members</span>
                </div>
                
                {/* Search input */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search unassigned students..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-750 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500/30 transition-colors"
                  />
                </div>

                {/* Students List */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-800 p-2">
                  {filteredStudents.length === 0 ? (
                    <div className="py-6 text-center text-slate-600 text-xs">
                      No eligible students found.
                    </div>
                  ) : (
                    filteredStudents.map((s) => {
                      const isSelected = selectedMembers.includes(s.id)
                      return (
                        <div 
                          key={s.id} 
                          onClick={() => toggleSelectMember(s.id)}
                          className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-orange-500/10 border border-orange-500/20 text-white' 
                              : 'hover:bg-slate-800/40 border border-transparent text-slate-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{s.name}</p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                              {s.enrollmentNo || 'No Enroll'} {s.branch && `• ${s.branch}`} {s.batch && `• ${s.batch}`}
                            </p>
                          </div>
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-700'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-650 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Invites...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Create Team & Send Invites
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Pending Invitations Card */}
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6 flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <Send className="w-5 h-5 text-amber-500 rotate-90" />
                Pending Invitations ({pendingInvites.length})
              </h2>
              <p className="text-xs text-slate-400 mt-1">Accept an invitation to join an active team. Once you accept, you cannot exit.</p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px]">
              {pendingInvites.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2 border border-dashed border-slate-850 rounded-xl">
                  <Users className="w-8 h-8 text-slate-750" />
                  <span>No pending team invitations found.</span>
                </div>
              ) : (
                pendingInvites.map((inv) => (
                  <div key={inv.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Invite</span>
                      <h4 className="text-sm font-bold text-white truncate mt-2">{inv.teamName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">"{inv.tagline}"</p>
                      <p className="text-[10px] text-slate-500 mt-2">Invited by: <strong className="text-slate-350">{inv.leaderName}</strong></p>
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleInviteAction(inv.id, 'ACCEPT')}
                        className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => handleInviteAction(inv.id, 'DECLINE')}
                        className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1 border border-slate-700/50 transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
