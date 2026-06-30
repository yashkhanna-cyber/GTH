import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch the 20 most recent scores/adjustments from points_history table
    const { data: scoreHistory, error: historyError } = await supabaseAdmin
      .from('points_history')
      .select('*, student:student_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (historyError) {
      console.error('Fetch recent scores error:', historyError)
      return NextResponse.json({ error: 'Failed to fetch points history' }, { status: 500 })
    }

    const recentScores = (scoreHistory || []).map(s => {
      const studentUser = s.student as any
      const diffMs = Date.now() - new Date(s.created_at).getTime()
      const diffMins = Math.round(diffMs / 60000)
      let timeStr = 'Just now'
      if (diffMins >= 60) {
        const diffHrs = Math.floor(diffMins / 60)
        timeStr = `${diffHrs} hr ago`
      } else if (diffMins > 0) {
        timeStr = `${diffMins} min ago`
      }

      return {
        student: studentUser?.full_name || 'Unknown',
        points: s.points,
        category: 'COMMUNITY', // default category
        reason: s.reason,
        time: timeStr
      }
    })

    return NextResponse.json({ recentScores })
  } catch (error) {
    console.error('Fetch admin recent scores error:', error)
    return NextResponse.json({ error: 'Failed to fetch points history' }, { status: 500 })
  }
}
