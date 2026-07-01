import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch user details from public.users table
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.userId)
      .maybeSingle()

    if (dbError || !dbUser) {
      console.error('Fetch user error:', dbError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate dynamic rank for Student
    let rank = 1
    if (dbUser.role === 'Student') {
      const { count, error: countError } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'Student')
        .gt('total_points', dbUser.total_points || 0)

      if (!countError && count !== null) {
        rank = count + 1
      }
    }

    const uppercaseRole = dbUser.role.toUpperCase()

    // Format full user profile to match frontend components structure
    const fullUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.full_name,
      phone: dbUser.enrollment_no, // mapping enrollment number to phone for display purposes if needed, but the original also has phone field
      avatar: dbUser.photo,
      role: uppercaseRole,
      bio: dbUser.bio,
      skills: dbUser.skills,
      linkedin: dbUser.linkedin,
      github: dbUser.github,
      instagram: dbUser.instagram,
      student: dbUser.role === 'Student' ? {
        id: dbUser.id,
        enrollmentNo: dbUser.enrollment_no || '',
        team: dbUser.team ? {
          name: dbUser.team
        } : null,
        leaderboard: {
          totalPoints: dbUser.total_points || 0,
          rank: rank
        }
      } : null
    }

    return NextResponse.json({ user: fullUser })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
