import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

export default function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await apiFetch('/api/admin/reports')
        console.log('[AdminReportsPage] Fetched data:', data)

        let filtered = (data || []).map((r) => ({
          id: r._id || r.id,
          title: r.title || 'No title',
          category: r.category || 'other',
          status: r.status || 'open',
          created_at: r.createdAt || r.created_at || new Date().toISOString(),
          user_id: r.user_id?.toString() || '',
        }))

        console.log('[AdminReportsPage] Mapped reports:', filtered)

        if (filter !== 'all') {
          filtered = filtered.filter((r) => r.status === filter)
        }

        console.log('[AdminReportsPage] Filtered reports:', filtered)
        setReports(filtered)
      } catch (error) {
        console.error('Error fetching reports:', error)
        setReports([])
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [filter])

  const handleStatusChange = async (reportId, newStatus) => {
    const result = await apiFetch(`/api/admin/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    if (result?.success) {
      setReports(reports.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)))
    }
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reports Management</h1>
        <p className="text-muted-foreground">
          View and manage all reports submitted by the community.
        </p>
      </div>

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

      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">
          Loading reports...
        </Card>
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No reports found.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Issue</th>
                  <th className="text-left px-6 py-3 font-semibold">Category</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Date</th>
                  <th className="text-left px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>{categoryEmojis[report.category] || '📍'}</span>
                        <span className="font-medium">{report.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {report.category.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={report.status}
                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                        className={`px-3 py-1 rounded-md text-sm font-medium border-0 cursor-pointer ${statusColors[report.status]}`}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" disabled>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
