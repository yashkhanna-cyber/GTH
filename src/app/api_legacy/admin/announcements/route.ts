import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: announcements, error } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch announcements error:', error)
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
    }

    // Format for frontend compatibility under both old and new database schemas
    const formattedAnnouncements = (announcements || []).map((ann: any) => ({
      id: ann.id,
      title: ann.title,
      message: ann.message || ann.content || '',
      type: ann.type || 'INFO',
      target_group: ann.target_group || ann.target_audience || 'ALL',
      created_at: ann.created_at
    }))

    return NextResponse.json({ success: true, announcements: formattedAnnouncements })
  } catch (error) {
    console.error('Announcements admin GET error:', error)
    return NextResponse.json({ error: 'Failed to load announcements' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { title, message, type, targetGroup } = await req.json()

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    let newAnnouncement: any = null

    // 1. Insert announcement (Try new schema first)
    const { data: dataNew, error: errorNew } = await supabaseAdmin
      .from('announcements')
      .insert({
        title,
        message,
        type: type || 'INFO',
        target_group: targetGroup || 'ALL'
      })
      .select()
      .single()

    if (!errorNew) {
      newAnnouncement = dataNew
    } else {
      console.warn('Inserting announcement with new schema failed, trying fallback to old schema:', errorNew.message)
      // Fallback: insert with content / target_audience
      const { data: dataOld, error: errorOld } = await supabaseAdmin
        .from('announcements')
        .insert({
          title,
          content: message,
          type: type || 'INFO',
          target_audience: targetGroup || 'ALL'
        })
        .select()
        .single()

      if (errorOld) {
        console.error('Create announcement error (both schemas failed):', errorOld)
        return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
      }

      newAnnouncement = {
        id: dataOld.id,
        title: dataOld.title,
        message: dataOld.message || dataOld.content || '',
        type: dataOld.type || 'INFO',
        target_group: dataOld.target_group || dataOld.target_audience || 'ALL',
        created_at: dataOld.created_at
      }
    }

    // 2. Fetch matching students
    let query = supabaseAdmin.from('users').select('id').eq('role', 'Student')

    if (targetGroup && targetGroup !== 'ALL') {
      // If it is starting with "team:", query by team
      if (targetGroup.startsWith('team:')) {
         const teamName = targetGroup.replace('team:', '')
         query = query.eq('team', teamName)
      } else if (targetGroup.startsWith('batch:')) {
         const batchName = targetGroup.replace('batch:', '')
         query = query.eq('batch', batchName)
      }
    }

    const { data: targetStudents, error: studentsError } = await query
    if (studentsError) {
      console.error('Fetch target students error:', studentsError)
    }

    // 3. Create notifications for each target student
    if (targetStudents && targetStudents.length > 0) {
      const notificationsData = targetStudents.map(student => ({
        student_id: student.id,
        title: `Announcement: ${title}`,
        message,
        is_read: false
      }))

      const { error: notificationsError } = await supabaseAdmin
        .from('notifications')
        .insert(notificationsData)

      if (notificationsError) {
        console.error('Create announcement notifications error:', notificationsError)
      }
    }

    return NextResponse.json({ success: true, announcement: newAnnouncement })
  } catch (error) {
    console.error('Announcements admin POST error:', error)
    return NextResponse.json({ error: 'Failed to publish announcement' }, { status: 500 })
  }
}
