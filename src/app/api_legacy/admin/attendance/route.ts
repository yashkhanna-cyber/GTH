import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // 1. Fetch all registered students
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, photo, enrollment_no, branch, batch')
      .eq('role', 'Student')
      .order('full_name', { ascending: true })

    if (studentsError) {
      console.error('Fetch students error:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    // 2. Fetch attendance for the specific date
    const { data: attendanceRecords, error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .select('student_id, status')
      .eq('date', dateParam)

    if (attendanceError) {
      // If table doesn't exist yet, return a helpful hint
      if (attendanceError.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Attendance table does not exist. Please run the SQL schema migration in Supabase first.',
          needMigration: true
        }, { status: 400 })
      }
      console.error('Fetch attendance error:', attendanceError)
      return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 })
    }

    // Map status to students
    const attendanceMap = new Map(
      (attendanceRecords || []).map(r => [r.student_id, r.status])
    )

    const formattedStudents = students.map(s => ({
      id: s.id,
      name: s.full_name,
      email: s.email,
      photo: s.photo,
      enrollmentNo: s.enrollment_no,
      branch: s.branch,
      batch: s.batch,
      status: attendanceMap.get(s.id) || null // null means unmarked
    }))

    return NextResponse.json({ success: true, students: formattedStudents })
  } catch (error) {
    console.error('Admin attendance GET error:', error)
    return NextResponse.json({ error: 'Failed to get attendance data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { studentId, date, status } = await req.json()

    if (!studentId || !date || !status || !['PRESENT', 'ABSENT'].includes(status)) {
      return NextResponse.json({ error: 'Missing required parameters or invalid status' }, { status: 400 })
    }

    // Enforce that attendance can only be modified on the same day before 12:00 AM midnight
    const now = new Date()
    const todayUTC = now.toISOString().split('T')[0]
    const todayIST = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0]

    if (date !== todayUTC && date !== todayIST) {
      return NextResponse.json({ error: 'Attendance can only be modified on the same day before 12:00 AM midnight.' }, { status: 400 })
    }

    // 1. Fetch current status to see if it is changing
    const { data: currentRecord } = await supabaseAdmin
      .from('attendance')
      .select('status')
      .eq('student_id', studentId)
      .eq('date', date)
      .maybeSingle()

    const previousStatus = currentRecord?.status || null

    if (previousStatus === status) {
      // No change
      return NextResponse.json({ success: true, message: 'Status is already set' })
    }

    // 2. Fetch student profile to get current points
    const { data: student, error: studentError } = await supabaseAdmin
      .from('users')
      .select('id, total_points')
      .eq('id', studentId)
      .maybeSingle()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // 3. Upsert the attendance record
    const { error: upsertError } = await supabaseAdmin
      .from('attendance')
      .upsert({
        student_id: studentId,
        date: date,
        status: status
      }, { onConflict: 'student_id,date' })

    if (upsertError) {
      console.error('Upsert attendance error:', upsertError)
      return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
    }

    // 4. Implement penalty logic: "100% nahi aaye toh minus hojayegi"
    // If student is marked ABSENT (and wasn't ABSENT before), deduct 10 points.
    // If student is marked PRESENT (and was ABSENT before), restore 10 points.
    const penaltyAmount = 10

    if (status === 'ABSENT' && previousStatus !== 'ABSENT') {
      // Deduct points
      const newPoints = Math.max(0, (student.total_points || 0) - penaltyAmount)
      await supabaseAdmin
        .from('users')
        .update({ total_points: newPoints })
        .eq('id', studentId)

      // Add to points history
      await supabaseAdmin
        .from('points_history')
        .insert({
          student_id: studentId,
          points: -penaltyAmount,
          reason: `Attendance Penalty: Absent on ${date}`,
          given_by: user.userId
        })

      // Add notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          student_id: studentId,
          title: 'Attendance Warning',
          message: `You were marked ABSENT on ${date}. A penalty of -${penaltyAmount} points has been applied to your score.`,
          is_read: false
        })
    } else if (status === 'PRESENT' && previousStatus === 'ABSENT') {
      // Restore points
      const newPoints = (student.total_points || 0) + penaltyAmount
      await supabaseAdmin
        .from('users')
        .update({ total_points: newPoints })
        .eq('id', studentId)

      // Add to points history
      await supabaseAdmin
        .from('points_history')
        .insert({
          student_id: studentId,
          points: penaltyAmount,
          reason: `Attendance Restored: Present on ${date}`,
          given_by: user.userId
        })

      // Add notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          student_id: studentId,
          title: 'Attendance Updated',
          message: `Your attendance for ${date} has been updated to PRESENT. ${penaltyAmount} points have been restored.`,
          is_read: false
        })
    }

    return NextResponse.json({ success: true, message: 'Attendance updated successfully' })
  } catch (error) {
    console.error('Admin attendance POST error:', error)
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 })
  }
}
