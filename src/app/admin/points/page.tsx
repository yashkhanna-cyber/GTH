'use client'
import { Trophy, Plus, Search, Send, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const categories = ['PROJECT', 'COMMUNITY', 'INNOVATION', 'REFERRAL', 'AI', 'IOT', 'CYBER']

interface StudentSuggestion {
  id: string
  name: string
  enrollment: string
  team: string
}

interface RecentScore {
  student: string
  points: number
  category: string
  reason: string
  time: string
}

export default function PointsAdmin() {
  const [students, setStudents] = useState<StudentSuggestion[]>([])
  const [recentScores, setRecentScores] = useState<RecentScore[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentSuggestion | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [form, setForm] = useState({ points: '', category: 'PROJECT', reason: '' })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchPointsData = () => {
    fetch('/api/admin/points')
      .then(r => r.json())
      .then(data => {
        if (data.recentScores) setRecentScores(data.recentScores)
      })
      .catch(err => console.error(err))
  }

  useEffect(() => {
    fetchPointsData()

    fetch('/api/admin/students')
      .then(r => r.json())
      .then(data => {
        if (data.students) setStudents(data.students)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filteredSuggestions = studentSearch
    ? students.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.enrollment.toLowerCase().includes(studentSearch.toLowerCase())
      ).slice(0, 5)
    : []

  const handleSelectStudent = (student: StudentSuggestion) => {
    setSelectedStudent(student)
    setStudentSearch(student.name)
    setShowSuggestions(false)
  }

  const handleClearStudent = () => {
    setSelectedStudent(null)
    setStudentSearch('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedStudent) {
      setError('Please select a student from the search suggestions.')
      return
    }

    const pointsNum = Number(form.points)
    if (!pointsNum || isNaN(pointsNum)) {
      setError('Please enter a valid non-zero points number.')
      return
    }

    if (!form.reason.trim()) {
      setError('Please enter a reason for the points change.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/admin/students/${selectedStudent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.abs(pointsNum),
          type: pointsNum >= 0 ? 'ADD' : 'SUBTRACT',
          reason: form.reason,
          category: form.category
        })
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(`Points successfully adjusted for ${selectedStudent.name}!`)
        // Reset form
        handleClearStudent()
        setForm({ points: '', category: 'PROJECT', reason: '' })
        // Reload recent score changes
        fetchPointsData()
      }
    } catch {
      setError('Failed to submit points adjustment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading points system...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
        <Trophy className="w-6 h-6 text-red-400" /> Points Management
      </h1>

      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6">
        <h3 className="text-white font-semibold mb-4">Add/Deduct Points</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Student search input with autocomplete suggestions */}
            <div className="relative">
              <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Search Student</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                <input
                  placeholder="Type student name or enrollment..."
                  value={studentSearch}
                  disabled={!!selectedStudent}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm disabled:opacity-60"
                />
                {selectedStudent && (
                  <button
                    type="button"
                    onClick={handleClearStudent}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl z-50 overflow-hidden">
                  {filteredSuggestions.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={() => handleSelectStudent(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-700/50 text-xs text-slate-200 flex items-center justify-between border-b border-slate-700/40 last:border-b-0"
                    >
                      <div>
                        <p className="font-bold text-white">{s.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{s.enrollment}</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-700 text-slate-350">{s.team}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Points Amount</label>
              <input
                type="number"
                placeholder="e.g. 50 (negative to deduct)"
                value={form.points}
                onChange={e => setForm({ ...form, points: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white text-sm focus:outline-none focus:border-red-500 appearance-none"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Reason</label>
              <input
                placeholder="Remarks / Award justification..."
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-60 transition-all"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Award Points
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6">
        <h3 className="text-white font-semibold mb-4">Recent Point Changes</h3>
        <div className="space-y-3">
          {recentScores.length === 0 ? (
            <p className="text-slate-500 text-sm">No recent point allocations found.</p>
          ) : (
            recentScores.map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-700/20 transition-all">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{s.student}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.reason} • {s.time}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-700/50 text-slate-350 uppercase tracking-wider">{s.category}</span>
                <span className={`text-sm font-bold font-mono ${s.points > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.points > 0 ? '+' : ''}{s.points} XP
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
