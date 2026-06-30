'use client'

import React, { useState, useEffect } from 'react'
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

interface AttendanceRecord {
  id: string
  date: string
  day: string
  status: 'PRESENT' | 'ABSENT'
  time: string
}

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [rate, setRate] = useState(100)
  const [presentCount, setPresentCount] = useState(0)
  const [absentCount, setAbsentCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttendance = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/attendance')
      const data = await res.json()
      if (data.success) {
        setAttendance(data.attendance)
        setRate(data.rate)
        setPresentCount(data.presentCount)
        setAbsentCount(data.absentCount)
        setTotalCount(data.totalCount)
      } else {
        setError(data.error || 'Failed to fetch attendance data')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-white flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <CalendarCheck className="w-6 h-6 text-red-500" />
          My Attendance
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Review your attendance history and track check-ins. Keep rate at 100% to avoid score penalties.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
          <span>Loading attendance details...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      ) : (
        <>
          {/* Penalty warning banner when rate is < 100% */}
          {rate < 100 && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-400 font-bold text-sm">Attendance Penalty Active (-10 points per absence)</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Your current attendance is {rate}%. Because it is below 100%, an automated penalty of -10 points has been deducted for each absent mark. Keep up with daily sessions to preserve your overall score!
                </p>
              </div>
            </div>
          )}

          {/* Stats widgets */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div
              className={`p-5 rounded-2xl border text-center ${
                rate === 100
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              <p
                className={`text-3xl font-black ${rate === 100 ? 'text-emerald-400' : 'text-red-400'}`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {rate}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Attendance Rate</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/40 text-center">
              <p className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {presentCount}/{totalCount}
              </p>
              <p className="text-xs text-slate-400 mt-1">Sessions Present</p>
            </div>

            <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
              <p className="text-3xl font-black text-red-400" style={{ fontFamily: 'var(--font-display)' }}>
                {absentCount}
              </p>
              <p className="text-xs text-slate-400 mt-1">Sessions Absent</p>
            </div>
          </div>

          {/* Session history checklist */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Check-in History
            </h3>
            {attendance.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-800/10 border border-slate-850 text-center text-slate-500 text-xs">
                No attendance logs found yet.
              </div>
            ) : (
              attendance.map((record) => {
                const isPresent = record.status === 'PRESENT'
                const StatusIcon = isPresent ? CheckCircle2 : XCircle
                const statusColor = isPresent ? 'text-emerald-400' : 'text-red-400'
                const statusBg = isPresent ? 'bg-emerald-500/5' : 'bg-red-500/5'

                return (
                  <div
                    key={record.id}
                    className={`rounded-xl border p-4 flex items-center gap-4 ${statusBg} ${
                      isPresent ? 'border-emerald-500/15' : 'border-red-500/15'
                    }`}
                  >
                    <StatusIcon className={`w-5 h-5 ${statusColor} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {record.day} — {record.date}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isPresent ? `Checked in at ${record.time}` : 'No check-in record'}
                      </p>
                    </div>
                    <span className={`text-xs font-bold ${statusColor} uppercase tracking-wider`}>
                      {isPresent ? 'Present' : 'Absent'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
