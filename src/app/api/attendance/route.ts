import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch student's attendance records from database
    const { data: records, error } = await supabaseAdmin
      .from('attendance')
      .select('id, date, status, created_at')
      .eq('student_id', user.userId)
      .order('date', { ascending: false })

    if (error) {
      if (error.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Attendance table does not exist. Please run the SQL schema migration first.',
          needMigration: true,
          attendance: [],
          presentCount: 0,
          absentCount: 0,
          totalCount: 0,
          rate: 100
        })
      }
      console.error('Fetch student attendance error:', error)
      return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }

    const presentCount = records ? records.filter(r => r.status === 'PRESENT').length : 0
    const absentCount = records ? records.filter(r => r.status === 'ABSENT').length : 0
    const totalCount = records ? records.length : 0
    const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100

    // Format for display
    const formattedRecords = (records || []).map((r, index) => {
      const dateObj = new Date(r.date)
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
      return {
        id: r.id,
        date: formattedDate,
        day: `Session ${totalCount - index}`,
        status: r.status,
        time: new Date(r.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    })

    return NextResponse.json({
      success: true,
      attendance: formattedRecords,
      presentCount,
      absentCount,
      totalCount,
      rate
    })
  } catch (error) {
    console.error('Student attendance GET error:', error)
    return NextResponse.json({ error: 'Failed to retrieve attendance' }, { status: 500 })
  }
}
