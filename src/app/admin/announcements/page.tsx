'use client'

import React, { useState, useEffect } from 'react'
import { Megaphone, Plus, Trash, RefreshCw, Send, AlertCircle, Info, CheckCircle2, Zap, AlertTriangle, Users } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  target_group: string
  created_at: string
}

interface Team {
  id: string
  team_name: string
}

const typeOptions = [
  { label: 'Info (Blue)', value: 'INFO', icon: Info, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { label: 'Success (Green)', value: 'SUCCESS', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  { label: 'Warning (Yellow)', value: 'WARNING', icon: AlertTriangle, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  { label: 'Critical (Red)', value: 'ERROR', icon: Zap, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
]

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'>('INFO')
  const [targetType, setTargetType] = useState<'ALL' | 'TEAM' | 'BATCH'>('ALL')
  const [targetValue, setTargetValue] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const resAnn = await fetch('/api/admin/announcements')
      const dataAnn = await resAnn.json()
      if (dataAnn.success) {
        setAnnouncements(dataAnn.announcements)
      } else {
        setError(dataAnn.error || 'Failed to load announcements')
      }

      // Fetch teams for target selection
      const resTeams = await fetch('/api/admin/teams')
      const dataTeams = await resTeams.json()
      if (dataTeams.teams) {
        setTeams(dataTeams.teams)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      setError('Title and Message are required')
      return
    }

    setSubmitting(true)
    setError(null)

    let finalTargetGroup = 'ALL'
    if (targetType === 'TEAM' && targetValue) {
      finalTargetGroup = `team:${targetValue}`
    } else if (targetType === 'BATCH' && targetValue) {
      finalTargetGroup = `batch:${targetValue}`
    }

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          type,
          targetGroup: finalTargetGroup,
        }),
      })

      const data = await res.json()
      if (data.success) {
        // Clear form
        setTitle('')
        setMessage('')
        setType('INFO')
        setTargetType('ALL')
        setTargetValue('')
        // Refresh list
        fetchData()
      } else {
        setError(data.error || 'Failed to create announcement')
      }
    } catch (err) {
      console.error(err)
      setError('Network error. Failed to publish announcement.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <Megaphone className="w-6 h-6 text-red-500" /> Announcements Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Broadcast daily updates, warnings, and bootcamp events to students.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2.5 rounded-xl border border-slate-700/60 text-slate-400 hover:text-white bg-slate-800/20 hover:bg-slate-800/40 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left/Compose Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/20 p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Plus className="w-4 h-4 text-red-500" /> Compose Broadcast
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-1.5 uppercase tracking-wider">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Session Starting in 15 Minutes!"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-1.5 uppercase tracking-wider">Broadcast Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type details, link to resources, or details about the challenge/session..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-2 uppercase tracking-wider">Alert Priority Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {typeOptions.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = type === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value as any)}
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-red-550/15 border-red-500/40 text-white font-semibold'
                            : 'bg-slate-800/20 border-slate-700/40 text-slate-400 hover:bg-slate-800/40'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px]">{opt.label.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-1.5 uppercase tracking-wider">Target Audience</label>
                <div className="flex gap-2 mb-2">
                  {(['ALL', 'TEAM', 'BATCH'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTargetType(t)
                        setTargetValue('')
                      }}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                        targetType === t
                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : 'bg-slate-800/40 border-slate-700/40 text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {targetType === 'TEAM' && (
                  <select
                    required
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all text-xs"
                  >
                    <option value="">Select Team...</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.team_name}>{team.team_name}</option>
                    ))}
                  </select>
                )}

                {targetType === 'BATCH' && (
                  <select
                    required
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all text-xs"
                  >
                    <option value="">Select Batch...</option>
                    <option value="Batch A">Batch A</option>
                    <option value="Batch B">Batch B</option>
                    <option value="Batch C">Batch C</option>
                  </select>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 rounded-xl bg-red-650 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-red-550/15 transition-all disabled:opacity-60"
              >
                {submitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Publish Announcement
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right/History List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/10 p-6">
            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Megaphone className="w-4 h-4 text-red-500" /> Broadcast History
            </h2>

            {loading ? (
              <div className="py-24 text-center text-slate-550 text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-red-550" />
                <span>Loading announcement history...</span>
              </div>
            ) : announcements.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                No past announcements found. Composed broadcasts will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => {
                  const typeOpt = typeOptions.find(o => o.value === ann.type) || typeOptions[0]
                  const Icon = typeOpt.icon
                  
                  return (
                    <div
                      key={ann.id}
                      className="p-5 rounded-2xl border border-slate-700/40 bg-slate-800/10 flex items-start gap-4 transition-all hover:bg-slate-800/20"
                    >
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${typeOpt.color}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{ann.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-800 border border-slate-700/60 text-slate-400 uppercase tracking-wider">
                              Target: {ann.target_group}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(ann.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-350 mt-2 leading-relaxed whitespace-pre-wrap">
                          {ann.message}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
