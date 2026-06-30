'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Sparkles } from 'lucide-react'

const navLinks = [
  { name: 'About', href: '#about' },
  { name: 'Highlights', href: '#highlights' },
  { name: 'Projects', href: '#projects' },
  { name: 'Prizes', href: '#prizes' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'py-3 bg-[rgba(15,23,42,0.85)] backdrop-blur-xl border-b border-white/10'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg leading-tight tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              GTH TechVerse
            </span>
            <span className="text-orange-400/80 text-[10px] font-semibold tracking-[0.2em] uppercase">
              2026
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-semibold text-white/80 hover:text-white border border-white/15 hover:border-white/30 rounded-xl transition-all hover:bg-white/5"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5"
          >
            Register Now
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[rgba(15,23,42,0.97)] backdrop-blur-xl border-b border-white/10 animate-slideDown">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-sm font-medium text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-all"
              >
                {link.name}
              </a>
            ))}
            <hr className="border-white/10 my-2" />
            <div className="flex gap-3 mt-2">
              <Link href="/login" className="flex-1 px-5 py-3 text-center text-sm font-semibold text-white border border-white/15 rounded-xl hover:bg-white/5">
                Login
              </Link>
              <Link href="/register" className="flex-1 px-5 py-3 text-center text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
                Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
