import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/lib/api'

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchInitiatives = async () => {
      try {
        const data = await apiFetch('/api/initiatives')

        let filtered = (data || []).map((init) => ({
          id: init._id || init.id,
          title: init.title,
          description: init.description,
          category: init.category,
          status: init.status,
          participants_count: init.participants_count,
          created_at: init.createdAt || init.created_at,
        }))

        if (filter !== 'all') {
          filtered = filtered.filter((i) => i.status === filter)
        }

        setInitiatives(filtered)
      } catch (error) {
        console.error('Error fetching initiatives:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitiatives()
  }, [filter])

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    paused: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
  }

  const categoryEmojis = {
    cleanup: '🧹',
    planting: '🌱',
    recycling: '♻️',
    education: '📚',
    safety: '🚨',
    other: '🤝',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Community Initiatives</h1>
          <p className="text-muted-foreground">
            Join or create community projects to improve your neighborhood.
          </p>
        </div>
        <Link to="/dashboard/initiatives/new">
          <Button>+ New Initiative</Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'active', 'completed', 'paused'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            {status === 'all' ? 'All Initiatives' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading initiatives...</div>
        </div>
      ) : initiatives.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">🤝</div>
          <h3 className="text-lg font-semibold mb-2">
            {filter === 'all' ? 'No initiatives yet' : `No ${filter} initiatives`}
          </h3>
          <p className="text-muted-foreground mb-4">
            {filter === 'all'
              ? 'Be the first to start a community initiative!'
              : 'Try another category or create a new initiative.'}
          </p>
          <Link to="/dashboard/initiatives/new">
            <Button>Start New Initiative</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initiatives.map((initiative) => (
            <Link key={initiative.id} to={`/dashboard/initiatives/${initiative.id}`}>
              <Card className="p-6 h-full hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-3xl">{categoryEmojis[initiative.category] || '🤝'}</span>
                  <Badge className={statusColors[initiative.status]}>
                    {initiative.status.charAt(0).toUpperCase() + initiative.status.slice(1)}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-2 line-clamp-2">{initiative.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {initiative.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    👥 {initiative.participants_count} participants
                  </span>
                  <span className="text-primary hover:underline">View →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card className="p-6 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
        <h3 className="font-semibold mb-3 text-orange-900 dark:text-orange-100">Community Initiative Ideas</h3>
        <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-2">
          <li>✓ Organize neighborhood cleanup events</li>
          <li>✓ Plant trees and create green spaces</li>
          <li>✓ Start community garden projects</li>
          <li>✓ Plan educational workshops</li>
          <li>✓ Organize safety patrols</li>
          <li>✓ Coordinate recycling drives</li>
        </ul>
      </Card>
    </div>
  )
}
