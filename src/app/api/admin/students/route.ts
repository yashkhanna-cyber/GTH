import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: students, error: studentsError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'Student')
      .order('enrollment_no', { ascending: true })

    if (studentsError) {
      console.error('Fetch admin students error:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students list' }, { status: 500 })
    }

    const formattedStudents = (students || []).map(s => ({
      id: s.id,
      name: s.full_name,
      email: s.email,
      enrollment: s.enrollment_no || '',
      branch: s.branch || '',
      year: s.year || 1,
      team: s.team || 'No Team',
      points: s.total_points || 0
    }))

    return NextResponse.json({ students: formattedStudents })
  } catch (error) {
    console.error('Fetch admin students error:', error)
    return NextResponse.json({ error: 'Failed to fetch students list' }, { status: 500 })
  }
}
