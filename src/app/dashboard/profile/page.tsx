'use client'
import { useUser } from '../layout'
import { User, Mail, Phone, FileText, MapPin, GraduationCap, Code, Save, Loader2, Upload } from 'lucide-react'
import { Github, Linkedin, Instagram } from '@/components/icons/SocialIcons'
import { useState, useEffect } from 'react'

export default function ProfilePage() {
  const { user } = useUser()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profile, setProfile] = useState({
    bio: '',
    skills: '',
    linkedin: '', github: '', instagram: '',
    photo: ''
  })

  useEffect(() => {
    if (user) {
      setProfile({
        bio: user.bio || '',
        skills: user.skills || '',
        linkedin: user.linkedin || '',
        github: user.github || '',
        instagram: user.instagram || '',
        photo: user.avatar || ''
      })
    }
  }, [user])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, photo: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update profile')
        return
      }
      setSuccess('Profile updated successfully!')
      // Reload page to refresh header avatar
      window.location.reload()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
        <User className="w-6 h-6 inline mr-2 text-red-400" /> My Profile
      </h1>

      {/* Profile Card */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-red-500 to-purple-600 relative">
          <div className="absolute -bottom-10 left-8">
            <div className="relative group w-20 h-20 rounded-2xl border-4 border-[#0f172a] shadow-xl overflow-hidden bg-slate-800 flex items-center justify-center">
              {profile.photo ? (
                <img src={profile.photo} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              )}
              {/* Photo Upload Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                <Upload className="w-4 h-4 text-white" />
                <span className="text-[7px] text-white font-bold uppercase mt-1">Upload</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  aria-label="Update avatar"
                />
              </div>
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
              <span className="px-3 py-1 rounded-lg bg-red-500/15 text-red-400 text-xs font-bold">
                {user?.student?.enrollmentNo || 'STUDENT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6 sm:p-8 space-y-5">
        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Edit Profile</h3>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center font-medium">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
          <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3}
            className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Code className="w-3.5 h-3.5 inline mr-1" /> Skills (comma separated)
          </label>
          <input value={profile.skills} onChange={e => setProfile({ ...profile, skills: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm" />
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
                className="w-full px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm" />
            </div>
          ))}
        </div>

        <button onClick={handleSave} disabled={saving}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Academic Info */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6 sm:p-8">
        <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Academic Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: GraduationCap, label: 'Department', value: user?.department || user?.student?.department || 'N/A' },
            { icon: Code, label: 'Branch', value: user?.branch || user?.student?.branch || 'N/A' },
            { icon: MapPin, label: 'Year', value: user?.year || user?.student?.year ? `Year ${user.year || user?.student?.year}` : 'N/A' },
            { icon: FileText, label: 'Enrollment', value: user?.student?.enrollmentNo || 'N/A' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/20">
              <item.icon className="w-4 h-4 text-red-400" />
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
