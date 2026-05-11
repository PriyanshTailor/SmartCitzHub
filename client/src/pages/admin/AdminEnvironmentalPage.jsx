import { useState, useEffect } from 'react'
import { mapApi } from '@/api/map.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Wind, Droplets, Eye, Gauge, ChevronLeft, ChevronRight, TrendingUp, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useEmblaCarousel from 'embla-carousel-react'
import AllLocationsPredictions from '@/components/ui/AllLocationsPredictions'

function getAQILevel(aqi) {
  if (aqi <= 50) return 'good'
  if (aqi <= 100) return 'moderate'
  if (aqi <= 150) return 'unhealthy_for_sensitive_groups'
  if (aqi <= 200) return 'unhealthy'
  if (aqi <= 300) return 'very_unhealthy'
  return 'hazardous'
}

function getAQIColor(aqi) {
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

const getAQIDescription = (level, aqi) => {
  if (level === 'good' || aqi <= 50) return 'Good'
  if (level === 'moderate' || aqi <= 100) return 'Moderate'
  if (level === 'unhealthy_for_sensitive_groups' || aqi <= 150) return 'Unhealthy for Sensitive Groups'
  if (level === 'unhealthy' || aqi <= 200) return 'Unhealthy'
  if (level === 'very_unhealthy' || aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

const normalizeLocation = (location) => {
  const aqi = Number(location.aqi ?? location.airQuality?.aqi ?? 0)
  const level = location.aqi_level || location.airQuality?.level || 'moderate'

  return {
    id: location.id,
    location: location.location,
    coordinates: {
      lat: Number(location.latitude ?? location.coordinates?.lat ?? 0),
      lng: Number(location.longitude ?? location.coordinates?.lng ?? 0),
    },
    airQuality: {
      aqi,
      level,
      color: location.airQuality?.color || '#999999',
      description: getAQIDescription(level, aqi),
    },
    pollutants: {
      pm25: Number(location.pollutants?.pm25 ?? 0),
      pm10: Number(location.pollutants?.pm10 ?? 0),
      o3: Number(location.pollutants?.o3 ?? 0),
      no2: Number(location.pollutants?.no2 ?? 0),
      so2: Number(location.pollutants?.so2 ?? 0),
      co: Number(location.pollutants?.co ?? 0),
    },
    temperature: Number(location.temperature ?? 0),
    humidity: Number(location.humidity ?? 0),
    windSpeed: Number(location.windSpeed ?? 0),
    visibility: Number(location.visibility ?? 0),
    timestamp: location.timestamp || new Date().toISOString(),
    trend: location.trend || 'stable',
    prediction: location.prediction
  }
}

const normalizeSummary = (summary, locations) => ({
  averageAQI: Number(summary?.averageAQI ?? (locations.length ? locations.reduce((sum, item) => sum + item.airQuality.aqi, 0) / locations.length : 0)),
  worstArea: summary?.worstArea || '',
  bestArea: summary?.bestArea || '',
  areasOfConcern: Number(summary?.areasOfConcern ?? locations.filter((item) => item.airQuality.aqi > 100).length),
  averageTemperature: Number(summary?.averageTemperature ?? (locations.length ? locations.reduce((sum, item) => sum + item.temperature, 0) / locations.length : 0)),
  averageHumidity: Number(summary?.averageHumidity ?? (locations.length ? locations.reduce((sum, item) => sum + item.humidity, 0) / locations.length : 0)),
  lastUpdated: summary?.lastUpdated || new Date().toISOString(),
  aqiLevels: summary?.aqiLevels || {},
})

export default function AdminEnvironmentalPage() {
  const [environmental, setEnvironmental] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start', 
    loop: true,
    dragFree: true 
  })

  useEffect(() => {
    if (emblaApi && selectedLocation && environmental?.environmentalData) {
      const index = environmental.environmentalData.findIndex(loc => loc.id === selectedLocation.id)
      if (index !== -1) {
        emblaApi.scrollTo(index)
      }
    }
  }, [emblaApi, selectedLocation, environmental])

  useEffect(() => {
    let cancelled = false

    const loadEnvironmentalData = async () => {
      try {
        setError(null)
        const payload = await mapApi.getEnvironmentalData()
        const locations = (payload.data || []).map(normalizeLocation)
        const summary = normalizeSummary(payload.summary, locations)

        if (cancelled) return

        const normalized = {
          environmentalData: locations,
          summary,
        }

        setEnvironmental(normalized)
        setSelectedLocation((current) => {
          if (!locations.length) return null
          if (current) {
            const match = locations.find((item) => item.id === current.id)
            if (match) return match
          }
          return locations[0]
        })
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load environmental data')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadEnvironmentalData()
    const interval = setInterval(loadEnvironmentalData, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const downloadReport = () => {
    if (!environmental) return

    const reportData = {
      title: "SmartCitizenHub - Admin Environmental Master Report",
      generatedAt: new Date().toLocaleString(),
      summary: environmental.summary,
      locations: environmental.environmentalData
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-environmental-master-report-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-700 font-medium">Error loading environmental management system: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Retry Connection</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!environmental) return null

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Environmental Management</h1>
          <p className="text-muted-foreground text-sm">
            Admin interface for city-wide air quality monitoring and AI forecasting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={downloadReport} variant="outline" className="gap-2">
            Export Master Report
          </Button>
          <div className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-md shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium">System Online</span>
          </div>
        </div>
      </div>

      {/* Emergency Environmental Alerts */}
      {environmental.environmentalData.some(loc => loc.airQuality.aqi > 150) && (
        <div className="bg-red-600/10 border-2 border-red-600/20 rounded-2xl p-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertCircle className="w-24 h-24 text-red-600" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shrink-0 animate-pulse shadow-lg shadow-red-600/50">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 space-y-1 text-center md:text-left">
              <h3 className="text-xl font-black text-red-600 uppercase tracking-tighter">Emergency Environmental Alert</h3>
              <p className="text-red-900/80 font-medium">
                Critical pollution levels detected in {environmental.environmentalData.filter(loc => loc.airQuality.aqi > 150).length} areas. 
                Immediate administrative response or public broadcast required.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {environmental.environmentalData
                .filter(loc => loc.airQuality.aqi > 150)
                .map(loc => (
                  <Badge key={loc.id} variant="destructive" className="bg-red-600 hover:bg-red-700 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                    🚨 {loc.location}: {Math.round(loc.airQuality.aqi)} AQI
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      )}


      {/* Vadodara City Overview Section */}
      <Card className="relative overflow-hidden bg-white/40 backdrop-blur-md border-white/40 shadow-xl rounded-2xl group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/20 transition-colors duration-500" />
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="w-5 h-5" />
                <span className="font-bold uppercase tracking-widest text-sm">Admin Control Center</span>
              </div>
              <h2 className="text-4xl font-extrabold tracking-tighter">Vadodara Environmental Network</h2>
              <p className="text-muted-foreground max-w-md">
                Aggregated live data from all {environmental.environmentalData.length} active monitoring nodes in the smart city network.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-12 gap-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground/80">
                  <Wind className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Avg AQI</span>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-black tracking-tighter leading-none">{environmental.summary.averageAQI}</p>
                  <div className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getAQIBadgeColor(getAQILevel(environmental.summary.averageAQI))}`}>
                    {getAQILevel(environmental.summary.averageAQI).replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground/80">
                  <Droplets className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Avg Temp</span>
                </div>
                <p className="text-4xl font-black tracking-tighter leading-none">
                  {environmental.summary.averageTemperature}<span className="text-xl ml-0.5">°C</span>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground/80">
                  <Eye className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Avg Humidity</span>
                </div>
                <p className="text-4xl font-black tracking-tighter leading-none">{environmental.summary.averageHumidity}%</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground/80">
                  <Gauge className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Nodes</span>
                </div>
                <p className="text-4xl font-black tracking-tighter leading-none text-primary">{environmental.environmentalData.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environmental List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Sensor Network Status</h2>
            </div>
          </div>

          <div className="space-y-3">
            {environmental.environmentalData.map((location) => (
              <div
                key={location.id}
                onClick={() => setSelectedLocation(location)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedLocation?.id === location.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : getAQIColor(location.airQuality.aqi)
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold flex items-center gap-2">
                      {location.location}
                      {location.airQuality.aqi > 150 && (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Station ID: {location.id} • Lat: {location.coordinates.lat}
                    </p>
                  </div>
                  <Badge className={getAQIBadgeColor(location.airQuality.level)}>
                    AQI {location.airQuality.aqi.toFixed(0)}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-0.5">PM2.5</p>
                    <p className="font-bold">{location.pollutants.pm25.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Temp</p>
                    <p className="font-bold">{location.temperature.toFixed(1)}°C</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Humidity</p>
                    <p className="font-bold">{location.humidity}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Trend</p>
                    <p className={`font-bold ${location.trend === 'worsening' ? 'text-red-600' : 'text-green-600'}`}>
                      {location.trend.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Node Details */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Node Details</h2>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => emblaApi?.scrollPrev()}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => emblaApi?.scrollNext()}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
              <div className="flex">
                {environmental.environmentalData.map((loc) => (
                  <div key={loc.id} className="flex-[0_0_100%] min-w-0">
                    <Card className="border-none bg-muted/40 backdrop-blur-sm">
                      <CardContent className="p-6 space-y-6">
                        <div>
                          <Badge className={`${getAQIBadgeColor(loc.airQuality.level)} mb-2`}>
                            {loc.airQuality.level.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                          <h3 className="text-2xl font-bold">{loc.location}</h3>
                        </div>

                        <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center ${getAQIColor(loc.airQuality.aqi)}`}>
                          <span className="text-xs font-bold uppercase tracking-widest opacity-60">Live AQI</span>
                          <span className="text-6xl font-black my-1">{loc.airQuality.aqi.toFixed(0)}</span>
                          <p className="text-sm font-semibold">{loc.airQuality.description}</p>
                        </div>

                        {/* ML Forecast Card */}
                        <div className="p-4 bg-background border rounded-xl space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" /> AI Forecasting Module
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {loc.prediction?.forecast?.slice(0, 3).map((step) => (
                              <div key={step.hour_ahead} className="p-2 rounded-lg bg-muted border text-center">
                                <p className="text-[9px] font-bold opacity-60">+{step.hour_ahead}H</p>
                                <p className="text-sm font-bold">{step.predicted_aqi}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button className="w-full h-11 bg-primary text-white font-bold">
                          Configure Sensor Node
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* City-Wide Analytics Extension */}
      <AllLocationsPredictions 
        data={environmental.environmentalData} 
        lastUpdated={new Date(environmental.summary.lastUpdated)}
      />
    </div>
  )
}
