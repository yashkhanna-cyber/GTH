import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { studentId } = await params

    // 1. Fetch student user profile
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', studentId)
      .maybeSingle()

    if (userError || !dbUser) {
      console.error('Fetch student error:', userError)
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const student = {
      id: dbUser.id,
      userId: dbUser.id,
      enrollmentNo: dbUser.enrollment_no,
      branch: dbUser.branch,
      year: dbUser.year,
      batch: dbUser.batch,
      bio: dbUser.bio,
      skills: dbUser.skills,
      linkedin: dbUser.linkedin,
      github: dbUser.github,
      instagram: dbUser.instagram,
      user: {
        name: dbUser.full_name,
        email: dbUser.email,
        phone: dbUser.enrollment_no || ''
      },
      team: dbUser.team ? { name: dbUser.team } : null,
      leaderboard: {
        totalPoints: dbUser.total_points
      }
    }

    // 2. Fetch Score adjustment history from points_history
    const { data: scoreHistory, error: historyError } = await supabaseAdmin
      .from('points_history')
      .select('*, giver:given_by(full_name)')
      .eq('student_id', dbUser.id)
      .order('created_at', { ascending: false })

    const scoreLogs = (scoreHistory || []).map(h => {
      const giver = h.giver as any
      return {
        id: h.id,
        points: h.points,
        reason: h.reason,
        createdAt: h.created_at,
        awardedBy: giver ? { name: giver.full_name } : { name: 'System' }
      }
    })

    // 3. Fetch Task Submissions history
    const { data: subs, error: subsError } = await supabaseAdmin
      .from('task_submissions')
      .select('*, tasks(title, points)')
      .eq('student_id', dbUser.id)
      .order('submitted_at', { ascending: false })

    const taskSubmissions = (subs || []).map(s => {
      const task = s.tasks as any
      return {
        id: s.id,
        uploadedFile: s.uploaded_file,
        comment: s.comment,
        status: s.status,
        reviewComment: s.review_comment,
        pointsAwarded: s.points_awarded,
        submittedAt: s.submitted_at,
        task: task ? { title: task.title, points: task.points } : null
      }
    })

    // 4. Fetch Referral count
    const { count: referralCount } = await supabaseAdmin
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_student', dbUser.id)

    return NextResponse.json({
      student,
      scoreLogs,
      taskSubmissions,
      referralCount: referralCount || 0
    })
  } catch (error) {
    console.error('Fetch student profile error:', error)
    return NextResponse.json({ error: 'Failed to fetch student details' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { studentId } = await params
    const { amount, type, reason } = await req.json()

    if (!amount || !type || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch target user profile
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, total_points, full_name')
      .eq('id', studentId)
      .maybeSingle()

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const pointsValue = parseInt(amount) || 0
    const netPoints = type === 'ADD' ? pointsValue : -pointsValue

    // 1. Create Score Entry in points_history
    const { error: insertHistoryError } = await supabaseAdmin
      .from('points_history')
      .insert({
        student_id: dbUser.id,
        points: netPoints,
        reason: reason,
        given_by: user.userId
      })

    if (insertHistoryError) {
      console.error('Insert points history error:', insertHistoryError)
      return NextResponse.json({ error: 'Failed to create point transaction' }, { status: 500 })
    }

    // 2. Update Student's points
    const newTotalPoints = (dbUser.total_points || 0) + netPoints
    const { error: updatePointsError } = await supabaseAdmin
      .from('users')
      .update({ total_points: newTotalPoints })
      .eq('id', dbUser.id)

    if (updatePointsError) {
      console.error('Update points error:', updatePointsError)
      return NextResponse.json({ error: 'Failed to update user points' }, { status: 500 })
    }

    // 3. Create Notification for the student
    const actionLabel = type === 'ADD' ? 'awarded' : 'deducted'
    await supabaseAdmin
      .from('notifications')
      .insert({
        student_id: dbUser.id,
        title: 'Points Adjusted!',
        message: `Admin ${actionLabel} you ${pointsValue} points. Reason: ${reason}`,
        is_read: false
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Adjust points error:', error)
    return NextResponse.json({ error: 'Failed to adjust points' }, { status: 500 })
  }
}
