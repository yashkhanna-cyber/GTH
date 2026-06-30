'use client'

import { useState, useEffect } from 'react'
import { ClipboardList, CheckCircle2, Clock, Circle, Loader2, X, AlertCircle, FileText, Send, Calendar } from 'lucide-react'

interface TaskSubmission {
  id: string
  uploadedFile: string
  comments: string | null
  status: string
  reviewComments: string | null
  pointsAwarded: number
  submittedAt: string
}

interface Task {
  id: string
  name: string
  description: string | null
  rules: string | null
  points: number
  deadline: string | null
  referenceFile: string | null
  createdAt: string
  submissions: TaskSubmission[]
}

// Countdown hook
function useCountdown(deadline: string | null) {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    if (!deadline) {
      setTimeLeft('No Deadline')
      return
    }

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const end = new Date(deadline).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft('Deadline Passed')
        clearInterval(interval)
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`)
        } else {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [deadline])

  return timeLeft
}

function TaskCard({ task, onSubmitClick }: { task: Task; onSubmitClick: () => void }) {
  const submission = task.submissions?.[0] || null
  const countdown = useCountdown(task.deadline)

  const statusConfig: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    PENDING: { label: 'Assigned', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', icon: Circle },
    APPROVED: { label: 'Approved', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 },
    REJECTED: { label: 'Rejected', bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', icon: X },
    CHANGES_REQUESTED: { label: 'Changes Requested', bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400', icon: Clock },
    SUBMITTED: { label: 'Waiting for Review', bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400', icon: Clock },
  }

  const currentStatus = submission
    ? statusConfig[submission.status] || statusConfig.SUBMITTED
    : statusConfig.PENDING

  const StatusIcon = currentStatus.icon

  return (
    <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6 flex flex-col justify-between hover:border-slate-650/40 hover:shadow-lg transition-all group">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${currentStatus.bg} ${currentStatus.text} uppercase tracking-wider`}>
            {currentStatus.label}
          </span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(task.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h3 className="text-white font-bold text-lg group-hover:text-red-400 transition-colors mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          {task.name}
        </h3>
        
        {task.description && (
          <p className="text-slate-450 text-xs leading-relaxed mb-4 line-clamp-3">
            {task.description}
          </p>
        )}

        {task.rules && (
          <div className="mb-4 bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Rules / Guidelines</p>
            <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">{task.rules}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5 border-t border-slate-700/20 pt-4">
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Deadline</p>
            <p className="text-xs text-slate-300 font-medium">
              {task.deadline ? new Date(task.deadline).toLocaleString() : 'No Deadline'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Remaining Time</p>
            <p className="text-xs text-red-400 font-bold font-mono">{countdown}</p>
          </div>
        </div>

        {/* Reference File */}
        {task.referenceFile && (
          <a
            href={task.referenceFile}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold mb-6 bg-red-500/5 border border-red-500/10 px-3 py-1.5 rounded-lg"
          >
            <FileText className="w-3.5 h-3.5" />
            Reference Materials
          </a>
        )}
      </div>

      <div className="space-y-3">
        {/* Mentor feedback */}
        {submission?.reviewComments && (
          <div className="bg-slate-700/20 border border-slate-700/30 p-3.5 rounded-xl space-y-1">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Mentor Comments</p>
            <p className="text-xs text-slate-300 italic">"{submission.reviewComments}"</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="shrink-0">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Reward</p>
            <p className="text-sm text-red-400 font-bold">
              {submission?.status === 'APPROVED' ? `+${submission.pointsAwarded}` : `+${task.points}`} Points
            </p>
          </div>

          {(!submission || submission.status === 'PENDING' || submission.status === 'REJECTED' || submission.status === 'CHANGES_REQUESTED') ? (
            <button
              onClick={onSubmitClick}
              className="px-4 py-2.5 bg-red-500 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/10 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {submission ? 'Resubmit Task' : 'Submit Task'}
            </button>
          ) : (
            <div className="px-3.5 py-2.5 bg-slate-700/20 text-slate-400 rounded-xl text-xs font-semibold border border-slate-800/80">
              Submitted
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  // Submit Form states
  const [file, setFile] = useState<File | null>(null)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchTasks = () => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(data => {
        if (data.tasks) {
          setTasks(data.tasks)
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Max Size limit: 10MB
    const MAX_SIZE = 10 * 1024 * 1024
    if (selectedFile.size > MAX_SIZE) {
      setError('File size exceeds the limit of 10MB.')
      return
    }

    // Allowed Extensions
    const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.zip', '.rar']
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
    if (!allowed.includes(ext)) {
      setError('Unsupported file type. Choose ZIP, RAR, PDF, Word, or Image.')
      return
    }

    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask || !file) {
      setError('Please select a file to submit.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('taskId', selectedTask.id)
    formData.append('comments', comments)
    formData.append('file', file)

    try {
      const res = await fetch('/api/tasks/submissions', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setSuccess('Task submitted successfully!')
        setFile(null)
        setComments('')
        fetchTasks()
        setTimeout(() => {
          setSelectedTask(null)
          setSuccess(null)
        }, 1500)
      }
    } catch {
      setError('Failed to submit task. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5" style={{ fontFamily: 'var(--font-display)' }}>
          <ClipboardList className="w-6 h-6 text-red-400" />
          Assigned Tasks
        </h1>
        <p className="text-sm text-slate-400 mt-1">Complete tasks, submit work, and earn points on the leaderboard.</p>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/10 p-16 text-center max-w-xl mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 mx-auto">
            <ClipboardList className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            No Tasks Assigned Yet
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            There are currently no tasks assigned to you. Keep an eye out for updates from your program mentors.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {tasks.map(t => (
            <TaskCard key={t.id} task={t} onSubmitClick={() => setSelectedTask(t)} />
          ))}
        </div>
      )}

      {/* Task Submission Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTask(null)} />
          
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[#0b1120] border border-slate-850 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <Send className="w-4.5 h-4.5 text-red-400" />
                Submit Task: {selectedTask.name}
              </h2>
              <button onClick={() => setSelectedTask(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 animate-pulse">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Upload Deliverables</label>
                <button
                  type="button"
                  onClick={() => document.getElementById('task-file-input')?.click()}
                  className="w-full py-5 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 text-slate-400 hover:text-white transition-all flex flex-col items-center justify-center gap-1.5"
                >
                  <FileText className="w-6 h-6 text-red-400" />
                  <span className="text-xs font-semibold">
                    {file ? file.name : 'Select file (ZIP, RAR, PDF, Document, Image)'}
                  </span>
                  <span className="text-[10px] text-slate-500">Max size limit: 10MB</span>
                </button>
                <input
                  type="file"
                  id="task-file-input"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.rar"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Comments (Optional)</label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  placeholder="Write any comments for your reviewer..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold text-sm hover:shadow-lg hover:shadow-red-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 font-bold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading Deliverables...
                  </>
                ) : (
                  'Submit Deliverables'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
