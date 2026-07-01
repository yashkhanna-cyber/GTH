import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { bio, skills, linkedin, github, instagram, photo } = await req.json()

    let photoUrl = undefined
    if (photo) {
      if (photo.startsWith('data:image/')) {
        try {
          const mimeType = photo.split(';')[0].split(':')[1]
          const base64Data = photo.split(',')[1]
          const buffer = Buffer.from(base64Data, 'base64')
          const filename = `avatar-${user.userId}-${Date.now()}.${mimeType.split('/')[1]}`

          const { error: uploadError } = await supabaseAdmin.storage
            .from('avatars')
            .upload(filename, buffer, {
              contentType: mimeType,
              upsert: true
            })

          if (!uploadError) {
            const { data: { publicUrl } } = supabaseAdmin.storage
              .from('avatars')
              .getPublicUrl(filename)
            photoUrl = publicUrl
          } else {
            photoUrl = photo
          }
        } catch (e) {
          console.error('Profile pic upload error:', e)
          photoUrl = photo
        }
      } else {
        photoUrl = photo
      }
    }

    const updateData: any = {
      bio: bio || null,
      skills: skills || null,
      linkedin: linkedin || null,
      github: github || null,
      instagram: instagram || null,
    }

    if (photoUrl !== undefined) {
      updateData.photo = photoUrl
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.userId)

    if (updateError) {
      console.error('Update profile error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 550 })
    }

    return NextResponse.json({ success: true, photoUrl })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
