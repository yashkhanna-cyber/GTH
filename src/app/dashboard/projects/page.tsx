'use client'

import { useState, useEffect } from 'react'
import { FolderKanban, FileText, Download, Maximize2, ArrowLeft, Calendar, Loader2 } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  instructionPdf: string
  assignedTo: string
  assignedTarget: string | null
  createdAt: string
}

export default function StudentProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        if (data.projects) {
          setProjects(data.projects)
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const enterFullscreen = () => {
    const elem = document.getElementById('pdf-viewer-container')
    if (elem) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen()
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading projects...</p>
      </div>
    )
  }

  if (activeProject) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Back navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => setActiveProject(null)}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-all w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>
          
          <div className="flex items-center gap-3">
            <a
              href={activeProject.instructionPdf}
              download
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700/50 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </a>
            <button
              onClick={enterFullscreen}
              className="px-4 py-2 bg-red-500 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-red-500/10"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Fullscreen
            </button>
          </div>
        </div>

        {/* Project details card */}
        <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
              Assigned
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(activeProject.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {activeProject.name}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
            {activeProject.description}
          </p>
        </div>

        {/* PDF Viewer Container */}
        <div
          id="pdf-viewer-container"
          className={`rounded-2xl overflow-hidden border border-slate-700/40 bg-slate-900 shadow-xl relative ${
            isFullscreen ? 'h-screen w-screen p-0 m-0 border-0 rounded-none' : 'h-[700px]'
          }`}
        >
          {isFullscreen && (
            <div className="absolute top-4 right-4 z-50 flex gap-2">
              <button
                onClick={() => document.exitFullscreen()}
                className="px-3 py-1.5 bg-slate-950/80 text-white text-xs font-bold rounded-lg border border-slate-800 hover:bg-slate-900"
              >
                Exit Fullscreen
              </button>
            </div>
          )}
          <iframe
            src={`${activeProject.instructionPdf}#toolbar=1&navpanes=0`}
            className="w-full h-full border-0"
            title={activeProject.name}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5" style={{ fontFamily: 'var(--font-display)' }}>
          <FolderKanban className="w-6 h-6 text-red-400" />
          Project Instructions
        </h1>
        <p className="text-sm text-slate-400 mt-1">Read instruction PDFs and build your assigned projects step-by-step.</p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/10 p-16 text-center max-w-xl mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 mx-auto">
            <FileText className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            No Projects Assigned Yet
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            There are currently no projects assigned to your batch or team. Please check back later or contact your instructor.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6 flex flex-col justify-between hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-950/20 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                    Assigned
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-white font-bold text-lg group-hover:text-red-400 transition-colors mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {project.name}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-6">
                  {project.description}
                </p>
              </div>

              <button
                onClick={() => setActiveProject(project)}
                className="w-full py-3 bg-slate-700/40 hover:bg-red-500 text-slate-200 hover:text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-slate-600/30 hover:border-red-400 transition-all"
              >
                <FileText className="w-4 h-4" />
                Open Project
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
