import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await req.formData()
    const isReview = formData.get('isReview') === 'true'

    if (isReview) {
      // --- ADMIN REVIEW LOGIC ---
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      const submissionId = formData.get('submissionId') as string
      const status = formData.get('status') as string
      const reviewComments = formData.get('reviewComments') as string || ''

      if (!submissionId || !status) {
        return NextResponse.json({ error: 'Missing submission ID or status' }, { status: 400 })
      }

      // 1. Fetch submission details
      const { data: submission, error: subError } = await supabaseAdmin
        .from('task_submissions')
        .select('*, tasks(points, title)')
        .eq('id', submissionId)
        .maybeSingle()

      if (subError || !submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
      }

      const task = submission.tasks as any
      const pointsToAward = status === 'APPROVED' ? (task?.points || 0) : 0

      // 2. Fetch student profile
      const { data: student, error: studentError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', submission.student_id)
        .maybeSingle()

      if (studentError || !student) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
      }

      // 3. Update Submission Status
      const { error: updateSubError } = await supabaseAdmin
        .from('task_submissions')
        .update({
          status,
          review_comment: reviewComments,
          points_awarded: pointsToAward
        })
        .eq('id', submissionId)

      if (updateSubError) {
        console.error('Update submission error:', updateSubError)
        return NextResponse.json({ error: 'Failed to update submission status' }, { status: 500 })
      }

      // 4. If approved, award points
      if (status === 'APPROVED' && pointsToAward > 0) {
        // Update user points
        const newPoints = (student.total_points || 0) + pointsToAward
        await supabaseAdmin
          .from('users')
          .update({ total_points: newPoints })
          .eq('id', student.id)

        // Insert score entry into points_history
        await supabaseAdmin
          .from('points_history')
          .insert({
            student_id: student.id,
            points: pointsToAward,
            reason: `Task submission approved: ${task?.title || 'Task'}`,
            given_by: user.userId
          })

        // Create notification for student
        await supabaseAdmin
          .from('notifications')
          .insert({
            student_id: student.id,
            title: 'Task Approved!',
            message: `Your submission for task "${task?.title || 'Task'}" has been approved! You received ${pointsToAward} points.`,
            is_read: false
          })
      } else {
        // Create notification for rejection or changes requested
        const statusLabel = status === 'CHANGES_REQUESTED' ? 'Changes Requested' : 'Rejected'
        await supabaseAdmin
          .from('notifications')
          .insert({
            student_id: student.id,
            title: `Task Submission Update: ${statusLabel}`,
            message: `Your submission for task "${task?.title || 'Task'}" was reviewed. Status: ${statusLabel}. Comments: ${reviewComments}`,
            is_read: false
          })
      }

      return NextResponse.json({ success: true })
    } else {
      // --- STUDENT SUBMISSION LOGIC ---
      if (user.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Only students can submit tasks' }, { status: 403 })
      }

      const taskId = formData.get('taskId') as string
      const comment = formData.get('comment') as string || ''
      const file = formData.get('file') as File | null

      if (!taskId) {
        return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
      }

      if (!file) {
        return NextResponse.json({ error: 'Submission file is required' }, { status: 400 })
      }

      // Check if student profile exists (student.id matches user.userId)
      const { data: student, error: studentError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.userId)
        .maybeSingle()

      if (studentError || !student) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
      }

      // Check if submission already exists (update or create)
      const { data: existingSub } = await supabaseAdmin
        .from('task_submissions')
        .select('id, uploaded_file')
        .eq('student_id', user.userId)
        .eq('task_id', taskId)
        .maybeSingle()

      // Upload file to Supabase Storage bucket 'task-submissions'
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const filename = `${Date.now()}-${user.userId}-${file.name.replace(/\s+/g, '_')}`
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('task-submissions')
        .upload(filename, buffer, {
          contentType: file.type,
          duplex: 'half'
        })

      if (uploadError) {
        console.error('Task submission upload error:', uploadError)
        return NextResponse.json({ error: 'Failed to upload submission file' }, { status: 500 })
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('task-submissions')
        .getPublicUrl(filename)

      if (existingSub) {
        // Update existing submission (reset status to PENDING on new upload)
        const { error: updateError } = await supabaseAdmin
          .from('task_submissions')
          .update({
            uploaded_file: publicUrl,
            comment,
            status: 'PENDING',
            review_comment: null,
            points_awarded: 0,
            submitted_at: new Date().toISOString()
          })
          .eq('id', existingSub.id)

        if (updateError) {
          console.error('Update submission database error:', updateError)
          return NextResponse.json({ error: 'Failed to update submission in database' }, { status: 500 })
        }

        // Clean up old file from storage if possible (optional but good practice)
        const oldFilename = existingSub.uploaded_file.split('/').pop()
        if (oldFilename) {
          await supabaseAdmin.storage.from('task-submissions').remove([oldFilename])
        }

        return NextResponse.json({ success: true, message: 'Submission updated successfully' })
      } else {
        // Create new submission
        const { error: insertError } = await supabaseAdmin
          .from('task_submissions')
          .insert({
            student_id: user.userId,
            task_id: taskId,
            uploaded_file: publicUrl,
            comment,
            status: 'PENDING',
            points_awarded: 0
          })

        if (insertError) {
          console.error('Insert submission database error:', insertError)
          return NextResponse.json({ error: 'Failed to save submission in database' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Submission uploaded successfully' })
      }
    }
  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { submissionId, status, reviewComments, pointsAwarded } = await req.json()

    if (!submissionId || !status) {
      return NextResponse.json({ error: 'Missing submission ID or status' }, { status: 400 })
    }

    // 1. Fetch submission details
    const { data: submission, error: subError } = await supabaseAdmin
      .from('task_submissions')
      .select('*, tasks(points, title)')
      .eq('id', submissionId)
      .maybeSingle()

    if (subError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const task = submission.tasks as any
    const pointsToAward = status === 'APPROVED' ? (pointsAwarded !== undefined ? Number(pointsAwarded) : (task?.points || 0)) : 0

    // 2. Fetch student profile
    const { data: student, error: studentError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', submission.student_id)
      .maybeSingle()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // 3. Update Submission Status
    const { error: updateSubError } = await supabaseAdmin
      .from('task_submissions')
      .update({
        status,
        review_comment: reviewComments,
        points_awarded: pointsToAward
      })
      .eq('id', submissionId)

    if (updateSubError) {
      console.error('Update submission error:', updateSubError)
      return NextResponse.json({ error: 'Failed to update submission status' }, { status: 500 })
    }

    // 4. If approved, award points
    if (status === 'APPROVED' && pointsToAward > 0) {
      const newPoints = (student.total_points || 0) + pointsToAward
      await supabaseAdmin
        .from('users')
        .update({ total_points: newPoints })
        .eq('id', student.id)

      await supabaseAdmin
        .from('points_history')
        .insert({
          student_id: student.id,
          points: pointsToAward,
          reason: `Task submission approved: ${task?.title || 'Task'}`,
          given_by: user.userId
        })

      await supabaseAdmin
        .from('notifications')
        .insert({
          student_id: student.id,
          title: 'Task Approved!',
          message: `Your submission for task "${task?.title || 'Task'}" has been approved! You received ${pointsToAward} points.`,
          is_read: false
        })
    } else if (status !== 'APPROVED') {
      const statusLabel = status === 'CHANGES_REQUESTED' ? 'Changes Requested' : 'Rejected'
      await supabaseAdmin
        .from('notifications')
        .insert({
          student_id: student.id,
          title: `Task Submission Update: ${statusLabel}`,
          message: `Your submission for task "${task?.title || 'Task'}" was reviewed. Status: ${statusLabel}. Comments: ${reviewComments}`,
          is_read: false
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Submission review error:', error)
    return NextResponse.json({ error: 'Failed to process submission review' }, { status: 500 })
  }
}
