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
      const { data: projects, error: projectsError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: teams, error: teamsError } = await supabaseAdmin
        .from('teams')
        .select('*')
        .order('team_name', { ascending: true })

      if (projectsError || teamsError) {
        console.error('Fetch projects/teams error:', projectsError, teamsError)
        return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 })
      }

      // Format teams to match frontend expectations (using name instead of team_name)
      const formattedTeams = (teams || []).map(t => ({
        id: t.id,
        name: t.team_name,
        mentor: t.mentor,
        createdAt: t.created_at
      }))

      // Format projects to have camelCase fields if frontend expects it
      const formattedProjects = (projects || []).map(p => ({
        id: p.id,
        name: p.title, // mapping title to name
        description: p.description,
        instructionPdf: p.instruction_pdf,
        assignedTo: p.assigned_to,
        assignedTarget: p.assigned_target,
        createdAt: p.created_at
      }))

      return NextResponse.json({ projects: formattedProjects, teams: formattedTeams })
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

    // Query projects matching assignment criteria
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('Fetch projects error:', projectsError)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    // Filter projects based on student attributes
    const filteredProjects = (projects || []).filter(p => {
      if (p.assigned_to === 'ALL') return true
      if (p.assigned_to === 'BATCH' && p.assigned_target === student.batch) return true
      if (p.assigned_to === 'TEAM' && p.assigned_target === student.team) return true
      return false
    }).map(p => ({
      id: p.id,
      name: p.title, // mapping title to name
      description: p.description,
      instructionPdf: p.instruction_pdf,
      assignedTo: p.assigned_to,
      assignedTarget: p.assigned_target,
      createdAt: p.created_at
    }))

    return NextResponse.json({ projects: filteredProjects })
  } catch (error) {
    console.error('Fetch projects error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
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
    const description = data.get('description') as string
    const assignedTo = data.get('assignedTo') as string
    const assignedTarget = data.get('assignedTarget') as string | null
    const file = data.get('file') as File | null

    if (!name || !description || !assignedTo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: 'Instruction PDF file is required' }, { status: 400 })
    }

    // Upload PDF to Supabase Storage bucket 'project-pdfs'
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('project-pdfs')
      .upload(filename, buffer, {
        contentType: file.type || 'application/pdf',
        duplex: 'half'
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload PDF file' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('project-pdfs')
      .getPublicUrl(filename)

    // Insert new project in public.projects
    const { data: newProject, error: insertError } = await supabaseAdmin
      .from('projects')
      .insert({
        title: name,
        description,
        instruction_pdf: publicUrl,
        assigned_to: assignedTo,
        assigned_target: assignedTarget || null,
        created_by: user.userId
      })
      .select()
      .single()

    if (insertError || !newProject) {
      console.error('Project insertion error:', insertError)
      // Attempt cleanup
      await supabaseAdmin.storage.from('project-pdfs').remove([filename])
      return NextResponse.json({ error: 'Failed to save project to database' }, { status: 500 })
    }

    const formattedProject = {
      id: newProject.id,
      name: newProject.title,
      description: newProject.description,
      instructionPdf: newProject.instruction_pdf,
      assignedTo: newProject.assigned_to,
      assignedTarget: newProject.assigned_target,
      createdAt: newProject.created_at
    }

    return NextResponse.json({ success: true, project: formattedProject })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
