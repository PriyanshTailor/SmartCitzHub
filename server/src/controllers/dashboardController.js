import { dashboardService } from '../services/dashboardService.js'
import { alertService } from '../services/alertService.js'


import User from '../models/User.js'

export const getDashboardAlerts = async (req, res) => {
    try {
        let userLocation = null
        if (req.user && req.user.sub) {
            const user = await User.findById(req.user.sub).select('location district')
            userLocation = user?.location || user?.district || null
        }

        const alerts = await alertService.getActiveAlerts(userLocation)
        res.json(alerts)
    } catch (error) {
        console.error('Alerts Error:', error)
        res.status(500).json({ error: 'Failed to fetch alerts' })
    }
}

export const getDashboardSummary = async (req, res) => {
    try {
        const userRole = req.user.user_type
        const userId = req.user.sub

        if (userRole === 'admin' || userRole === 'official') {
            const summary = await dashboardService.getAdminSummary()
            return res.json(summary)
        } else {
            const summary = await dashboardService.getCitizenSummary(userId)
            return res.json(summary)
        }
    } catch (error) {
        console.error('Dashboard Summary Error:', error)
        res.status(500).json({ error: 'Failed to fetch dashboard summary' })
    }
}

export const getDashboardPredictions = async (req, res) => {
    try {
        const predictions = await dashboardService.getPredictions()
        res.json(predictions)
    } catch (error) {
        console.error('Predictions Error:', error)
        res.status(500).json({ error: 'Failed to fetch predictions' })
    }
}

export const updatePreferences = async (req, res) => {
    // Placeholder for user preferences (widgets layout, etc.)
    // Would typically update a UserPreference model
    res.json({ success: true, message: "Preferences updated" })
}
