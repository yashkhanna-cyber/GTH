'use client'

import React, { useState, useEffect } from 'react'
import { BadgeCheck, Download, Calendar, Info, RefreshCw, Trophy, Lock, ShieldAlert, Award } from 'lucide-react'
import CertificateModal from '@/components/CertificateModal'

interface Certificate {
  id: string
  title: string
  description: string
  requiredXp: number
  unlocked: boolean
  date: string
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [studentName, setStudentName] = useState('')
  const [studentPoints, setStudentPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal active certificate details
  const [activeCert, setActiveCert] = useState<Certificate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/certificates')
      const data = await res.json()
      if (data.success) {
        setCertificates(data.certificates)
        setStudentName(data.studentName)
        setStudentPoints(data.studentPoints)
      } else {
        setError(data.error || 'Failed to load certificates')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCertificates()
  }, [])

  const handleOpenCertificate = (cert: Certificate) => {
    setActiveCert(cert)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <BadgeCheck className="w-6 h-6 text-red-500" /> My Certificates
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Track and print your dynamic credentials earned throughout the GTH TechVerse bootcamp.
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl shrink-0 self-start sm:self-center">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-slate-400">My Score: <strong className="text-white font-bold">{studentPoints} XP</strong></span>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
        <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-red-400 font-bold text-sm">Dynamic XP unlocking</h3>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Certificates are locked based on XP goals set by administrators. Once you reach the required points by completing tasks on time, you can instantly claim and download your verified certificates.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-550 text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
          <span>Loading credentials...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      ) : certificates.length === 0 ? (
        <div className="p-16 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 text-center text-slate-550 text-xs max-w-xl mx-auto my-12">
          <Award className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <h3 className="text-white font-bold text-sm mb-1">No Credentials Listed</h3>
          <p className="text-slate-400 text-xs">
            The administrator has not published any certificate goals yet.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {certificates.map(c => {
            const progressPct = Math.min((studentPoints / c.requiredXp) * 100, 100)
            return (
              <div
                key={c.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between gap-5 transition-all ${
                  c.unlocked
                    ? 'bg-gradient-to-br from-slate-900/40 via-red-500/5 to-slate-900/40 border-red-500/20 shadow-lg shadow-red-500/2'
                    : 'bg-slate-800/10 border-slate-750/40 opacity-70'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                    c.unlocked ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    {c.unlocked ? <BadgeCheck className="w-6 h-6 animate-pulse" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white leading-snug">{c.title}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      XP Target: {c.requiredXp} • Issued {c.date}
                    </p>
                  </div>
                </div>

                {!c.unlocked && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Unlock Progress ({studentPoints}/{c.requiredXp} XP)</span>
                      <span>{Math.round(progressPct)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-850 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-650 to-red-500 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-4">
                  {c.unlocked ? (
                    <>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/25">
                        UNLOCKED & ACTIVE
                      </span>
                      <button
                        onClick={() => handleOpenCertificate(c)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/10 hover:shadow-red-600/20"
                      >
                        <Download className="w-3.5 h-3.5" /> View Certificate
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-800">
                        LOCKED
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold bg-red-500/5 px-3 py-1.5 rounded-xl border border-red-500/15">
                        Earn {c.requiredXp - studentPoints} more XP
                      </span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Render Certificate Modal */}
      {activeCert && (
        <CertificateModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setActiveCert(null)
          }}
          studentName={studentName}
          certificateTitle={activeCert.title}
          certificateDescription={activeCert.description}
          certificateId={`GTH-CERT-${activeCert.id.slice(0, 8).toUpperCase()}`}
          issueDate={activeCert.date}
        />
      )}
    </div>
  )
}
