import { SummaryStats } from '@/components/dashboard/SummaryStats'
import { AiInsightsPanel } from '@/components/dashboard/AiInsightsPanel'
import { PredictiveWidget } from '@/components/dashboard/PredictiveWidget'
import { RealTimeAlerts } from '@/components/dashboard/RealTimeAlerts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Activity, RefreshCcw, AlertCircle } from 'lucide-react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { getAuthUser } from '@/lib/auth'

export default function DashboardHome() {
  const { data, loading, error, lastUpdated, refresh } = useDashboardData()
  const user = getAuthUser()

  // Loading State
  if (loading && !data.summary) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">Initializing AI Dashboard...</p>
      </div>
    )
  }

  // Error State
  if (error && !data.summary) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold">Failed to load dashboard</h2>
        <p className="text-muted-foreground max-w-md">
          Error: {error.message || "Unknown error"} {error.status && `(Status: ${error.status})`}
        </p>
        <Button onClick={refresh}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header with Auto-Refresh Indicator */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome, {user?.full_name?.split(' ')[0] || 'Citizen'}! 👋</h2>
          <p className="text-muted-foreground">
            Here is your personalized city overview.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          <RefreshCcw className="w-3 h-3" />
          Updated {lastUpdated?.toLocaleTimeString()}
        </div>
      </div>

      {/* AI Insight Hero Section */}
      <div className="grid gap-6">
        <RealTimeAlerts />
        <AiInsightsPanel data={data.summary?.ai_insight} />
      </div>

      {/* Key Stats Row */}
      <SummaryStats stats={data.summary && data.summary.stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">

        {/* Left Col: Predictions & Charts (4 cols) */}
        <div className="md:col-span-4 space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Predictive Analytics
          </h3>
          <PredictiveWidget predictions={data.predictions} />

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-2 gap-4">
            <ActionCard
              title="Report Issue"
              desc="Submit a new complaint"
              to="/dashboard/reports/new"
              gradient="from-blue-500/10 to-blue-600/5"
            />
            <ActionCard
              title="Track Status"
              desc="View report history"
              to="/dashboard/reports"
              gradient="from-emerald-500/10 to-emerald-600/5"
            />
            <ActionCard
              title="Transit"
              desc="Check live schedules"
              to="/dashboard/transit"
              gradient="from-violet-500/10 to-violet-600/5"
            />
            <ActionCard
              title="Waste Map"
              desc="Find disposal points"
              to="/dashboard/waste-management"
              gradient="from-amber-500/10 to-amber-600/5"
            />
          </div>
        </div>

        {/* Right Col: Ongoing Activity (3 cols) */}
        <div className="md:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {data.summary?.nearby ? (
                <div className="space-y-4">
                  {data.summary.nearby.map((item, i) => (
                    <div key={i} className="flex gap-3 text-sm border-b last:border-0 pb-3 last:pb-0">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-primary" />
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-muted-foreground text-xs">{item.category} • {item.location_name || 'Nearby'}</p>
                      </div>
                    </div>
                  ))}
                  {data.summary.nearby.length === 0 && <p className="text-muted-foreground">No recent nearby activity.</p>}
                </div>
              ) : (
                <p className="text-muted-foreground">Loading activity...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ActionCard({ title, desc, to, gradient }) {
  return (
    <Link to={to}>
      <Card className={`hover:border-primary transition-all cursor-pointer group bg-gradient-to-br ${gradient} border-muted/50`}>
        <CardContent className="p-4">
          <h3 className="font-semibold group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
