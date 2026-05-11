import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/api'
import { MapPin, Navigation, Info, AlertTriangle, Clock, Shield, Bus } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function CrowdInsightsPage() {
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180)
  }

  useEffect(() => {
    const fetchInsights = async (userLat, userLon) => {
      try {
        // DIRECTLY FETCH FROM JSON to ensure Vadodara data is shown
        // (Bypassing API for demo purposes as requested to show specific JSON data)
        const response = await fetch('/crowd_data.json');
        const data = await response.json();

        let processedData = (data || []).map((insight, index) => {
          const lat = insight.latitude;
          const lon = insight.longitude;
          let distance = null;

          if (userLat && userLon && lat && lon) {
            distance = calculateDistance(userLat, userLon, lat, lon);
          }

          return {
            id: insight._id || insight.id || `insight-${index}`,
            location: insight.location_name || insight.location,
            density_level: insight.density_level || insight.crowd_level || 'low',
            latitude: lat,
            longitude: lon,
            reported_at: insight.last_reported || insight.reported_at || new Date().toISOString(),
            distance: distance,
            trend: insight.trend || 'stable',
            // New Vadodara specific fields
            prediction: insight.prediction_next_2h || 'N/A',
            reason: insight.reason || 'Routine activity',
            safety_index: insight.safety_index || 80,
            best_time: insight.best_time_to_visit || 'Anytime',
            alternative: insight.alternative_location || 'None nearby',
            advisory: insight.travel_advisory || 'Caution advised',
            transport: insight.transport_suggestion || 'Use public transport'
          }
        });

        // Sort by distance if user location is available
        if (userLat && userLon) {
          processedData.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        }

        setInsights(processedData)
      } catch (error) {
        console.error('Error fetching crowd insights:', error)
      } finally {
        setLoading(false)
      }
    }

    // Get user location first, fallback to Vadodara
    const VADODARA_COORDS = { latitude: 22.3072, longitude: 73.1812 };
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          fetchInsights(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Using default location: Vadodara");
          setUserLocation(VADODARA_COORDS);
          fetchInsights(VADODARA_COORDS.latitude, VADODARA_COORDS.longitude);
        }
      );
    } else {
      setLocationError("Geolocation not supported. Using default location: Vadodara");
      setUserLocation(VADODARA_COORDS);
      fetchInsights(VADODARA_COORDS.latitude, VADODARA_COORDS.longitude);
    }
  }, [])

  const densityColors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  }

  const densityEmojis = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
  }

  const getSafetyColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Smart Insights</h1>
        <p className="text-muted-foreground mb-4">
          Real-time crowd intelligence, predictions, and safety advisories for Vadodara city.
        </p>

        {locationError ? (
          <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded-md text-sm flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            {locationError}
          </div>
        ) : userLocation ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded-md text-sm flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Showing insights nearest to your location
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 p-3 rounded-md text-sm flex items-center gap-2">
            <Navigation className="h-4 w-4 animate-pulse" />
            Locating you...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-muted-foreground text-sm mb-1">Low Density Areas</p>
          <p className="text-3xl font-bold text-green-600">
            {insights.filter((i) => i.density_level === 'low').length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm mb-1">Medium Density Areas</p>
          <p className="text-3xl font-bold text-yellow-600">
            {insights.filter((i) => i.density_level === 'medium').length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm mb-1">High Density Areas</p>
          <p className="text-3xl font-bold text-red-600">
            {insights.filter((i) => i.density_level === 'high').length}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {userLocation ? 'Nearby Hotspots' : 'City Hotspots'}
        </h2>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading crowd insights...
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No crowd insights available yet.</p>
            <p className="text-sm mt-2">Check back soon for real-time updates!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="border border-border rounded-lg hover:border-primary transition-all shadow-sm"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{densityEmojis[insight.density_level]}</span>
                        <h3 className="font-bold text-lg">{insight.location}</h3>
                        {insight.distance !== null && (
                          <Badge variant="outline" className="ml-2 font-normal">
                            <MapPin className="h-3 w-3 mr-1" />
                            {insight.distance.toFixed(1)} km
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm mt-3">
                        <div className="flex items-center gap-1.5" title="Safety Index">
                          <Shield className={`h-4 w-4 ${getSafetyColor(insight.safety_index)}`} />
                          <span className="font-medium">Safety: <span className={getSafetyColor(insight.safety_index)}>{insight.safety_index}/100</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Prediction: {insight.prediction}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge className={densityColors[insight.density_level]}>
                        {insight.density_level.charAt(0).toUpperCase() + insight.density_level.slice(1)} Density
                      </Badge>
                      {insight.trend && (
                        <span className={`text-xs font-medium ${insight.trend === 'increasing' ? 'text-red-500' :
                          insight.trend === 'decreasing' ? 'text-green-500' : 'text-muted-foreground'
                          }`}>
                          Trend: {insight.trend}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detailed Accordion */}
                  <Accordion type="single" collapsible className="w-full mt-2">
                    <AccordionItem value="details" className="border-b-0">
                      <AccordionTrigger className="py-2 hover:no-underline text-sm text-primary">
                        View Travel & Safety Advisory
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md mt-2">
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Reason for Crowd</p>
                                <p className="text-sm">{insight.reason}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Travel Advisory</p>
                                <p className="text-sm">{insight.advisory}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Bus className="h-4 w-4 text-green-500 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Transport & Parking</p>
                                <p className="text-sm">{insight.transport}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Clock className="h-4 w-4 text-purple-500 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Best Time to Visit</p>
                                <p className="text-sm">{insight.best_time}</p>
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-2 pt-2 border-t mt-1">
                            <p className="text-sm">
                              <span className="font-semibold">Alternative Location: </span>
                              <span className="text-green-600">{insight.alternative}</span>
                            </p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-indigo-700 dark:text-indigo-300 flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-1 text-indigo-900 dark:text-indigo-100">About Vadodara Crowd Intelligene</h3>
            <p className="text-sm text-indigo-800 dark:text-indigo-200">
              This system provides real-time insights for Vadodara city. Safety Index is calculated based on crowd density, lighting, and police presence reports. Predictions utilize historical data and event calendars (e.g., Navratri, IPL).
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
