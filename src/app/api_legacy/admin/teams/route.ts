import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 1. Fetch all teams
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .order('team_name', { ascending: true })

    if (teamsError) {
      console.error('Fetch teams admin error:', teamsError)
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }

    // 2. Fetch all student profiles to group by team
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, photo, enrollment_no, branch, batch, total_points, team')
      .eq('role', 'Student')

    if (studentsError) {
      console.error('Fetch students admin error:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch student profiles' }, { status: 500 })
    }

    const studentsMap = new Map<string, any>()
    ;(students || []).forEach(s => {
      studentsMap.set(s.id, s)
    })

    // Group students by team name
    const teamMembersMap = new Map<string, any[]>()
    ;(students || []).forEach(s => {
      if (s.team) {
        if (!teamMembersMap.has(s.team)) {
          teamMembersMap.set(s.team, [])
        }
        teamMembersMap.get(s.team)!.push(s)
      }
    })

    const formattedTeams = (teams || []).map(t => {
      const members = teamMembersMap.get(t.team_name) || []
      const leader = t.leader_id ? studentsMap.get(t.leader_id) : null

      const formattedMembers = members.map(m => ({
        id: m.id,
        name: m.full_name,
        email: m.email,
        photo: m.photo,
        enrollmentNo: m.enrollment_no,
        branch: m.branch,
        batch: m.batch,
        points: m.total_points || 0,
        role: t.leader_id === m.id ? 'Leader' : 'Member'
      }))

      const totalPoints = formattedMembers.reduce((sum, m) => sum + m.points, 0)

      return {
        id: t.id,
        name: t.team_name,
        tagline: t.tagline || '',
        mentor: t.mentor || '',
        leaderId: t.leader_id,
        leaderName: leader ? leader.full_name : 'No Leader Assigned',
        members: formattedMembers,
        totalPoints
      }
    })

    return NextResponse.json({ success: true, teams: formattedTeams })
  } catch (error) {
    console.error('Admin teams GET error:', error)
    return NextResponse.json({ error: 'Failed to load teams data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { action, teamId } = body

    if (!action || !teamId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // 1. Fetch team record
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .maybeSingle()

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const oldTeamName = team.team_name

    // 2. Perform action
    if (action === 'EDIT') {
      const { teamName, tagline, mentor } = body

      if (!teamName || !tagline) {
        return NextResponse.json({ error: 'Missing team name or tagline' }, { status: 400 })
      }

      const newTeamName = teamName.trim()

      // If name is changing, check uniqueness
      if (newTeamName.toLowerCase() !== oldTeamName.toLowerCase()) {
        const { data: existing } = await supabaseAdmin
          .from('teams')
          .select('id')
          .eq('team_name', newTeamName)
          .maybeSingle()

        if (existing) {
          return NextResponse.json({ error: 'Team name already exists' }, { status: 409 })
        }
      }

      // Update team record
      const { error: updateError } = await supabaseAdmin
        .from('teams')
        .update({
          team_name: newTeamName,
          tagline: tagline.trim(),
          mentor: mentor ? mentor.trim() : null
        })
        .eq('id', teamId)

      if (updateError) {
        console.error('Update team error:', updateError)
        return NextResponse.json({ error: 'Failed to update team details' }, { status: 500 })
      }

      // If team name changed, update memberships of students
      if (newTeamName !== oldTeamName) {
        await supabaseAdmin
          .from('users')
          .update({ team: newTeamName })
          .eq('team', oldTeamName)
      }

      return NextResponse.json({ success: true, message: 'Team details updated successfully' })
    }

    if (action === 'DELETE') {
      // Clear team fields for all members of this team
      await supabaseAdmin
        .from('users')
        .update({ team: null })
        .eq('team', oldTeamName)

      // Delete invitations
      await supabaseAdmin
        .from('team_invitations')
        .delete()
        .eq('team_id', teamId)

      // Delete team record
      await supabaseAdmin
        .from('teams')
        .delete()
        .eq('id', teamId)

      return NextResponse.json({ success: true, message: 'Team deleted successfully' })
    }

    if (action === 'POINTS') {
      const { points, reason } = body

      if (points === undefined || isNaN(points) || !reason) {
        return NextResponse.json({ error: 'Missing points amount or reason' }, { status: 400 })
      }

      const pointsVal = parseInt(points)

      // Fetch all members of this team
      const { data: members } = await supabaseAdmin
        .from('users')
        .select('id, total_points')
        .eq('team', oldTeamName)

      if (!members || members.length === 0) {
        return NextResponse.json({ error: 'No members in this team to modify points' }, { status: 400 })
      }

      // Apply points to all members
      for (const member of members) {
        const newPoints = Math.max(0, (member.total_points || 0) + pointsVal)
        
        await supabaseAdmin
          .from('users')
          .update({ total_points: newPoints })
          .eq('id', member.id)

        await supabaseAdmin
          .from('points_history')
          .insert({
            student_id: member.id,
            points: pointsVal,
            reason: `Team Points Modification: ${reason} (Team: ${oldTeamName})`,
            given_by: user.userId
          })

        await supabaseAdmin
          .from('notifications')
          .insert({
            student_id: member.id,
            title: pointsVal >= 0 ? 'Team Points Received!' : 'Team Points Deducted',
            message: `Your team '${oldTeamName}' was awarded ${pointsVal} points. Reason: ${reason}`,
            is_read: false
          })
      }

      return NextResponse.json({ success: true, message: 'Points successfully applied to all team members' })
    }

    if (action === 'APPRECIATE') {
      const { message } = body

      if (!message) {
        return NextResponse.json({ error: 'Appreciation message is required' }, { status: 400 })
      }

      // Fetch members
      const { data: members } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('team', oldTeamName)

      if (!members || members.length === 0) {
        return NextResponse.json({ error: 'No members in this team to appreciate' }, { status: 400 })
      }

      // Insert high-priority notification to each member
      for (const member of members) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            student_id: member.id,
            title: '🌟 Team Appreciated by Admin!',
            message: `Congratulations! Admin appreciated your team '${oldTeamName}': "${message.trim()}"`,
            is_read: false
          })
      }

      return NextResponse.json({ success: true, message: 'Appreciation sent to all team members' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Admin teams POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
