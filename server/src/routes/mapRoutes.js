import express from 'express'
import * as trafficController from '../controllers/trafficController.js'
import * as environmentalController from '../controllers/environmentalController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * Traffic Routes
 */
router.get('/traffic', authenticateToken, trafficController.getTrafficUpdates)
router.get('/traffic/:locationId', authenticateToken, trafficController.getTrafficByLocation)

/**
 * Environmental Data Routes
 */
router.get('/environmental', authenticateToken, environmentalController.getEnvironmentalData)
router.get(
  '/environmental/:locationId',
  authenticateToken,
  environmentalController.getEnvironmentalByLocation
)
// Environment prediction route (calls external ML microservice)
router.get('/environment/prediction', authenticateToken, environmentalController.getEnvironmentalPrediction)

export default router
