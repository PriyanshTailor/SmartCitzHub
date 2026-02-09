import { useState, useEffect, useCallback } from 'react'
import { dashboardApi } from '../api/dashboard.api'

/**
 * Custom hook to manage dashboard data fetching and state.
 * Handles polling interval and error states.
 */
export function useDashboardData(pollingInterval = 30000) {
    const [data, setData] = useState({
        summary: null,
        predictions: null,
        alerts: []
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [lastUpdated, setLastUpdated] = useState(null)

    const fetchAllData = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true)

            const [summaryData, predictionsData, alertsData] = await Promise.all([
                dashboardApi.getSummary(),
                dashboardApi.getPredictions(),
                dashboardApi.getAlerts()
            ])

            setData({
                summary: summaryData,
                predictions: predictionsData,
                alerts: alertsData || []
            })
            setLastUpdated(new Date())
            setError(null)
        } catch (err) {
            console.error("Dashboard Hook Error:", err)
            setError(err)
        } finally {
            if (isInitial) setLoading(false)
        }
    }, [])

    useEffect(() => {
        // Initial fetch
        fetchAllData(true)

        // Polling interval
        const intervalId = setInterval(() => {
            fetchAllData(false)
        }, pollingInterval)

        return () => clearInterval(intervalId)
    }, [fetchAllData, pollingInterval])

    return {
        data,
        loading,
        error,
        lastUpdated,
        refresh: () => fetchAllData(true)
    }
}
