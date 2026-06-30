'use client'

import { useState, useEffect } from 'react'
import { Share2, Copy, Check, Users, Award, Calendar, Loader2 } from 'lucide-react'

interface Referral {
  id: string
  pointsAwarded: number
  createdAt: string
  newStudent: {
    enrollmentNo: string
    user: {
      name: string
      email: string
    }
  }
}

export default function StudentReferralsPage() {
  const [referralCode, setReferralCode] = useState('')
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referrals')
      .then(r => r.json())
      .then(data => {
        if (data.referralCode) setReferralCode(data.referralCode)
        if (data.referrals) setReferrals(data.referrals)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const copyToClipboard = () => {
    if (typeof window !== 'undefined' && referralCode) {
      navigator.clipboard.writeText(referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const totalPoints = referrals.reduce((sum, r) => sum + r.pointsAwarded, 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading referrals history...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5" style={{ fontFamily: 'var(--font-display)' }}>
          <Share2 className="w-6 h-6 text-red-400" />
          Referrals Program
        </h1>
        <p className="text-sm text-slate-400 mt-1">Invite your friends to GTH TechVerse 2026 and earn points when they register.</p>
      </div>

      {/* Grid: Code and Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Referral Code Card */}
        <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">My Referral Code</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Share your referral code with classmates. When they register using your code, you receive 10 points immediately.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono font-bold text-sm tracking-wider flex items-center justify-between">
              {referralCode || 'NOT AVAILABLE'}
            </div>
            <button
              onClick={copyToClipboard}
              disabled={!referralCode}
              className="px-4 py-3 rounded-xl bg-red-500 hover:bg-red-700 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-md shadow-red-500/10 shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-rows-2 gap-4">
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Referrals</p>
              <p className="text-xl font-bold text-white mt-0.5">{referrals.length}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Points Earned</p>
              <p className="text-xl font-bold text-white mt-0.5">+{totalPoints} XP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="rounded-2xl bg-slate-800/20 border border-slate-700/40 p-6 space-y-4">
        <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
          Referrals History
        </h3>

        {referrals.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No referral history found. Share your code to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                  <th className="pb-3 font-semibold">Student Name</th>
                  <th className="pb-3 font-semibold">Enrollment No.</th>
                  <th className="pb-3 font-semibold">Registration Date</th>
                  <th className="pb-3 text-right font-semibold">Points Earned</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-slate-800/50 hover:bg-slate-900/10 transition-colors">
                    <td className="py-3.5 text-white font-medium">{ref.newStudent.user.name}</td>
                    <td className="py-3.5 text-slate-400 font-mono">{ref.newStudent.enrollmentNo}</td>
                    <td className="py-3.5 text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-bold text-emerald-400">+{ref.pointsAwarded} XP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
