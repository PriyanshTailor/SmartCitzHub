import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { getComplaints } from '../../api'

export function ReportsList() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await getComplaints()
        const mappedReports = (data || []).map((r) => ({
          id: r._id || r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          status: r.status,
          created_at: r.createdAt || r.created_at,
          user_id: r.user_id,
        }))

        setReports(mappedReports)
      } catch (error) {
        console.error('Failed to fetch reports', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const filteredReports = reports.filter((report) => {
    if (filter === 'all') return true
    return report.status === filter
  })

  const categoryEmojis = {
    pothole: '🕳️',
    broken_light: '💡',
    garbage: '🗑️',
    graffiti: '🎨',
    flooding: '💧',
    other: '📍',
  }

  const statusColors = {
    open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading your reports...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'open', 'in_progress', 'resolved'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            {status === 'all' ? 'All Reports' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold mb-2">
            {filter === 'all' ? 'No reports yet' : `No ${filter.replace('_', ' ')} reports`}
          </h3>
          <p className="text-muted-foreground mb-4">
            {filter === 'all'
              ? 'Start by reporting an issue in your neighborhood.'
              : "You don't have any reports in this category."}
          </p>
          <Link to="/dashboard/reports/new" className="text-primary hover:underline">
            Create your first report →
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Link to={`/dashboard/reports/${report.id}`} key={report.id}>
              <Card className="p-4 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{categoryEmojis[report.category] || '📍'}</span>
                      <h3 className="font-semibold truncate">{report.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={statusColors[report.status]}>
                        {report.status === 'in_progress' ? 'In Progress' : report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
