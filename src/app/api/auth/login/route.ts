import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    })

    if (authError || !authData.user) {
      console.error('Supabase Auth error details:', authError)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // 2. Fetch User profile from public users table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (profileError || !profile) {
      console.error('Fetch profile error:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const uppercaseRole = profile.role.toUpperCase() // 'STUDENT' or 'ADMIN'

    // 3. Set auth session cookie
    await setAuthCookie({
      userId: profile.id,
      email: profile.email,
      role: uppercaseRole,
      name: profile.full_name,
    })

    return NextResponse.json({
      user: { id: profile.id, email: profile.email, name: profile.full_name, role: uppercaseRole },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
