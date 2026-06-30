'use client'

import { useEffect, useRef, useState } from 'react'
import { Trophy, Users, Wrench, BookOpen, Rocket, Monitor, Award, Clock } from 'lucide-react'

const highlights = [
  { icon: Trophy, title: '₹50K+ Prizes', desc: 'Win cash prizes, gadgets, and exclusive goodies', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: Users, title: '200+ Students', desc: 'Network with passionate peers from all departments', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Wrench, title: 'Hardware Lab', desc: 'ESP32, sensors, servos, cameras — all provided', color: 'text-green-400', bg: 'bg-green-500/10' },
  { icon: BookOpen, title: '4 Major Projects', desc: 'Build gesture-controlled servos, AI face RGB, and more', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: Rocket, title: 'Real-World Skills', desc: 'Learn what matters: AI, IoT, Cybersecurity fundamentals', color: 'text-red-400', bg: 'bg-red-500/10' },
  { icon: Monitor, title: 'Live Dashboard', desc: 'Track your progress, scores, and rank in real-time', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { icon: Award, title: 'Certificates', desc: 'Get verifiable certificates with unique QR codes', color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { icon: Clock, title: '3 Intense Days', desc: 'Non-stop learning, coding, building, and competing', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
]

export default function HighlightsSection() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="highlights" ref={ref} className="relative py-24 sm:py-32 bg-[#0b1120]">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-red-400 text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">What Awaits You</span>
          <h2 className="section-title text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Bootcamp{' '}<span className="gradient-text">Highlights</span>
          </h2>
          <p className="section-subtitle text-slate-400 mx-auto">
            Everything you need for an unforgettable tech experience
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {highlights.map((item, i) => (
            <div
              key={item.title}
              className={`group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/40 hover:border-slate-600/60 transition-all duration-500 hover:-translate-y-1 cursor-default ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="text-white font-bold mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
