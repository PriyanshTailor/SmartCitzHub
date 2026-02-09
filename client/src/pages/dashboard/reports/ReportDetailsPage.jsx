import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Share2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export default function ReportDetailsPage() {
  const { id } = useParams()
  const reportId = id
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await apiFetch(`/api/reports/${reportId}`)

        if (data) {
          setReport({
            id: data._id || data.id,
            title: data.title,
            description: data.description,
            category: data.category,
            status: data.status,
            image_url: data.image_url || null,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            created_at: data.createdAt || data.created_at,
            updated_at: data.updatedAt || data.updated_at,
          })
        }
      } catch (error) {
        console.error('Error fetching report:', error)
      } finally {
        setLoading(false)
      }
    }

    if (reportId) {
      fetchReport()
    }
  }, [reportId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading report...</div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Report not found</h2>
        <Link to="/dashboard/reports">
          <Button variant="outline">Back to Reports</Button>
        </Link>
      </div>
    )
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
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Header */}
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-4xl">{categoryEmojis[report.category] || '📍'}</span>
                <div>
                  <h1 className="text-3xl font-bold">{report.title}</h1>
                  <p className="text-muted-foreground mt-1">
                    Reported on {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge className={statusColors[report.status]}>
                {report.status === 'in_progress' ? 'In Progress' : report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Badge>
            </div>
          </Card>

          {/* Image */}
          {report.image_url && (
            <Card className="overflow-hidden">
              <img
                src={report.image_url || '/placeholder.svg'}
                alt={report.title}
                className="w-full h-96 object-cover"
              />
            </Card>
          )}

          {/* Description */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-foreground whitespace-pre-line">{report.description}</p>
          </Card>

          {/* Location */}
          {(report.latitude || report.longitude) && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              <p className="text-foreground mb-2">
                <span className="text-muted-foreground">Latitude: </span>
                {report.latitude?.toFixed(4)}
              </p>
              <p className="text-foreground">
                <span className="text-muted-foreground">Longitude: </span>
                {report.longitude?.toFixed(4)}
              </p>
            </Card>
          )}

          {/* Comments Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Updates</h2>
            <div className="text-center text-muted-foreground py-8">
              <p>No updates yet. Check back soon!</p>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Report Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Category</p>
                <p className="font-medium capitalize">{report.category.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Status</p>
                <p className="font-medium capitalize">{report.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Report ID</p>
                <p className="font-mono text-xs break-all">{report.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Created</p>
                <p className="font-medium">{new Date(report.created_at).toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <Button variant="outline" className="w-full gap-2 bg-transparent" disabled>
              <Share2 size={18} />
              Share Report
            </Button>
          </Card>

          {report.status === 'open' && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This report is open and visible to city officials. You'll receive updates as progress is made.
              </p>
            </Card>
          )}

          {report.status === 'resolved' && (
            <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ This issue has been resolved. Thank you for reporting it!
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
