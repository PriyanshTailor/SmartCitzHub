import express from 'express'
import * as dashboardController from '../controllers/dashboardController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/summary', authenticateToken, dashboardController.getDashboardSummary)
router.get('/alerts', authenticateToken, dashboardController.getDashboardAlerts)
router.get('/predictions', authenticateToken, dashboardController.getDashboardPredictions)
router.post('/preferences', authenticateToken, dashboardController.updatePreferences)

export default router
