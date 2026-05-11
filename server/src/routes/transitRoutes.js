import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get transit data with simulated real-time updates
router.get('/', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../../data/transit-data.json')
    const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'))
    
    // Simulate real-time movement
    data.vehicles = data.vehicles.map(vehicle => {
      // Small random movement to simulate real vehicle tracking
      const latOffset = (Math.random() - 0.5) * 0.002 // ~200m movement
      const lngOffset = (Math.random() - 0.5) * 0.002
      
      // Update passenger count randomly
      const passengerChange = Math.floor((Math.random() - 0.5) * 10)
      const newPassengers = Math.max(0, Math.min(vehicle.capacity, vehicle.passengers + passengerChange))
      
      // Randomly update status (95% on time, 5% delayed)
      const status = Math.random() > 0.05 ? 'on_time' : 'delayed'
      
      // Update ETA
      const eta = status === 'on_time' ? vehicle.eta : vehicle.eta + Math.floor(Math.random() * 5)
      
      return {
        ...vehicle,
        lat: vehicle.lat + latOffset,
        lng: vehicle.lng + lngOffset,
        passengers: newPassengers,
        status,
        eta: Math.max(1, eta),
        lastUpdated: new Date().toISOString()
      }
    })
    
    res.json({
      success: true,
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Transit data error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transit data'
    })
  }
})

// Get specific route details
router.get('/routes/:routeId', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../../data/transit-data.json')
    const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'))
    
    const route = data.routes.find(r => r.id === req.params.routeId)
    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      })
    }
    
    const vehicles = data.vehicles.filter(v => v.route === req.params.routeId)
    
    res.json({
      success: true,
      data: {
        route,
        vehicles,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Route data error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch route data'
    })
  }
})

// Get vehicle details
router.get('/vehicles/:vehicleId', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../../data/transit-data.json')
    const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'))
    
    const vehicle = data.vehicles.find(v => v.id === req.params.vehicleId)
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      })
    }
    
    const route = data.routes.find(r => r.id === vehicle.route)
    
    res.json({
      success: true,
      data: {
        vehicle,
        route,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Vehicle data error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle data'
    })
  }
})

// Get active alerts
router.get('/alerts', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../../data/transit-data.json')
    const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'))
    
    res.json({
      success: true,
      data: {
        alerts: data.alerts,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Alerts data error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    })
  }
})

export default router
