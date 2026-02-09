/**
 * Environmental Data API Controller
 * Handles real-time air quality and environmental metrics
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environmental data from JSON file
const loadEnvironmentalData = () => {
  const filePath = path.join(__dirname, '../../data/environmental-data.json')
  const data = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(data)
}

// Simulate real-time environmental data with slight variations
const getEnvironmentalData = async (req, res) => {
  try {
    const baseData = loadEnvironmentalData()

    // Apply real-time simulation (±5-15% variation for AQI)
    const simulatedData = {
      data: baseData.environmentalData.map((location) => ({
        id: location.id,
        location: location.location,
        latitude: location.coordinates.lat,
        longitude: location.coordinates.lng,
        aqi: Math.round(location.airQuality.aqi + (Math.random() - 0.5) * 20),
        aqi_level: location.airQuality.level,
        pollutants: {
          pm25: Math.round((location.pollutants.pm25 + (Math.random() - 0.5) * 5) * 10) / 10,
          pm10: Math.round((location.pollutants.pm10 + (Math.random() - 0.5) * 8) * 10) / 10,
          o3: Math.round((location.pollutants.o3 + (Math.random() - 0.5) * 6) * 10) / 10,
          no2: Math.round((location.pollutants.no2 + (Math.random() - 0.5) * 4) * 10) / 10,
          so2: Math.round((location.pollutants.so2 + (Math.random() - 0.5) * 2) * 10) / 10,
          co: Math.round(location.pollutants.co + (Math.random() - 0.5) * 30),
        },
        temperature: Math.round((location.temperature + (Math.random() - 0.5) * 2) * 10) / 10,
        humidity: Math.round(location.humidity + (Math.random() - 0.5) * 5),
        windSpeed: Math.round((location.windSpeed + (Math.random() - 0.5) * 3) * 10) / 10,
        visibility: Math.round((location.visibility + (Math.random() - 0.5) * 1) * 10) / 10,
        timestamp: new Date().toISOString(),
        trend: location.trend,
      })),
      summary: {
        averageAQI: Math.round(baseData.environmentalData.reduce((sum, e) => sum + e.airQuality.aqi, 0) / baseData.environmentalData.length),
        worstArea: baseData.summary.worstArea,
        bestArea: baseData.summary.bestArea,
        areasOfConcern: baseData.summary.areasOfConcern,
        averageTemperature: Math.round(baseData.environmentalData.reduce((sum, e) => sum + e.temperature, 0) / baseData.environmentalData.length * 10) / 10,
        averageHumidity: Math.round(baseData.environmentalData.reduce((sum, e) => sum + e.humidity, 0) / baseData.environmentalData.length),
        lastUpdated: new Date().toISOString(),
        aqiLevels: baseData.summary.aqiLevels,
      },
    }

    res.json(simulatedData)
  } catch (error) {
    console.error('Environmental Data Error:', error)
    res.status(500).json({ error: 'Failed to fetch environmental data' })
  }
}

const getEnvironmentalByLocation = async (req, res) => {
  try {
    const { locationId } = req.params
    const baseData = loadEnvironmentalData()

    const location = baseData.environmentalData.find((e) => e.id === locationId)

    if (!location) {
      return res.status(404).json({ error: 'Location not found' })
    }

    // Return specific location data with simulation
    const simulatedLocation = {
      id: location.id,
      location: location.location,
      latitude: location.coordinates.lat,
      longitude: location.coordinates.lng,
      aqi: Math.round(location.airQuality.aqi + (Math.random() - 0.5) * 20),
      aqi_level: location.airQuality.level,
      pollutants: {
        pm25: Math.round((location.pollutants.pm25 + (Math.random() - 0.5) * 5) * 10) / 10,
        pm10: Math.round((location.pollutants.pm10 + (Math.random() - 0.5) * 8) * 10) / 10,
        o3: Math.round((location.pollutants.o3 + (Math.random() - 0.5) * 6) * 10) / 10,
        no2: Math.round((location.pollutants.no2 + (Math.random() - 0.5) * 4) * 10) / 10,
        so2: Math.round((location.pollutants.so2 + (Math.random() - 0.5) * 2) * 10) / 10,
        co: Math.round(location.pollutants.co + (Math.random() - 0.5) * 30),
      },
      temperature: Math.round((location.temperature + (Math.random() - 0.5) * 2) * 10) / 10,
      humidity: Math.round(location.humidity + (Math.random() - 0.5) * 5),
      windSpeed: Math.round((location.windSpeed + (Math.random() - 0.5) * 3) * 10) / 10,
      visibility: Math.round((location.visibility + (Math.random() - 0.5) * 1) * 10) / 10,
      timestamp: new Date().toISOString(),
      trend: location.trend,
    }

    res.json(simulatedLocation)
  } catch (error) {
    console.error('Get Environmental by Location Error:', error)
    res.status(500).json({ error: 'Failed to fetch environmental location' })
  }
}

export { getEnvironmentalData, getEnvironmentalByLocation }

