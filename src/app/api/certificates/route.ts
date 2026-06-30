import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch user's current points
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('full_name, total_points')
      .eq('id', user.userId)
      .maybeSingle()

    if (dbError || !dbUser) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // 2. Fetch all certificate templates
    const { data: certificates, error: certError } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .order('required_xp', { ascending: true })

    if (certError) {
      console.error('Fetch student certificates error:', certError)
      return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 })
    }

    // 3. Mark unlock eligibility dynamically
    const studentPoints = dbUser.total_points || 0
    const studentName = dbUser.full_name

    const formattedCertificates = (certificates || []).map(cert => {
      const isUnlocked = studentPoints >= cert.required_xp
      return {
        id: cert.id,
        title: cert.title,
        description: cert.description,
        requiredXp: cert.required_xp,
        unlocked: isUnlocked,
        date: new Date(cert.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    })

    return NextResponse.json({
      success: true,
      studentName,
      studentPoints,
      certificates: formattedCertificates
    })
  } catch (error) {
    console.error('Certificates GET error:', error)
    return NextResponse.json({ error: 'Failed to load certificates' }, { status: 500 })
  }
}
