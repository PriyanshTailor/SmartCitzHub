import { apiFetch } from '@/lib/api'

export const transitApi = {
  // Get all transit data including vehicles, routes, and alerts
  getTransitData: async () => {
    return apiFetch('/api/transit')
  },

  // Get specific route details
  getRoute: async (routeId) => {
    return apiFetch(`/api/transit/routes/${routeId}`)
  },

  // Get vehicle details
  getVehicle: async (vehicleId) => {
    return apiFetch(`/api/transit/vehicles/${vehicleId}`)
  },

  // Get active alerts
  getAlerts: async () => {
    return apiFetch('/api/transit/alerts')
  }
}
