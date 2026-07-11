import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch current student profile
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, role, team, total_points')
      .eq('id', user.userId)
      .maybeSingle()

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (dbUser.team) {
      // --- Student has a team ---
      // Fetch Team details
      const { data: teamData } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('team_name', dbUser.team)
        .maybeSingle()

      // Fetch all members of this team
      const { data: members } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email, photo, enrollment_no, branch, batch, total_points')
        .eq('team', dbUser.team)

      const formattedMembers = (members || []).map(m => ({
        id: m.id,
        name: m.full_name,
        email: m.email,
        photo: m.photo,
        enrollmentNo: m.enrollment_no,
        branch: m.branch,
        batch: m.batch,
        points: m.total_points || 0,
        role: teamData?.leader_id === m.id ? 'Leader' : 'Member'
      }))

      // Calculate total team points
      const totalPoints = formattedMembers.reduce((sum, m) => sum + m.points, 0)

      // Calculate Rank dynamically
      // Fetch all users to aggregate team points
      const { data: allUsers } = await supabaseAdmin
        .from('users')
        .select('team, total_points')
        .eq('role', 'Student')

      const teamPointsMap: Record<string, number> = {}
      ;(allUsers || []).forEach(u => {
        if (u.team) {
          teamPointsMap[u.team] = (teamPointsMap[u.team] || 0) + (u.total_points || 0)
        }
      })

      // Sort teams by points
      const sortedTeams = Object.keys(teamPointsMap).map(name => ({
        name,
        points: teamPointsMap[name]
      })).sort((a, b) => b.points - a.points)

      const rankIndex = sortedTeams.findIndex(t => t.name === dbUser.team)
      const rank = rankIndex !== -1 ? rankIndex + 1 : 1

      return NextResponse.json({
        success: true,
        inTeam: true,
        team: {
          id: teamData?.id,
          name: teamData?.team_name,
          tagline: teamData?.tagline || '',
          mentor: teamData?.mentor || null,
          leaderId: teamData?.leader_id,
          members: formattedMembers,
          totalPoints,
          rank,
          totalTeams: sortedTeams.length
        }
      })
    } else {
      // --- Student does NOT have a team ---
      // Fetch pending invitations
      const { data: invites } = await supabaseAdmin
        .from('team_invitations')
        .select('id, team_id, status, teams(*, users(full_name))')
        .eq('student_id', user.userId)
        .eq('status', 'PENDING')

      const formattedInvites = (invites || []).map(inv => {
        const teamObj: any = inv.teams
        const leaderObj: any = teamObj?.users
        return {
          id: inv.id,
          teamId: inv.team_id,
          teamName: teamObj?.team_name,
          tagline: teamObj?.tagline,
          leaderName: leaderObj?.full_name || teamObj?.mentor || 'GTH Leader'
        }
      })

      // Fetch all eligible students (students not in a team)
      const { data: eligible } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email, enrollment_no, branch, batch')
        .eq('role', 'Student')
        .is('team', null)

      // Filter out self
      const formattedEligible = (eligible || [])
        .filter(s => s.id !== user.userId)
        .map(s => ({
          id: s.id,
          name: s.full_name,
          email: s.email,
          enrollmentNo: s.enrollment_no,
          branch: s.branch,
          batch: s.batch
        }))

      return NextResponse.json({
        success: true,
        inTeam: false,
        pendingInvitations: formattedInvites,
        eligibleMembers: formattedEligible
      })
    }
  } catch (error) {
    console.error('Fetch team error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamName, tagline, invitedStudentIds } = await req.json()

    if (!teamName || !tagline || !invitedStudentIds || !Array.isArray(invitedStudentIds)) {
      return NextResponse.json({ error: 'Missing required team fields' }, { status: 400 })
    }

    // 1. Verify creator profile
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id, full_name, team')
      .eq('id', user.userId)
      .maybeSingle()

    if (!dbUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (dbUser.team) {
      return NextResponse.json({ error: 'You are already in a team' }, { status: 400 })
    }

    // 2. Validate team size (inviting 2 to 4 students, making total size 3 to 5)
    const invitedCount = invitedStudentIds.length
    if (invitedCount < 2 || invitedCount > 4) {
      return NextResponse.json({ error: 'A team must consist of minimum 3 and maximum 5 members (including the leader).' }, { status: 400 })
    }

    // 3. Verify team name uniqueness
    const { data: existingTeam } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('team_name', teamName.trim())
      .maybeSingle()

    if (existingTeam) {
      return NextResponse.json({ error: 'Team name already exists' }, { status: 409 })
    }

    // 4. Verify that invited students do not belong to a team
    const { data: alreadyAssigned } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .in('id', invitedStudentIds)
      .not('team', 'is', null)

    if (alreadyAssigned && alreadyAssigned.length > 0) {
      const names = alreadyAssigned.map(s => s.full_name).join(', ')
      return NextResponse.json({ error: `The following students are already in a team: ${names}` }, { status: 400 })
    }

    // 5. Create Team
    const { data: newTeam, error: createError } = await supabaseAdmin
      .from('teams')
      .insert({
        team_name: teamName.trim(),
        tagline: tagline.trim(),
        leader_id: user.userId
      })
      .select()
      .single()

    if (createError || !newTeam) {
      console.error('Create team error:', createError)
      return NextResponse.json({ error: 'Failed to create team record' }, { status: 500 })
    }

    // 6. Add creator to the team immediately
    await supabaseAdmin
      .from('users')
      .update({ team: teamName.trim() })
      .eq('id', user.userId)

    // 7. Upsert invitations and create notifications
    for (const studentId of invitedStudentIds) {
      // 7a. Upsert invitation record (handles cases where a student was previously invited/declined)
      await supabaseAdmin
        .from('team_invitations')
        .upsert({
          team_id: newTeam.id,
          student_id: studentId,
          status: 'PENDING'
        }, {
          onConflict: 'team_id,student_id'
        })

      // 7b. Create notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          student_id: studentId,
          title: 'Team Invitation',
          message: `${dbUser.full_name} has invited you to join the team '${teamName.trim()}'. Go to My Team page to Accept or Decline.`,
          is_read: false
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Team created successfully and invitations sent!'
    }, { status: 201 })
  } catch (error) {
    console.error('Create team POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
