import Report from '../models/Report.js'
import CrowdInsight from '../models/CrowdInsight.js'

/**
 * Service to generate Real-Time City Alerts based on data thresholds.
 * Simulates an "Event Processor".
 */
class AlertService {

    /**
     * Generates a list of active alerts based on live data and user location.
     * @param {string} userLocation - Filter alerts by this city/area name.
     */
    async getActiveAlerts(userLocation = null) {
        const alerts = []

        // Build query for location
        const locationQuery = userLocation
            ? { location_name: { $regex: userLocation, $options: 'i' } }
            : {}

        // 1. Check High Priority Complaints (Critical Issues)
        // Count open reports marked 'high' priority in the user's area
        const criticalReports = await Report.countDocuments({
            status: 'open',
            priority: 'high',
            ...locationQuery
        })

        if (criticalReports > 0) {
            alerts.push({
                id: 'alert-critical-reports',
                type: 'maintenance',
                severity: criticalReports > 2 ? 'high' : 'medium',
                message: `${criticalReports} Critical Infrastructure issues reported in ${userLocation || 'the city'}.`,
                area: userLocation || 'City Wide',
                timestamp: new Date().toISOString()
            })
        }

        // 2. Check Crowd Density
        const crowdQuery = { crowd_level: 'high', ...locationQuery }
        const crowdSpike = await CrowdInsight.findOne(crowdQuery).sort({ createdAt: -1 })

        if (crowdSpike) {
            alerts.push({
                id: `alert-crowd-${crowdSpike._id}`,
                type: 'crowd',
                severity: 'medium',
                message: `Unusual crowd surge detected at ${crowdSpike.location_name}.`,
                area: crowdSpike.location_name,
                timestamp: crowdSpike.createdAt ? crowdSpike.createdAt.toISOString() : new Date().toISOString()
            })
        }

        // 3. Simulated environmental/weather alerts (Location specific or Global)
        // ... (Environment alerts kept random/global for simulation unless we had weather API)
        const randomEnvState = Math.random()
        if (randomEnvState > 0.7) {
            alerts.push({
                id: 'alert-weather-storm',
                type: 'transport',
                severity: 'high',
                message: `Severe Weather Warning for ${userLocation || 'Metro Area'}. Transport delays expected.`,
                area: userLocation || 'City Wide',
                timestamp: new Date().toISOString()
            })
        } else if (randomEnvState < 0.2) {
            alerts.push({
                id: 'alert-air-quality',
                type: 'health',
                severity: 'low',
                message: 'Air Quality Index check advised for sensitive groups.',
                area: 'Industrial Zone',
                timestamp: new Date().toISOString()
            })
        }

        const severityOrder = { high: 3, medium: 2, low: 1 }
        return alerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])
    }
}

export const alertService = new AlertService()
