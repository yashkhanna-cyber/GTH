'use client'

import { useEffect, useRef, useState } from 'react'
import { Trophy, Medal, Award, Star, Gift } from 'lucide-react'

const prizes = [
  {
    place: '1st Place',
    prize: '₹25,000',
    icon: Trophy,
    color: 'from-yellow-400 to-amber-500',
    shadow: 'shadow-amber-500/20',
    extras: ['Winner Certificate', 'Exclusive Swag Kit', 'LinkedIn Recommendation', 'Mentorship Access'],
    scale: 'lg:scale-110',
  },
  {
    place: '2nd Place',
    prize: '₹15,000',
    icon: Medal,
    color: 'from-slate-300 to-slate-400',
    shadow: 'shadow-slate-400/20',
    extras: ['Runner-up Certificate', 'Swag Kit', 'Course Vouchers'],
    scale: '',
  },
  {
    place: '3rd Place',
    prize: '₹10,000',
    icon: Award,
    color: 'from-red-700 to-amber-700',
    shadow: 'shadow-red-700/20',
    extras: ['Bronze Certificate', 'Swag Kit', 'Goodie Bag'],
    scale: '',
  },
]

const specialPrizes = [
  { title: 'Best AI Project', prize: '₹5,000', icon: Star },
  { title: 'Best IoT Project', prize: '₹5,000', icon: Star },
  { title: 'Most Innovative', prize: '₹5,000', icon: Star },
  { title: 'Community Champion', prize: 'Special Swag', icon: Gift },
]

export default function PrizesSection() {
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
    <section id="prizes" ref={ref} className="relative py-24 sm:py-32 bg-[#0b1120]">
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[150px]" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-red-400 text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">Compete & Win</span>
          <h2 className="section-title text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Prizes &{' '}<span className="gradient-text">Rewards</span>
          </h2>
          <p className="section-subtitle text-slate-400 mx-auto">
            Over ₹50,000+ in prizes and exclusive rewards for top performers
          </p>
        </div>

        {/* Main Prizes */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 items-end">
          {[prizes[1], prizes[0], prizes[2]].map((prize, i) => (
            <div
              key={prize.place}
              className={`relative text-center p-8 rounded-2xl bg-slate-800/30 border border-slate-700/40 hover:border-slate-600/50 transition-all duration-500 hover:-translate-y-1 ${prize.scale} ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${prize.color} flex items-center justify-center mb-4 ${prize.shadow} shadow-lg`}>
                <prize.icon className="w-8 h-8 text-white" />
              </div>
              <p className="text-slate-400 text-sm font-semibold mb-1">{prize.place}</p>
              <p className="text-3xl font-black text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {prize.prize}
              </p>
              <ul className="space-y-2">
                {prize.extras.map((e) => (
                  <li key={e} className="text-sm text-slate-400 flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Special Prizes */}
        <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '600ms' }}>
          {specialPrizes.map((sp) => (
            <div key={sp.title} className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <sp.icon className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{sp.title}</p>
                <p className="text-red-400 text-xs font-bold">{sp.prize}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
