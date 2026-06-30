'use client'

import { useState, useEffect } from 'react'
import { FolderKanban, Plus, FileText, X, CheckCircle2, AlertCircle, Loader2, Calendar, Users, Briefcase, Trash2 } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  instructionPdf: string
  assignedTo: string
  assignedTarget: string | null
  createdAt: string
}

interface Team {
  id: string
  name: string
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [assignedTo, setAssignedTo] = useState('ALL') // ALL, BATCH, TEAM
  const [assignedTarget, setAssignedTarget] = useState('')
  
  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (data.projects) setProjects(data.projects)
      if (data.teams) setTeams(data.teams)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null)
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    if (!selectedFile.type.includes('pdf') && !selectedFile.name.endsWith('.pdf')) {
      setFormError('Please select a PDF file only.')
      return
    }
    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !description || !file) {
      setFormError('Please fill all fields and select a PDF instruction file.')
      return
    }

    if (assignedTo !== 'ALL' && !assignedTarget) {
      setFormError('Please specify the assignment target (batch name or team).')
      return
    }

    setSubmitting(true)
    setFormError(null)
    setFormSuccess(null)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('assignedTo', assignedTo)
    formData.append('assignedTarget', assignedTarget)
    formData.append('file', file)

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (data.error) {
        setFormError(data.error)
      } else {
        setFormSuccess('Project instruction PDF uploaded and assigned successfully!')
        // Reset form
        setName('')
        setDescription('')
        setFile(null)
        setAssignedTo('ALL')
        setAssignedTarget('')
        // Refresh list
        fetchData()
        // Close modal after a delay
        setTimeout(() => {
          setIsModalOpen(false)
          setFormSuccess(null)
        }, 1500)
      }
    } catch (err) {
      console.error(err)
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This will also remove the uploaded PDF from storage.')) return

    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        alert(data.error || 'Failed to delete project')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading projects list...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <FolderKanban className="w-6 h-6 text-red-400" />
            Projects Setup
          </h1>
          <p className="text-sm text-slate-400 mt-1">Upload instruction PDFs and assign projects to students, batches, or teams.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-500/20 transition-all w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 p-16 text-center max-w-xl mx-auto my-12">
          <FolderKanban className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-white font-bold text-sm">No Projects Added Yet</h3>
          <p className="text-xs text-slate-500 mt-1">Click the "Add Project" button to upload your first project instructions PDF.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6 flex flex-col justify-between hover:border-slate-650/40 hover:shadow-lg transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 border border-slate-700 text-slate-350 uppercase tracking-wider">
                    {project.assignedTo === 'ALL'
                      ? 'All Students'
                      : project.assignedTo === 'BATCH'
                      ? `Batch: ${project.assignedTarget}`
                      : `Team: ${project.assignedTarget}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-550 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-white font-bold text-base group-hover:text-red-400 transition-colors mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {project.name}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-6">
                  {project.description}
                </p>
              </div>

              <a
                href={project.instructionPdf}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-slate-900/40 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800 hover:border-red-500/30 transition-all"
              >
                <FileText className="w-4 h-4" />
                View Instruction PDF
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[#0b1120] border border-slate-850 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <FolderKanban className="w-5 h-5 text-red-500" />
                Add New Project
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Smart Agriculture Node"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide a short description/overview of the project instructions..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Assign To</label>
                  <select
                    value={assignedTo}
                    onChange={e => {
                      setAssignedTo(e.target.value)
                      setAssignedTarget('')
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-white focus:outline-none focus:border-red-500 text-sm appearance-none"
                  >
                    <option value="ALL">All Students</option>
                    <option value="BATCH">Selected Batch</option>
                    <option value="TEAM">Selected Team</option>
                  </select>
                </div>

                {assignedTo === 'BATCH' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Batch Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Batch A"
                      value={assignedTarget}
                      onChange={e => setAssignedTarget(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 text-sm"
                    />
                  </div>
                )}

                {assignedTo === 'TEAM' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Select Team</label>
                    <select
                      required
                      value={assignedTarget}
                      onChange={e => setAssignedTarget(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-white focus:outline-none focus:border-red-500 text-sm appearance-none"
                    >
                      <option value="">Choose Team</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Instruction PDF File</label>
                <button
                  type="button"
                  onClick={() => document.getElementById('project-pdf-file-input')?.click()}
                  className="w-full py-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 text-slate-400 hover:text-white transition-all flex flex-col items-center justify-center gap-1.5"
                >
                  <FileText className="w-6 h-6 text-red-500" />
                  <span className="text-xs font-medium">
                    {file ? file.name : 'Select instruction PDF file'}
                  </span>
                </button>
                <input
                  type="file"
                  id="project-pdf-file-input"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold text-sm hover:shadow-lg hover:shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading & Saving...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
