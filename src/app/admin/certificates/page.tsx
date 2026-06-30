'use client'

import React, { useState, useEffect } from 'react'
import { Award, Plus, RefreshCw, Trophy, AlertCircle, FileText, CheckCircle2, ChevronRight } from 'lucide-react'

interface CertificateTemplate {
  id: string
  title: string
  description: string
  required_xp: number
  created_at: string
}

interface StudentStats {
  id: string
  full_name: string
  enrollment_no: string
  total_points: number
}

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateTemplate[]>([])
  const [students, setStudents] = useState<StudentStats[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requiredXp, setRequiredXp] = useState(100)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const resCert = await fetch('/api/admin/certificates')
      const dataCert = await resCert.json()
      if (dataCert.success) {
        setCertificates(dataCert.certificates)
      } else {
        setError(dataCert.error || 'Failed to load certificates')
      }

      // Fetch students to calculate eligibility
      const resStud = await fetch('/api/admin/students')
      const dataStud = await resStud.json()
      if (dataStud.students) {
        setStudents(dataStud.students)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch certificates data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError('Title and Description are required')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          requiredXp,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setTitle('')
        setDescription('')
        setRequiredXp(100)
        fetchData()
      } else {
        setError(data.error || 'Failed to create certificate template')
      }
    } catch (err) {
      console.error(err)
      setError('Network error. Failed to save template.')
    } finally {
      setSubmitting(false)
    }
  }

  // Helper to count eligible students
  const countEligible = (reqXp: number) => {
    return students.filter(s => s.total_points >= reqXp).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <Award className="w-6 h-6 text-red-500" /> Certificate Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure dynamic certificate criteria. Students will auto-unlock credentials upon reaching XP goals.
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
        {/* Compose Form */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/20 p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Plus className="w-4 h-4 text-red-500" /> Create Certificate
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-455 mb-1.5 uppercase tracking-wider">Certificate Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Certificate of Appreciation"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-455 mb-1.5 uppercase tracking-wider">Appreciation Description</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. for outstanding performance and demonstrating exceptional technical expertise throughout the TechVerse 2026 bootcamp."
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-455 mb-1.5 uppercase tracking-wider">Required XP Goal</label>
                <div className="relative">
                  <Trophy className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    required
                    min={0}
                    value={requiredXp}
                    onChange={(e) => setRequiredXp(parseInt(e.target.value) || 0)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all text-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-550 mt-1">
                  Students will automatically unlock this certificate once their total points meet or exceed this target.
                </p>
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
                    <Award className="w-3.5 h-3.5" /> Save Template
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Templates List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/10 p-6">
            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <FileText className="w-4 h-4 text-red-500" /> Active Certificate Goals
            </h2>

            {loading ? (
              <div className="py-24 text-center text-slate-550 text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-red-550" />
                <span>Loading certificates list...</span>
              </div>
            ) : certificates.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                No certificates configured yet. Build your first template on the left!
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {certificates.map((cert) => {
                  const eligibleCount = countEligible(cert.required_xp)
                  return (
                    <div
                      key={cert.id}
                      className="p-5 rounded-2xl border border-slate-700/40 bg-slate-800/10 flex flex-col justify-between gap-4 transition-all hover:bg-slate-800/20"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-white leading-snug">{cert.title}</h3>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            {cert.required_xp} XP
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {cert.description}
                        </p>
                      </div>

                      <div className="border-t border-slate-850 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-red-500" />
                          <strong className="text-white">{eligibleCount}</strong> eligible students
                        </span>
                        <span className="font-mono text-[9px]">
                          Goal ID: {cert.id.slice(0, 8)}...
                        </span>
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
