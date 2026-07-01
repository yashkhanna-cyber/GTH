'use client'

import React, { useRef, useEffect } from 'react'
import { X, Award, Printer, Download, Sparkles, ShieldCheck } from 'lucide-react'
import confetti from 'canvas-confetti'

interface CertificateModalProps {
  isOpen: boolean
  onClose: () => void
  studentName: string
  certificateTitle: string
  certificateDescription: string
  certificateId: string
  issueDate: string
}

export default function CertificateModal({
  isOpen,
  onClose,
  studentName,
  certificateTitle,
  certificateDescription,
  certificateId,
  issueDate
}: CertificateModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Trigger a beautiful confetti celebration
      const duration = 2 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML
    const originalContent = document.body.innerHTML
    
    if (printContent) {
      // Create a temporary print stylesheet and window print framework
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Certificate - ${studentName}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @media print {
                  body {
                    margin: 0;
                    padding: 0;
                    background-color: #030712 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  .no-print {
                    display: none;
                  }
                }
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Orbitron:wght@500;700;900&family=Playfair+Display:ital,wght@0,600;0,800;1,600&display=swap');
              </style>
            </head>
            <body class="bg-slate-950 flex items-center justify-center min-h-screen p-0 m-0">
              <div class="w-[900px] h-[630px] p-1 bg-gradient-to-br from-red-600 via-amber-500 to-red-700 rounded-3xl relative overflow-hidden shadow-2xl">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }
              </script>
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Actions Header (No Print) */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="text-sm font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              Earned Credential
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-600/10 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Container (A4 Aspect Ratio: 1.414) */}
        <div className="p-6 md:p-8 flex items-center justify-center bg-slate-950 overflow-x-auto">
          
          {/* Printable Frame */}
          <div
            ref={printAreaRef}
            className="w-[850px] h-[580px] shrink-0 p-1 bg-gradient-to-br from-red-600 via-amber-500 to-red-700 rounded-2xl relative overflow-hidden"
          >
            {/* Inner Border Card */}
            <div className="w-full h-full bg-slate-950 rounded-[14px] p-8 flex flex-col justify-between relative overflow-hidden">
              
              {/* Tech Cyber Grid Background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }} />

              {/* Glowing decorative shapes */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

              {/* Tech Corner Brackets */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-red-500/35 rounded-tl-md pointer-events-none" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-red-500/35 rounded-tr-md pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-red-500/35 rounded-bl-md pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-red-500/35 rounded-br-md pointer-events-none" />

              {/* Logos Section */}
              <div className="flex justify-between items-center z-10">
                {/* 1st Place Logo: Geeta University Logo */}
                <div className="flex items-center gap-2">
                  <div className="h-11 px-3 bg-white rounded-lg flex items-center justify-center shadow-md border border-white/10">
                    <img src="/geeta-logo.png" alt="Geeta University Logo" className="h-8 object-contain" />
                  </div>
                </div>

                {/* Main Logo: GTH Logo */}
                <div className="flex items-center gap-2">
                  <div className="h-11 px-3 bg-white rounded-lg flex items-center justify-center shadow-md border border-white/10">
                    <img src="/gth-logo.jpg" alt="GTH Logo" className="h-8 object-contain" />
                  </div>
                </div>
              </div>

              {/* Certificate Core Content */}
              <div className="text-center my-auto space-y-4 z-10">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-red-500 tracking-[0.3em] uppercase block">
                    GTH TechVerse Bootcamp Credential
                  </span>
                  <h1 className="text-3xl font-extrabold text-white tracking-wider uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {certificateTitle}
                  </h1>
                </div>

                <div className="w-16 h-0.5 mx-auto bg-gradient-to-r from-red-500 to-amber-500" />

                <div className="space-y-3">
                  <p className="text-[11px] italic text-slate-400">
                    This is proudly presented to
                  </p>
                  <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-250 to-white italic py-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {studentName}
                  </h2>
                  <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed font-sans px-4">
                    {certificateDescription}
                  </p>
                </div>
              </div>

              {/* Footer details & signatures */}
              <div className="flex justify-between items-end border-t border-slate-800/60 pt-4 z-10">
                {/* Date & ID */}
                <div className="text-left space-y-1">
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">
                    Credential ID: <span className="text-slate-400 font-bold">{certificateId}</span>
                  </p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">
                    Issued Date: <span className="text-slate-400 font-bold">{issueDate}</span>
                  </p>
                </div>



                {/* Signatures */}
                <div className="flex gap-8">
                  <div className="text-center space-y-1.5">
                    <div className="w-20 h-0.5 bg-slate-700 mx-auto" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                      Program Director
                    </span>
                    <span className="text-[6px] text-slate-500 uppercase block font-medium">
                      Geeta Technical Hub
                    </span>
                  </div>
                  <div className="text-center space-y-1.5">
                    <div className="w-20 h-0.5 bg-slate-700 mx-auto" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                      Dean Academics
                    </span>
                    <span className="text-[6px] text-slate-500 uppercase block font-medium">
                      Geeta University
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
