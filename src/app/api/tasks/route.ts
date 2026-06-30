import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.role === 'ADMIN') {
      const { data: tasks, error: tasksError } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: teams, error: teamsError } = await supabaseAdmin
        .from('teams')
        .select('*')
        .order('team_name', { ascending: true })

      const { data: submissions, error: subsError } = await supabaseAdmin
        .from('task_submissions')
        .select('*, users:student_id(id, full_name, email, photo)')

      if (tasksError || teamsError || subsError) {
        console.error('Fetch tasks admin error:', tasksError, teamsError, subsError)
        return NextResponse.json({ error: 'Failed to fetch admin tasks' }, { status: 500 })
      }

      const formattedTeams = (teams || []).map(t => ({
        id: t.id,
        name: t.team_name,
        mentor: t.mentor,
        createdAt: t.created_at
      }))

      const formattedTasks = (tasks || []).map(t => {
        const taskSubs = (submissions || [])
          .filter(s => s.task_id === t.id)
          .map(s => {
            const studentUser = s.users as any
            return {
              id: s.id,
              uploadedFile: s.uploaded_file,
              comments: s.comment,
              status: s.status,
              reviewComments: s.review_comment,
              pointsAwarded: s.points_awarded,
              submittedAt: s.submitted_at,
              student: {
                id: s.student_id,
                user: studentUser ? {
                  name: studentUser.full_name,
                  email: studentUser.email,
                  avatar: studentUser.photo
                } : null
              }
            }
          })

        return {
          id: t.id,
          name: t.title, // mapping title to name
          description: t.description,
          rules: t.rules,
          points: t.points,
          deadline: t.deadline,
          referenceFile: t.reference_file,
          assignedTo: t.assigned_to,
          assignedTarget: t.assigned_target,
          createdAt: t.created_at,
          submissions: taskSubs
        }
      })

      return NextResponse.json({ tasks: formattedTasks, teams: formattedTeams })
    }

    // For students
    const { data: student, error: studentError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.userId)
      .maybeSingle()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Fetch all tasks
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    // Fetch submissions for this student
    const { data: submissions, error: subsError } = await supabaseAdmin
      .from('task_submissions')
      .select('*')
      .eq('student_id', user.userId)

    if (tasksError || subsError) {
      console.error('Fetch tasks student error:', tasksError, subsError)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // Filter tasks assigned to student
    const filteredTasks = (tasks || []).filter(t => {
      if (t.assigned_to === 'ALL') return true
      if (t.assigned_to === 'BATCH' && t.assigned_target === student.batch) return true
      if (t.assigned_to === 'TEAM' && t.assigned_target === student.team) return true
      return false
    }).map(t => {
      const taskSubs = (submissions || [])
        .filter(s => s.task_id === t.id)
        .map(s => ({
          id: s.id,
          uploadedFile: s.uploaded_file,
          comments: s.comment,
          status: s.status,
          reviewComments: s.review_comment,
          pointsAwarded: s.points_awarded,
          submittedAt: s.submitted_at
        }))

      return {
        id: t.id,
        name: t.title, // mapping title to name
        description: t.description,
        rules: t.rules,
        points: t.points,
        deadline: t.deadline,
        referenceFile: t.reference_file,
        assignedTo: t.assigned_to,
        assignedTarget: t.assigned_target,
        createdAt: t.created_at,
        submissions: taskSubs
      }
    })

    return NextResponse.json({ tasks: filteredTasks })
  } catch (error) {
    console.error('Fetch tasks error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const data = await req.formData()
    const name = data.get('name') as string
    const description = data.get('description') as string | null
    const rules = data.get('rules') as string | null
    const points = parseInt(data.get('points') as string) || 0
    const deadline = data.get('deadline') as string | null
    const assignedTo = data.get('assignedTo') as string
    const assignedTarget = data.get('assignedTarget') as string | null
    const file = data.get('file') as File | null

    if (!name) {
      return NextResponse.json({ error: 'Task Name is required' }, { status: 400 })
    }

    let referenceFileUrl: string | null = null

    if (file) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('documents')
        .upload(filename, buffer, {
          contentType: file.type,
          duplex: 'half'
        })

      if (uploadError) {
        console.error('Task reference file upload error:', uploadError)
        return NextResponse.json({ error: 'Failed to upload reference file' }, { status: 500 })
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('documents')
        .getPublicUrl(filename)

      referenceFileUrl = publicUrl
    }

    const { data: newTask, error: insertError } = await supabaseAdmin
      .from('tasks')
      .insert({
        title: name,
        description: description || null,
        rules: rules || null,
        points,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        reference_file: referenceFileUrl,
        assigned_to: assignedTo,
        assigned_target: assignedTarget || null
      })
      .select()
      .single()

    if (insertError || !newTask) {
      console.error('Task insertion error:', insertError)
      if (file && referenceFileUrl) {
        const filename = referenceFileUrl.split('/').pop()
        if (filename) await supabaseAdmin.storage.from('documents').remove([filename])
      }
      return NextResponse.json({ error: 'Failed to create task in database' }, { status: 500 })
    }

    const formattedTask = {
      id: newTask.id,
      name: newTask.title,
      description: newTask.description,
      rules: newTask.rules,
      points: newTask.points,
      deadline: newTask.deadline,
      referenceFile: newTask.reference_file,
      assignedTo: newTask.assigned_to,
      assignedTarget: newTask.assigned_target,
      createdAt: newTask.created_at
    }

    return NextResponse.json({ success: true, task: formattedTask })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
