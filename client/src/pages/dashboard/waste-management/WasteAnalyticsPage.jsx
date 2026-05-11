import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Recycle, TrendingUp, Download, Truck } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const BarChart = ({ data, color = 'bg-primary' }) => (
  <div className="flex items-end gap-2 h-40 w-full mt-4">
    {data.map((item, i) => (
      <div key={item.zone || i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
        <div className={`w-full ${color} rounded-t-sm transition-all group-hover:opacity-80`} style={{ height: `${item.value}%` }} />
      </div>
    ))}
  </div>
)

const LineChart = ({ data }) => {
  const points = data.length
    ? data.map((item, index) => {
        const x = data.length === 1 ? 100 : (index / (data.length - 1)) * 100
        const y = 40 - (item.value / 100) * 35
        return `${x},${y}`
      }).join(' ')
    : '0,40 100,40'

  return (
    <div className="relative h-40 w-full mt-4 border-l border-b flex items-end">
      <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <polyline points={points} fill="none" className="stroke-primary" strokeWidth="2" />
      </svg>
    </div>
  )
}

const emptyAnalytics = {
  summary: {
    totalBins: 0,
    avgFillRate: 0,
    collections: 0,
    collectionEfficiency: 0,
    recyclingRate: 0,
    schedules: 0,
  },
  trend: [],
  zoneEfficiency: [],
  composition: [],
  highPriorityBins: [],
}

export default function WasteAnalyticsPage() {
  const [analytics, setAnalytics] = useState(emptyAnalytics)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await apiFetch('/api/waste/analytics')
        setAnalytics(data || emptyAnalytics)
      } catch (err) {
        console.error('Error fetching waste analytics:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const { summary, trend, zoneEfficiency, composition, highPriorityBins } = analytics

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Waste Analytics</h1>
          <p className="text-muted-foreground">Live insights from disposal points, schedules, and waste complaints.</p>
        </div>
        <Button variant="outline" disabled={loading}>
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 text-red-700">
          {error}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bins</p>
              <h3 className="text-2xl font-bold">{summary.totalBins}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{summary.schedules} collection schedules</p>
        </Card>
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Fill Rate</p>
              <h3 className="text-2xl font-bold">{summary.avgFillRate}%</h3>
            </div>
            <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">From stored bin fill levels</p>
        </Card>
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolved Collections</p>
              <h3 className="text-2xl font-bold">{summary.collections}</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{summary.collectionEfficiency}% complaint resolution</p>
        </Card>
        <Card className="p-4 flex flex-col justify-between bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Recycling Rate</p>
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">{summary.recyclingRate}%</h3>
            </div>
            <div className="p-2 bg-green-200 dark:bg-green-800 rounded-full text-green-700 dark:text-green-200">
              <Recycle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">Based on disposal point types</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Waste Complaint Trend</h3>
          <p className="text-sm text-muted-foreground mb-4">Complaint volume proxy over the last 30 days</p>
          <LineChart data={trend} />
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Collection Readiness by Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">Operational points as a percentage of total points</p>
          <BarChart data={zoneEfficiency.length ? zoneEfficiency : [{ zone: 'No Data', value: 0 }]} />
          <div className="flex justify-between text-xs text-muted-foreground mt-2 gap-2 overflow-hidden">
            {(zoneEfficiency.length ? zoneEfficiency : [{ zone: 'No Data' }]).slice(0, 6).map((item) => (
              <span key={item.zone} className="truncate">{item.zone}</span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-1">
          <h3 className="font-semibold mb-4">Waste Composition</h3>
          <div className="space-y-4">
            {composition.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="font-bold text-sm">{item.value}%</span>
              </div>
            ))}
            <div className="h-4 w-full flex rounded-full overflow-hidden mt-4 bg-muted">
              {composition.map((item) => (
                <div key={item.label} className={item.color} style={{ width: `${item.value}%` }} />
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6 md:col-span-2">
          <h3 className="font-semibold mb-4">Top High-Priority Bins</h3>
          <div className="space-y-4">
            {highPriorityBins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No disposal points available yet.</p>
            ) : (
              highPriorityBins.map((bin) => (
                <div key={bin.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="font-mono text-xs bg-background border px-1 py-0.5 rounded shrink-0">{bin.id.slice(-6)}</div>
                    <span className="text-sm font-medium truncate">{bin.loc}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-sm font-bold">{bin.fill}</div>
                    <div className={`text-xs px-2 py-1 rounded-full ${bin.status === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                      {bin.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
