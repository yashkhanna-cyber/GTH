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
  console.log('--- Students in public.users ---')
  const { data: students, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, team, role')
    .eq('role', 'Student')
  if (userError) console.error('Error fetching students:', userError)
  else console.log('Students:', students)

  console.log('\n--- Teams in public.teams ---')
  const { data: teams, error: teamError } = await supabaseAdmin
    .from('teams')
    .select('*')
  if (teamError) console.error('Error fetching teams:', teamError)
  else console.log('Teams:', teams)

  console.log('\n--- Invitations in public.team_invitations ---')
  const { data: invites, error: inviteError } = await supabaseAdmin
    .from('team_invitations')
    .select('*')
  if (inviteError) console.error('Error fetching invitations:', inviteError)
  else console.log('Invitations:', invites)
}

check().catch(console.error)
