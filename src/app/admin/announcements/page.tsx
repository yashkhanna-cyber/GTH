'use client'
import { Construction } from 'lucide-react'

export default function AdminPage() {
  const pageName = typeof window !== 'undefined' ? window.location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Page' : 'Page'
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-red-400" />
      </div>
      <h1 className="text-2xl font-bold text-white capitalize mb-2" style={{ fontFamily: 'var(--font-display)' }}>{pageName}</h1>
      <p className="text-sm text-slate-400 max-w-md">This admin page is ready for your data. Connect the API routes to see live information here.</p>
    </div>
  )
}
