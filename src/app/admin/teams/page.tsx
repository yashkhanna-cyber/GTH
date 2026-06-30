'use client'

import React, { useState, useEffect } from 'react'
import { 
  Users, Crown, Trophy, Edit, Trash2, Award, Heart, 
  ChevronDown, ChevronUp, Plus, Loader2, AlertCircle, 
  Check, X, Search 
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

interface TeamItem {
  id: string
  name: string
  tagline: string
  mentor: string
  leaderId: string
  leaderName: string
  members: TeamMember[]
  totalPoints: number
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Expandable team row states
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({})

  // Modal states
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null)
  const [activeModal, setActiveModal] = useState<'EDIT' | 'DELETE' | 'POINTS' | 'APPRECIATE' | null>(null)

  // Form states
  const [editName, setEditName] = useState('')
  const [editTagline, setEditTagline] = useState('')
  const [editMentor, setEditMentor] = useState('')
  
  const [pointsVal, setPointsVal] = useState('')
  const [pointsReason, setPointsReason] = useState('')
  
  const [appreciationMsg, setAppreciationMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch all teams
  const fetchTeams = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/teams')
      const data = await res.json()
      if (data.success) {
        setTeams(data.teams)
      } else {
        setError(data.error || 'Failed to load teams')
      }
    } catch {
      setError('Connection issue. Please reload page.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  const toggleExpand = (teamId: string) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }))
  }

  const openModal = (team: TeamItem, mode: 'EDIT' | 'DELETE' | 'POINTS' | 'APPRECIATE') => {
    setSelectedTeam(team)
    setActiveModal(mode)
    setError(null)
    setSuccessMsg(null)

    // Prepopulate
    if (mode === 'EDIT') {
      setEditName(team.name)
      setEditTagline(team.tagline)
      setEditMentor(team.mentor)
    } else if (mode === 'POINTS') {
      setPointsVal('')
      setPointsReason('')
    } else if (mode === 'APPRECIATE') {
      setAppreciationMsg('')
    }
  }

  const closeModal = () => {
    setSelectedTeam(null)
    setActiveModal(null)
  }

  // Handle action submission
  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam || !activeModal) return

    setSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    let payload: any = {
      action: activeModal,
      teamId: selectedTeam.id
    }

    if (activeModal === 'EDIT') {
      payload.teamName = editName
      payload.tagline = editTagline
      payload.mentor = editMentor
    } else if (activeModal === 'POINTS') {
      payload.points = parseInt(pointsVal)
      payload.reason = pointsReason
      if (isNaN(payload.points)) {
        setError('Points must be a valid integer.')
        setSubmitting(false)
        return
      }
    } else if (activeModal === 'APPRECIATE') {
      payload.message = appreciationMsg
    }

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMsg(data.message || 'Action completed successfully!')
        setTimeout(() => {
          closeModal()
          fetchTeams()
        }, 1200)
      } else {
        setError(data.error || 'Failed to execute command')
      }
    } catch {
      setError('Connection failure. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter teams list
  const filteredTeams = teams.filter(t => {
    const term = searchQuery.toLowerCase()
    return (
      t.name.toLowerCase().includes(term) ||
      (t.tagline && t.tagline.toLowerCase().includes(term)) ||
      (t.mentor && t.mentor.toLowerCase().includes(term)) ||
      (t.leaderName && t.leaderName.toLowerCase().includes(term))
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <Users className="w-6 h-6 text-orange-500" />
            Teams Management
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage formed student teams, assign mentors, adjust team points, and send high-priority team appreciations.
          </p>
        </div>
      </div>

      {/* Search and general status messages */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search teams by name, tagline, leader or mentor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/40 border border-slate-700/60 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-red-500/40 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span>Fetching bootcamp teams...</span>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/10 text-slate-500 text-xs">
          <Users className="w-10 h-10 mx-auto mb-2 text-slate-700" />
          No teams found. Let students invite and accept team members first.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTeams.map((team) => {
            const isExpanded = expandedTeams[team.id]
            return (
              <div key={team.id} className="rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden transition-all hover:border-slate-700/60">
                {/* Team summary header bar */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none" onClick={() => toggleExpand(team.id)}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold text-white">{team.name}</h3>
                      {team.mentor ? (
                        <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Mentor: {team.mentor}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-750 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          No Mentor Assigned
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400">
                        {team.members.length} Members
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 italic">"{team.tagline}"</p>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Leader: <strong className="text-slate-350">{team.leaderName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0" onClick={e => e.stopPropagation()}>
                    {/* Points details */}
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Points</p>
                      <p className="text-base font-black text-orange-400 font-mono mt-0.5">{team.totalPoints.toLocaleString()}</p>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openModal(team, 'POINTS')}
                        className="p-2 rounded-lg bg-slate-850 hover:bg-orange-500/10 text-slate-400 hover:text-orange-400 border border-slate-800 transition-colors"
                        title="Modify Team Points"
                      >
                        <Award className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal(team, 'APPRECIATE')}
                        className="p-2 rounded-lg bg-slate-850 hover:bg-pink-500/10 text-slate-400 hover:text-pink-400 border border-slate-800 transition-colors"
                        title="Appreciate Team"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal(team, 'EDIT')}
                        className="p-2 rounded-lg bg-slate-850 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 border border-slate-800 transition-colors"
                        title="Edit Team Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal(team, 'DELETE')}
                        className="p-2 rounded-lg bg-slate-850 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors"
                        title="Delete Team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Accordion toggle */}
                    <button 
                      onClick={() => toggleExpand(team.id)}
                      className="p-2 text-slate-500 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Members list */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-850 bg-slate-950/40">
                    <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-3">Team Roster</h4>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {team.members.map((m) => (
                        <div key={m.id} className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-850 flex items-center gap-3">
                          {m.photo ? (
                            <img src={m.photo} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-850 border border-slate-750 flex items-center justify-center text-xs font-bold uppercase text-slate-400">
                              {m.name.substring(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{m.name}</p>
                              {m.role === 'Leader' && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                              {m.enrollmentNo || 'No Enroll'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-orange-400 font-mono">{m.points}</p>
                            <p className="text-[9px] text-slate-500">pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Action Modals */}
      {activeModal && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Error & Success banner in modal */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Modal Edit Form */}
            {activeModal === 'EDIT' && (
              <form onSubmit={handleSubmitAction} className="space-y-4">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Edit Team Details</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Team Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 outline-none focus:border-indigo-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tagline</label>
                  <input
                    type="text"
                    required
                    value={editTagline}
                    onChange={e => setEditTagline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 outline-none focus:border-indigo-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign Mentor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Kumar"
                    value={editMentor}
                    onChange={e => setEditMentor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 outline-none focus:border-indigo-500/40 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {/* Modal Delete Form */}
            {activeModal === 'DELETE' && (
              <form onSubmit={handleSubmitAction} className="space-y-4">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Delete Team</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to delete team <strong className="text-white">{selectedTeam.name}</strong>?
                  This will clear the team name for all <strong className="text-white">{selectedTeam.members.length}</strong> members and allow them to form or join another team.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 bg-slate-850 text-slate-350 hover:bg-slate-800 text-xs font-bold rounded-xl border border-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center"
                  >
                    {submitting ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              </form>
            )}

            {/* Modal Points Form */}
            {activeModal === 'POINTS' && (
              <form onSubmit={handleSubmitAction} className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                  <Award className="w-5 h-5 text-orange-400" /> Adjust Team Points
                </h3>
                <p className="text-xs text-slate-400 leading-normal">
                  The point modification value will be applied individually to all <strong className="text-white">{selectedTeam.members.length} members</strong> of team <strong className="text-orange-400 font-semibold">{selectedTeam.name}</strong>.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Points Change Amount</label>
                  <input
                    type="number"
                    required
                    placeholder="Use positive e.g. 50, or negative e.g. -20"
                    value={pointsVal}
                    onChange={e => setPointsVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 outline-none focus:border-orange-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Excellent presentation delivery"
                    value={pointsReason}
                    onChange={e => setPointsReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 outline-none focus:border-orange-500/40 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-orange-500/10"
                >
                  {submitting ? 'Applying Points...' : 'Apply Points'}
                </button>
              </form>
            )}

            {/* Modal Appreciation Form */}
            {activeModal === 'APPRECIATE' && (
              <form onSubmit={handleSubmitAction} className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                  <Heart className="w-5 h-5 text-pink-500" /> Appreciate Team
                </h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Write a congratulatory message. This will send a high-priority system notification to all members of <strong className="text-pink-400 font-semibold">{selectedTeam.name}</strong>.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Message</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Outstanding work on the first project deliverable! Proud of your collaboration..."
                    value={appreciationMsg}
                    onChange={e => setAppreciationMsg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 outline-none focus:border-pink-500/40 transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-pink-500/10"
                >
                  {submitting ? 'Sending...' : 'Send Appreciation'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
