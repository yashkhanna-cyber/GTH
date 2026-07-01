import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch student details to find team and batch
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('team, batch')
      .eq('id', user.userId)
      .maybeSingle()

    if (dbError || !dbUser) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // 2. Query announcements matching target groups
    const targetGroups = ['ALL']
    if (dbUser.team) {
      targetGroups.push(`team:${dbUser.team}`)
    }
    if (dbUser.batch) {
      targetGroups.push(`batch:${dbUser.batch}`)
    }

    let announcements: any[] = []
    const { data: dataNew, error: errorNew } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .in('target_group', targetGroups)
      .order('created_at', { ascending: false })

    if (!errorNew) {
      announcements = dataNew || []
    } else {
      console.warn('Querying target_group failed, trying fallback to target_audience:', errorNew.message)
      const { data: dataOld, error: errorOld } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .in('target_audience', targetGroups)
        .order('created_at', { ascending: false })

      if (errorOld) {
        console.error('Fetch student announcements error (both schemas failed):', errorOld)
        return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
      }

      // Map old columns to the new schema format expected by the frontend
      announcements = (dataOld || []).map((ann: any) => ({
        id: ann.id,
        title: ann.title,
        message: ann.message || ann.content || '',
        type: ann.type || 'INFO',
        target_group: ann.target_group || ann.target_audience || 'ALL',
        created_at: ann.created_at
      }))
    }

    return NextResponse.json({ success: true, announcements })
  } catch (error) {
    console.error('Announcements GET error:', error)
    return NextResponse.json({ error: 'Failed to load announcements' }, { status: 500 })
  }
}
