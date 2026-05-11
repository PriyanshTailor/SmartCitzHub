import express from 'express'
import * as crowdInsightsController from '../controllers/crowdInsightsController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/crowd/insights
// Publicly accessible or protected? The existing `dashboardRoutes` used `authenticateToken`.
// The frontend calls `apiFetch` which usually attaches the token if available.
// Let's keep it protected for consistency with other dashboard data, or public if it's general info.
// Given it's "Crowd Insights" it might be public info, but let's use `authenticateToken` as per the dashboard pattern.

router.get('/insights', authenticateToken, crowdInsightsController.getInsights)

export default router
