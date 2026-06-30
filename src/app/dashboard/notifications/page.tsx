'use client'

import React, { useState, useEffect } from 'react'
import { Bell, CheckCircle2, Info, AlertTriangle, Zap, RefreshCw, Check } from 'lucide-react'

interface NotificationItem {
  id: string
  title: string
  message: string
  read: boolean
  time: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
}

const typeConfig: Record<string, { icon: typeof Info; color: string }> = {
  INFO: { icon: Info, color: 'text-blue-400' },
  SUCCESS: { icon: CheckCircle2, color: 'text-emerald-400' },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-400' },
  ERROR: { icon: Zap, color: 'text-red-400' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [marking, setMarking] = useState(false)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications)
      } else {
        setError(data.error || 'Failed to load notifications')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    setMarking(true)
    try {
      const res = await fetch('/api/notifications', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      }
    } catch (err) {
      console.error('Failed to mark all read:', err)
    } finally {
      setMarking(false)
    }
  }

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <Bell className="w-6 h-6 text-red-500" /> Notifications
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Stay updated with your task reviews, scores, and daily bootcamp alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={marking}
            className="text-xs font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 border border-orange-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 self-start sm:self-center transition-all disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
          <span>Loading notifications...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-16 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 text-center text-slate-500 text-xs max-w-xl mx-auto my-12">
          <Bell className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <h3 className="text-white font-bold text-sm mb-1">No Notifications Yet</h3>
          <p className="text-slate-400 text-xs">
            We will notify you here when your submissions are graded or when you receive score updates.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            const config = typeConfig[n.type] || typeConfig.INFO
            const Icon = config.icon
            return (
              <div
                key={n.id}
                className={`rounded-xl border p-5 flex items-start gap-4 transition-all ${
                  n.read
                    ? 'bg-slate-800/20 border-slate-700/40 opacity-75'
                    : 'bg-orange-500/5 border-orange-500/20 shadow-sm shadow-orange-500/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${config.color} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">{n.time}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0 animate-pulse" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
