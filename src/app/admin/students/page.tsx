'use client'
import { Users, Search, Download, Plus, Filter, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Student {
  id: string
  name: string
  email: string
  enrollment: string
  branch: string
  year: number
  team: string
  points: number
}

export default function StudentsAdmin() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/students')
      .then(res => res.json())
      .then(data => {
        if (data.students) setStudents(data.students)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.enrollment.toLowerCase().includes(search.toLowerCase()) ||
    s.team.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading students list...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          <Users className="w-6 h-6 inline mr-2 text-red-400" /> Students
        </h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl bg-slate-800/50 text-slate-400 text-sm flex items-center gap-1.5 hover:text-white"><Download className="w-3.5 h-3.5" /> Export</button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white text-sm flex items-center gap-1.5 font-semibold"><Plus className="w-3.5 h-3.5" /> Add</button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <Search className="w-4 h-4 text-slate-550" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students by name, enrollment or team..." className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full" />
        </div>
        <button className="px-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:text-white"><Filter className="w-4 h-4" /></button>
      </div>

      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-700/40 text-slate-400">
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">Student</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">Branch</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase">Team</th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase">Points</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-500 text-sm">
                  No students match your search criteria.
                </td>
              </tr>
            ) : (
              filtered.map(s => (
                <tr key={s.id} className="border-b border-slate-700/20 hover:bg-slate-700/10 transition-all cursor-pointer">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {s.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{s.name}</p>
                        <p className="text-xs text-slate-505 font-mono mt-0.5">{s.enrollment}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{s.branch}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{s.team}</td>
                  <td className="px-5 py-3.5 text-right text-sm text-red-400 font-bold font-mono">{s.points} XP</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
