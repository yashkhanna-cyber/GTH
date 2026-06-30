'use client'
import { BadgeCheck, Download, ExternalLink } from 'lucide-react'

const certificates = [
  { id: 'GTH-CERT-001', type: 'PARTICIPATION', title: 'TechVerse 2026 Participation Certificate', date: 'July 17, 2026', ready: false },
  { id: 'GTH-CERT-002', type: 'CHALLENGE', title: 'AI Challenge Completion Certificate', date: 'July 15, 2026', ready: true },
]

export default function CertificatesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
        <BadgeCheck className="w-6 h-6 inline mr-2 text-orange-400" /> Certificates
      </h1>
      <div className="space-y-4">
        {certificates.map(c => (
          <div key={c.id} className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <BadgeCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">{c.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">ID: {c.id} • {c.date}</p>
            </div>
            {c.ready ? (
              <button className="px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-all flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            ) : (
              <span className="text-xs text-slate-500">Available after bootcamp</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
