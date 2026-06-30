'use client'

import Link from 'next/link'
import { Sparkles, Mail, Phone, MapPin, Globe, ArrowUp } from 'lucide-react'
import { Github, Linkedin, Instagram } from '@/components/icons/SocialIcons'

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative bg-[#070c18] border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-lg block leading-tight" style={{ fontFamily: 'var(--font-display)' }}>GTH TechVerse</span>
                <span className="text-orange-400/80 text-[10px] font-semibold tracking-[0.2em] uppercase">2026</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Future Skills Bootcamp by Geeta Technical Hub, School of Computer Science & Engineering, Geeta University.
            </p>
            <div className="flex gap-2">
              {[Github, Linkedin, Globe, Instagram].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4" style={{ fontFamily: 'var(--font-display)' }}>Quick Links</h3>
            <ul className="space-y-2.5">
              {['About', 'Projects', 'Mentors', 'Prizes', 'Register'].map((link) => (
                <li key={link}>
                  <a href={link === 'Register' ? '/register' : `#${link.toLowerCase()}`} className="text-sm text-slate-400 hover:text-orange-400 transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4" style={{ fontFamily: 'var(--font-display)' }}>Platform</h3>
            <ul className="space-y-2.5">
              {[
                { name: 'Student Dashboard', href: '/dashboard' },
                { name: 'Leaderboard', href: '/dashboard/leaderboard' },
                { name: 'Submit Project', href: '/dashboard/projects' },
                { name: 'Certificates', href: '/dashboard/certificates' },
                { name: 'Admin Panel', href: '/admin' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-orange-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4" style={{ fontFamily: 'var(--font-display)' }}>Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-400">Geeta University, Panipat, Haryana, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                <a href="mailto:gth@geeta.edu.in" className="text-sm text-slate-400 hover:text-orange-400 transition-colors">gth@geeta.edu.in</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                <a href="tel:+919876543210" className="text-sm text-slate-400 hover:text-orange-400 transition-colors">+91 98765 43210</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2026 Geeta Technical Hub. All rights reserved.
          </p>
          <button
            onClick={scrollToTop}
            className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all hover:-translate-y-0.5"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  )
}
