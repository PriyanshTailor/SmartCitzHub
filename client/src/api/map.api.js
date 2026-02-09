import { apiFetch } from '@/lib/api'

/**
 * Client-side API service for Map Data (Traffic & Environmental).
 * Centralizes all backend calls related to traffic and environmental data.
 */
export const mapApi = {
  /**
   * Fetches real-time traffic updates.
   * GET /api/map/traffic
   */
  getTrafficUpdates: async () => {
    return apiFetch('/api/map/traffic')
  },

  /**
   * Fetches traffic data for a specific location.
   * GET /api/map/traffic/:locationId
   */
  getTrafficByLocation: async (locationId) => {
    return apiFetch(`/api/map/traffic/${locationId}`)
  },

  /**
   * Fetches real-time environmental data.
   * GET /api/map/environmental
   */
  getEnvironmentalData: async () => {
    return apiFetch('/api/map/environmental')
  },

  /**
   * Fetches environmental data for a specific location.
   * GET /api/map/environmental/:locationId
   */
  getEnvironmentalByLocation: async (locationId) => {
    return apiFetch(`/api/map/environmental/${locationId}`)
  },
}
