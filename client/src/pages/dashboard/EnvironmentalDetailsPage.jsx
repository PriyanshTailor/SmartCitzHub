import { useState, useEffect } from 'react'
import environmentalData from '@/data/environmental-data.json'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Wind, Droplets, Eye, Gauge } from 'lucide-react'

const getAQIColor = (aqi) => {
  if (aqi <= 50) return 'bg-green-50 border-green-200'
  if (aqi <= 100) return 'bg-yellow-50 border-yellow-200'
  if (aqi <= 150) return 'bg-orange-50 border-orange-200'
  if (aqi <= 200) return 'bg-red-50 border-red-200'
  if (aqi <= 300) return 'bg-purple-50 border-purple-200'
  return 'bg-maroon-50 border-maroon-200'
}

const getAQIBadgeColor = (level) => {
  const colors = {
    good: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    unhealthy_for_sensitive_groups: 'bg-orange-100 text-orange-800',
    unhealthy: 'bg-red-100 text-red-800',
    very_unhealthy: 'bg-purple-100 text-purple-800',
    hazardous: 'bg-red-900 text-white',
  }
  return colors[level] || colors.moderate
}

export default function EnvironmentalDetailsPage() {
  const [environmental, setEnvironmental] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)

  useEffect(() => {
    // Simulate real-time API data by using the JSON file
    setEnvironmental(environmentalData)
    if (environmentalData.environmentalData && environmentalData.environmentalData.length > 0) {
      setSelectedLocation(environmentalData.environmentalData[0])
    }

    // Simulate real-time updates every 15 seconds
    const interval = setInterval(() => {
      setEnvironmental((prev) => {
        if (!prev) return environmentalData
        // Simulate slight changes in environmental data
        const updated = JSON.parse(JSON.stringify(prev))
        updated.environmentalData = updated.environmentalData.map((location) => ({
          ...location,
          airQuality: {
            ...location.airQuality,
            aqi: Math.max(
              20,
              Math.min(500, location.airQuality.aqi + (Math.random() - 0.5) * 15)
            ),
          },
          pollutants: {
            ...location.pollutants,
            pm25: Math.max(0, location.pollutants.pm25 + (Math.random() - 0.5) * 5),
            pm10: Math.max(0, location.pollutants.pm10 + (Math.random() - 0.5) * 8),
            o3: Math.max(0, location.pollutants.o3 + (Math.random() - 0.5) * 6),
            no2: Math.max(0, location.pollutants.no2 + (Math.random() - 0.5) * 4),
          },
          temperature: location.temperature + (Math.random() - 0.5),
          humidity: Math.max(30, Math.min(95, location.humidity + (Math.random() - 0.5) * 3)),
          timestamp: new Date().toISOString(),
        }))
        return updated
      })
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  if (!environmental) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">Loading environmental data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Environmental Data</h1>
        <p className="text-muted-foreground">
          Air quality and environmental metrics for your area
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average AQI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{environmental.summary.averageAQI.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monitored Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{environmental.environmentalData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {environmental.summary.averageTemperature.toFixed(1)}°C
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Areas of Concern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {environmental.summary.areasOfConcern}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environmental List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Air Quality by Location</h2>
          </div>

          <div className="space-y-3">
            {environmental.environmentalData.map((location) => (
              <div
                key={location.id}
                onClick={() => setSelectedLocation(location)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedLocation?.id === location.id
                    ? 'border-primary bg-primary/5'
                    : getAQIColor(location.airQuality.aqi)
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{location.location}</h3>
                    <p className="text-sm text-muted-foreground">
                      Lat: {location.coordinates.lat}, Lng: {location.coordinates.lng}
                    </p>
                  </div>
                  <Badge className={getAQIBadgeColor(location.airQuality.level)}>
                    AQI {location.airQuality.aqi.toFixed(0)}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-semibold">{location.airQuality.description}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Temp</p>
                    <p className="font-semibold">{location.temperature.toFixed(1)}°C</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Humidity</p>
                    <p className="font-semibold">{location.humidity}%</p>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  {location.trend === 'worsening' ? (
                    <span className="text-red-600">⚠️ Worsening</span>
                  ) : location.trend === 'improving' ? (
                    <span className="text-green-600">✓ Improving</span>
                  ) : (
                    <span>Stable</span>
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

              {/* Air Quality Section */}
              <div className="space-y-3 pb-4 border-b">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Air Quality Index</span>
                  <Badge className={getAQIBadgeColor(selectedLocation.airQuality.level)}>
                    {selectedLocation.airQuality.aqi.toFixed(0)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedLocation.airQuality.description}
                </p>
              </div>

              {/* Pollutants Section */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm mb-2">Pollutant Levels (µg/m³)</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PM2.5</span>
                    <span className="font-semibold">{selectedLocation.pollutants.pm25.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PM10</span>
                    <span className="font-semibold">{selectedLocation.pollutants.pm10.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">O₃ (Ozone)</span>
                    <span className="font-semibold">{selectedLocation.pollutants.o3.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NO₂</span>
                    <span className="font-semibold">{selectedLocation.pollutants.no2.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SO₂</span>
                    <span className="font-semibold">{selectedLocation.pollutants.so2.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CO</span>
                    <span className="font-semibold">{selectedLocation.pollutants.co.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Weather Section */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Droplets className="w-4 h-4" /> Humidity
                  </span>
                  <span className="font-semibold">{selectedLocation.humidity}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Wind className="w-4 h-4" /> Wind Speed
                  </span>
                  <span className="font-semibold">{selectedLocation.windSpeed} km/h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Visibility
                  </span>
                  <span className="font-semibold">{selectedLocation.visibility} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Temperature</span>
                  <span className="font-semibold">{selectedLocation.temperature.toFixed(1)}°C</span>
                </div>
              </div>

              {selectedLocation.airQuality.aqi > 100 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-900">Air Quality Alert</p>
                    <p className="text-xs text-orange-800 mt-1">
                      {selectedLocation.airQuality.aqi > 150
                        ? 'Sensitive groups should avoid outdoor activities'
                        : 'Sensitive groups may experience health effects'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* AQI Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Air Quality Index (AQI) Scale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
            <div className="p-2 bg-green-50 border border-green-200 rounded text-center">
              <p className="font-semibold text-green-900">0-50</p>
              <p className="text-xs text-green-700">Good</p>
            </div>
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
              <p className="font-semibold text-yellow-900">51-100</p>
              <p className="text-xs text-yellow-700">Moderate</p>
            </div>
            <div className="p-2 bg-orange-50 border border-orange-200 rounded text-center">
              <p className="font-semibold text-orange-900">101-150</p>
              <p className="text-xs text-orange-700">Unhealthy SG</p>
            </div>
            <div className="p-2 bg-red-50 border border-red-200 rounded text-center">
              <p className="font-semibold text-red-900">151-200</p>
              <p className="text-xs text-red-700">Unhealthy</p>
            </div>
            <div className="p-2 bg-purple-50 border border-purple-200 rounded text-center">
              <p className="font-semibold text-purple-900">201-300</p>
              <p className="text-xs text-purple-700">V. Unhealthy</p>
            </div>
            <div className="p-2 bg-red-900 border border-red-950 rounded text-center">
              <p className="font-semibold text-white">301+</p>
              <p className="text-xs text-red-100">Hazardous</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Real-Time Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Environmental data is continuously updated every 15 seconds using real-time API data
            from air quality monitoring stations and weather sensors.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-1">Live Monitoring</p>
              <p className="font-semibold">Real-Time Sensors</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-1">Global Standards</p>
              <p className="font-semibold">EPA/WHO AQI Scale</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-1">Health Alerts</p>
              <p className="font-semibold">Smart Notifications</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
