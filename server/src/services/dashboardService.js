import Report from '../models/Report.js'
import User from '../models/User.js'
import WastePoint from '../models/WastePoint.js'
import { aiService } from './aiService.js'

/**
 * Service to handle complex Dashboard Data Aggregation.
 */
class DashboardService {

    /**
     * Gets the "Big Picture" summary for Admins.
     */
    async getAdminSummary() {
        const totalUsers = await User.countDocuments()
        const openReports = await Report.countDocuments({ status: 'open' })
        const resolvedReports = await Report.countDocuments({ status: 'resolved' })
        const highPriority = await Report.countDocuments({ priority: 'high', status: 'open' })

        // Calculate Trend (Simulated for now, real implementation would compare vs last week)
        const trend = openReports > 5 ? 'increasing' : 'stable'

        // Get AI Insight
        const insight = await aiService.generateDailyInsight({
            openReports,
            highPriority,
            userCount: totalUsers
        })

        // Fetch recent activity (recent reports from any user)
        const recentReports = await Report.find()
            .sort({ createdAt: -1 })
            .select('title category location_name')
            .limit(5)
            .lean()

        return {
            stats: {
                totalUsers,
                openReports,
                resolvedReports,
                highPriority
            },
            trend,
            ai_insight: insight,
            nearby: recentReports
        }
    }

    /**
     * Gets User-Specific Dashboard Data.
     */
    async getCitizenSummary(userId) {
        const myReports = await Report.countDocuments({ user_id: userId })
        // Mock points for now, user model might need 'points' field
        const points = 1250

        // Find nearby issues (Mock logic for "nearby" using just recent open reports)
        const nearbyReports = await Report.find({ status: 'open' })
            .select('title category location_name')
            .limit(3)
            .lean()

        const insight = await aiService.generateDailyInsight({
            openReports: nearbyReports.length,
            userSpecific: true
        })

        return {
            stats: {
                submitted: myReports,
                points,
                nearby_issues: nearbyReports.length
            },
            nearby: nearbyReports,
            ai_insight: insight
        }
    }

    /**
     * Get Predictive Analytics Data
     */
    async getPredictions() {
        return await aiService.generateDetailedPredictions()
    }
}

export const dashboardService = new DashboardService()
