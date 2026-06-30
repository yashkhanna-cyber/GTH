'use client'

import { useEffect, useRef, useState } from 'react'
import { Globe } from 'lucide-react'
import { Github, Linkedin } from '@/components/icons/SocialIcons'

const mentors = [
  {
    name: 'Dr. Priya Sharma',
    role: 'AI & Machine Learning Lead',
    bio: 'PhD in Computer Science, IIT Delhi. 8+ years in AI research and industry.',
    specialties: ['Deep Learning', 'NLP', 'Computer Vision'],
    gradient: 'from-purple-500 to-indigo-500',
    initial: 'PS',
  },
  {
    name: 'Arjun Patel',
    role: 'IoT & Embedded Systems Expert',
    bio: 'Ex-Qualcomm engineer. Builds IoT solutions for smart cities and agriculture.',
    specialties: ['ESP32', 'Arduino', 'MQTT', 'Sensors'],
    gradient: 'from-cyan-500 to-blue-500',
    initial: 'AP',
  },
  {
    name: 'Meera Krishnan',
    role: 'Cybersecurity Specialist',
    bio: 'OSCP certified. Red team lead at a Fortune 500 company. Bug bounty hunter.',
    specialties: ['Ethical Hacking', 'Network Security', 'CTF'],
    gradient: 'from-emerald-500 to-green-500',
    initial: 'MK',
  },
  {
    name: 'Vikram Singh',
    role: 'Full-Stack & Cloud Architect',
    bio: 'AWS Solutions Architect. Open source contributor. 10+ years building scalable apps.',
    specialties: ['React', 'Node.js', 'AWS', 'DevOps'],
    gradient: 'from-red-500 to-red-500',
    initial: 'VS',
  },
]

export default function MentorsSection() {
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
    <section id="mentors" ref={ref} className="relative py-24 sm:py-32 bg-[#0f172a]">
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[150px]" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-red-400 text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">Expert Guidance</span>
          <h2 className="section-title text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Meet Our{' '}<span className="gradient-text">Mentors</span>
          </h2>
          <p className="section-subtitle text-slate-400 mx-auto">
            Industry experts and researchers who will guide you through every project
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mentors.map((mentor, i) => (
            <div
              key={mentor.name}
              className={`group relative text-center p-6 rounded-2xl bg-slate-800/30 border border-slate-700/40 hover:border-slate-600/50 transition-all duration-500 hover:-translate-y-1 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Avatar */}
              <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${mentor.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <span className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {mentor.initial}
                </span>
              </div>

              <h3 className="text-white font-bold text-lg mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                {mentor.name}
              </h3>
              <p className="text-red-400 text-xs font-semibold mb-3">{mentor.role}</p>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{mentor.bio}</p>

              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                {mentor.specialties.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-md bg-slate-700/50 text-[10px] text-slate-300 font-medium">{s}</span>
                ))}
              </div>

              <div className="flex justify-center gap-2">
                {[Linkedin, Github, Globe].map((Icon, j) => (
                  <button key={j} className="w-8 h-8 rounded-lg bg-slate-700/40 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600/50 transition-all">
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
