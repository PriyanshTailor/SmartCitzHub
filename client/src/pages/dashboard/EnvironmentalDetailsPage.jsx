import { useState, useEffect } from 'react'
import { mapApi } from '@/api/map.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Wind, Droplets, Eye, Gauge, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useEmblaCarousel from 'embla-carousel-react'
import EnvPrediction from '@/components/ui/EnvPrediction'
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

export default function EnvironmentalDetailsPage() {
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
      title: "SmartCitizenHub - Vadodara Environmental Report",
      generatedAt: new Date().toLocaleString(),
      summary: environmental.summary,
      locations: environmental.environmentalData.map(loc => ({
        name: loc.location,
        aqi: loc.airQuality.aqi,
        temperature: loc.temperature,
        humidity: loc.humidity,
        pollutants: loc.pollutants
      }))
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vadodara-environmental-report-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }


  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!environmental) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">Loading environmental data...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Environmental Forecasting</h1>
          <p className="text-muted-foreground">
            Live air quality and weather monitoring for Vadodara City
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Live Data
          </Badge>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(environmental.summary.lastUpdated).toLocaleTimeString()}
          </p>
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
                Immediate health precautions recommended for all citizens.
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
                <span className="font-bold uppercase tracking-widest text-sm">City Overview</span>
              </div>
              <h2 className="text-4xl font-extrabold tracking-tighter">Vadodara, Gujarat</h2>
              <p className="text-muted-foreground max-w-md">
                Current atmospheric conditions aggregated from {environmental.environmentalData.length} strategic monitoring stations across the city.
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
                  <span className="text-[10px] font-bold uppercase tracking-widest">Temp</span>
                </div>
                <p className="text-4xl font-black tracking-tighter leading-none">
                  {environmental.summary.averageTemperature}<span className="text-xl ml-0.5">°C</span>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground/80">
                  <Eye className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Humidity</span>
                </div>
                <p className="text-4xl font-black tracking-tighter leading-none">{environmental.summary.averageHumidity}%</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground/80">
                  <Gauge className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Stations</span>
                </div>
                <p className="text-4xl font-black tracking-tighter leading-none text-primary">{environmental.environmentalData.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

        {/* Location Details Carousel */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Location Details</h2>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={() => emblaApi?.scrollPrev()}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={() => emblaApi?.scrollNext()}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="overflow-hidden rounded-xl" ref={emblaRef}>
              <div className="flex">
                {environmental.environmentalData.map((loc) => (
                  <div key={loc.id} className="flex-[0_0_100%] min-w-0">
                    <Card className="border-none shadow-none bg-muted/30">
                      <CardContent className="p-6 space-y-6">
                        <div>
                          <Badge className={`${getAQIBadgeColor(loc.airQuality.level)} mb-2`}>
                            {loc.airQuality.level.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                          <h3 className="text-2xl font-bold text-primary">{loc.location}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Coordinates: {loc.coordinates.lat}, {loc.coordinates.lng}
                          </p>
                        </div>

                        {/* Large AQI Display */}
                        <div className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center text-center ${getAQIColor(loc.airQuality.aqi)}`}>
                          <span className="text-sm font-bold uppercase tracking-widest opacity-70">Air Quality Index</span>
                          <span className="text-6xl font-black my-2">{loc.airQuality.aqi.toFixed(0)}</span>
                          <p className="font-semibold">{loc.airQuality.description}</p>
                        </div>

                        {/* Pollutants Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-white/50 border border-white/20">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">PM2.5</p>
                            <p className="text-lg font-bold">{loc.pollutants.pm25.toFixed(1)}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/50 border border-white/20">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">PM10</p>
                            <p className="text-lg font-bold">{loc.pollutants.pm10.toFixed(1)}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/50 border border-white/20">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Ozone (O₃)</p>
                            <p className="text-lg font-bold">{loc.pollutants.o3.toFixed(1)}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/50 border border-white/20">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">NO₂</p>
                            <p className="text-lg font-bold">{loc.pollutants.no2.toFixed(1)}</p>
                          </div>
                        </div>

                        {/* Weather Details */}
                        <div className="space-y-3 pt-4 border-t border-white/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <Droplets className="w-4 h-4" /> Humidity
                            </span>
                            <span className="font-bold">{loc.humidity}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <Wind className="w-4 h-4" /> Wind Speed
                            </span>
                            <span className="font-bold">{loc.windSpeed} km/h</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <Eye className="w-4 h-4" /> Visibility
                            </span>
                            <span className="font-bold">{loc.visibility} km</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Ambient Temp</span>
                            <span className="font-bold">{loc.temperature.toFixed(1)}°C</span>
                          </div>
                        </div>

                        {/* Forecast Section (Integrated) */}
                        {loc.prediction?.forecast && (
                          <div className="space-y-3 pt-6 border-t border-white/20">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                              <Gauge className="w-4 h-4" /> AI 3-Hour Forecast
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                              {loc.prediction.forecast.slice(0, 3).map((step) => (
                                <div key={step.hour_ahead} className="p-2 rounded-lg bg-white/40 border border-white/10 text-center">
                                  <p className="text-[10px] font-bold text-muted-foreground">+{step.hour_ahead}H</p>
                                  <p className="text-sm font-bold">{step.predicted_aqi}</p>
                                  <p className="text-[9px] font-medium opacity-70">{step.status}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Health Recommendations Extension */}
                        <div className="space-y-3 pt-6 border-t border-white/20">
                          <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Health Advice</h4>
                          <div className="space-y-2">
                            {loc.airQuality.aqi <= 50 ? (
                              <p className="text-xs text-green-700 bg-green-50/50 p-2 rounded-lg border border-green-100">
                                Perfect day for outdoor activities and exercise!
                              </p>
                            ) : loc.airQuality.aqi <= 100 ? (
                              <p className="text-xs text-yellow-700 bg-yellow-50/50 p-2 rounded-lg border border-yellow-100">
                                Moderate quality. Sensitive people should consider reducing prolonged outdoor exertion.
                              </p>
                            ) : (
                              <>
                                <p className="text-xs text-red-700 bg-red-50/50 p-2 rounded-lg border border-red-100 font-medium">
                                  Wear an N95 mask if heading outdoors for long periods.
                                </p>
                                <p className="text-xs text-orange-700 bg-orange-50/50 p-2 rounded-lg border border-orange-100">
                                  Keep windows closed and use air purifiers if available.
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {loc.airQuality.aqi > 100 && (
                          <div className="p-3 bg-orange-100/50 border border-orange-200 rounded-xl flex gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                            <p className="text-xs text-orange-900 font-medium">
                              {loc.airQuality.aqi > 150
                                ? 'Alert: High pollution detected. Sensitive individuals should stay indoors.'
                                : 'Notice: Moderate pollution. Sensitive groups should limit outdoor time.'}
                            </p>
                          </div>
                        )}
                        
                        <div className="text-[10px] text-center text-muted-foreground pt-4">
                          Last updated at {new Date(loc.timestamp).toLocaleTimeString()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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

      {/* City-Wide Environmental Forecasts */}
      {environmental && (
        <div className="space-y-6">
          <AllLocationsPredictions 
            data={environmental.environmentalData} 
            lastUpdated={new Date(environmental.summary.lastUpdated)}
          />

          {/* New City-Wide Insights Module */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wind className="w-5 h-5 text-indigo-600" />
                  City-Wide Environmental Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/60 rounded-xl border border-white/40">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Cleanest Air</p>
                    <p className="text-xl font-bold text-green-600">{environmental.summary.bestArea}</p>
                    <p className="text-xs text-muted-foreground">Currently the safest zone in Vadodara</p>
                  </div>
                  <div className="p-4 bg-white/60 rounded-xl border border-white/40">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Pollution Hotspot</p>
                    <p className="text-xl font-bold text-red-600">{environmental.summary.worstArea}</p>
                    <p className="text-xs text-muted-foreground">High concentration of particulate matter detected</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-indigo-600/10 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-900">Overall City Health Score</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 bg-indigo-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600" 
                        style={{ width: `${Math.max(0, 100 - (environmental.summary.averageAQI / 3))}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-indigo-900">
                      {Math.round(Math.max(0, 100 - (environmental.summary.averageAQI / 3)))}/100
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-900">
                  Daily Forecast Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const currentAvg = environmental.summary.averageAQI
                  const predictedAvg = environmental.environmentalData.reduce((sum, loc) => 
                    sum + (loc.prediction?.predicted_aqi || loc.airQuality.aqi), 0) / environmental.environmentalData.length
                  
                  const diff = predictedAvg - currentAvg
                  const percentChange = Math.abs((diff / currentAvg) * 100).toFixed(1)
                  const isWorsening = diff > 2 // small threshold
                  const isImproving = diff < -2

                  return (
                    <>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isWorsening ? 'bg-red-100' : isImproving ? 'bg-green-100' : 'bg-blue-100'}`}>
                          {isWorsening ? (
                            <TrendingUp className="w-6 h-6 text-red-600" />
                          ) : isImproving ? (
                            <TrendingDown className="w-6 h-6 text-green-600" />
                          ) : (
                            <Minus className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-amber-900">
                            {isWorsening ? 'Air Quality Spike' : isImproving ? 'Improvement Expected' : 'Stable Conditions'}
                          </p>
                          <p className="text-[10px] text-amber-700 font-medium">
                            {isWorsening ? `AQI may rise by ~${percentChange}%` : isImproving ? `AQI may drop by ~${percentChange}%` : 'No significant change predicted'}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-amber-200/50">
                        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                          {isWorsening 
                            ? `Our ML model expects a pollution surge in the next hour. Citizens in ${environmental.summary.worstArea} should consider limiting outdoor time.`
                            : isImproving
                            ? `Favorable atmospheric patterns detected. Air quality is expected to improve, especially near ${environmental.summary.bestArea}.`
                            : "Current trends remain consistent. No major environmental shifts are forecasted for the next few hours across the city."
                          }
                        </p>
                      </div>
                    </>
                  )
                })()}
                <Button 
                  onClick={downloadReport}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm h-9 text-xs font-bold uppercase tracking-wider"
                >
                  Download Full Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
