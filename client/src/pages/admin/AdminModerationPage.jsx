import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { moderationApi } from '@/api/moderation.api'
import { Loader2 } from 'lucide-react'

export default function AdminModerationPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchFlags()
  }, [])

  const fetchFlags = async () => {
    try {
      setLoading(true)
      const data = await moderationApi.getFlags()
      setItems(data)
    } catch (error) {
      console.error('Failed to fetch flags', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, action) => {
    try {
      // Optimistic update
      setItems(items.map(item => item._id === id ? { ...item, status: action === 'dismiss' ? 'rejected' : 'resolved' } : item))

      await moderationApi.resolveFlag(id, action)
      fetchFlags() // Refresh to be sure
    } catch (error) {
      console.error('Failed to resolve flag', error)
      fetchFlags() // Revert
    }
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200', // Content Deleted
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200', // Flag Dismissed
  }

  const typeEmojis = {
    Report: '📍',
    Discussion: '💬',
    Comment: '💭',
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'pending') return item.status === 'pending'
    if (filter === 'reviewed') return item.status !== 'pending'
    return true
  })

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Moderation Center</h1>
        <p className="text-muted-foreground">
          Review and manage flagged content from the community.
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'reviewed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            {status === 'all' ? 'All Items' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No flagged content to review.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <Card key={item._id} className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{typeEmojis[item.contentType] || '❓'}</span>
                    <h3 className="font-semibold">{item.contentType} Content</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Type: <span className="capitalize">{item.contentType}</span>
                  </p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">ID: </span>
                      {/* Access populated contentId if available, or just the ID */}
                      {typeof item.contentId === 'object' ? (item.contentId?.title || item.contentId?.content || item.contentId?._id) : item.contentId}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Reason: </span>
                      {item.reason}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Flagged by: </span>
                      {item.flaggedBy?.full_name || item.flaggedBy?.email || 'User'}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Date: </span>
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                    {item.adminComments && (
                      <p className="mt-2 p-2 bg-muted/50 rounded text-xs">
                        <span className="font-semibold">Admin Note:</span> {item.adminComments}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className={statusColors[item.status] || 'bg-gray-100'}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
              </div>

              {item.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    size="sm"
                    onClick={() => handleAction(item._id, 'dismiss')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve (Keep Content)
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(item._id, 'reject')}
                  >
                    Reject (Delete Content)
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
