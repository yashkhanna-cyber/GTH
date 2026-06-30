'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Cpu, Brain, Eye, Zap } from 'lucide-react'
import { Github } from '@/components/icons/SocialIcons'

const projects = [
  {
    title: 'Gesture-Controlled Servo Motor',
    desc: 'Build a system that uses hand gestures captured by a camera to control servo motor movements via ESP32. Real-time gesture recognition meets IoT.',
    difficulty: 'MEDIUM',
    tags: ['ESP32', 'OpenCV', 'Python', 'IoT'],
    icon: Cpu,
    gradient: 'from-red-500 to-red-500',
    day: 1,
  },
  {
    title: 'AI Face-Detected RGB LED',
    desc: 'Create an intelligent lighting system that detects faces using computer vision and changes RGB LED colors based on detected emotions or distance.',
    difficulty: 'HARD',
    tags: ['AI', 'Face Detection', 'ESP32', 'RGB LED'],
    icon: Eye,
    gradient: 'from-purple-500 to-indigo-500',
    day: 2,
  },
  {
    title: 'GenVision AI — Image Generator',
    desc: 'Build a generative AI application that creates images from text prompts using diffusion models. Deploy it as a web application.',
    difficulty: 'HARD',
    tags: ['GenAI', 'Stable Diffusion', 'Python', 'Web'],
    icon: Brain,
    gradient: 'from-cyan-500 to-blue-500',
    day: 2,
  },
  {
    title: 'NeuroVision — Real-time Classifier',
    desc: 'Train a neural network to classify objects in real-time using a webcam feed. Implement transfer learning for high accuracy with minimal data.',
    difficulty: 'EXPERT',
    tags: ['Neural Networks', 'TensorFlow', 'Computer Vision'],
    icon: Zap,
    gradient: 'from-emerald-500 to-teal-500',
    day: 3,
  },
]

const difficultyColors: Record<string, string> = {
  EASY: 'bg-green-500/15 text-green-400',
  MEDIUM: 'bg-yellow-500/15 text-yellow-400',
  HARD: 'bg-red-500/15 text-red-400',
  EXPERT: 'bg-red-500/15 text-red-400',
}

export default function ProjectsSection() {
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
    <section id="projects" ref={ref} className="relative py-24 sm:py-32 bg-[#0b1120]">
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-[150px]" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-red-400 text-sm font-semibold uppercase tracking-[0.2em] mb-3 block">Build & Ship</span>
          <h2 className="section-title text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Featured{' '}<span className="gradient-text">Projects</span>
          </h2>
          <p className="section-subtitle text-slate-400 mx-auto">
            Four hands-on projects that combine AI, IoT, and Cybersecurity
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project, i) => (
            <div
              key={project.title}
              className={`group relative overflow-hidden rounded-2xl bg-slate-800/30 border border-slate-700/40 hover:border-slate-600/50 transition-all duration-500 hover:-translate-y-1 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {/* Header */}
              <div className={`h-2 bg-gradient-to-r ${project.gradient}`} />
              
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${project.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <project.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${difficultyColors[project.difficulty]}`}>
                        {project.difficulty}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Day {project.day}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                      {project.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed mb-5">
                  {project.desc}
                </p>

                <div className="flex flex-wrap gap-2 mb-5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-slate-700/50 text-xs text-slate-300 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors font-medium">
                    <ExternalLink className="w-3.5 h-3.5" /> View Details
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors font-medium">
                    <Github className="w-3.5 h-3.5" /> Starter Code
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
