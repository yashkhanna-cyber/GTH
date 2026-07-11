import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.role === 'ADMIN') {
      const { data: referrals, error: refError } = await supabaseAdmin
        .from('referrals')
        .select('*, referrer:referrer_student(id, full_name, email), new_user:new_student(id, full_name, email)')
        .order('created_at', { ascending: false })

      if (refError) {
        console.error('Fetch admin referrals error:', refError)
        return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 })
      }

      // Format referrals to match frontend structure
      const formattedReferrals = (referrals || []).map(r => {
        const referrerUser = r.referrer as any
        const newUser = r.new_user as any
        return {
          id: r.id,
          referrerStudentId: r.referrer_student,
          newStudentId: r.new_student,
          pointsAwarded: r.points_awarded,
          createdAt: r.created_at,
          referrerStudent: {
            user: {
              name: referrerUser?.full_name || 'Unknown',
              email: referrerUser?.email || ''
            }
          },
          newStudent: {
            user: {
              name: newUser?.full_name || 'Unknown',
              email: newUser?.email || ''
            }
          }
        }
      })

      // Aggregate statistics for admin
      const totalPoints = formattedReferrals.reduce((sum, r) => sum + r.pointsAwarded, 0)
      
      // Calculate a referral leaderboard
      const referrerMap: Record<string, { name: string; email: string; count: number; points: number }> = {}
      for (const ref of formattedReferrals) {
        const id = ref.referrerStudentId
        const name = ref.referrerStudent.user.name
        const email = ref.referrerStudent.user.email
        if (!referrerMap[id]) {
          referrerMap[id] = { name, email, count: 0, points: 0 }
        }
        referrerMap[id].count += 1
        referrerMap[id].points += ref.pointsAwarded
      }

      const referralLeaderboard = Object.values(referrerMap).sort((a, b) => b.points - a.points)

      return NextResponse.json({
        referrals: formattedReferrals,
        stats: {
          totalReferrals: formattedReferrals.length,
          totalPoints,
          referralLeaderboard
        }
      })
    }

    // For students
    const { data: student, error: studentError } = await supabaseAdmin
      .from('users')
      .select('referral_code')
      .eq('id', user.userId)
      .maybeSingle()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const { data: referrals, error: refError } = await supabaseAdmin
      .from('referrals')
      .select('*, new_user:new_student(id, full_name, email)')
      .eq('referrer_student', user.userId)
      .order('created_at', { ascending: false })

    if (refError) {
      console.error('Fetch student referrals error:', refError)
      return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 })
    }

    const formattedReferrals = (referrals || []).map(r => {
      const newUser = r.new_user as any
      return {
        id: r.id,
        pointsAwarded: r.points_awarded,
        createdAt: r.created_at,
        newStudent: {
          user: {
            name: newUser?.full_name || 'Unknown',
            email: newUser?.email || ''
          }
        }
      }
    })

    return NextResponse.json({
      referralCode: student.referral_code,
      referrals: formattedReferrals
    })
  } catch (error) {
    console.error('Fetch referrals error:', error)
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 })
  }
}
