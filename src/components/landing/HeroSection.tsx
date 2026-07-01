'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Cpu, Brain, Shield, Wifi, Zap, Rocket } from 'lucide-react'

const floatingCards = [
  { icon: Brain, label: 'AI & ML', color: 'from-purple-500 to-indigo-600', delay: '0s', x: '10%', y: '25%' },
  { icon: Cpu, label: 'IoT', color: 'from-cyan-500 to-blue-600', delay: '1s', x: '80%', y: '20%' },
  { icon: Shield, label: 'Cyber Security', color: 'from-emerald-500 to-green-600', delay: '2s', x: '75%', y: '65%' },
  { icon: Wifi, label: 'ESP32', color: 'from-red-500 to-red-600', delay: '0.5s', x: '15%', y: '70%' },
  { icon: Zap, label: 'Neural Net', color: 'from-yellow-500 to-amber-600', delay: '1.5s', x: '50%', y: '80%' },
]

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    setMounted(true)
    const target = new Date('2026-07-15T09:00:00+05:30').getTime()
    const timer = setInterval(() => {
      const now = Date.now()
      const diff = target - now
      if (diff <= 0) { clearInterval(timer); return }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Floating Tech Cards */}
      {mounted && floatingCards.map((card, i) => (
        <div
          key={i}
          className="absolute hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl glass-dark opacity-0"
          style={{
            left: card.x,
            top: card.y,
            animation: `float 6s ease-in-out infinite, fadeIn 1s ease-out ${card.delay} forwards`,
            animationDelay: card.delay,
          }}
        >
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
            <card.icon className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <span className="text-white/90 text-sm font-medium">{card.label}</span>
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-28 pb-20">
        {/* Branding Badge */}
        <div className="flex flex-col items-center gap-3 mb-8 animate-slideDown" style={{ animationDelay: '0.2s' }}>
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-widest">Presented By</span>
            <div className="h-6 px-1.5 bg-white rounded flex items-center justify-center">
              <img src="/geeta-logo.png" alt="Geeta University Logo" className="h-4.5 object-contain" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-sm text-red-300 font-medium">
            <Rocket className="w-4 h-4 animate-pulse" />
            <span>3-Day Intensive Bootcamp • July 15-17, 2026</span>
          </div>
        </div>

        {/* Heading */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight mb-6 opacity-0 animate-slideUp"
          style={{ fontFamily: 'var(--font-display)', animationDelay: '0.4s', animationFillMode: 'forwards' }}
        >
          GTH{' '}
          <span className="gradient-text">TechVerse</span>
          <br />
          <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white/60">2026</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed opacity-0 animate-slideUp" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          Future Skills Bootcamp by{' '}
          <span className="text-white font-semibold">Geeta Technical Hub</span>
          {' '}— Build real projects in AI, IoT & Cybersecurity. Compete, learn, and win.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 opacity-0 animate-slideUp" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
          <Link
            href="/register"
            className="btn-primary text-base px-8 py-4 rounded-2xl shadow-xl shadow-red-500/20"
          >
            Register for Bootcamp
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#about"
            className="btn-secondary text-base px-8 py-4 rounded-2xl"
          >
            Learn More
          </a>
        </div>

        {/* Countdown */}
        <div className="opacity-0 animate-slideUp" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4 font-semibold">Bootcamp Starts In</p>
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            {[
              { label: 'Days', value: countdown.days },
              { label: 'Hours', value: countdown.hours },
              { label: 'Minutes', value: countdown.minutes },
              { label: 'Seconds', value: countdown.seconds },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl glass-dark flex items-center justify-center mb-2">
                  <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                    {String(item.value).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f172a] to-transparent" />
    </section>
  )
}
