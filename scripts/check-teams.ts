import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

async function main() {
  console.log('--- Diagnostic: Checking Teams and Users in Supabase ---')
  
  const { data: teams, error: teamsErr } = await supabaseAdmin.from('teams').select('*')
  console.log('Teams in DB:', teamsErr ? teamsErr.message : teams)
  
  const { data: users, error: usersErr } = await supabaseAdmin.from('users').select('id, full_name, email, role, team')
  console.log('Users in DB:', usersErr ? usersErr.message : users)
}

main()
