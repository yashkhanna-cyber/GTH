'use client'
import { useUser } from '../layout'
import { User, Mail, Phone, FileText, MapPin, GraduationCap, Code, Save, Loader2 } from 'lucide-react'
import { Github, Linkedin, Instagram } from '@/components/icons/SocialIcons'
import { useState } from 'react'

export default function ProfilePage() {
  const { user } = useUser()
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    bio: 'Passionate about AI and IoT. Love building things that make a difference.',
    skills: 'Python, TensorFlow, ESP32, React, Node.js',
    linkedin: '', github: '', instagram: '',
  })

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
        <User className="w-6 h-6 inline mr-2 text-orange-400" /> My Profile
      </h1>

      {/* Profile Card */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-orange-500 to-purple-600 relative">
          <div className="absolute -bottom-10 left-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-[#0f172a] shadow-xl">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          </div>
        </div>
        <div className="pt-14 px-8 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" /> {user?.email}
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-lg bg-orange-500/15 text-orange-400 text-xs font-bold">
                {user?.student?.enrollmentNo || 'STUDENT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6 sm:p-8 space-y-5">
        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Edit Profile</h3>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
          <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3}
            className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Code className="w-3.5 h-3.5 inline mr-1" /> Skills (comma separated)
          </label>
          <input value={profile.skills} onChange={e => setProfile({ ...profile, skills: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm" />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Linkedin, label: 'LinkedIn', key: 'linkedin' as const, placeholder: 'linkedin.com/in/...' },
            { icon: Github, label: 'GitHub', key: 'github' as const, placeholder: 'github.com/...' },
            { icon: Instagram, label: 'Instagram', key: 'instagram' as const, placeholder: '@username' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <field.icon className="w-3.5 h-3.5 inline mr-1" /> {field.label}
              </label>
              <input value={profile[field.key]} onChange={e => setProfile({ ...profile, [field.key]: e.target.value })} placeholder={field.placeholder}
                className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm" />
            </div>
          ))}
        </div>

        <button onClick={handleSave} disabled={saving}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Academic Info */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6 sm:p-8">
        <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Academic Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: GraduationCap, label: 'Department', value: 'Computer Science & Engineering' },
            { icon: Code, label: 'Branch', value: 'CSE (AI/ML)' },
            { icon: MapPin, label: 'Year', value: 'Year 3' },
            { icon: FileText, label: 'Enrollment', value: user?.student?.enrollmentNo || 'N/A' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/20">
              <item.icon className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm text-white font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
