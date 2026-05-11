import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await apiFetch('/api/notifications')

        let mapped = (data || []).map((n) => ({
          id: n._id || n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.is_read ?? n.read,
          created_at: n.createdAt || n.created_at,
        }))

        if (filter === 'unread') {
          mapped = mapped.filter((n) => !n.read)
        }

        setNotifications(mapped)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [filter])

  const typeEmojis = {
    report_update: '📍',
    initiative_update: '🤝',
    community_mention: '💬',
    achievement: '🏆',
    system: '⚙️',
  }

  const handleMarkAsRead = async (notificationId) => {
    const result = await apiFetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
    })

    if (result?.success) {
      setNotifications(
        notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    const result = await apiFetch('/api/notifications/mark-all', { method: 'POST' })

    if (result?.success) {
      setNotifications(notifications.map((n) => ({ ...n, read: true })))
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on your reports, initiatives, and community activity.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'unread'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === type
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            {type === 'all' ? 'All Notifications' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">
          Loading notifications...
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">🔔</div>
          <h3 className="text-lg font-semibold mb-2">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-muted-foreground">
            {filter === 'unread'
              ? "You're all caught up!"
              : 'When you have updates, they will appear here.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 cursor-pointer transition-colors ${notification.read ? '' : 'bg-primary/5 border-primary/20'
                } hover:border-primary`}
            >
              <div
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                className="flex items-start gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{typeEmojis[notification.type]}</span>
                    <h3 className={`font-semibold ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <Badge className="bg-primary text-primary-foreground text-xs">New</Badge>
                    )}
                  </div>
                  <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>

                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="reports" className="text-sm font-medium">
              Report Updates
            </label>
            <input type="checkbox" id="reports" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="initiatives" className="text-sm font-medium">
              Initiative Updates
            </label>
            <input type="checkbox" id="initiatives" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="community" className="text-sm font-medium">
              Community Mentions
            </label>
            <input type="checkbox" id="community" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="system" className="text-sm font-medium">
              System Announcements
            </label>
            <input type="checkbox" id="system" defaultChecked className="w-4 h-4" />
          </div>
        </div>
        <Button className="mt-4">Save Preferences</Button>
      </Card>
    </div>
  )
}
