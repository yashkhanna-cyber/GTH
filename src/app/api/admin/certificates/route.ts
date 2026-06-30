import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: certificates, error } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .order('required_xp', { ascending: true })

    if (error) {
      console.error('Fetch admin certificates error:', error)
      return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 })
    }

    return NextResponse.json({ success: true, certificates })
  } catch (error) {
    console.error('Certificates admin GET error:', error)
    return NextResponse.json({ error: 'Failed to load certificates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { title, description, requiredXp } = await req.json()

    if (!title || !description || requiredXp === undefined) {
      return NextResponse.json({ error: 'Title, description, and required XP are required' }, { status: 400 })
    }

    const { data: newCertificate, error } = await supabaseAdmin
      .from('certificates')
      .insert({
        title,
        description,
        required_xp: parseInt(requiredXp) || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Create certificate error:', error)
      return NextResponse.json({ error: 'Failed to create certificate' }, { status: 500 })
    }

    return NextResponse.json({ success: true, certificate: newCertificate })
  } catch (error) {
    console.error('Certificates admin POST error:', error)
    return NextResponse.json({ error: 'Failed to create certificate template' }, { status: 500 })
  }
}
