import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file to seed the database.')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function main() {
  console.log('Seeding GTH TechVerse 2026 Supabase Database...')

  // 1. Clean up existing data in correct dependency order
  console.log('Cleaning up existing database records...')
  await supabaseAdmin.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('points_history').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('referrals').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('task_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('Cleaning up existing auth users...')
  const { data: authUsersData, error: authListError } = await supabaseAdmin.auth.admin.listUsers()
  if (authListError) {
    console.warn('Warning: Could not fetch auth users for cleanup:', authListError.message)
  } else if (authUsersData && authUsersData.users) {
    for (const u of authUsersData.users) {
      console.log(`Deleting auth user: ${u.email}`)
      await supabaseAdmin.auth.admin.deleteUser(u.id)
    }
  }

  // 2. Insert Teams
  console.log('Inserting teams...')
  const { data: teamA, error: teamAError } = await supabaseAdmin
    .from('teams')
    .insert({ team_name: 'Team Alpha', mentor: 'Alice Mentor' })
    .select()
    .single()

  const { data: teamB, error: teamBError } = await supabaseAdmin
    .from('teams')
    .insert({ team_name: 'Team Beta', mentor: 'Bob Mentor' })
    .select()
    .single()

  if (teamAError || teamBError) {
    throw new Error('Failed to insert teams: ' + (teamAError?.message || teamBError?.message))
  }

  // 3. Insert Admin User
  console.log('Creating Admin Auth user...')
  const adminEmail = 'admin@gth.com'
  const { data: authAdmin, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: 'password123',
    email_confirm: true,
    user_metadata: { name: 'GTH Admin' }
  })

  if (adminAuthError || !authAdmin.user) {
    throw new Error('Failed to create admin auth user: ' + adminAuthError?.message)
  }

  console.log('Inserting Admin user profile...')
  const { error: adminProfileError } = await supabaseAdmin.from('users').insert({
    id: authAdmin.user.id,
    full_name: 'GTH Admin',
    email: adminEmail,
    role: 'Admin',
    department: 'Management',
    referral_code: 'GTH-ADMIN',
    total_points: 0
  })

  if (adminProfileError) {
    throw new Error('Failed to create admin profile: ' + adminProfileError.message)
  }

  // 4. Insert Student Users
  console.log('Creating Student users...')
  const studentsToSeed = [
    { email: 'student1@gth.com', name: 'Yash Student', enrollment: '22CSE001', team: 'Team Alpha', points: 120 },
    { email: 'student2@gth.com', name: 'Aryan Dev', enrollment: '22CSE002', team: 'Team Alpha', points: 90 },
    { email: 'student3@gth.com', name: 'Kabir Malik', enrollment: '22CSE003', team: 'Team Beta', points: 150 }
  ]

  const seededStudents: Record<string, string> = {}

  for (const s of studentsToSeed) {
    console.log(`Creating auth user: ${s.email}`)
    const { data: authUser, error: userAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: s.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { name: s.name }
    })

    if (userAuthError || !authUser.user) {
      throw new Error(`Failed to create student auth user ${s.email}: ` + userAuthError?.message)
    }

    console.log(`Inserting user profile: ${s.name}`)
    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authUser.user.id,
      full_name: s.name,
      email: s.email,
      role: 'Student',
      department: 'Computer Science',
      team: s.team,
      referral_code: `GTH-${s.enrollment}`,
      enrollment_no: s.enrollment,
      branch: 'CSE',
      year: 3,
      batch: 'Batch A',
      total_points: s.points,
      bio: 'Enthusiastic full-stack developer eager to learn IoT and AI.',
      skills: 'React, Tailwind CSS, TypeScript, Node.js'
    })

    if (profileError) {
      throw new Error(`Failed to create profile for student ${s.email}: ` + profileError.message)
    }

    seededStudents[s.enrollment] = authUser.user.id
  }

  // 5. Insert Projects
  console.log('Inserting projects...')
  const { error: projectsError } = await supabaseAdmin.from('projects').insert([
    {
      title: 'Full Stack TechVerse Bootcamp Manager',
      description: 'Develop a modern, highly interactive bootcamp portal with Next.js App Router and Supabase services.',
      instruction_pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      assigned_to: 'ALL',
      created_by: authAdmin.user.id
    },
    {
      title: 'AI Smart Agent & Chat Interface',
      description: 'Create an intelligent customer-facing chatbot integrating Google Gemini API and LangChain.',
      instruction_pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      assigned_to: 'BATCH',
      assigned_target: 'Batch A',
      created_by: authAdmin.user.id
    }
  ])

  if (projectsError) {
    throw new Error('Failed to insert projects: ' + projectsError.message)
  }

  // 6. Insert Tasks
  console.log('Inserting tasks...')
  const { data: task1, error: task1Error } = await supabaseAdmin
    .from('tasks')
    .insert({
      title: 'Setup Project and Repository',
      description: 'Initialize a clean Next.js application, configure TailwindCSS, and push the repository to GitHub.',
      rules: 'Submit a valid GitHub repository URL. Ensure proper README.md.',
      points: 50,
      deadline: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
      assigned_to: 'ALL'
    })
    .select()
    .single()

  const { data: task2, error: task2Error } = await supabaseAdmin
    .from('tasks')
    .insert({
      title: 'Design Dashboard UI Components',
      description: 'Implement a highly responsive client dashboard UI containing points metrics and task lists.',
      rules: 'Use Tailwind CSS and shadcn/ui. Ensure dark mode works correctly.',
      points: 100,
      deadline: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
      assigned_to: 'ALL'
    })
    .select()
    .single()

  if (task1Error || task2Error) {
    throw new Error('Failed to insert tasks: ' + (task1Error?.message || task2Error?.message))
  }

  // 7. Insert some referrals/logs for student 1 referring student 2
  console.log('Inserting referrals and score history logs...')
  const referrerId = seededStudents['22CSE001']
  const newStudentId = seededStudents['22CSE002']

  if (referrerId && newStudentId) {
    // Record Referral
    await supabaseAdmin.from('referrals').insert({
      referrer_student: referrerId,
      new_student: newStudentId,
      points_awarded: 10
    })

    // Record Referral Points History
    await supabaseAdmin.from('points_history').insert({
      student_id: referrerId,
      points: 10,
      reason: 'Referral bonus: referred Aryan Dev (22CSE002)',
      given_by: newStudentId
    })

    // Record normal tasks Points History
    await supabaseAdmin.from('points_history').insert([
      {
        student_id: referrerId,
        points: 50,
        reason: 'Task approved: Setup Project and Repository',
        given_by: authAdmin.user.id
      },
      {
        student_id: seededStudents['22CSE003'],
        points: 100,
        reason: 'Task approved: Design Dashboard UI Components',
        given_by: authAdmin.user.id
      }
    ])

    // Record Task Submission
    await supabaseAdmin.from('task_submissions').insert({
      student_id: referrerId,
      task_id: task1.id,
      uploaded_file: 'https://github.com/yash/techverse-setup',
      comment: 'Here is the setup repository link. Ready for review.',
      status: 'APPROVED',
      points_awarded: 50,
      review_comment: 'Excellent file structure and documentation!'
    })

    // Create Notification
    await supabaseAdmin.from('notifications').insert({
      student_id: referrerId,
      title: 'Task Approved!',
      message: 'Your submission for task "Setup Project and Repository" has been approved. You earned 50 points.',
      is_read: false
    })
  }

  console.log('Database seeding completed successfully!')
}

main().catch(err => {
  console.error('Error seeding database:', err)
  process.exit(1)
})
