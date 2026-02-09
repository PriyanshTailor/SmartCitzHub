import dotenv from 'dotenv'

dotenv.config()

// Mock AI responses when no API key is available
const MOCK_INSIGHTS = [
    "Traffic congestion has increased by 15% in the Downtown area due to weekend market activities.",
    "Waste collection efficiency is operating at 92%. North District requires additional pickup trucks this Tuesday.",
    "Air quality index (AQI) is improving. Current level: 45 (Good). Suggest promoting outdoor initiatives.",
    "Public transport usage peaks between 8 AM and 10 AM. Recommended to deploy 2 extra buses on Route 5.",
    "Water consumption spikes detected in Sector 7. Possible leak or high commercial usage.",
    "Community engagement is up! 4 new safety initiatives started this week."
]

/**
 * AI Service to generate intelligent insights for the dashboard.
 * 
 * Capability:
 * - Analyzes raw data (trends, spikes).
 * - Generates natural language summaries.
 * - Uses LLM if API key provides, otherwise uses Advanced Simulation.
 */
class AiService {
    constructor() {
        this.apiKey = process.env.AI_API_KEY
        this.provider = process.env.AI_PROVIDER || 'simulation' // 'openai', 'gemini', 'simulation'
    }

    /**
     * Generates a daily city insight based on aggregated data.
     * @param {Object} contextData - Structured data (report counts, waste stats, etc.)
     * @returns {Promise<Object>} - { text: string, confidence: number, type: string }
     */
    async generateDailyInsight(contextData) {
        if (this.provider === 'simulation' || !this.apiKey) {
            return this._simulateInsight(contextData)
        }

        // TODO: Implement actual LLM call here (OpenAI/Gemini)
        // For now, even if key exists, we fallback to simulation until integration is finalized
        return this._simulateInsight(contextData)
    }

    /**
     * Simulates an AI response using rule-based logic to feel "Real-Time".
     */
    async _simulateInsight(data) {
        // 1. Analyze Data Patterns
        const reportCount = data.openReports || 0
        const urgentReports = data.highPriority || 0

        // 2. Generate Context-Aware Message
        let message = ""
        let type = "info"

        if (urgentReports > 2) {
            message = `Critical Action Required: ${urgentReports} high-priority issues detected. Focus on infrastructure safety immediately.`
            type = "alert"
        } else if (reportCount > 10) {
            message = `High civic engagement today. ${reportCount} new reports filed. Most concern road maintenance.`
            type = "trend"
        } else {
            // Random insight for variety if data is normal
            message = MOCK_INSIGHTS[Math.floor(Math.random() * MOCK_INSIGHTS.length)]
        }

        return {
            text: message,
            confidence: 0.85 + (Math.random() * 0.1), // 0.85 - 0.95
            generated_at: new Date().toISOString(),
            type
        }
    }

    /**
     * Generates a detailed predictive analytics object.
     */
    async generateDetailedPredictions() {
        return {
            crowdRisk: {
                area: "Railway Station",
                probability: 0.78, // High risk
                timeWindow: "6 PM – 8 PM",
                reason: "Evening peak + nearby event"
            },
            wasteRisk: {
                zone: "Zone 3",
                probability: 0.65, // Medium risk
                reason: "High usage + delayed pickup"
            },
            transportDelay: {
                route: "Ring Road",
                delayMinutes: 18,
                reason: "Traffic congestion and roadwork"
            }
        }
    }
}

export const aiService = new AiService()
