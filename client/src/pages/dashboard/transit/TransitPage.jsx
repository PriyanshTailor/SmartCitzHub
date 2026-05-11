import { useState, useEffect } from 'react'
import { TransitMap } from '@/components/transit/transit-map'
import { Card } from '@/components/ui/card'
import { Bus, Train, AlertTriangle, Clock } from 'lucide-react'
import { transitApi } from '@/api/transit.api'

export default function TransitPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await transitApi.getTransitData()
        console.log('Stats API Response:', response)
        if (response.success && response.data) {
          // Count active vehicles
          const activeVehicles = response.data.vehicles?.length || 0
          const onTimeVehicles = response.data.vehicles?.filter(v => v.status === 'on_time').length || 0
          const onTimePercentage = activeVehicles > 0 
            ? Math.round((onTimeVehicles / activeVehicles) * 100) 
            : 94
          
          const calculatedStats = {
            activeVehicles: activeVehicles,
            totalRoutes: response.data.routes?.length || 7,
            onTimePercentage: onTimePercentage,
            activeAlerts: response.data.alerts?.length || 0,
            avgWaitTime: response.data.statistics?.avgWaitTime || 8,
            totalPassengers: response.data.statistics?.totalPassengers || 12500
          }
          console.log('Calculated stats:', calculatedStats)
          setStats(calculatedStats)
        }
      } catch (error) {
        console.error('Failed to fetch transit stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 10000) // Update every 10 seconds for real-time
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Transit System</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Real-time tracking of city bus routes across Vadodara</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Active Vehicles Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-normal">Active Vehicles</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                  {loading ? '...' : stats?.activeVehicles || 142}
                </h3>
              </div>
              <Bus className="w-12 h-12 text-slate-700 dark:text-slate-300" />
            </div>
          </div>
        </Card>

        {/* Routes On Time Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-normal">Routes On Time</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                  {loading ? '...' : `${stats?.onTimePercentage || 94}%`}
                </h3>
              </div>
              <Train className="w-12 h-12 text-slate-700 dark:text-slate-300" />
            </div>
          </div>
        </Card>

        {/* Active Alerts Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-normal">Active Alerts</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                  {loading ? '...' : stats?.activeAlerts || 3}
                </h3>
              </div>
              <AlertTriangle className="w-12 h-12 text-slate-700 dark:text-slate-300" />
            </div>
          </div>
        </Card>

        {/* Avg Wait Time Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-normal">Avg Wait Time</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                  {loading ? '...' : `${stats?.avgWaitTime || 8} min`}
                </h3>
              </div>
              <Clock className="w-12 h-12 text-slate-700 dark:text-slate-300" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0 shadow-sm rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <TransitMap />
      </Card>
    </div>
  )
}
