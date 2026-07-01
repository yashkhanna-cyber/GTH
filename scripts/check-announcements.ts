import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

async function main() {
  console.log('--- Diagnostic: Checking Announcements Schema/Data ---')
  
  const { data: announcements, error: annErr } = await supabaseAdmin.from('announcements').select('*')
  if (annErr) {
    console.error('Error fetching announcements:', annErr)
  } else {
    console.log('Announcements in DB:', announcements)
  }
}

main()
