import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function check() {
  console.log('--- Fetching Admin users from Supabase Auth ---')
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()
  if (authError) {
    console.error('Error listing auth users:', authError)
    return
  }

  console.log('\n--- Fetching Admin users from public.users ---')
  const { data: publicAdmins, error: publicError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('role', 'Admin')

  if (publicError) {
    console.error('Error fetching public admins:', publicError)
  } else {
    console.log('Public Admins:', publicAdmins)
  }

  // Check if any admin user in auth is missing from public.users
  authData.users.forEach(u => {
    // Check if the user is an admin (we can check by email or metadata, or if it is in the database as Admin)
    const isPublicAdmin = publicAdmins?.some(pa => pa.id === u.id)
    console.log(`Auth user: ${u.email} (${u.id}) -> isPublicAdmin: ${isPublicAdmin}`)
  })
}

check().catch(console.error)
