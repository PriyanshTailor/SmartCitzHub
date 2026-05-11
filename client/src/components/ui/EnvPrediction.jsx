import React, { useEffect, useState } from 'react'
import { mapApi } from '@/api/map.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function getAQIStatus(aqi) {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

function getStatusStyles(status) {
  switch (status) {
    case 'Good':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'Moderate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Unhealthy for Sensitive Groups':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'Unhealthy':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'Very Unhealthy':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    default:
      return 'bg-red-950 text-red-100 border-red-900'
  }
}

export default function EnvPrediction({ locationId }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!data) setLoading(true)
      setError(null)
      try {
        const json = await mapApi.getEnvironmentalPrediction(locationId)
        if (!cancelled) {
          setData(json)
          setLastUpdated(new Date())
        }
      } catch (e) {
        if (!cancelled) {
          const details = e?.details || e?.error || e?.message || 'Unable to load environmental prediction'
          setError(details)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    const intervalId = setInterval(load, 60000)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [locationId])

  if (loading && !data) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Live Environment Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="h-20 rounded-lg bg-muted" />
              <div className="h-20 rounded-lg bg-muted" />
              <div className="h-20 rounded-lg bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !data) {
    return (
      <Card className="border-red-200 bg-red-50/70">
        <CardHeader>
          <CardTitle className="text-base text-red-900">Live Environment Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const input = data.input || {}
  const pred = data.prediction || {}
  const currentAqi = Number(input.aqi ?? 0)
  const predicted = Number(pred.predicted_aqi ?? 0)
  const delta = predicted - currentAqi
  const direction = delta > 0 ? 'Rising' : delta < 0 ? 'Improving' : 'Stable'
  const status = getAQIStatus(predicted)
  const statusStyles = getStatusStyles(status)
  const forecast = Array.isArray(pred.forecast) ? pred.forecast : []

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-lg">Live Environment Prediction</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              ML-powered 1-3 hour forecast for {data.location || 'selected location'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusStyles}>{status}</Badge>
            {loading && <Badge variant="secondary">Refreshing...</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
            Showing last successful data. Latest refresh failed: {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Current AQI</p>
            <p className="text-2xl font-bold leading-tight">{currentAqi.toFixed(0)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Predicted AQI (+1h)</p>
            <p className="text-2xl font-bold leading-tight">{predicted.toFixed(0)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Trend</p>
            <p className="text-xl font-semibold leading-tight">
              {direction} {delta === 0 ? '' : `(${delta > 0 ? '+' : ''}${delta.toFixed(0)})`}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Confidence</p>
            <p className="text-2xl font-bold leading-tight">
              {pred.confidence ? `${(pred.confidence * 100).toFixed(0)}%` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-muted-foreground">PM2.5</p>
            <p className="font-semibold">
              {Number(input.pm25 ?? pred.predicted_pm25 ?? 0).toFixed(1)} {'->'} {Number(pred.predicted_pm25 ?? 0).toFixed(1)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-muted-foreground">Temperature</p>
            <p className="font-semibold">
              {Number(input.temperature ?? pred.predicted_temperature ?? 0).toFixed(1)} degC {'->'} {Number(pred.predicted_temperature ?? 0).toFixed(1)} degC
            </p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-muted-foreground">Model</p>
            <p className="font-semibold wrap-break-word">{pred.model_used || 'Unknown'}</p>
          </div>
        </div>

        {forecast.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-semibold">1-3 Hour Forecast</h5>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {forecast.slice(0, 3).map((step) => (
                <div key={step.hour_ahead} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">+{step.hour_ahead} hour</span>
                    <Badge variant="secondary">{step.status}</Badge>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p><span className="text-muted-foreground">AQI:</span> <strong>{step.predicted_aqi}</strong></p>
                    <p><span className="text-muted-foreground">PM2.5:</span> <strong>{step.predicted_pm25}</strong></p>
                    <p><span className="text-muted-foreground">Temp:</span> <strong>{step.predicted_temperature} degC</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground flex flex-col gap-1 sm:flex-row sm:justify-between">
          <span>Auto-refresh interval: 60 seconds</span>
          <span>Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Just now'}</span>
        </div>
      </CardContent>
    </Card>
  )
}
