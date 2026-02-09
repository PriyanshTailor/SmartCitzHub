import { apiFetch } from '@/lib/api'

/**
 * Client-side API service for Dashboard.
 * Centralizes all backend calls related to the dashboard.
 */
export const dashboardApi = {

    /**
     * Fetches the main summary stats (User specific or Admin specific).
     * GET /api/dashboard/summary
     */
    getSummary: async () => {
        return apiFetch('/api/dashboard/summary')
    },

    /**
     * Fetches real-time alerts.
     * GET /api/dashboard/alerts
     */
    getAlerts: async () => {
        return apiFetch('/api/dashboard/alerts')
    },

    /**
     * Fetches predictive analytics data.
     * GET /api/dashboard/predictions
     */
    getPredictions: async () => {
        return apiFetch('/api/dashboard/predictions')
    }
}
