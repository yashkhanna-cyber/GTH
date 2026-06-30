'use client'

import { useEffect, useRef, useState } from 'react'
import { Target, Eye, Lightbulb, GraduationCap, Users, Code } from 'lucide-react'

const items = [
  {
    icon: Target,
    title: 'Our Mission',
    desc: 'To bridge the gap between academic learning and industry-ready skills through immersive, hands-on bootcamps that prepare students for the future of technology.',
    color: 'from-red-500 to-red-500',
  },
  {
    icon: Eye,
    title: 'Our Vision',
    desc: 'To create a thriving tech community at Geeta University where innovation meets execution, fostering the next generation of tech leaders and entrepreneurs.',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Lightbulb,
    title: 'Innovation First',
    desc: 'Every project, every challenge, every session is designed to push creative boundaries and encourage students to think beyond conventional solutions.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: GraduationCap,
    title: 'Learn by Doing',
    desc: 'No boring lectures. Build real IoT devices, train AI models, and hack (ethically!) systems — all with expert mentors guiding you step by step.',
    color: 'from-emerald-500 to-green-500',
  },
  {
    icon: Users,
    title: 'Team Spirit',
    desc: 'Form teams, collaborate on projects, compete on the leaderboard, and forge connections that last beyond the bootcamp.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Code,
    title: 'Future Skills',
    desc: 'AI, IoT, Cybersecurity, ESP32, Computer Vision, Neural Networks — master the technologies that define tomorrow\'s careers.',
    color: 'from-amber-500 to-red-500',
  },
]

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref])
  return visible
}

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const visible = useInView(sectionRef)

  return (
    <section id="about" ref={sectionRef} className="relative py-24 sm:py-32 bg-[#0f172a]">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-red-400 text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">
            About the Bootcamp
          </span>
          <h2 className="section-title text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Why{' '}
            <span className="gradient-text">TechVerse?</span>
          </h2>
          <p className="section-subtitle text-slate-400 mx-auto">
            GTH TechVerse 2026 is a 3-day intensive bootcamp organized by the Geeta Technical Hub,
            School of Computer Science & Engineering at Geeta University.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div
              key={item.title}
              className={`group relative p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-500 hover:-translate-y-1 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {item.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
