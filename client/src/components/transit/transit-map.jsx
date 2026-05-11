import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bus, Train, Navigation, Clock, Users, AlertTriangle } from 'lucide-react'
import { transitApi } from '@/api/transit.api'

export function TransitMap() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [routes, setRoutes] = useState([])

  // Fetch transit data from API
  const fetchTransitData = async () => {
    try {
      const response = await transitApi.getTransitData()
      console.log('Transit API Response:', response)
      if (response.success && response.data) {
        console.log('Vehicles received:', response.data.vehicles?.length || 0)
        console.log('Alerts received:', response.data.alerts?.length || 0)
        setVehicles(response.data.vehicles || [])
        setAlerts(response.data.alerts || [])
        setRoutes(response.data.routes || [])
      } else {
        console.error('API response not successful:', response)
      }
    } catch (error) {
      console.error('Failed to fetch transit data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and polling for real-time updates
  useEffect(() => {
    fetchTransitData()
    const interval = setInterval(fetchTransitData, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Initialize map centered on Vadodara
  useEffect(() => {
    import('leaflet').then((L) => {
      if (!mapContainer.current || map.current) return

      map.current = L.map(mapContainer.current).setView([22.3072, 73.1812], 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update markers when vehicles change
  useEffect(() => {
    if (!map.current) {
      console.log('Map not initialized yet')
      return
    }
    
    if (vehicles.length === 0) {
      console.log('No vehicles to display')
      return
    }

    console.log('Adding markers for', vehicles.length, 'vehicles')

    import('leaflet').then((L) => {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        if (map.current) {
          map.current.removeLayer(marker)
        }
      })
      markersRef.current = []

      vehicles.forEach((v) => {
        const route = routes.find(r => r.id === v.route)
        const routeColor = route?.color || '#3B82F6'
        
        console.log('Adding marker for vehicle:', v.id, 'at', v.lat, v.lng)
        
        const icon = L.divIcon({
          html: `
            <div class="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-lg transition-all hover:scale-110" style="background-color: ${routeColor}">
              <span class="text-white text-xs font-bold">${v.route.split('-')[1]}</span>
            </div>
          `,
          className: 'transit-marker',
          iconSize: [40, 40],
        })

        const marker = L.marker([v.lat, v.lng], { icon })
          .addTo(map.current)
          .on('click', () => {
            console.log('Vehicle clicked:', v)
            setSelectedVehicle(v)
          })

        markersRef.current.push(marker)
      })
      
      console.log('Total markers added:', markersRef.current.length)
    })
  }, [vehicles, routes])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      <div className="lg:col-span-2 rounded-lg border overflow-hidden relative">
        <div ref={mapContainer} className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex items-center justify-center z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading transit data...</p>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border text-xs z-10">
          <div className="font-semibold mb-2 text-primary">Vadodara City Transit</div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Active Buses</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>On-Time</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Delayed</span>
          </div>
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            {vehicles.length} vehicles active
          </div>
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Live Updates
        </h3>

        {selectedVehicle ? (
          <Card className="p-4 border-primary">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold flex items-center gap-2">
                  <Bus />
                  Route {selectedVehicle.route}
                </h4>
                <p className="text-sm text-muted-foreground">Vehicle #{selectedVehicle.id}</p>
              </div>
              <Badge variant={selectedVehicle.status === 'on_time' ? 'default' : 'destructive'}>
                {selectedVehicle.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Navigation className="w-4 h-4" /> Next Stop
                </span>
                <span className="font-medium">{selectedVehicle.nextStop} ({selectedVehicle.eta} min)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Users className="w-4 h-4" /> Occupancy
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        (selectedVehicle.passengers / selectedVehicle.capacity * 100) > 80 
                          ? 'bg-red-500' 
                          : (selectedVehicle.passengers / selectedVehicle.capacity * 100) > 60 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((selectedVehicle.passengers / selectedVehicle.capacity * 100), 100)}%` }}
                    />
                  </div>
                  <span>{selectedVehicle.passengers}/{selectedVehicle.capacity}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Speed</span>
                <span className="font-medium">{selectedVehicle.speed} km/h</span>
              </div>
            </div>

            <Button className="w-full mt-4" variant="outline" onClick={() => setSelectedVehicle(null)}>
              Close Details
            </Button>
          </Card>
        ) : (
          <div className="p-8 text-center border rounded-lg border-dashed text-muted-foreground">
            <MapIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Select a vehicle on the map to see real-time details.</p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Service Alerts</h4>
          {loading ? (
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Loading alerts...</p>
            </Card>
          ) : alerts.length > 0 ? (
            alerts.map((alert) => (
              <Card 
                key={alert.id} 
                className={`p-3 ${
                  alert.severity === 'high' 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900' 
                    : alert.severity === 'medium'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900'
                }`}
              >
                <p className={`text-sm font-medium flex items-center gap-2 ${
                  alert.severity === 'high' 
                    ? 'text-red-800 dark:text-red-200' 
                    : alert.severity === 'medium'
                    ? 'text-yellow-800 dark:text-yellow-200'
                    : 'text-blue-800 dark:text-blue-200'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                  {alert.title}
                </p>
                <p className={`text-xs mt-1 ${
                  alert.severity === 'high' 
                    ? 'text-red-700 dark:text-red-300' 
                    : alert.severity === 'medium'
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  Route {alert.route}: {alert.description}
                </p>
              </Card>
            ))
          ) : (
            <Card className="p-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                ✓ All Systems Operational
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                No service disruptions reported.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function MapIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </svg>
  )
}
