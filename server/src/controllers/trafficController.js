/**
 * Traffic Updates API Controller
 * Handles real-time traffic data and congestion information
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load traffic data from JSON file
const loadTrafficData = () => {
  const filePath = path.join(__dirname, '../../data/traffic-data.json')
  const data = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(data)
}

// Simulate real-time traffic data with slight variations
const getTrafficUpdates = async (req, res) => {
  try {
    const baseData = loadTrafficData()
    
    // Apply real-time simulation (±10% variation for congestion)
    const simulatedData = {
      data: baseData.trafficUpdates.map((location) => ({
        id: location.id,
        location: location.location,
        latitude: location.coordinates.lat,
        longitude: location.coordinates.lng,
        congestion: Math.round(location.congestionPercentage + (Math.random() - 0.5) * 20),
        congestionLevel: location.congestionLevel,
        avg_speed: Math.round(location.averageSpeed + (Math.random() - 0.5) * 4),
        speed_limit: location.speedLimit,
        vehicles: location.vehicles + Math.floor((Math.random() - 0.5) * 50),
        timestamp: new Date().toISOString(),
        trend: location.trend,
        estimated_delay: location.estimatedDelay + Math.floor((Math.random() - 0.5) * 4),
        road_condition: location.roadCondition,
        incidents: location.incidents,
      })),
      summary: {
        totalLocations: baseData.summary.totalLocations,
        highCongestionCount: baseData.trafficUpdates.filter((t) => t.congestionPercentage >= 70).length,
        moderateCongestionCount: baseData.trafficUpdates.filter((t) => t.congestionPercentage >= 50 && t.congestionPercentage < 70).length,
        lowCongestionCount: baseData.trafficUpdates.filter((t) => t.congestionPercentage < 50).length,
        averageCongestion: Math.round(baseData.trafficUpdates.reduce((sum, t) => sum + t.congestionPercentage, 0) / baseData.trafficUpdates.length),
        totalIncidents: baseData.trafficUpdates.reduce((sum, t) => sum + t.incidents, 0),
        lastUpdated: new Date().toISOString(),
      },
    }

    res.json(simulatedData)
  } catch (error) {
    console.error('Traffic Updates Error:', error)
    res.status(500).json({ error: 'Failed to fetch traffic updates' })
  }
}

const getTrafficByLocation = async (req, res) => {
  try {
    const { locationId } = req.params
    const baseData = loadTrafficData()

    const location = baseData.trafficUpdates.find((t) => t.id === locationId)

    if (!location) {
      return res.status(404).json({ error: 'Location not found' })
    }

    // Return specific location data with simulation
    const simulatedLocation = {
      id: location.id,
      location: location.location,
      latitude: location.coordinates.lat,
      longitude: location.coordinates.lng,
      congestion: Math.round(location.congestionPercentage + (Math.random() - 0.5) * 20),
      congestionLevel: location.congestionLevel,
      avg_speed: Math.round(location.averageSpeed + (Math.random() - 0.5) * 4),
      speed_limit: location.speedLimit,
      vehicles: location.vehicles + Math.floor((Math.random() - 0.5) * 50),
      timestamp: new Date().toISOString(),
      trend: location.trend,
      estimated_delay: location.estimatedDelay + Math.floor((Math.random() - 0.5) * 4),
      road_condition: location.roadCondition,
      incidents: location.incidents,
    }

    res.json(simulatedLocation)
  } catch (error) {
    console.error('Get Traffic by Location Error:', error)
    res.status(500).json({ error: 'Failed to fetch traffic location' })
  }
}

export { getTrafficUpdates, getTrafficByLocation }

