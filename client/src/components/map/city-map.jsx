import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { apiFetch } from '@/lib/api'
import { mapApi } from '@/api/map.api'

export function CityMap() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [reports, setReports] = useState([])
  const [wastePoints, setWastePoints] = useState([])
  const [traffic, setTraffic] = useState(null)
  const [environmental, setEnvironmental] = useState(null)
  const [loading, setLoading] = useState(true)
  const [center, setCenter] = useState({ lat: 22.3072, lng: 73.1812 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch traffic and environmental data
        const trafficData = await mapApi.getTrafficUpdates().catch(() => null)
        const envData = await mapApi.getEnvironmentalData().catch(() => null)
        
        // Fetch existing map data (reports and waste points)
        const mapData = await apiFetch('/api/map').catch(() => null)
        
        setTraffic(trafficData)
        setEnvironmental(envData)
        setReports(mapData?.reports || [])
        setWastePoints(mapData?.wastePoints || [])
      } catch (error) {
        console.error('Failed to load map data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!map.current) {
      import('leaflet').then((L) => {
        if (!mapContainer.current) return

        map.current = L.map(mapContainer.current).setView(
          [center.lat, center.lng],
          13
        )

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map.current)

        // Add traffic markers
        if (traffic?.data) {
          traffic.data.forEach((location) => {
            if (location.latitude && location.longitude) {
              const congestionColor = 
                location.congestion >= 80 ? '#ef4444' :
                location.congestion >= 60 ? '#f97316' :
                location.congestion >= 40 ? '#eab308' :
                '#22c55e'

              const marker = L.marker([location.latitude, location.longitude], {
                title: location.location,
              })

              const icon = L.divIcon({
                html: `
                  <div class="flex items-center justify-center w-10 h-10 rounded-full font-bold text-xl text-white"
                    style="background-color: ${congestionColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.3)">
                    🚗
                  </div>
                `,
                className: 'custom-marker',
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40],
              })

              marker.setIcon(icon)
              marker.bindPopup(`
                <div class="p-2 max-w-xs">
                  <h4 class="font-semibold text-sm mb-1">${location.location}</h4>
                  <p class="text-xs text-gray-600">Congestion: ${location.congestion}%</p>
                  <p class="text-xs text-gray-600">Avg Speed: ${location.avg_speed} km/h</p>
                </div>
              `)
              marker.addTo(map.current)
            }
          })
        }

        // Add environmental markers
        if (environmental?.data) {
          environmental.data.forEach((location) => {
            if (location.latitude && location.longitude) {
              const aqiColor = 
                location.aqi >= 401 ? '#7f1d1d' :
                location.aqi >= 301 ? '#991b1b' :
                location.aqi >= 201 ? '#dc2626' :
                location.aqi >= 101 ? '#f97316' :
                location.aqi >= 51 ? '#eab308' :
                '#22c55e'

              const marker = L.marker([location.latitude, location.longitude], {
                title: location.location,
              })

              const icon = L.divIcon({
                html: `
                  <div class="flex items-center justify-center w-10 h-10 rounded-full font-bold text-xl text-white"
                    style="background-color: ${aqiColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.3)">
                    💨
                  </div>
                `,
                className: 'custom-marker',
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40],
              })

              marker.setIcon(icon)
              marker.bindPopup(`
                <div class="p-2 max-w-xs">
                  <h4 class="font-semibold text-sm mb-1">${location.location}</h4>
                  <p class="text-xs text-gray-600">AQI: ${location.aqi}</p>
                  <p class="text-xs text-gray-600">Temp: ${location.temperature}°C</p>
                </div>
              `)
              marker.addTo(map.current)
            }
          })
        }

        reports.forEach((report) => {
          if (report.latitude && report.longitude) {
            const categoryIcons = {
              pothole: '🕳️',
              broken_light: '💡',
              garbage: '🗑️',
              graffiti: '🎨',
              flooding: '💧',
              other: '📍',
            }

            const marker = L.marker([report.latitude, report.longitude], {
              title: report.title,
            })

            const icon = L.divIcon({
              html: `
                <div class="flex items-center justify-center w-10 h-10 rounded-full font-bold text-2xl"
                  style="background-color: ${report.status === 'open'
                ? '#fbbf24'
                : report.status === 'in_progress'
                  ? '#60a5fa'
                  : '#34d399'
              }; box-shadow: 0 2px 4px rgba(0,0,0,0.2)">
                  ${categoryIcons[report.category] || '📍'}
                </div>
              `,
              className: 'custom-marker',
              iconSize: [40, 40],
              iconAnchor: [20, 40],
              popupAnchor: [0, -40],
            })

            marker.setIcon(icon)
            marker.bindPopup(`
              <div class="p-2 max-w-xs">
                <h4 class="font-semibold text-sm mb-1">${report.title}</h4>
                <p class="text-xs text-gray-600 mb-2">${report.category.replace('_', ' ')}</p>
                <span class="inline-block px-2 py-1 text-xs rounded ${report.status === 'open'
                ? 'bg-yellow-100 text-yellow-800'
                : report.status === 'in_progress'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }">
                  ${report.status === 'in_progress' ? 'In Progress' : report.status}
                </span>
              </div>
            `)
            marker.addTo(map.current)
          }
        })

        wastePoints.forEach((point) => {
          if (point.latitude && point.longitude) {
            const typeIcons = {
              recycling: '♻️',
              composting: '🌱',
              landfill: '🚚',
            }

            const marker = L.marker([point.latitude, point.longitude], {
              title: point.name,
            })

            const icon = L.divIcon({
              html: `
                <div class="flex items-center justify-center w-10 h-10 rounded-full font-bold text-2xl bg-green-500"
                  style="box-shadow: 0 2px 4px rgba(0,0,0,0.2)">
                  ${typeIcons[point.type] || '♻️'}
                </div>
              `,
              className: 'custom-marker',
              iconSize: [40, 40],
              iconAnchor: [20, 40],
              popupAnchor: [0, -40],
            })

            marker.setIcon(icon)
            marker.bindPopup(`
              <div class="p-2">
                <h4 class="font-semibold text-sm">${point.name}</h4>
                <p class="text-xs text-gray-600">${point.type.replace('_', ' ')}</p>
              </div>
            `)
            marker.addTo(map.current)
          }
        })
      })
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [reports, wastePoints, traffic, environmental, center])

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded-full text-xl">🚗</div>
          <span>Traffic Monitored</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded-full text-xl">💨</div>
          <span>Environmental Quality</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded-full bg-yellow-400" />
          <span>Open Issues</span>
        </div>
      </div>

      {loading ? (
        <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-muted-foreground">Loading map...</div>
        </div>
      ) : (
        <div
          ref={mapContainer}
          className="w-full h-96 rounded-lg border border-border overflow-hidden"
          style={{ minHeight: '400px' }}
        />
      )}

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="p-3 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground mb-1">Traffic Locations</p>
          <p className="text-2xl font-bold">{traffic?.data?.length || 0}</p>
        </div>
        <div className="p-3 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground mb-1">Environmental Areas</p>
          <p className="text-2xl font-bold">{environmental?.data?.length || 0}</p>
        </div>
        <div className="p-3 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground mb-1">Open Issues</p>
          <p className="text-2xl font-bold text-yellow-600">
            {reports.filter((r) => r.status === 'open').length}
          </p>
        </div>
      </div>
    </div>
  )
}
