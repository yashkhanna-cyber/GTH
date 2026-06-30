import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { inviteId, action } = await req.json()

    if (!inviteId || !action || !['ACCEPT', 'DECLINE'].includes(action)) {
      return NextResponse.json({ error: 'Missing required parameters or invalid action' }, { status: 400 })
    }

    // 1. Fetch invitation
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('team_invitations')
      .select('*, teams(*)')
      .eq('id', inviteId)
      .maybeSingle()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invite.student_id !== user.userId) {
      return NextResponse.json({ error: 'This invitation was not sent to you' }, { status: 403 })
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invitation has already been handled' }, { status: 400 })
    }

    const teamObj: any = invite.teams
    const teamName = teamObj?.team_name
    const leaderId = teamObj?.leader_id

    // Fetch user details to log their name
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('full_name, team')
      .eq('id', user.userId)
      .maybeSingle()

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (action === 'ACCEPT') {
      if (dbUser.team) {
        return NextResponse.json({ error: 'You are already in a team' }, { status: 400 })
      }

      // Update invitation status to ACCEPTED
      await supabaseAdmin
        .from('team_invitations')
        .update({ status: 'ACCEPTED' })
        .eq('id', inviteId)

      // Add student to the team
      await supabaseAdmin
        .from('users')
        .update({ team: teamName })
        .eq('id', user.userId)

      // Notify the leader
      if (leaderId) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            student_id: leaderId,
            title: 'Invitation Accepted',
            message: `${dbUser.full_name} accepted your invitation and has joined '${teamName}'.`,
            is_read: false
          })
      }
    } else {
      // Update invitation status to REJECTED
      await supabaseAdmin
        .from('team_invitations')
        .update({ status: 'REJECTED' })
        .eq('id', inviteId)

      // Notify the leader
      if (leaderId) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            student_id: leaderId,
            title: 'Invitation Declined',
            message: `${dbUser.full_name} declined your invitation to join '${teamName}'.`,
            is_read: false
          })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Invitation successfully ${action === 'ACCEPT' ? 'accepted' : 'declined'}`
    })
  } catch (error) {
    console.error('Invite action POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
