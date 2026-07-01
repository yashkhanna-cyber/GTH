import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 1. Fetch top 100 students sorted by total_points DESC
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'Student')
      .order('total_points', { ascending: false })
      .limit(100)

    if (studentsError) {
      console.error('Fetch leaderboard students error:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // 2. Fetch all referrals to calculate referral scores
    const { data: referrals, error: referralsError } = await supabaseAdmin
      .from('referrals')
      .select('referrer_student')

    const referralCounts: Record<string, number> = {}
    if (!referralsError && referrals) {
      for (const ref of referrals) {
        referralCounts[ref.referrer_student] = (referralCounts[ref.referrer_student] || 0) + 1
      }
    }

    // 3. Format entries for the leaderboard frontend
    const leaderboard = (students || []).map((s, index) => {
      const refCount = referralCounts[s.id] || 0
      const referralScore = refCount * 10
      const totalPoints = s.total_points || 0
      const communityScore = Math.max(0, totalPoints - referralScore)

      return {
        id: s.id,
        rank: index + 1,
        totalPoints,
        projectScore: 0,
        communityScore,
        innovationScore: 0,
        referralScore,
        student: {
          id: s.id,
          enrollmentNo: s.enrollment_no || '',
          team: s.team ? { name: s.team } : null,
          user: {
            name: s.full_name,
            avatar: s.photo || null
          }
        }
      }
    })

    // 4. Calculate Team Leaderboard (Group students by team and sum points)
    const { data: allStudents, error: allStudentsError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, team, total_points, photo')
      .eq('role', 'Student')

    const teamMap: Record<string, { teamName: string; totalPoints: number; memberCount: number; members: { name: string; avatar: string | null }[] }> = {}
    
    if (!allStudentsError && allStudents) {
      for (const s of allStudents) {
        if (s.team) {
          const tName = s.team.trim()
          if (!teamMap[tName]) {
            teamMap[tName] = {
              teamName: tName,
              totalPoints: 0,
              memberCount: 0,
              members: []
            }
          }
          teamMap[tName].totalPoints += s.total_points || 0
          teamMap[tName].memberCount += 1
          if (teamMap[tName].members.length < 5) {
            teamMap[tName].members.push({
              name: s.full_name,
              avatar: s.photo || null
            })
          }
        }
      }
    }

    const teamLeaderboard = Object.values(teamMap)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((t, index) => ({
        rank: index + 1,
        teamName: t.teamName,
        totalPoints: t.totalPoints,
        memberCount: t.memberCount,
        members: t.members
      }))

    return NextResponse.json({ 
      leaderboard,
      teamsLeaderboard: teamLeaderboard
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 })
  }
}
