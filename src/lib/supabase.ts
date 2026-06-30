import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key'

if (
  supabaseUrl.includes('placeholder') || 
  supabaseAnonKey.includes('placeholder') || 
  supabaseServiceRoleKey.includes('placeholder')
) {
  console.warn('⚠️ WARNING: Supabase environment variables are missing or using placeholder values! Please check your Vercel Project Settings.')
}

// Client-side and standard server-side client using anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side admin client using service role key (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

