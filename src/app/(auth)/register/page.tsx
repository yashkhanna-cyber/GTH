'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User, Phone, Hash, BookOpen, Building, GraduationCap, Upload } from 'lucide-react'

const departments = ['Computer Science & Engineering', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering']
const branches = ['CSE', 'CSE (AI/ML)', 'CSE (Data Science)', 'CSE (Cyber Security)', 'ECE', 'ME', 'CE', 'EE']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    enrollmentNo: '', department: '', branch: '', year: '1', batch: '', referralCode: '', photo: '',
  })

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        updateForm('photo', reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      setStep(step + 1)
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, year: parseInt(form.year) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      router.push('/dashboard')
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex gradient-hero relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-red-500/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-8 flex flex-col items-center">
            <Link href="/" className="inline-flex items-center gap-3 mb-3">
              <div className="h-10 px-3 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <img src="/gth-logo.jpg" alt="GTH Logo" className="h-7 object-contain" />
              </div>
              <div className="text-left font-bold text-xl text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                GTH TechVerse
              </div>
            </Link>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">under the aegis of</span>
              <div className="h-5 px-1.5 bg-white rounded flex items-center justify-center shadow-sm">
                <img src="/geeta-logo.png" alt="Geeta University" className="h-3.5 object-contain" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Join TechVerse
            </h1>
            <p className="text-slate-400 text-sm">Register for the bootcamp in 3 easy steps</p>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s ? 'bg-gradient-to-r from-red-500 to-red-700 text-white' : 'bg-slate-700/50 text-slate-500'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 rounded-full transition-all ${step > s ? 'bg-red-500' : 'bg-slate-700/50'}`} />}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-8 backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              {step === 1 && (
                <>
                  <p className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Personal Info</p>
                  
                  {/* Profile Photo Upload */}
                  <div className="flex flex-col items-center gap-2 mb-6">
                    <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden bg-slate-800/40 group hover:border-red-500 transition-colors">
                      {form.photo ? (
                        <img src={form.photo} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-red-400 transition-colors" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoChange} 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        aria-label="Upload profile picture"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Profile Photo</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="text" required value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="John Doe"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="email" required value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="you@example.com"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="tel" value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="+91 98765 43210"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm" />
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Academic Details</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <select required value={form.department} onChange={e => updateForm('department', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm appearance-none">
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
                      <div className="relative">
                        <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <select required value={form.branch} onChange={e => updateForm('branch', e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm appearance-none">
                          <option value="">Branch</option>
                          {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <select required value={form.year} onChange={e => updateForm('year', e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm appearance-none">
                          {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <p className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Security & Referral</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Referral Code (Optional)</label>
                    <div className="relative">
                      <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="text" value={form.referralCode} onChange={e => updateForm('referralCode', e.target.value)} placeholder="e.g. GTH-22CSE001"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={e => updateForm('password', e.target.value)} placeholder="Min 6 characters"
                        className="w-full pl-11 pr-12 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="password" required value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} placeholder="Re-enter password"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm" />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(step - 1)}
                    className="flex-1 py-3.5 rounded-xl border border-slate-600/40 text-slate-300 font-semibold text-sm hover:bg-slate-700/30 transition-all">
                    Back
                  </button>
                )}
                <button type="submit" disabled={loading}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>{step < 3 ? 'Continue' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="text-red-400 font-semibold hover:text-red-300">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
