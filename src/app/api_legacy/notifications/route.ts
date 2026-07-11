import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: list, error } = await supabaseAdmin
      .from('notifications')
      .select('id, title, message, is_read, created_at')
      .eq('student_id', user.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch notifications error:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    const formatted = (list || []).map(item => {
      const diffMs = Date.now() - new Date(item.created_at).getTime()
      const diffMins = Math.round(diffMs / 60000)
      let timeStr = 'Just now'

      if (diffMins >= 1440) {
        const diffDays = Math.floor(diffMins / 1440)
        timeStr = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
      } else if (diffMins >= 60) {
        const diffHrs = Math.floor(diffMins / 60)
        timeStr = `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`
      } else if (diffMins > 0) {
        timeStr = `${diffMins} min ago`
      }

      // Determine type based on keywords (for UI icon styling match)
      let type = 'INFO'
      const msgLower = item.message.toLowerCase()
      const titleLower = item.title.toLowerCase()
      if (titleLower.includes('approved') || msgLower.includes('earned') || msgLower.includes('restored') || titleLower.includes('unlocked')) {
        type = 'SUCCESS'
      } else if (msgLower.includes('warning') || msgLower.includes('absent') || titleLower.includes('warning')) {
        type = 'WARNING'
      } else if (msgLower.includes('error') || msgLower.includes('fail') || msgLower.includes('reject')) {
        type = 'ERROR'
      }

      return {
        id: item.id,
        title: item.title,
        message: item.message,
        read: item.is_read,
        time: timeStr,
        type
      }
    })

    return NextResponse.json({ success: true, notifications: formatted })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('student_id', user.userId)
      .eq('is_read', false)

    if (error) {
      console.error('Mark read error:', error)
      return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notifications POST error:', error)
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 })
  }
}
