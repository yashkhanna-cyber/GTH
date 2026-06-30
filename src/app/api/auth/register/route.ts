import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, confirmPassword, phone, enrollmentNo, department, branch, year, batch, referralCode } = body

    if (!name || !email || !password || !enrollmentNo || !department || !branch) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if user email exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Check if enrollment number exists
    const { data: existingEnrollment } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('enrollment_no', enrollmentNo.trim())
      .maybeSingle()

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Enrollment number already registered' }, { status: 409 })
    }

    // Validate referral code if provided
    let referrer = null
    if (referralCode) {
      const { data: foundReferrer } = await supabaseAdmin
        .from('users')
        .select('id, total_points, full_name')
        .eq('referral_code', referralCode.trim())
        .maybeSingle()

      if (!foundReferrer) {
        return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
      }
      referrer = foundReferrer
    }

    // 1. Create User in Supabase Auth using admin client (auto-confirming email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: { name }
    })

    if (authError || !authData.user) {
      console.error('Supabase Auth createUser error:', authError)
      return NextResponse.json({ error: authError?.message || 'Failed to create auth user' }, { status: 500 })
    }

    const myReferralCode = `GTH-${enrollmentNo.trim().toUpperCase()}`
    const userId = authData.user.id

    // 2. Create User Profile in public users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        full_name: name,
        email: email.trim().toLowerCase(),
        role: 'Student',
        department,
        referral_code: myReferralCode,
        enrollment_no: enrollmentNo.trim(),
        branch,
        year: parseInt(year) || 1,
        batch,
        total_points: 0
      })

    if (profileError) {
      console.error('Supabase profile insertion error:', profileError)
      // Cleanup auth user on profile creation failure
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    // 3. If referral code was valid, apply referral bonuses
    if (referrer) {
      const bonusPoints = 10

      // 3a. Update referrer's points
      const newReferrerPoints = (referrer.total_points || 0) + bonusPoints
      await supabaseAdmin
        .from('users')
        .update({ total_points: newReferrerPoints })
        .eq('id', referrer.id)

      // 3b. Insert record into referrals table
      await supabaseAdmin
        .from('referrals')
        .insert({
          referrer_student: referrer.id,
          new_student: userId,
          points_awarded: bonusPoints
        })

      // 3c. Insert record into points_history table
      await supabaseAdmin
        .from('points_history')
        .insert({
          student_id: referrer.id,
          points: bonusPoints,
          reason: `Referral bonus: referred ${name}`,
          given_by: userId // The new user is the cause of the bonus
        })

      // 3d. Create notification for referrer
      await supabaseAdmin
        .from('notifications')
        .insert({
          student_id: referrer.id,
          title: 'Referral Bonus Received!',
          message: `Congratulations! ${name} registered using your referral code. You earned ${bonusPoints} points.`,
          is_read: false
        })
    }

    // Set auth session cookie
    await setAuthCookie({
      userId: userId,
      email: email.trim().toLowerCase(),
      role: 'STUDENT',
      name: name,
    })

    return NextResponse.json({
      user: { id: userId, email: email.trim().toLowerCase(), name: name, role: 'STUDENT' },
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
