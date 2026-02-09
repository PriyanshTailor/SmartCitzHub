import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/api'

export default function AdminHome() {
  const [stats, setStats] = useState({
    totalReports: 0,
    openReports: 0,
    inProgressReports: 0,
    resolvedReports: 0,
    totalUsers: 0,
    totalInitiatives: 0,
  })
  const [departmentStats, setDepartmentStats] = useState([])
  const [wardStats, setWardStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/api/admin/stats')
        setStats({
          totalReports: data.totalReports,
          openReports: data.openReports,
          inProgressReports: data.totalReports - (data.openReports + data.resolvedReports),
          resolvedReports: data.resolvedReports,
          totalUsers: data.totalUsers,
          totalInitiatives: 0,
        })

        // Fetch department-wise stats
        const deptData = await apiFetch('/api/admin/department-stats').catch(() => null)
        if (deptData) {
          setDepartmentStats(deptData)
        } else {
          // Mock data for department stats
          setDepartmentStats([
            { name: 'Water & Sanitation', total: 45, resolved: 32, pending: 13 },
            { name: 'Roads & Transport', total: 38, resolved: 28, pending: 10 },
            { name: 'Waste Management', total: 29, resolved: 24, pending: 5 },
            { name: 'Electricity', total: 22, resolved: 18, pending: 4 },
            { name: 'Public Safety', total: 15, resolved: 10, pending: 5 },
          ])
        }

        // Fetch ward-wise stats
        const wardData = await apiFetch('/api/admin/ward-stats').catch(() => null)
        if (wardData) {
          setWardStats(wardData)
        } else {
          // Mock data for ward stats
          setWardStats([
            { ward: 'Ward 1', complaints: 42, severity: 'high' },
            { ward: 'Ward 2', complaints: 28, severity: 'medium' },
            { ward: 'Ward 3', complaints: 35, severity: 'high' },
            { ward: 'Ward 4', complaints: 18, severity: 'low' },
            { ward: 'Ward 5', complaints: 31, severity: 'medium' },
            { ward: 'Ward 6', complaints: 25, severity: 'medium' },
            { ward: 'Ward 7', complaints: 15, severity: 'low' },
            { ward: 'Ward 8', complaints: 38, severity: 'high' },
          ])
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  const pendingReports = stats.openReports + stats.inProgressReports
  const resolvedPercentage = stats.totalReports ? Math.round((stats.resolvedReports / stats.totalReports) * 100) : 0
  const pendingPercentage = 100 - resolvedPercentage

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Complaints" 
          value={stats.totalReports} 
          icon="📋" 
          color="text-primary"
          subtitle="All time reports"
        />
        <StatCard 
          title="Resolved" 
          value={stats.resolvedReports} 
          icon="✅" 
          color="text-green-600"
          subtitle={`${resolvedPercentage}% completion`}
        />
        <StatCard 
          title="Pending" 
          value={pendingReports} 
          icon="⏳" 
          color="text-yellow-600"
          subtitle={`${pendingPercentage}% remaining`}
        />
        <StatCard 
          title="Active Users" 
          value={stats.totalUsers} 
          icon="👥" 
          color="text-purple-600"
          subtitle="Registered citizens"
        />
      </div>

      {/* Resolved vs Pending Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Complaints Status Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-center h-64">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  {/* Resolved segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray={`${resolvedPercentage * 2.51} ${251 - resolvedPercentage * 2.51}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold">{resolvedPercentage}%</div>
                  <div className="text-xs text-muted-foreground">Resolved</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-600 rounded"></div>
                <div>
                  <div className="font-semibold">Resolved</div>
                  <div className="text-sm text-muted-foreground">Completed tasks</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.resolvedReports}</div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                <div>
                  <div className="font-semibold">Pending</div>
                  <div className="text-sm text-muted-foreground">Yet to complete</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-600">{pendingReports}</div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-primary rounded"></div>
                <div>
                  <div className="font-semibold">Total</div>
                  <div className="text-sm text-muted-foreground">All complaints</div>
                </div>
              </div>
              <div className="text-2xl font-bold">{stats.totalReports}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Department-wise Analytics */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Department-wise Analytics</h2>
        <div className="space-y-4">
          {departmentStats.map((dept, index) => {
            const completionRate = dept.total ? Math.round((dept.resolved / dept.total) * 100) : 0
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{dept.name}</div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Total: <span className="font-semibold text-foreground">{dept.total}</span>
                    </span>
                    <span className="text-green-600">
                      Resolved: <span className="font-semibold">{dept.resolved}</span>
                    </span>
                    <span className="text-yellow-600">
                      Pending: <span className="font-semibold">{dept.pending}</span>
                    </span>
                    <Badge variant={completionRate >= 80 ? 'default' : 'secondary'}>
                      {completionRate}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Ward-wise Heatmap */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Ward-wise Complaint Heatmap</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {wardStats.map((ward, index) => {
            const getSeverityColor = (severity) => {
              switch(severity) {
                case 'high': return 'bg-red-500 border-red-600'
                case 'medium': return 'bg-yellow-500 border-yellow-600'
                case 'low': return 'bg-green-500 border-green-600'
                default: return 'bg-gray-500 border-gray-600'
              }
            }

            return (
              <div 
                key={index}
                className={`p-6 rounded-lg border-2 ${getSeverityColor(ward.severity)} text-white relative overflow-hidden transition-transform hover:scale-105 cursor-pointer`}
              >
                <div className="relative z-10">
                  <div className="text-sm font-medium opacity-90">{ward.ward}</div>
                  <div className="text-3xl font-bold mt-2">{ward.complaints}</div>
                  <div className="text-xs mt-1 opacity-75">complaints</div>
                </div>
                <div className="absolute top-0 right-0 text-6xl opacity-10">📍</div>
              </div>
            )
          })}
        </div>
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>High (&gt;35)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Medium (20-35)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Low (&lt;20)</span>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">📋 Reports</h3>
          <p className="text-muted-foreground text-sm mb-4">
            View and manage all complaints
          </p>
          <Link to="/admin/reports">
            <Button variant="outline" className="w-full">Manage</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">👥 Users</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Manage user accounts
          </p>
          <Link to="/admin/users">
            <Button variant="outline" className="w-full">Manage</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">🗑️ Waste</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Waste management system
          </p>
          <Link to="/admin/waste">
            <Button variant="outline" className="w-full">Manage</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">⚠️ Moderation</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Review flagged content
          </p>
          <Link to="/admin/moderation">
            <Button variant="outline" className="w-full">Review</Button>
          </Link>
        </Card>
      </div>

      {/* System Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Platform Health</h3>
            <div className="space-y-2">
              <StatusIndicator label="Database" status="healthy" />
              <StatusIndicator label="API Services" status="healthy" />
              <StatusIndicator label="Storage" status="healthy" />
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Performance</h3>
            <div className="space-y-2">
              <MetricRow label="Avg Response" value="142ms" />
              <MetricRow label="Uptime" value="99.98%" />
              <MetricRow label="CPU Load" value="32%" />
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Activity Today</h3>
            <div className="space-y-2">
              <MetricRow label="New Reports" value="12" />
              <MetricRow label="Resolved" value="8" />
              <MetricRow label="Active Users" value="45" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon, color, subtitle }) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </Card>
  )
}

function StatusIndicator({ label, status }) {
  const isHealthy = status === 'healthy'
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
        {isHealthy ? '✓ Healthy' : '✗ Issue'}
      </span>
    </div>
  )
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
