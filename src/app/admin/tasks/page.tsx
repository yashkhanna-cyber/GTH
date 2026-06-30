'use client'

import { useState, useEffect } from 'react'
import { ClipboardList, Plus, FileText, X, CheckCircle2, AlertCircle, Loader2, Calendar, Users, Award, MessageSquare, ExternalLink, ShieldAlert, Check, RefreshCw, Trash2 } from 'lucide-react'

interface Student {
  id: string
  enrollmentNo: string
  batch: string | null
  user: {
    name: string
    email: string
  }
}

interface TaskSubmission {
  id: string
  uploadedFile: string
  comments: string | null
  status: string
  reviewComments: string | null
  pointsAwarded: number
  submittedAt: string
  student: Student
}

interface Task {
  id: string
  name: string
  description: string | null
  rules: string | null
  points: number
  deadline: string | null
  referenceFile: string | null
  assignedTo: string
  assignedTarget: string | null
  createdAt: string
  submissions: TaskSubmission[]
}

interface Team {
  id: string
  name: string
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'TASKS' | 'SUBMISSIONS'>('TASKS')

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rules, setRules] = useState('')
  const [points, setPoints] = useState(10)
  const [deadline, setDeadline] = useState('')
  const [assignedTo, setAssignedTo] = useState('ALL')
  const [assignedTarget, setAssignedTarget] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Review panel state
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | ''>('')
  const [pointsAwarded, setPointsAwarded] = useState<number | ''>('')
  const [reviewComments, setReviewComments] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      if (data.tasks) setTasks(data.tasks)
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

  // Flatten submissions
  const allSubmissions: TaskSubmission[] = tasks.reduce((acc: TaskSubmission[], task) => {
    if (task.submissions) {
      const subsWithTaskInfo = task.submissions.map(sub => ({
        ...sub,
        taskName: task.name,
        taskMaxPoints: task.points
      })) as any
      return [...acc, ...subsWithTaskInfo]
    }
    return acc
  }, [])

  const selectedSub = allSubmissions.find(s => s.id === selectedSubId) as any

  useEffect(() => {
    if (selectedSub) {
      setReviewStatus(selectedSub.status === 'PENDING' ? '' : selectedSub.status)
      setPointsAwarded(selectedSub.pointsAwarded || selectedSub.taskMaxPoints || 0)
      setReviewComments(selectedSub.reviewComments || '')
      setReviewError(null)
      setReviewSuccess(null)
    }
  }, [selectedSubId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) setFile(selectedFile)
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      setFormError('Task Name is required.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    setFormSuccess(null)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('rules', rules)
    formData.append('points', points.toString())
    formData.append('deadline', deadline)
    formData.append('assignedTo', assignedTo)
    formData.append('assignedTarget', assignedTarget)
    if (file) {
      formData.append('file', file)
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (data.error) {
        setFormError(data.error)
      } else {
        setFormSuccess('Task created and assigned successfully!')
        setName('')
        setDescription('')
        setRules('')
        setPoints(10)
        setDeadline('')
        setAssignedTo('ALL')
        setAssignedTarget('')
        setFile(null)
        fetchData()
        setTimeout(() => {
          setIsModalOpen(false)
          setFormSuccess(null)
        }, 1500)
      }
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task? This will also remove all student submissions for this task.')) return

    try {
      const res = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        alert(data.error || 'Failed to delete task')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSub || !reviewStatus) {
      setReviewError('Please choose status.')
      return
    }

    if (pointsAwarded !== '' && (pointsAwarded < 0 || pointsAwarded > selectedSub.taskMaxPoints)) {
      setReviewError(`Points awarded must be between 0 and ${selectedSub.taskMaxPoints}.`)
      return
    }

    setReviewing(true)
    setReviewError(null)
    setReviewSuccess(null)

    try {
      const res = await fetch('/api/tasks/submissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSub.id,
          status: reviewStatus,
          reviewComments,
          pointsAwarded: pointsAwarded === '' ? 0 : Number(pointsAwarded)
        })
      })
      const data = await res.json()

      if (data.error) {
        setReviewError(data.error)
      } else {
        setReviewSuccess('Review saved successfully!')
        fetchData()
        setTimeout(() => {
          setReviewSuccess(null)
        }, 1500)
      }
    } catch {
      setReviewError('Failed to save review.')
    } finally {
      setReviewing(false)
    }
  }

  const renderFilePreview = (filePath: string) => {
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase()
    const isImage = ['.png', '.jpg', '.jpeg', '.gif'].includes(ext)
    const isPdf = ext === '.pdf'

    if (isImage) {
      return (
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center p-2 max-h-[400px]">
          <img src={filePath} alt="Submission deliverable" className="object-contain max-h-[380px] rounded-lg" />
        </div>
      )
    }

    if (isPdf) {
      return (
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 h-[500px]">
          <iframe src={`${filePath}#toolbar=1`} className="w-full h-full border-0" title="PDF submission viewer" />
        </div>
      )
    }

    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center flex flex-col items-center justify-center gap-3">
        <FileText className="w-12 h-12 text-slate-650" />
        <h4 className="text-white font-bold text-sm">Download Needed for Preview</h4>
        <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
          This file type ({ext.toUpperCase()}) cannot be rendered inline. Click the button above to download and review it locally.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading tasks information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <ClipboardList className="w-6 h-6 text-red-400" />
            Task Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">Create tasks, assign deadlines, and review student work submissions.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-500/20 transition-all w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 gap-6">
        <button
          onClick={() => setActiveTab('TASKS')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'TASKS' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tasks List ({tasks.length})
          {activeTab === 'TASKS' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('SUBMISSIONS')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'SUBMISSIONS' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Submissions Review ({allSubmissions.length})
          {activeTab === 'SUBMISSIONS' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />}
        </button>
      </div>

      {activeTab === 'TASKS' ? (
        /* TASKS TAB */
        tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 p-16 text-center max-w-xl mx-auto my-12">
            <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-white font-bold text-sm">No Tasks Created Yet</h3>
            <p className="text-xs text-slate-500 mt-1">Click the "Add Task" button to create your first learning milestone task.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map(t => (
              <div
                key={t.id}
                className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-6 flex flex-col justify-between hover:border-slate-655/40 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 border border-slate-700 text-slate-350 uppercase tracking-wider">
                      {t.assignedTo === 'ALL'
                        ? 'All Students'
                        : t.assignedTo === 'BATCH'
                        ? `Batch: ${t.assignedTarget}`
                        : `Team: ${t.assignedTarget}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-550 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="text-slate-450 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-all"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-white font-bold text-base mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    {t.name}
                  </h3>
                  {t.description && (
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4">
                      {t.description}
                    </p>
                  )}
                  {t.rules && (
                    <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2 italic mb-4 bg-slate-900/25 p-2 rounded-lg border border-slate-800/60">
                      Rules: {t.rules}
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Deadline</p>
                    <p className="text-xs text-slate-350 font-medium font-mono">
                      {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No Deadline'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Award</p>
                    <p className="text-xs text-red-400 font-bold">+{t.points} Points</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* SUBMISSIONS TAB */
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Submissions list sidebar */}
          <div className="lg:col-span-5 rounded-2xl bg-[#0b1120] border border-slate-800/60 p-5 space-y-4">
            <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
              Submissions List
            </h3>

            <div className="max-h-[500px] overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
              {allSubmissions.length === 0 ? (
                <p className="text-slate-550 text-xs text-center py-8">No submissions uploaded yet.</p>
              ) : (
                allSubmissions.map(sub => {
                  const isSelected = sub.id === selectedSubId
                  const subStatusColors: Record<string, string> = {
                    PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
                    CHANGES_REQUESTED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                  }
                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubId(sub.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-red-500/10 border-red-500/30 text-white'
                          : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/20 text-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-xs leading-tight">{sub.student.user.name}</p>
                        <p className="text-slate-450 text-[10px] truncate max-w-[200px]">Task: {(sub as any).taskName}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${subStatusColors[sub.status] || 'bg-slate-800'}`}>
                          {sub.status}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Submission Details and Review controls */}
          <div className="lg:col-span-7 space-y-6">
            {selectedSub ? (
              <div className="space-y-6">
                {/* Header info */}
                <div className="rounded-2xl bg-[#0b1120] border border-slate-800/60 p-6 space-y-4">
                  <div className="border-b border-slate-800/80 pb-4 flex justify-between items-start gap-4">
                    <div>
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Reviewing work submission</p>
                      <h3 className="text-white font-bold text-lg leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        {selectedSub.student.user.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Enrollment: {selectedSub.student.enrollmentNo} {selectedSub.student.batch ? `• Batch: ${selectedSub.student.batch}` : ''}
                      </p>
                    </div>

                    <a
                      href={selectedSub.uploadedFile}
                      download
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Download File
                    </a>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Task</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{selectedSub.taskName}</p>
                  </div>

                  {selectedSub.comments && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Student Comments</p>
                      <p className="text-xs text-slate-300 italic mt-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/60">
                        "{selectedSub.comments}"
                      </p>
                    </div>
                  )}

                  {/* Inline File Preview */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Deliverable Preview</p>
                    {renderFilePreview(selectedSub.uploadedFile)}
                  </div>
                </div>

                {/* Grading form */}
                <div className="rounded-2xl bg-[#0b1120] border border-slate-800/60 p-6 space-y-5">
                  <h4 className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                    Grade Submission
                  </h4>

                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    {reviewError && (
                      <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{reviewError}</span>
                      </div>
                    )}

                    {reviewSuccess && (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{reviewSuccess}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Action Status</label>
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setReviewStatus('APPROVED')}
                          className={`py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                            reviewStatus === 'APPROVED'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                              : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/20 text-slate-450'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewStatus('REJECTED')}
                          className={`py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                            reviewStatus === 'REJECTED'
                              ? 'bg-red-500/15 border-red-500/40 text-red-400'
                              : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/20 text-slate-455'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewStatus('CHANGES_REQUESTED')}
                          className={`py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                            reviewStatus === 'CHANGES_REQUESTED'
                              ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400'
                              : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/20 text-slate-455'
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                          Revisions
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Points Awarded (Max: {selectedSub.taskMaxPoints})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder={`Max: ${selectedSub.taskMaxPoints}`}
                          value={pointsAwarded}
                          onChange={e => setPointsAwarded(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-white focus:outline-none focus:border-red-500 text-sm"
                          disabled={reviewStatus !== 'APPROVED'}
                        />
                        <Award className="absolute right-4 top-3.5 w-4 h-4 text-slate-500" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Review Comments</label>
                      <div className="relative">
                        <textarea
                          rows={3}
                          placeholder="Provide feedback on deliverables..."
                          value={reviewComments}
                          onChange={e => setReviewComments(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-white focus:outline-none focus:border-red-500 text-sm resize-none"
                        />
                        <MessageSquare className="absolute right-4 bottom-3 w-4 h-4 text-slate-500" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={reviewing}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Grade and Review'}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/10 p-16 text-center">
                <ShieldAlert className="w-12 h-12 text-slate-750 mx-auto mb-3" />
                <h4 className="text-white font-bold text-sm">No Submission Selected</h4>
                <p className="text-slate-500 text-xs mt-1">Select a submission from the sidebar to inspect deliverables and award points.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[#0b1120] border border-slate-850 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <ClipboardList className="w-5 h-5 text-red-500" />
                Create New Task
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-550 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Task Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ESP32 Sensor Readings & Dashboard Integration"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  rows={2}
                  placeholder="Summarize the task objectives..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Rules & Guidelines</label>
                <textarea
                  rows={2}
                  placeholder="Submit GitHub repo url, write code standards..."
                  value={rules}
                  onChange={e => setRules(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Points Reward</label>
                  <input
                    type="number"
                    required
                    value={points}
                    onChange={e => setPoints(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-white text-sm focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-white text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Optional Reference File</label>
                <button
                  type="button"
                  onClick={() => document.getElementById('task-ref-file-input')?.click()}
                  className="w-full py-3.5 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 text-slate-400 hover:text-white transition-all flex flex-col items-center justify-center gap-1"
                >
                  <FileText className="w-5 h-5 text-red-500" />
                  <span className="text-xs font-medium">
                    {file ? file.name : 'Select reference materials'}
                  </span>
                </button>
                <input
                  type="file"
                  id="task-ref-file-input"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 font-bold"
              >
                {submitting ? 'Creating Task...' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
