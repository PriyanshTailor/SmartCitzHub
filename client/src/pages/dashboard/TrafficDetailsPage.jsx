import { useState, useEffect } from 'react'
import trafficData from '@/data/traffic-data.json'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react'

const getCongestionColor = (level) => {
  const colors = {
    low: 'bg-green-50 border-green-200',
    moderate: 'bg-yellow-50 border-yellow-200',
    high: 'bg-red-50 border-red-200',
  }
  return colors[level] || colors.low
}

const getCongestionBadgeColor = (level) => {
  const colors = {
    low: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }
  return colors[level] || colors.low
}

export default function TrafficDetailsPage() {
  const [traffic, setTraffic] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)

  useEffect(() => {
    // Simulate real-time API data by using the JSON file
    setTraffic(trafficData)
    if (trafficData.trafficUpdates && trafficData.trafficUpdates.length > 0) {
      setSelectedLocation(trafficData.trafficUpdates[0])
    }

    // Simulate real-time updates every 10 seconds
    const interval = setInterval(() => {
      setTraffic((prev) => {
        if (!prev) return trafficData
        // Simulate slight changes in traffic data
        const updated = JSON.parse(JSON.stringify(prev))
        updated.trafficUpdates = updated.trafficUpdates.map((location) => ({
          ...location,
          congestionPercentage: Math.max(
            20,
            Math.min(95, location.congestionPercentage + (Math.random() - 0.5) * 10)
          ),
          averageSpeed: Math.max(
            5,
            Math.min(location.speedLimit, location.averageSpeed + (Math.random() - 0.5) * 3)
          ),
          timestamp: new Date().toISOString(),
        }))
        return updated
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  if (!traffic) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">Loading traffic data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Traffic Updates</h1>
        <p className="text-muted-foreground">
          Real-time traffic conditions and congestion levels across the city
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monitored Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{traffic.summary.totalLocations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Congestion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {traffic.summary.highCongestionCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Congestion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{traffic.summary.averageCongestion.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {traffic.summary.totalIncidents}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Traffic Locations</h2>
          </div>

          <div className="space-y-3">
            {traffic.trafficUpdates.map((location) => (
              <div
                key={location.id}
                onClick={() => setSelectedLocation(location)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedLocation?.id === location.id
                    ? 'border-primary bg-primary/5'
                    : getCongestionColor(location.congestionLevel)
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{location.location}</h3>
                    <p className="text-sm text-muted-foreground">
                      Lat: {location.coordinates.lat}, Lng: {location.coordinates.lng}
                    </p>
                  </div>
                  <Badge className={getCongestionBadgeColor(location.congestionLevel)}>
                    {location.congestionLevel.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Congestion</p>
                    <p className="font-semibold">{location.congestionPercentage.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Speed</p>
                    <p className="font-semibold">{location.averageSpeed} km/h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vehicles</p>
                    <p className="font-semibold">{location.vehicles}</p>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  {location.trend === 'increasing' ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-500" />
                      <span>Worsening conditions</span>
                    </>
                  ) : location.trend === 'decreasing' ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-green-500" />
                      <span>Improving conditions</span>
                    </>
                  ) : (
                    <span>Stable conditions</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Details */}
        {selectedLocation && (
          <Card className="h-fit sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-primary">{selectedLocation.location}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Updated: {new Date(selectedLocation.timestamp).toLocaleTimeString()}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Congestion Level</span>
                  <Badge className={getCongestionBadgeColor(selectedLocation.congestionLevel)}>
                    {selectedLocation.congestionPercentage.toFixed(0)}%
                  </Badge>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Average Speed</span>
                  <span className="font-semibold">
                    {selectedLocation.averageSpeed} / {selectedLocation.speedLimit} km/h
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Active Vehicles</span>
                  <span className="font-semibold">{selectedLocation.vehicles}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Estimated Delay</span>
                  <span className="font-semibold text-orange-600">
                    {selectedLocation.estimatedDelay} min
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Road Condition</span>
                  <span className="font-semibold capitalize">{selectedLocation.roadCondition}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Incidents</span>
                  <span className="font-semibold">{selectedLocation.incidents}</span>
                </div>
              </div>

              {selectedLocation.incidents > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      {selectedLocation.incidents} incident{selectedLocation.incidents > 1 ? 's' : ''} reported
                    </p>
                    <p className="text-xs text-red-800 mt-1">
                      Use caution when traveling through this area
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-Time Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Data automatically refreshes every 10 seconds from connected traffic sensors and
            real-time API monitoring systems.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-1">Peak Hours Detection</p>
              <p className="font-semibold">AI-Powered Analysis</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-1">Incident Tracking</p>
              <p className="font-semibold">Real-Time Monitoring</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-1">Predictive Alerts</p>
              <p className="font-semibold">Smart Routing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
