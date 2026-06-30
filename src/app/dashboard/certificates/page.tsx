'use client'

import React from 'react'
import { BadgeCheck, Download, Calendar, Info } from 'lucide-react'

const certificates = [
  { id: 'GTH-CERT-001', type: 'PARTICIPATION', title: 'TechVerse 2026 Participation Certificate', date: 'July 17, 2026', ready: false },
  { id: 'GTH-CERT-002', type: 'CHALLENGE', title: 'AI Challenge Completion Certificate', date: 'July 15, 2026', ready: false },
]

export default function CertificatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <BadgeCheck className="w-6 h-6 text-red-500" /> Certificates
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          View and download your earned bootcamp credentials and challenge certificates.
        </p>
      </div>

      {/* Prominent notice banner */}
      <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
        <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-orange-400 font-bold text-sm">Bootcamp Certificate Availability</h3>
          <p className="text-slate-350 text-xs mt-1">
            You will get the certificate once the camp is completed. Keep submitting your tasks on time to maintain eligibility.
          </p>
        </div>
      </div>

      {/* List of certificates */}
      <div className="space-y-4">
        {certificates.map(c => (
          <div key={c.id} className="rounded-2xl bg-slate-800/20 border border-slate-700/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <BadgeCheck className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{c.title}</h3>
                <p className="text-[11px] text-slate-550 font-mono mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  ID: {c.id} • Available on {c.date}
                </p>
              </div>
            </div>
            
            <div className="shrink-0">
              {c.ready ? (
                <button className="px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-all flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              ) : (
                <span className="text-xs font-medium text-slate-500 bg-slate-900/40 border border-slate-800/80 px-3 py-1.5 rounded-xl block text-center">
                  You will get the certificate once the camp is completed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
