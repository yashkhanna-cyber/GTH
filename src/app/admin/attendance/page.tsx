'use client'

import React, { useState, useEffect } from 'react'
import {
  CalendarCheck,
  Check,
  X,
  Search,
  Calendar,
  AlertCircle,
  RefreshCw,
  User,
  Users
} from 'lucide-react'

interface StudentAttendance {
  id: string
  name: string
  email: string
  photo: string | null
  enrollmentNo: string
  branch: string
  batch: string
  status: 'PRESENT' | 'ABSENT' | null
}

export default function AdminAttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [students, setStudents] = useState<StudentAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [needMigration, setNeedMigration] = useState(false)

  // Initialize selectedDate with today's date in local time (YYYY-MM-DD)
  useEffect(() => {
    const today = new Date()
    const offset = today.getTimezoneOffset()
    const localDate = new Date(today.getTime() - offset * 60 * 1000)
    setSelectedDate(localDate.toISOString().split('T')[0])
  }, [])

  const fetchAttendance = async () => {
    if (!selectedDate) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/attendance?date=${selectedDate}`)
      
      if (!res.ok) {
        // Handle non-200 responses without trying to parse broken JSON
        if (res.status === 401) {
          setError('Session expired. Please log in again.')
        } else {
          setError(`Server error (${res.status}). Please try again.`)
        }
        setStudents([])
        return
      }

      const data = await res.json()

      if (data.needMigration) {
        setNeedMigration(true)
        setError(data.error)
        setStudents([])
      } else if (data.success) {
        setStudents(data.students || [])
        setNeedMigration(false)
      } else {
        setError(data.error || 'Failed to fetch attendance records')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [selectedDate])

  const [editingStudents, setEditingStudents] = useState<Record<string, boolean>>({})
  const [localStatuses, setLocalStatuses] = useState<Record<string, 'PRESENT' | 'ABSENT' | null>>({})

  // Helper to check if a date is today (local timezone)
  const isDateEditable = (dateStr: string) => {
    if (!dateStr) return false
    const today = new Date()
    const offset = today.getTimezoneOffset()
    const localToday = new Date(today.getTime() - offset * 60 * 1000).toISOString().split('T')[0]
    return dateStr === localToday
  }

  const startEditing = (studentId: string) => {
    setEditingStudents(prev => ({ ...prev, [studentId]: true }))
  }

  const selectLocalStatus = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    setLocalStatuses(prev => ({ ...prev, [studentId]: status }))
  }

  const saveAttendance = async (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    setUpdatingId(studentId)
    setError(null)
    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          date: selectedDate,
          status
        })
      })

      const data = await res.json()
      if (data.success) {
        // Update local state to trigger rerender immediately
        setStudents(prev =>
          prev.map(s => (s.id === studentId ? { ...s, status } : s))
        )
        // Lock editing state for this student
        setEditingStudents(prev => ({ ...prev, [studentId]: false }))
        // Clear local state
        setLocalStatuses(prev => {
          const next = { ...prev }
          delete next[studentId]
          return next
        })
      } else {
        setError(data.error || 'Failed to update attendance')
      }
    } catch {
      setError('Failed to reach backend. Please try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  // Filter students based on search input
  const filteredStudents = students.filter(s => {
    const term = searchQuery.toLowerCase()
    return (
      s.name.toLowerCase().includes(term) ||
      (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(term)) ||
      (s.batch && s.batch.toLowerCase().includes(term))
    )
  })

  // Attendance stats counters
  const totalStudents = students.length
  const presentCount = students.filter(s => s.status === 'PRESENT').length
  const absentCount = students.filter(s => s.status === 'ABSENT').length
  const unmarkedCount = students.filter(s => s.status === null).length

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <CalendarCheck className="w-6 h-6 text-red-500" />
            Attendance Sheets
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Track student check-ins and apply point penalties for absences.
          </p>
        </div>

        {/* Date Selector input */}
        <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/60 rounded-xl px-3 py-1.5 self-start sm:self-center">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs text-white outline-none border-none cursor-pointer [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Migration Notification */}
      {needMigration && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-amber-400 font-bold text-sm">Database Schema Setup Required</h3>
              <p className="text-slate-400 text-xs mt-1">
                The database is missing the `attendance` table. Paste the following SQL script in your Supabase SQL Editor and click Run:
              </p>
            </div>
          </div>
          <pre className="bg-slate-950/70 p-4 rounded-xl text-[10px] font-mono text-slate-350 overflow-x-auto border border-slate-800">
{`-- Run this in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for own attendance or admins on attendance"
    ON public.attendance FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Allow write access for admins on attendance"
    ON public.attendance FOR ALL TO authenticated USING (public.is_admin(auth.uid()));`}
          </pre>
          <button
            onClick={fetchAttendance}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-check Database
          </button>
        </div>
      )}

      {error && !needMigration && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats counter cards */}
      {!needMigration && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/20 border border-slate-700/40 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Students</span>
            <span className="text-2xl font-bold text-white mt-1">{totalStudents}</span>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Present Today</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1">{presentCount}</span>
          </div>
          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-red-400 text-[10px] uppercase font-bold tracking-wider">Absent Today</span>
            <span className="text-2xl font-bold text-red-400 mt-1">{absentCount}</span>
          </div>
          <div className="bg-slate-800/10 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Unmarked</span>
            <span className="text-2xl font-bold text-slate-350 mt-1">{unmarkedCount}</span>
          </div>
        </div>
      )}

      {/* Students sheet list */}
      {!needMigration && (
        <div className="bg-slate-800/20 border border-slate-700/40 rounded-2xl p-6 space-y-4">
          {/* Search box input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search student by name, enrollment, batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/40 border border-slate-700/60 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-red-500/40 transition-colors"
            />
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
              <span>Loading attendance sheet...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              No students found for this search.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredStudents.map((student) => (
                <div key={student.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  {/* Left Side: Avatar and Student Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-350 font-bold text-xs shrink-0 uppercase">
                        {student.name.substring(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{student.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {student.enrollmentNo || 'No Enrollment'}
                        {student.batch && <span className="text-slate-650 mx-1.5">•</span>}
                        {student.batch}
                        {student.branch && <span className="text-slate-650 mx-1.5">•</span>}
                        {student.branch}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Quick Action buttons */}
                  <div className="flex items-center gap-2">
                    {!isDateEditable(selectedDate) ? (
                      // PAST DATE LOCK: Just show status or Unmarked
                      student.status ? (
                        <span
                          className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${
                            student.status === 'PRESENT'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {student.status}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-900/40 text-slate-500 border border-slate-800 uppercase tracking-wide">
                          Unmarked
                        </span>
                      )
                    ) : (
                      // EDITABLE TODAY: Custom Update & Toggle Flow
                      <>
                        {!(editingStudents[student.id] || student.status === null) ? (
                          // Locked State (Already Marked): Show Badge + "Update" button to unlock
                          <>
                            <span
                              className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${
                                student.status === 'PRESENT'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {student.status}
                            </span>
                            <button
                              onClick={() => startEditing(student.id)}
                              className="px-3 py-1.5 bg-slate-900/40 text-slate-400 border border-slate-800 rounded-xl hover:text-white hover:border-slate-700 text-xs font-semibold transition-all"
                            >
                              Update
                            </button>
                          </>
                        ) : (
                          // Editing State (or Unmarked): Show Tick + Cross + "Update" button to save
                          (() => {
                            const activeStatus = localStatuses[student.id] !== undefined 
                              ? localStatuses[student.id] 
                              : student.status;
                            return (
                              <>
                                {/* Present/Tick button */}
                                <button
                                  disabled={updatingId === student.id}
                                  onClick={() => selectLocalStatus(student.id, 'PRESENT')}
                                  className={`p-2 rounded-xl transition-all duration-200 border ${
                                    activeStatus === 'PRESENT'
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/35 hover:bg-emerald-500/30'
                                      : 'bg-slate-900/40 text-slate-500 border-slate-800 hover:text-emerald-400 hover:border-emerald-500/30'
                                  } disabled:opacity-50`}
                                  title="Mark Present"
                                >
                                  <Check className="w-4 h-4" />
                                </button>

                                {/* Absent/Cross button */}
                                <button
                                  disabled={updatingId === student.id}
                                  onClick={() => selectLocalStatus(student.id, 'ABSENT')}
                                  className={`p-2 rounded-xl transition-all duration-200 border ${
                                    activeStatus === 'ABSENT'
                                      ? 'bg-red-500/20 text-red-400 border-red-500/35 hover:bg-red-500/30'
                                      : 'bg-slate-900/40 text-slate-500 border-slate-800 hover:text-red-400 hover:border-red-500/30'
                                  } disabled:opacity-50`}
                                  title="Mark Absent"
                                >
                                  <X className="w-4 h-4" />
                                </button>

                                {/* Save/Update action button */}
                                <button
                                  disabled={updatingId === student.id || !activeStatus}
                                  onClick={() => activeStatus && saveAttendance(student.id, activeStatus)}
                                  className="px-3 py-1.5 bg-red-500 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-650 disabled:border-slate-850 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/10 flex items-center gap-1"
                                >
                                  {updatingId === student.id ? 'Saving...' : 'Update'}
                                </button>
                              </>
                            );
                          })()
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
