import Report from '../models/Report.js'
import User from '../models/User.js'
import WastePoint from '../models/WastePoint.js'
import { aiService } from './aiService.js'

const hasMongo = Boolean(process.env.MONGODB_URI)

const DEMO_ADMIN_SUMMARY = {
    stats: {
        totalUsers: 1284,
        openReports: 18,
        resolvedReports: 91,
        highPriority: 4
    },
    trend: 'stable',
    nearby: [
        { _id: 'demo-r1', title: 'Pothole near City Hall', category: 'road', location_name: 'Downtown' },
        { _id: 'demo-r2', title: 'Overflowing bin at Market Road', category: 'waste', location_name: 'Market District' },
        { _id: 'demo-r3', title: 'Street light outage', category: 'lighting', location_name: 'North Ward' }
    ]
}

const DEMO_CITIZEN_SUMMARY = {
    stats: {
        submitted: 5,
        points: 1250,
        nearby_issues: 3
    },
    nearby: [
        { _id: 'demo-c1', title: 'Water logging near school', category: 'drainage', location_name: 'Ward 3' },
        { _id: 'demo-c2', title: 'Broken pavement', category: 'road', location_name: 'Ward 5' },
        { _id: 'demo-c3', title: 'Noise complaint', category: 'public_safety', location_name: 'Ward 2' }
    ]
}

/**
 * Service to handle complex Dashboard Data Aggregation.
 */
class DashboardService {

    /**
     * Gets the "Big Picture" summary for Admins.
     */
    async getAdminSummary() {
        if (!hasMongo) {
            const insight = await aiService.generateDailyInsight({
                openReports: DEMO_ADMIN_SUMMARY.stats.openReports,
                highPriority: DEMO_ADMIN_SUMMARY.stats.highPriority,
                userCount: DEMO_ADMIN_SUMMARY.stats.totalUsers
            })

            return {
                ...DEMO_ADMIN_SUMMARY,
                ai_insight: insight
            }
        }

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
        if (!hasMongo) {
            const insight = await aiService.generateDailyInsight({
                openReports: DEMO_CITIZEN_SUMMARY.stats.nearby_issues,
                userSpecific: true
            })

            return {
                ...DEMO_CITIZEN_SUMMARY,
                ai_insight: insight
            }
        }

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
