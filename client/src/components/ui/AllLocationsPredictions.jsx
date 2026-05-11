import React, { useEffect, useState, useCallback } from 'react'
import { mapApi } from '@/api/map.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, TrendingUp, AlertCircle, ChevronLeft, ChevronRight, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useEmblaCarousel from 'embla-carousel-react'

const LOCATIONS = [
  { id: 'env_001', name: 'Alkapuri' },
  { id: 'env_002', name: 'Sayaji Baug' },
  { id: 'env_003', name: 'Fatehgunj' },
  { id: 'env_004', name: 'Manjalpur' },
  { id: 'env_005', name: 'Karelibaug' },
  { id: 'env_006', name: 'Vasna Road' },
]

function getAQIColor(aqi) {
  if (aqi <= 50) return 'bg-green-100/40 text-green-800 border-green-300'
  if (aqi <= 100) return 'bg-yellow-100/40 text-yellow-800 border-yellow-300'
  if (aqi <= 150) return 'bg-orange-100/40 text-orange-800 border-orange-300'
  if (aqi <= 200) return 'bg-red-100/40 text-red-800 border-red-300'
  if (aqi <= 300) return 'bg-purple-100/40 text-purple-800 border-purple-300'
  return 'bg-red-950 text-red-100 border-red-900'
}

function getAQILevel(aqi) {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy (SG)'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

function PredictionCard({ location, data, loading, error }) {
  if (loading) {
    return (
      <div className="flex-[0_0_280px] min-w-0 px-2">
        <Card className="border-dashed h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{location.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 animate-pulse">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-[0_0_280px] min-w-0 px-2">
        <Card className="border-red-200 bg-red-50 h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-red-900">{location.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-red-700 flex items-center gap-1">
              <AlertCircle size={14} /> {error}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const pred = data.prediction
  const input = data.input
  const currentAQI = Math.round(input.aqi)
  const predictedAQI = Math.round(pred.predicted_aqi)
  
  let trend = 'stable'
  let trendLabel = 'Stable'
  let trendColor = 'text-blue-600'
  let trendIcon = <Minus size={14} />

  if (predictedAQI > currentAQI) {
    trend = 'worsening'
    trendLabel = 'Worse'
    trendColor = 'text-red-600'
    trendIcon = <TrendingUp size={14} />
  } else if (predictedAQI < currentAQI) {
    trend = 'improving'
    trendLabel = 'Better'
    trendColor = 'text-green-600'
    trendIcon = <TrendingDown size={14} />
  }

  return (
    <div className="flex-[0_0_300px] min-w-0 px-2">
      <Card className={`border-2 transition-all hover:shadow-md ${getAQIColor(currentAQI)} h-full`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">{location.name}</CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              {getAQILevel(currentAQI)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Current AQI</p>
              <p className="text-lg font-bold">{currentAQI}</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Predicted (+1h)</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-lg font-bold">{predictedAQI}</p>
                <div className={`flex items-center gap-0.5 text-[10px] font-bold ${trendColor}`}>
                  {trendIcon}
                  {trendLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Temperature</span>
            <span className="text-sm font-bold">
              {Number(input.temperature ?? 0).toFixed(1)}°C {'->'} {Number(pred.predicted_temperature ?? 0).toFixed(1)}°C
            </span>
          </div>

          <div className="space-y-2 py-1">
            <div className="flex justify-between text-[8px] font-bold uppercase text-muted-foreground">
              <span>Pollutants</span>
              <span>µg/m³</span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'PM2.5', val: input.aqi * 0.6, max: 200, color: 'bg-red-500' },
                { label: 'PM10', val: input.aqi * 1.2, max: 400, color: 'bg-orange-500' },
                { label: 'NO2', val: input.aqi * 0.3, max: 100, color: 'bg-blue-500' }
              ].map(p => (
                <div key={p.label} className="space-y-0.5">
                  <div className="flex justify-between text-[8px] font-medium">
                    <span>{p.label}</span>
                    <span>{Math.round(p.val)}</span>
                  </div>
                  <div className="h-1 w-full bg-black/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${p.color} transition-all duration-1000`} 
                      style={{ width: `${Math.min(100, (p.val / p.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Confidence</span>
            <span className="text-sm font-bold text-primary">
              {Math.min(95, Math.round(Number(pred.confidence ?? 0.75) * 100))}%
            </span>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-8 text-[10px] uppercase font-bold py-0 bg-white/50">
                Set Alert
              </Button>
              <div className={`flex items-center px-2 rounded-md text-[10px] font-bold ${trendColor} bg-white/50 border border-white/20`}>
                {predictedAQI - currentAQI > 0 ? '+' : ''}{predictedAQI - currentAQI} AQI
              </div>
            </div>
            <p className="text-[8px] text-muted-foreground italic text-center">AI Model: {pred.model_used || 'GradientBoosting'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AllLocationsPredictions({ data = [], lastUpdated = new Date() }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps'
  })

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  if (!data || data.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">City-Wide Forecasts</h2>
          <p className="text-sm text-muted-foreground">AI-powered 1-hour environmental predictions</p>
        </div>
      </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {data.map((location) => (
              <PredictionCard 
                key={location.id} 
                location={{ id: location.id, name: location.location }} 
                data={location.prediction ? { 
                  prediction: location.prediction,
                  input: { aqi: location.aqi, temp: location.temperature }
                } : null}
              />
            ))}
          </div>
        </div>


    </div>
  )
}
