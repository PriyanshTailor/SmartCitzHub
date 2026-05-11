import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Truck, AlertTriangle, X, MessageSquare, Edit2, Trash2, Plus, Package } from 'lucide-react'
import { apiFetch } from '@/lib/api'

// Vadodara coordinates
const VADODARA_LAT = 22.3072
const VADODARA_LNG = 73.1812

// Status colors and styles
const STATUS_CONFIG = {
  active: { color: 'border-green-500', badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200', icon: '🟢' },
  maintenance: { color: 'border-yellow-500', badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200', icon: '🟡' },
  inactive: { color: 'border-red-500', badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200', icon: '🔴' },
}

const STATUSES = ['active', 'maintenance', 'inactive']
const COMPLAINT_STATUSES = ['open', 'acknowledged', 'in_progress', 'resolved', 'closed']
const COMPLAINT_STATUS_RANK = {
  open: 0,
  acknowledged: 1,
  in_progress: 2,
  resolved: 3,
  closed: 4,
}
const VADODARA_SERVICE_RADIUS_KM = 35
const VADODARA_AREAS = [
  { name: 'Alkapuri', lat: 22.3117, lng: 73.1656 },
  { name: 'Fatehgunj', lat: 22.3236, lng: 73.1886 },
  { name: 'Manjalpur', lat: 22.2708, lng: 73.1880 },
  { name: 'Karelibaug', lat: 22.3229, lng: 73.2102 },
  { name: 'Gotri', lat: 22.3149, lng: 73.1323 },
  { name: 'Chhani', lat: 22.3613, lng: 73.1662 },
  { name: 'Makarpura GIDC', lat: 22.2595, lng: 73.1950 },
  { name: 'Sayajigunj', lat: 22.3078, lng: 73.1815 },
  { name: 'Akota', lat: 22.2916, lng: 73.1628 },
  { name: 'Savli Road', lat: 22.3370, lng: 73.2420 },
]

const TRUCK_AREA_ASSIGNMENTS = [
  { area: 'Sayaji Baug Garden', address: 'Sayaji Baug, Kala Goda Circle, Vadodara, Gujarat', lat: 22.3115, lng: 73.19 },
  { area: 'Akota Stadium', address: 'Akota Stadium, Productivity Road, Akota, Vadodara, Gujarat 390020', lat: 22.2967563, lng: 73.1697054 },
  { area: 'Gotri Garden', address: 'Gotri Garden Road, Gotri, Vadodara, Gujarat 390021', lat: 22.3149, lng: 73.1323 },
  { area: 'Sama Sports Complex', address: 'New Sama Road, Sahkar Nagar 4, Vadodara, Gujarat 390002', lat: 22.3542, lng: 73.1888 },
  { area: 'Manjalpur Sports Complex', address: 'Manjalpur Sports Complex, Vadodara, Gujarat 390011', lat: 22.2708, lng: 73.188 },
  { area: 'Bapod Talav', address: 'Natvarnagar, Bapod, Waghodia Road, Vadodara, Gujarat 390019', lat: 22.3017, lng: 73.2321 },
]

const DEFAULT_DISPOSAL_POINTS = [
  {
    id: 'DP-01',
    name: 'Ankhol Cricket Ground Waste Transfer Point',
    address: 'Bus Stop, Ankhol, New Waghodia Road, Vadodara, Gujarat 390019',
    latitude: 22.2950439,
    longitude: 73.2640678,
    district: 'Vadodara',
    ward: 'Waghodia Road',
    type: 'landfill',
    status: 'operational',
    capacity: 250,
    fill_level: 35,
    hours: '8:00 AM - 6:00 PM',
  },
  {
    id: 'DP-02',
    name: 'Atladara Lake Garden Recycling Point',
    address: 'Atladara Lake Garden, Atladara, Vadodara, Gujarat 390012',
    latitude: 22.2768,
    longitude: 73.1415,
    district: 'Vadodara',
    ward: 'Atladara',
    type: 'recycling',
    status: 'operational',
    capacity: 150,
    fill_level: 42,
    hours: '7:00 AM - 5:00 PM',
  },
  {
    id: 'DP-03',
    name: 'Makarpura SRP Ground Compost Point',
    address: 'Indulal Yagnik Road, GIDC Industrial Area, Manjalpur, Vadodara, Gujarat 390010',
    latitude: 22.2673,
    longitude: 73.1841,
    district: 'Vadodara',
    ward: 'Makarpura',
    type: 'composting',
    status: 'operational',
    capacity: 120,
    fill_level: 55,
    hours: '7:30 AM - 5:30 PM',
  },
]

const DEFAULT_COLLECTION_SCHEDULES = [
  { id: 'CS-01', location_name: 'Akota Stadium Collection Zone', district: 'Vadodara', latitude: 22.2967563, longitude: 73.1697054, collection_day: 'Monday', collection_time: '6:00 AM', waste_type: 'General Waste', collection_status: 'scheduled' },
  { id: 'CS-02', location_name: 'Sayaji Baug Garden Collection Zone', district: 'Vadodara', latitude: 22.3115, longitude: 73.19, collection_day: 'Tuesday', collection_time: '6:30 AM', waste_type: 'Commercial Waste', collection_status: 'scheduled' },
  { id: 'CS-03', location_name: 'Gotri Garden Collection Zone', district: 'Vadodara', latitude: 22.3149, longitude: 73.1323, collection_day: 'Wednesday', collection_time: '7:00 AM', waste_type: 'General Waste', collection_status: 'scheduled' },
  { id: 'CS-04', location_name: 'Chhani Lake Collection Zone', district: 'Vadodara', latitude: 22.3613, longitude: 73.1662, collection_day: 'Thursday', collection_time: '6:45 AM', waste_type: 'General Waste', collection_status: 'scheduled' },
  { id: 'CS-05', location_name: 'Manjalpur Sports Complex Collection Zone', district: 'Vadodara', latitude: 22.2708, longitude: 73.188, collection_day: 'Friday', collection_time: '7:15 AM', waste_type: 'Recycling', collection_status: 'scheduled' },
  { id: 'CS-06', location_name: 'Bapod Talav Collection Zone', district: 'Vadodara', latitude: 22.3017, longitude: 73.2321, collection_day: 'Saturday', collection_time: '6:30 AM', waste_type: 'General Waste', collection_status: 'scheduled' },
]

const emptyPointForm = {
  name: '',
  location_name: '',
  latitude: '',
  longitude: '',
  district: 'Vadodara',
  ward: '',
  waste_type: 'general',
  status: 'operational',
  capacity: 100,
  fill_level: 0,
  hours: '8:00 AM - 6:00 PM',
}

const emptyScheduleForm = {
  location_name: '',
  district: 'Vadodara',
  latitude: '',
  longitude: '',
  collection_day: 'Monday',
  collection_time: '6:00 AM',
  waste_type: 'General Waste',
}

const emptyVehicleForm = {
  id: '',
  name: '',
  lat: '',
  lng: '',
  area: '',
  address: '',
  status: 'active',
  load: 0,
  driver_name: '',
  assigned_route: '',
}

const getDistanceKm = (aLat, aLng, bLat, bLng) => {
  const toRad = (value) => (Number(value) * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const getNearestAreaLabel = (lat, lng) => {
  if (!lat || !lng) return 'Location unavailable'
  const nearest = VADODARA_AREAS
    .map((area) => ({
      ...area,
      distanceKm: getDistanceKm(lat, lng, area.lat, area.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0]

  return nearest ? `Near ${nearest.name} (${nearest.distanceKm.toFixed(1)} km)` : 'Vadodara'
}

const getVehicleAreaAssignment = (vehicle, index = 0) => {
  const numericId = String(vehicle?.id || '').match(/\d+/)?.[0]
  const assignmentIndex = numericId ? (Number(numericId) - 1) % TRUCK_AREA_ASSIGNMENTS.length : index % TRUCK_AREA_ASSIGNMENTS.length
  return TRUCK_AREA_ASSIGNMENTS[assignmentIndex]
}

const normalizeVehicleLocation = (vehicle, index) => {
  const assignedArea = getVehicleAreaAssignment(vehicle, index)
  return {
    ...vehicle,
    lat: Number(vehicle.lat || vehicle.latitude || assignedArea.lat),
    lng: Number(vehicle.lng || vehicle.longitude || assignedArea.lng),
    area: vehicle.area || assignedArea.area,
    address: vehicle.address || assignedArea.address,
  }
}

const normalizeDisposalPoint = (point, index) => {
  const fallback = DEFAULT_DISPOSAL_POINTS[index % DEFAULT_DISPOSAL_POINTS.length]
  const name = point.name || fallback.name
  const address = point.address || point.location_name || fallback.address
  const matchingDefault = DEFAULT_DISPOSAL_POINTS.find((item) =>
    `${name} ${address}`.toLowerCase().includes(item.address.split(',')[0].toLowerCase()) ||
    name.toLowerCase().includes(item.name.toLowerCase())
  ) || fallback

  return {
    ...matchingDefault,
    ...point,
    id: point.id || point._id || matchingDefault.id,
    name,
    address,
    latitude: Number(point.latitude || matchingDefault.latitude),
    longitude: Number(point.longitude || matchingDefault.longitude),
    district: point.district || 'Vadodara',
    ward: point.ward || matchingDefault.ward,
    type: point.type || matchingDefault.type,
    status: point.status || matchingDefault.status,
    hours: point.hours || matchingDefault.hours,
  }
}

const normalizeSchedule = (schedule, index) => {
  const fallback = DEFAULT_COLLECTION_SCHEDULES[index % DEFAULT_COLLECTION_SCHEDULES.length]
  return {
    ...fallback,
    ...schedule,
    id: schedule.id || schedule._id || fallback.id,
    location_name: schedule.location_name || schedule.location || fallback.location_name,
    district: schedule.district || 'Vadodara',
    latitude: Number(schedule.latitude || fallback.latitude),
    longitude: Number(schedule.longitude || fallback.longitude),
    collection_day: schedule.collection_day || fallback.collection_day,
    collection_time: schedule.collection_time || fallback.collection_time,
    waste_type: schedule.waste_type || schedule.type || fallback.waste_type,
    collection_status: schedule.collection_status || fallback.collection_status,
  }
}

const includeDefaultDisposalPoints = (points) => {
  return (points || []).map(normalizeDisposalPoint)
}

const includeDefaultSchedules = (items) => {
  return (items || []).map(normalizeSchedule)
}

const getRouteQuery = (_locationName, lat, lng) => {
  return encodeURIComponent(`${Number(lat)},${Number(lng)}`)
}

const canChangeComplaintStatus = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return false
  if (currentStatus === 'closed') return false
  return COMPLAINT_STATUS_RANK[nextStatus] > COMPLAINT_STATUS_RANK[currentStatus]
}

export default function AdminWastePage() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const mapInitialized = useRef(false)
  const [vehicles, setVehicles] = useState([])
  const [wastePoints, setWastePoints] = useState([])
  const [schedules, setSchedules] = useState([])
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [newStatus, setNewStatus] = useState(null)
  const [updatingVehicle, setUpdatingVehicle] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [vehicleFormData, setVehicleFormData] = useState(emptyVehicleForm)
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [expandedComplaint, setExpandedComplaint] = useState(null)
  const [editingPoint, setEditingPoint] = useState(null)
  const [editPointData, setEditPointData] = useState(emptyPointForm)
  const [showAddPoint, setShowAddPoint] = useState(false)
  const [updatingPoint, setUpdatingPoint] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [editScheduleData, setEditScheduleData] = useState(emptyScheduleForm)
  const [showAddSchedule, setShowAddSchedule] = useState(false)
  const [updatingSchedule, setUpdatingSchedule] = useState(false)

  // Fetch vehicles and waste points
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehicleData, wasteData, complaintsData, schedulesData] = await Promise.all([
          apiFetch('/api/admin/vehicles'),
          apiFetch('/api/waste/points'),
          apiFetch('/api/admin/waste-complaints'),
          apiFetch('/api/admin/waste-schedules'),
        ])

        console.log('[AdminWaste] Fetched vehicles:', vehicleData)
        console.log('[AdminWaste] Fetched waste points:', wasteData)
        console.log('[AdminWaste] Fetched complaints:', complaintsData)
        console.log('[AdminWaste] Fetched schedules:', schedulesData)

        setVehicles((vehicleData || []).map(normalizeVehicleLocation))
        setWastePoints(includeDefaultDisposalPoints(wasteData))
        setComplaints(complaintsData || [])
        setSchedules(includeDefaultSchedules(schedulesData))
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Poll for updates every 5 seconds to simulate live API
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  // Initialize map once on component mount
  useEffect(() => {
    if (mapInitialized.current || !mapContainer.current) return

    import('leaflet').then((L) => {
      // Double-check the map hasn't been initialized in another render
      if (mapInitialized.current || !mapContainer.current) return

      try {
        // Center map on Vadodara
        map.current = L.map(mapContainer.current, { preferCanvas: true }).setView([VADODARA_LAT, VADODARA_LNG], 13)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map.current)

        mapInitialized.current = true
        console.log('[Map] Initialized successfully')
      } catch (err) {
        console.error('[Map] Initialization error:', err)
      }
    })

    return () => {
      // Don't clean up the map on unmount - it will be reused if component remounts
    }
  }, []) // Empty dependency array - only initialize once

  // Update markers when data changes
  useEffect(() => {
    if (!mapInitialized.current || !map.current || !mapContainer.current) {
      console.log('[Map] Not ready for marker update', { initialized: mapInitialized.current, mapExists: !!map.current })
      return
    }

    import('leaflet').then((L) => {
      try {
        // Remove old markers (but keep tile layer)
        map.current.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            map.current.removeLayer(layer)
          }
        })
        const bounds = []

      // Add waste collection points
      wastePoints.forEach((point) => {
        if (point.latitude && point.longitude) {
          const statusColor = point.status === 'full' ? 'border-red-500' : point.status === 'maintenance' ? 'border-yellow-500' : 'border-green-500'
          const icon = L.divIcon({
            html: `
              <div class="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 ${statusColor} shadow-lg text-lg">
                🗑️
              </div>
            `,
            className: 'waste-marker',
            iconSize: [32, 32],
          })

          L.marker([point.latitude, point.longitude], { icon })
            .bindPopup(`<b>${point.name || 'Waste Point'}</b><br>${point.address || point.location_name || 'Vadodara'}<br>Type: ${point.type || 'general'}<br>Status: ${point.status || 'operational'}`)
            .addTo(map.current)
          bounds.push([Number(point.latitude), Number(point.longitude)])
        }
      })

      schedules.forEach((schedule) => {
        if (schedule.latitude && schedule.longitude) {
          const icon = L.divIcon({
            html: `
              <div class="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-blue-500 shadow-lg text-lg">
                📅
              </div>
            `,
            className: 'schedule-marker',
            iconSize: [32, 32],
          })

          L.marker([schedule.latitude, schedule.longitude], { icon })
            .bindPopup(`<b>${schedule.location_name || 'Collection Schedule'}</b><br>${schedule.district || 'Vadodara'}<br>Day: ${schedule.collection_day}<br>Time: ${schedule.collection_time}<br>Assigned: ${schedule.assigned_vehicle_id || 'None'}`)
            .addTo(map.current)
          bounds.push([Number(schedule.latitude), Number(schedule.longitude)])
        }
      })

      // Add vehicles to map
      vehicles.forEach((v) => {
        const config = STATUS_CONFIG[v.status] || STATUS_CONFIG.inactive
        const assignment = getVehicleAssignment(v.id)
        const icon = L.divIcon({
          html: `
            <div class="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 ${config.color} shadow-lg text-lg">
              🚛
            </div>
          `,
          className: 'vehicle-marker',
          iconSize: [32, 32],
        })

        L.marker([v.lat, v.lng], { icon })
          .bindPopup(`
            <div>
              <b>${v.name || v.id}</b><br>
              Status: <strong>${v.status}</strong><br>
              Area: ${v.address || getNearestAreaLabel(v.lat, v.lng)}<br>
              Coordinates: ${v.lat}, ${v.lng}<br>
              Assigned: ${assignment ? `${assignment.type} - ${assignment.name}` : 'Free'}<br>
              Last Updated: ${new Date(v.lastUpdated).toLocaleTimeString()}
            </div>
          `)
          .addTo(map.current)
        bounds.push([Number(v.lat), Number(v.lng)])
      })

      if (bounds.length) {
        map.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 })
      }
      } catch (err) {
        console.error('[Map] Error updating markers:', err)
      }
    })
  }, [vehicles, wastePoints, schedules]) // Update markers when data changes

  // Handle vehicle status update
  const handleStatusUpdate = async () => {
    if (!selectedVehicle || !newStatus) return
    if (getVehicleAssignment(selectedVehicle.id)) {
      setError('Assigned trucks cannot be moved to maintenance or inactive. Mark the assigned collection as collected or unassign the truck first.')
      return
    }

    setUpdatingVehicle(true)
    try {
      await apiFetch(`/api/admin/vehicles/${selectedVehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      // Update local state
      setVehicles(vehicles.map((v) => 
        v.id === selectedVehicle.id ? { ...v, status: newStatus } : v
      ))

      // Close dialog
      setSelectedVehicle(null)
      setNewStatus(null)
      console.log(`[Vehicle] Updated ${selectedVehicle.id} to ${newStatus}`)
    } catch (err) {
      console.error('Error updating vehicle status:', err)
      setError(`Failed to update vehicle: ${err.message}`)
    } finally {
      setUpdatingVehicle(false)
    }
  }

  const resetVehicleForm = () => {
    setVehicleFormData(emptyVehicleForm)
    setEditingVehicle(null)
    setShowAddVehicle(false)
  }

  const handleStartAddVehicle = () => {
    setSelectedVehicle(null)
    setEditingVehicle(null)
    setVehicleFormData(emptyVehicleForm)
    setShowAddVehicle(true)
  }

  const handleEditVehicle = (vehicle) => {
    if (getVehicleAssignment(vehicle.id)) {
      setError('Assigned trucks cannot be updated. Complete or remove the assignment first.')
      return
    }

    setShowAddVehicle(false)
    setEditingVehicle(vehicle.id)
    setVehicleFormData({
      id: vehicle.id,
      name: vehicle.name || '',
      lat: vehicle.lat ?? '',
      lng: vehicle.lng ?? '',
      area: vehicle.area || '',
      address: vehicle.address || '',
      status: vehicle.status || 'active',
      load: vehicle.load ?? 0,
      driver_name: vehicle.driver_name || '',
      assigned_route: vehicle.assigned_route || '',
    })
  }

  const validateVehicleForm = () => {
    if (!vehicleFormData.id || !vehicleFormData.name || vehicleFormData.lat === '' || vehicleFormData.lng === '') {
      setError('Vehicle ID, name, latitude, and longitude are required.')
      return false
    }

    if (!isWithinVadodaraServiceArea(vehicleFormData.lat, vehicleFormData.lng)) {
      setError('Vehicle coordinates must be within the Vadodara service area.')
      return false
    }

    return true
  }

  const handleAddVehicle = async () => {
    if (!validateVehicleForm()) return

    setUpdatingVehicle(true)
    try {
      const response = await apiFetch('/api/admin/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicleFormData),
      })

      setVehicles((current) => [...current, normalizeVehicleLocation(response, current.length)])
      resetVehicleForm()
    } catch (err) {
      console.error('Error creating vehicle:', err)
      setError(`Failed to create vehicle: ${err.message}`)
    } finally {
      setUpdatingVehicle(false)
    }
  }

  const handleSaveVehicle = async () => {
    if (!editingVehicle || !validateVehicleForm()) return

    const vehicle = vehicles.find((item) => item.id === editingVehicle)
    if (vehicle && getVehicleAssignment(vehicle.id)) {
      setError('Assigned trucks cannot be updated. Complete or remove the assignment first.')
      return
    }

    setUpdatingVehicle(true)
    try {
      const response = await apiFetch(`/api/admin/vehicles/${editingVehicle}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: vehicleFormData.name,
          lat: vehicleFormData.lat,
          lng: vehicleFormData.lng,
          area: vehicleFormData.area,
          address: vehicleFormData.address,
          status: vehicleFormData.status,
          load: vehicleFormData.load,
          driver_name: vehicleFormData.driver_name,
          assigned_route: vehicleFormData.assigned_route,
        }),
      })

      setVehicles((current) => current.map((item, index) =>
        item.id === editingVehicle ? normalizeVehicleLocation(response, index) : item
      ))
      resetVehicleForm()
    } catch (err) {
      console.error('Error updating vehicle:', err)
      setError(`Failed to update vehicle: ${err.message}`)
    } finally {
      setUpdatingVehicle(false)
    }
  }

  const handleDeleteVehicle = async (vehicle) => {
    if (getVehicleAssignment(vehicle.id)) {
      setError('Assigned trucks cannot be deleted. Complete or remove the assignment first.')
      return
    }

    if (!window.confirm(`Are you sure you want to delete ${vehicle.id}?`)) return

    setUpdatingVehicle(true)
    try {
      await apiFetch(`/api/admin/vehicles/${vehicle.id}`, {
        method: 'DELETE',
      })

      setVehicles((current) => current.filter((item) => item.id !== vehicle.id))
      if (editingVehicle === vehicle.id) resetVehicleForm()
    } catch (err) {
      console.error('Error deleting vehicle:', err)
      setError(`Failed to delete vehicle: ${err.message}`)
    } finally {
      setUpdatingVehicle(false)
    }
  }

  const handleComplaintStatusUpdate = async (complaintId, newComplaintStatus) => {
    const complaint = complaints.find((c) => c.id === complaintId)
    if (!complaint || !canChangeComplaintStatus(complaint.status, newComplaintStatus)) {
      setError('Complaint status can only move forward: open -> acknowledged -> in progress -> resolved -> closed. Closed complaints cannot be changed.')
      return
    }

    try {
      await apiFetch(`/api/admin/waste-complaints/${complaintId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newComplaintStatus }),
      })

      // Update local state
      setComplaints(complaints.map((c) => 
        c.id === complaintId ? { ...c, status: newComplaintStatus } : c
      ))

      console.log(`[Complaint] Updated ${complaintId} to ${newComplaintStatus}`)
    } catch (err) {
      console.error('Error updating complaint status:', err)
      setError(`Failed to update complaint: ${err.message}`)
    }
  }

  const getComplaintStatusColor = (status) => {
    const colors = {
      open: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      acknowledged: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
    }
    return colors[status] || colors.open
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    }
    return colors[priority] || colors.medium
  }

  const getDayColor = (_day) => {
    return ''
  }

  const handleEditPoint = (point) => {
    setEditingPoint(point.id)
    setEditPointData({
      name: point.name,
      location_name: point.address || '',
      latitude: point.latitude ?? '',
      longitude: point.longitude ?? '',
      district: point.district || 'Vadodara',
      ward: point.ward || '',
      waste_type: point.type === 'recycling' ? 'recyclable' : point.type === 'composting' ? 'organic' : 'general',
      status: point.status || 'operational',
      capacity: point.capacity || 100,
      fill_level: point.fill_level || 0,
      hours: point.hours || '8:00 AM - 6:00 PM',
    })
  }

  const handleSavePoint = async () => {
    if (!editingPoint) return

    if (!isWithinVadodaraServiceArea(editPointData.latitude, editPointData.longitude)) {
      setError('Disposal point coordinates must be within the Vadodara service area.')
      return
    }

    setUpdatingPoint(true)
    try {
      const response = await apiFetch(`/api/admin/waste-points/${editingPoint}`, {
        method: 'PUT',
        body: JSON.stringify(editPointData),
      })

      if (response.error) {
        setError(`Failed to update disposal point: ${response.error}`)
      } else {
        // Update local state
        setWastePoints(wastePoints.map((p) =>
          p.id === editingPoint
            ? {
                ...p,
                name: editPointData.name,
                address: editPointData.location_name,
                latitude: Number(editPointData.latitude),
                longitude: Number(editPointData.longitude),
                district: editPointData.district,
                ward: editPointData.ward,
                type: editPointData.waste_type === 'recyclable' ? 'recycling' : editPointData.waste_type === 'organic' ? 'composting' : 'landfill',
                status: editPointData.status,
                capacity: Number(editPointData.capacity),
                fill_level: Number(editPointData.fill_level),
                hours: editPointData.hours,
              }
            : p
        ))

        setEditingPoint(null)
        console.log(`[Waste Point] Updated ${editingPoint}`)
      }
    } catch (err) {
      console.error('Error updating waste point:', err)
      setError(`Failed to update disposal point: ${err.message}`)
    } finally {
      setUpdatingPoint(false)
    }
  }

  const handleDeletePoint = async (pointId) => {
    if (!window.confirm('Are you sure you want to delete this waste point?')) return

    try {
      await apiFetch(`/api/admin/waste-points/${pointId}`, {
        method: 'DELETE',
      })

      // Remove from local state
      setWastePoints(wastePoints.filter((p) => p.id !== pointId))
      console.log(`[Waste Point] Deleted ${pointId}`)
    } catch (err) {
      console.error('Error deleting waste point:', err)
      setError(`Failed to delete waste point: ${err.message}`)
    }
  }

  const handleAssignTruck = async (pointId, vehicleId) => {
    try {
      const updatedPoint = await apiFetch(`/api/admin/waste-points/${pointId}`, {
        method: 'PUT',
        body: JSON.stringify({ assigned_vehicle_id: vehicleId }),
      })

      setWastePoints(wastePoints.map((point) =>
        point.id === pointId ? normalizeDisposalPoint(updatedPoint, 0) : point
      ))
    } catch (err) {
      console.error('Error assigning truck:', err)
      setError(`Failed to assign truck: ${err.message}`)
    }
  }

  const getAssignedVehicle = (job) => {
    if (!job.assigned_vehicle_id) return null
    return vehicles.find((vehicle) => vehicle.id === job.assigned_vehicle_id)
  }

  const getVehicleAssignment = (vehicleId) => {
    const point = wastePoints.find((item) => item.assigned_vehicle_id === vehicleId)
    if (point) return { type: 'Disposal point', name: point.name, job: point }

    const schedule = schedules.find((item) => item.assigned_vehicle_id === vehicleId && item.collection_status !== 'collected')
    if (schedule) return { type: 'Schedule', name: schedule.location_name, job: schedule }

    return null
  }

  const getAvailableActiveVehicles = () => vehicles.filter((vehicle) =>
    vehicle.status === 'active' &&
    vehicle.lat &&
    vehicle.lng &&
    !getVehicleAssignment(vehicle.id)
  )

  const getAssignableVehicles = (currentVehicleId) => vehicles.filter((vehicle) =>
    vehicle.status === 'active' &&
    (!getVehicleAssignment(vehicle.id) || vehicle.id === currentVehicleId)
  )

  const isWithinVadodaraServiceArea = (lat, lng) => {
    if (!lat || !lng) return false
    return getDistanceKm(VADODARA_LAT, VADODARA_LNG, Number(lat), Number(lng)) <= VADODARA_SERVICE_RADIUS_KM
  }

  const getNearestAvailableVehicle = (job) => {
    if (!isWithinVadodaraServiceArea(job.latitude, job.longitude)) return null

    return getAvailableActiveVehicles()
      .map((vehicle) => ({
        ...vehicle,
        distanceKm: getDistanceKm(vehicle.lat, vehicle.lng, job.latitude, job.longitude),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0] || null
  }

  const handleAutoAssignPoint = async (point) => {
    const vehicle = getNearestAvailableVehicle(point)
    if (!vehicle) {
      setError('No available active truck found near this Vadodara location.')
      return
    }

    await handleAssignTruck(point.id, vehicle.id)
  }

  const handleAssignScheduleTruck = async (scheduleId, vehicleId) => {
    try {
      const updatedSchedule = await apiFetch(`/api/admin/waste-schedules/${scheduleId}`, {
        method: 'PUT',
        body: JSON.stringify({
          assigned_vehicle_id: vehicleId,
          collection_status: vehicleId ? 'assigned' : 'scheduled',
        }),
      })

      setSchedules(schedules.map((schedule) =>
        schedule.id === scheduleId
          ? normalizeSchedule(updatedSchedule, 0)
          : schedule
      ))
    } catch (err) {
      console.error('Error assigning schedule truck:', err)
      setError(`Failed to assign truck to schedule: ${err.message}`)
    }
  }

  const handleAutoAssignSchedule = async (schedule) => {
    const vehicle = getNearestAvailableVehicle(schedule)
    if (!vehicle) {
      setError('No available active truck found near this Vadodara schedule location.')
      return
    }

    await handleAssignScheduleTruck(schedule.id, vehicle.id)
  }

  const handleOpenTruckRoute = (point) => {
    const assignedVehicle = getAssignedVehicle(point)

    if (!assignedVehicle) {
      alert('Assign a truck before opening directions.')
      return
    }

    if (!assignedVehicle.lat || !assignedVehicle.lng || !point.latitude || !point.longitude) {
      alert('Truck or disposal point coordinates are missing.')
      return
    }

    const origin = getRouteQuery(assignedVehicle.address || assignedVehicle.area || assignedVehicle.name, assignedVehicle.lat, assignedVehicle.lng)
    const destination = getRouteQuery(point.address || point.name || point.location_name || 'Disposal Point', point.latitude, point.longitude)
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`,
      '_blank'
    )
  }

  const handleOpenScheduleRoute = (schedule) => {
    const assignedVehicle = getAssignedVehicle(schedule)

    if (!assignedVehicle) {
      alert('Assign a truck before opening directions.')
      return
    }

    if (!assignedVehicle.lat || !assignedVehicle.lng || !schedule.latitude || !schedule.longitude) {
      alert('Truck or schedule coordinates are missing.')
      return
    }

    const origin = getRouteQuery(assignedVehicle.address || assignedVehicle.area || assignedVehicle.name, assignedVehicle.lat, assignedVehicle.lng)
    const destination = getRouteQuery(schedule.location_name || 'Collection Schedule', schedule.latitude, schedule.longitude)
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`,
      '_blank'
    )
  }

  const handleOpenVehicleAssignedRoute = (vehicle) => {
    const assignment = getVehicleAssignment(vehicle.id)
    if (!assignment) return

    if (assignment.type === 'Schedule') {
      handleOpenScheduleRoute(assignment.job)
    } else {
      handleOpenTruckRoute(assignment.job)
    }
  }

  const handlePointCollected = async (point) => {
    try {
      await apiFetch(`/api/admin/waste-points/${point.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          assigned_vehicle_id: '',
          status: 'operational',
          fill_level: 0,
          last_collected_at: new Date().toISOString(),
        }),
      })

      setWastePoints(wastePoints.map((item) =>
        item.id === point.id
          ? { ...item, assigned_vehicle_id: '', status: 'operational', fill_level: 0, last_collected_at: new Date().toISOString() }
          : item
      ))
    } catch (err) {
      console.error('Error completing disposal point collection:', err)
      setError(`Failed to complete collection: ${err.message}`)
    }
  }

  const handleScheduleCollected = async (schedule) => {
    try {
      await apiFetch(`/api/admin/waste-schedules/${schedule.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          assigned_vehicle_id: '',
          collection_status: 'collected',
          last_collected_at: new Date().toISOString(),
        }),
      })

      setSchedules(schedules.map((item) =>
        item.id === schedule.id
          ? { ...item, assigned_vehicle_id: '', collection_status: 'collected', last_collected_at: new Date().toISOString() }
          : item
      ))
    } catch (err) {
      console.error('Error completing scheduled collection:', err)
      setError(`Failed to complete scheduled collection: ${err.message}`)
    }
  }

  const handleAddPoint = async () => {
    if (!editPointData.name || !editPointData.location_name || !editPointData.latitude || !editPointData.longitude || !editPointData.waste_type) {
      setError('Please fill in all required fields')
      return
    }

    if (!isWithinVadodaraServiceArea(editPointData.latitude, editPointData.longitude)) {
      setError('Disposal point coordinates must be within the Vadodara service area.')
      return
    }

    setUpdatingPoint(true)
    try {
      const response = await apiFetch('/api/admin/waste-points', {
        method: 'POST',
        body: JSON.stringify(editPointData),
      })

      if (response.error) {
        setError(`Failed to create disposal point: ${response.error}`)
      } else {
        // Add to local state
        setWastePoints([
          ...wastePoints,
          normalizeDisposalPoint({
            id: response.id,
            name: editPointData.name,
            address: editPointData.location_name,
            latitude: Number(editPointData.latitude),
            longitude: Number(editPointData.longitude),
            district: editPointData.district,
            ward: editPointData.ward,
            type: editPointData.waste_type === 'recyclable' ? 'recycling' : editPointData.waste_type === 'organic' ? 'composting' : 'landfill',
            status: editPointData.status,
            capacity: Number(editPointData.capacity),
            fill_level: Number(editPointData.fill_level),
            hours: editPointData.hours,
          }, wastePoints.length),
        ])

        // Reset form
        setEditPointData(emptyPointForm)
        setShowAddPoint(false)
        console.log(`[Waste Point] Created new disposal point: ${response.id}`)
      }
    } catch (err) {
      console.error('Error creating waste point:', err)
      setError(`Failed to create disposal point: ${err.message}`)
    } finally {
      setUpdatingPoint(false)
    }
  }

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule.id)
    setEditScheduleData({
      location_name: schedule.location_name,
      district: schedule.district || 'Vadodara',
      latitude: schedule.latitude ?? '',
      longitude: schedule.longitude ?? '',
      collection_day: schedule.collection_day,
      collection_time: schedule.collection_time,
      waste_type: schedule.waste_type,
    })
  }

  const handleSaveSchedule = async () => {
    if (!editingSchedule) return

    if (editScheduleData.latitude && editScheduleData.longitude && !isWithinVadodaraServiceArea(editScheduleData.latitude, editScheduleData.longitude)) {
      setError('Schedule coordinates must be within the Vadodara service area.')
      return
    }

    setUpdatingSchedule(true)
    try {
      const response = await apiFetch(`/api/admin/waste-schedules/${editingSchedule}`, {
        method: 'PUT',
        body: JSON.stringify(editScheduleData),
      })

      if (response.error) {
        setError(`Failed to update schedule: ${response.error}`)
      } else {
        // Update local state
        setSchedules(schedules.map((s) =>
          s.id === editingSchedule
            ? {
                ...s,
                ...editScheduleData,
              }
            : s
        ))

        setEditingSchedule(null)
        console.log(`[Waste Schedule] Updated ${editingSchedule}`)
      }
    } catch (err) {
      console.error('Error updating waste schedule:', err)
      setError(`Failed to update schedule: ${err.message}`)
    } finally {
      setUpdatingSchedule(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this collection schedule?')) return

    try {
      await apiFetch(`/api/admin/waste-schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      // Remove from local state
      setSchedules(schedules.filter((s) => s.id !== scheduleId))
      console.log(`[Waste Schedule] Deleted ${scheduleId}`)
    } catch (err) {
      console.error('Error deleting waste schedule:', err)
      setError(`Failed to delete schedule: ${err.message}`)
    }
  }

  const handleAddSchedule = async () => {
    if (!editScheduleData.location_name || !editScheduleData.collection_day || !editScheduleData.collection_time) {
      setError('Please fill in all required fields')
      return
    }

    if (editScheduleData.latitude && editScheduleData.longitude && !isWithinVadodaraServiceArea(editScheduleData.latitude, editScheduleData.longitude)) {
      setError('Schedule coordinates must be within the Vadodara service area.')
      return
    }

    setUpdatingSchedule(true)
    try {
      const response = await apiFetch('/api/admin/waste-schedules', {
        method: 'POST',
        body: JSON.stringify(editScheduleData),
      })

      if (response.error) {
        setError(`Failed to create schedule: ${response.error}`)
      } else {
        // Add to local state
        setSchedules([
          ...schedules,
          normalizeSchedule({
            id: response.id,
            ...editScheduleData,
          }, schedules.length),
        ])

        // Reset form
        setEditScheduleData(emptyScheduleForm)
        setShowAddSchedule(false)
        console.log(`[Waste Schedule] Created new schedule: ${response.id}`)
      }
    } catch (err) {
      console.error('Error creating waste schedule:', err)
      setError(`Failed to create schedule: ${err.message}`)
    } finally {
      setUpdatingSchedule(false)
    }
  }

  const vehiclesByStatus = {
    active: vehicles.filter((v) => v.status === 'active'),
    maintenance: vehicles.filter((v) => v.status === 'maintenance'),
    inactive: vehicles.filter((v) => v.status === 'inactive'),
  }

  // Get urgent collections (waste points that are full)
  const urgentCollections = wastePoints.filter((p) => p.status === 'full').slice(0, 3)
  const highPriorityComplaints = complaints.filter((c) =>
    (c.priority === 'urgent' || c.priority === 'high') &&
    !['resolved', 'closed'].includes(c.status)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Waste Management & Fleet Control</h1>
        <p className="text-sm text-muted-foreground mt-2">Real-time vehicle tracking and waste collection monitoring</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Two Column Layout: Sidebar + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Urgent Collections & High Priority Complaints */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            Urgent Collections & High Priority Complaints ({urgentCollections.length + highPriorityComplaints.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                {/* Waste Points - Full Status */}
                {urgentCollections.length > 0 && (
                  <>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Full Waste Points</div>
                    {urgentCollections.map((point, i) => (
                      <div key={`point-${i}`} className="flex items-start gap-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-900">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-red-900 dark:text-red-200">{point.name || 'Waste Point'}</p>
                          <p className="text-xs text-red-700 dark:text-red-300">Full • {point.type || 'general'}</p>
                          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 mt-2">
                            <select
                              value={point.assigned_vehicle_id || ''}
                              onChange={(e) => handleAssignTruck(point.id, e.target.value)}
                              className="px-2 py-1 border border-red-200 rounded-md bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Assign truck</option>
                              {getAssignableVehicles(point.assigned_vehicle_id).map((vehicle) => (
                                <option key={vehicle.id} value={vehicle.id}>
                                  {vehicle.id} - {vehicle.status}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs bg-background"
                              onClick={() => handleOpenTruckRoute(point)}
                              disabled={!point.assigned_vehicle_id}
                            >
                              Open Route
                            </Button>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              className="h-8 text-xs flex-1"
                              onClick={() => handleAutoAssignPoint(point)}
                              disabled={!!point.assigned_vehicle_id}
                            >
                              Auto Assign Nearest
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs flex-1 bg-background"
                              onClick={() => handlePointCollected(point)}
                              disabled={!point.assigned_vehicle_id}
                            >
                              Mark Collected
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* High Priority Complaints */}
                {highPriorityComplaints.length > 0 && (
                  <>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">High Priority Complaints</div>
                    {highPriorityComplaints.map((complaint) => (
                        <div
                          key={complaint.id}
                          className={`flex items-start gap-3 p-2 rounded-md border ${
                            complaint.priority === 'urgent'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900'
                              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900'
                          }`}
                        >
                          <AlertTriangle className={`w-4 h-4 mt-1 shrink-0 ${complaint.priority === 'urgent' ? 'text-red-600' : 'text-orange-600'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${complaint.priority === 'urgent' ? 'text-red-900 dark:text-red-200' : 'text-orange-900 dark:text-orange-200'}`}>
                              {complaint.title}
                            </p>
                            <p className={`text-xs truncate ${complaint.priority === 'urgent' ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'}`}>
                              From: {complaint.citizen_name} • {complaint.complaint_type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      ))}
                  </>
                )}

                {urgentCollections.length === 0 && highPriorityComplaints.length === 0 && (
                  <p className="text-sm text-muted-foreground">No urgent items at this time</p>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Right: Complaints Status */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Complaints Status Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded border border-red-200 dark:border-red-800">
              <span className="text-xs font-medium text-muted-foreground">Open</span>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {complaints.filter((c) => c.status === 'open').length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded border border-yellow-200 dark:border-yellow-800">
              <span className="text-xs font-medium text-muted-foreground">Acknowledged</span>
              <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {complaints.filter((c) => c.status === 'acknowledged').length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded border border-blue-200 dark:border-blue-800">
              <span className="text-xs font-medium text-muted-foreground">In Progress</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {complaints.filter((c) => c.status === 'in_progress').length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded border border-green-200 dark:border-green-800">
              <span className="text-xs font-medium text-muted-foreground">Resolved</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {complaints.filter((c) => c.status === 'resolved').length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/10 rounded border border-gray-200 dark:border-gray-800">
              <span className="text-xs font-medium text-muted-foreground">Closed</span>
              <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {complaints.filter((c) => c.status === 'closed').length}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Fleet Vehicles - Full Width */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Fleet Vehicles ({vehicles.length})
          </h3>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={handleStartAddVehicle}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

        {(showAddVehicle || editingVehicle) && (
          <div className="p-4 mb-4 rounded-lg border border-dashed bg-muted/50">
            <h4 className="font-semibold text-sm mb-3">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Vehicle ID (e.g., TRUCK-10)"
                value={vehicleFormData.id}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, id: e.target.value.toUpperCase() })}
                disabled={!!editingVehicle}
                className="bg-background"
              />
              <Input
                placeholder="Vehicle Name"
                value={vehicleFormData.name}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, name: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Input
                type="number"
                step="any"
                placeholder="Latitude"
                value={vehicleFormData.lat}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, lat: e.target.value })}
                className="bg-background"
              />
              <Input
                type="number"
                step="any"
                placeholder="Longitude"
                value={vehicleFormData.lng}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, lng: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Input
                placeholder="Area / Landmark"
                value={vehicleFormData.area}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, area: e.target.value })}
                className="bg-background"
              />
              <Input
                placeholder="Address"
                value={vehicleFormData.address}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, address: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <select
                value={vehicleFormData.status}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, status: e.target.value })}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Load %"
                value={vehicleFormData.load}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, load: e.target.value })}
                className="bg-background"
              />
              <Input
                placeholder="Driver Name"
                value={vehicleFormData.driver_name}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, driver_name: e.target.value })}
                className="bg-background"
              />
            </div>
            <Input
              placeholder="Assigned Route Label"
              value={vehicleFormData.assigned_route}
              onChange={(e) => setVehicleFormData({ ...vehicleFormData, assigned_route: e.target.value })}
              className="bg-background mt-3"
            />
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                className="flex-1"
                onClick={editingVehicle ? handleSaveVehicle : handleAddVehicle}
                disabled={updatingVehicle}
              >
                {updatingVehicle ? 'Saving...' : editingVehicle ? 'Save Vehicle' : 'Create Vehicle'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={resetVehicleForm}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vehicles available</p>
          ) : (
            vehicles.map((v) => {
              const assignment = getVehicleAssignment(v.id)
              return (
                <div
                  key={v.id}
                  className="p-3 rounded-md border border-border transition-colors hover:border-primary/50 hover:shadow-sm"
                >
                  <div
                    onClick={() => {
                      if (assignment) {
                        setError('This truck is assigned. Complete or remove its assignment before changing its status.')
                        return
                      }
                      setSelectedVehicle(v)
                      setNewStatus(v.status)
                    }}
                    className={`flex items-start justify-between gap-2 ${assignment ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Truck className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-primary">{v.id}</p>
                        <p className="text-xs text-muted-foreground break-words">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.address || getNearestAreaLabel(v.lat, v.lng)}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.lat}, {v.lng}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Load: {v.load ?? 0}%{v.driver_name ? ` - Driver: ${v.driver_name}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        className={`text-xs ${
                          v.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : v.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                        }`}
                      >
                        {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditVehicle(v)
                          }}
                          disabled={!!assignment}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteVehicle(v)
                          }}
                          disabled={!!assignment || updatingVehicle}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Assigned: {assignment ? `${assignment.type} - ${assignment.name}` : 'Free'}
                    </p>
                    {assignment && (
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        Status locked while assigned
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => handleOpenVehicleAssignedRoute(v)}
                      disabled={!assignment}
                    >
                      Open Assigned Route
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Citizen Complaints & Requests - Full Width */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4" />
          <h3 className="font-semibold">Citizen Complaints ({complaints.length})</h3>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading complaints...</p>
        ) : complaints.length === 0 ? (
          <p className="text-sm text-muted-foreground">No complaints at this time</p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setExpandedComplaint(expandedComplaint === complaint.id ? null : complaint.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-sm">{complaint.title}</h4>
                      <Badge className={`text-xs ${getComplaintStatusColor(complaint.status)}`}>
                        {complaint.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <span className="font-medium">From:</span> {complaint.citizen_name} • {complaint.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Type:</span> {complaint.complaint_type.replace('_', ' ')}
                    </p>
                    {complaint.location_name && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Location:</span> {complaint.location_name}
                        {complaint.district && ` • ${complaint.district}`}
                      </p>
                    )}
                    {complaint.phone && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Phone:</span> {complaint.phone}
                      </p>
                    )}

                    {expandedComplaint === complaint.id && (
                      <div className="mt-3 pt-3 border-t border-border space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Description:</p>
                          <p className="text-sm text-muted-foreground">{complaint.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {COMPLAINT_STATUSES.map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant={complaint.status === status ? 'default' : 'outline'}
                              className="text-xs"
                              disabled={!canChangeComplaintStatus(complaint.status, status)}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleComplaintStatusUpdate(complaint.id, status)
                              }}
                            >
                              {status.replace('_', ' ')}
                            </Button>
                          ))}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(complaint.createdAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Disposal Points Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5" />
            Disposal Points Management ({wastePoints.length})
          </h2>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowAddPoint(!showAddPoint)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Point
          </Button>
        </div>

        {/* Add New Point Form */}
        {showAddPoint && (
          <Card className="p-4 bg-muted/50 border-dashed">
            <h4 className="font-semibold text-sm mb-3">Add New Disposal Point</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Point Name (e.g., Central Recycling Center)"
                value={editPointData.name}
                onChange={(e) => setEditPointData({ ...editPointData, name: e.target.value })}
                className="bg-background"
              />
              <Input
                placeholder="Location/Address"
                value={editPointData.location_name}
                onChange={(e) => setEditPointData({ ...editPointData, location_name: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Input
                type="number"
                step="any"
                placeholder="Latitude (e.g., 22.3072)"
                value={editPointData.latitude}
                onChange={(e) => setEditPointData({ ...editPointData, latitude: e.target.value })}
                className="bg-background"
              />
              <Input
                type="number"
                step="any"
                placeholder="Longitude (e.g., 73.1812)"
                value={editPointData.longitude}
                onChange={(e) => setEditPointData({ ...editPointData, longitude: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <Input
                placeholder="District"
                value={editPointData.district}
                onChange={(e) => setEditPointData({ ...editPointData, district: e.target.value })}
                className="bg-background"
              />
              <Input
                placeholder="Ward"
                value={editPointData.ward}
                onChange={(e) => setEditPointData({ ...editPointData, ward: e.target.value })}
                className="bg-background"
              />
              <Input
                placeholder="Hours"
                value={editPointData.hours}
                onChange={(e) => setEditPointData({ ...editPointData, hours: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <select
                value={editPointData.waste_type}
                onChange={(e) => setEditPointData({ ...editPointData, waste_type: e.target.value })}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="recyclable">Recycling</option>
                <option value="organic">Composting</option>
                <option value="general">General Landfill</option>
              </select>
              <select
                value={editPointData.status}
                onChange={(e) => setEditPointData({ ...editPointData, status: e.target.value })}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="full">Full</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Input
                type="number"
                min="1"
                placeholder="Capacity"
                value={editPointData.capacity}
                onChange={(e) => setEditPointData({ ...editPointData, capacity: e.target.value })}
                className="bg-background"
              />
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Fill Level %"
                value={editPointData.fill_level}
                onChange={(e) => setEditPointData({ ...editPointData, fill_level: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleAddPoint}
                disabled={updatingPoint}
              >
                {updatingPoint ? 'Creating...' : 'Create Point'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddPoint(false)
                  setEditPointData(emptyPointForm)
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Disposal Points Grid */}
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Loading disposal points...
          </Card>
        ) : wastePoints.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No disposal points available</p>
          </Card>
        ) : editingPoint ? (
          <Card className="p-4 border-2 border-primary">
            <h4 className="font-semibold text-sm mb-3">Edit Disposal Point</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Point Name"
                value={editPointData.name}
                onChange={(e) => setEditPointData({ ...editPointData, name: e.target.value })}
                className="bg-background"
              />
              <Input
                placeholder="Location/Address"
                value={editPointData.location_name}
                onChange={(e) => setEditPointData({ ...editPointData, location_name: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Input
                type="number"
                step="any"
                placeholder="Latitude"
                value={editPointData.latitude}
                onChange={(e) => setEditPointData({ ...editPointData, latitude: e.target.value })}
                className="bg-background"
              />
              <Input
                type="number"
                step="any"
                placeholder="Longitude"
                value={editPointData.longitude}
                onChange={(e) => setEditPointData({ ...editPointData, longitude: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <Input
                placeholder="District"
                value={editPointData.district}
                onChange={(e) => setEditPointData({ ...editPointData, district: e.target.value })}
                className="bg-background"
              />
              <Input
                placeholder="Ward"
                value={editPointData.ward}
                onChange={(e) => setEditPointData({ ...editPointData, ward: e.target.value })}
                className="bg-background"
              />
              <Input
                placeholder="Hours"
                value={editPointData.hours}
                onChange={(e) => setEditPointData({ ...editPointData, hours: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <select
                value={editPointData.waste_type}
                onChange={(e) => setEditPointData({ ...editPointData, waste_type: e.target.value })}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="recyclable">Recycling</option>
                <option value="organic">Composting</option>
                <option value="general">General Landfill</option>
              </select>
              <select
                value={editPointData.status}
                onChange={(e) => setEditPointData({ ...editPointData, status: e.target.value })}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="full">Full</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Input
                type="number"
                min="1"
                placeholder="Capacity"
                value={editPointData.capacity}
                onChange={(e) => setEditPointData({ ...editPointData, capacity: e.target.value })}
                className="bg-background"
              />
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Fill Level %"
                value={editPointData.fill_level}
                onChange={(e) => setEditPointData({ ...editPointData, fill_level: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                className="flex-1"
                onClick={handleSavePoint}
                disabled={updatingPoint}
              >
                {updatingPoint ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setEditingPoint(null)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {wastePoints.map((point) => (
              <Card key={point.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold flex-1">{point.name}</h3>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPoint(point)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePoint(point.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{point.address}</p>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Type: </span>
                    {point.type.charAt(0).toUpperCase() + point.type.slice(1)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Status: </span>
                    {point.status.charAt(0).toUpperCase() + point.status.slice(1)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Hours: </span>
                    {point.hours}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Fill: </span>
                    {point.fill_level || 0}% of {point.capacity || 100}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Coordinates: </span>
                    {point.latitude}, {point.longitude}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Assigned Truck: </span>
                    {getAssignedVehicle(point)?.id || 'None'}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-3">
                  <select
                    value={point.assigned_vehicle_id || ''}
                    onChange={(e) => handleAssignTruck(point.id, e.target.value)}
                    className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Assign truck</option>
                    {getAssignableVehicles(point.assigned_vehicle_id).map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.id} - {vehicle.name} ({vehicle.status})
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOpenTruckRoute(point)}
                    disabled={!point.assigned_vehicle_id}
                  >
                    Open Google Maps Route
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAutoAssignPoint(point)}
                      disabled={!!point.assigned_vehicle_id}
                    >
                      Auto Assign
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePointCollected(point)}
                      disabled={!point.assigned_vehicle_id}
                    >
                      Collected
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Badge className={
                    point.type === 'recycling'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                      : point.type === 'composting'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                  }>
                    {point.type}
                  </Badge>
                  <Badge className={
                    point.status === 'operational'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      : point.status === 'maintenance'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                  }>
                    {point.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Collection Schedules Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Collection Schedules Management ({schedules.length})
          </h2>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => {
              setShowAddSchedule(!showAddSchedule)
              setEditingSchedule(null)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </div>

        {/* Add New Schedule Form */}
        {showAddSchedule && (
          <Card className="p-4 bg-muted/50 border-dashed">
            <h4 className="font-semibold text-sm mb-3">Add New Collection Schedule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Location Name (e.g., Downtown District)"
                value={editScheduleData.location_name}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, location_name: e.target.value })}
                className="bg-background"
              />
              <Input
                placeholder="District"
                value={editScheduleData.district}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, district: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Input
                type="number"
                step="any"
                placeholder="Latitude (Vadodara only)"
                value={editScheduleData.latitude}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, latitude: e.target.value })}
                className="bg-background"
              />
              <Input
                type="number"
                step="any"
                placeholder="Longitude (Vadodara only)"
                value={editScheduleData.longitude}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, longitude: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <select
                value={editScheduleData.collection_day}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, collection_day: e.target.value })}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
                <option value="Daily">Daily</option>
              </select>
              <Input
                placeholder="Collection Time (e.g., 6:00 AM)"
                value={editScheduleData.collection_time}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, collection_time: e.target.value })}
                className="bg-background"
              />
              <select
                value={editScheduleData.waste_type}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, waste_type: e.target.value })}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="General Waste">General Waste</option>
                <option value="Recycling">Recycling</option>
                <option value="Compost">Compost</option>
                <option value="Commercial Waste">Commercial Waste</option>
                <option value="Hazardous Waste">Hazardous Waste</option>
              </select>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleAddSchedule}
                disabled={updatingSchedule}
              >
                {updatingSchedule ? 'Creating...' : 'Create Schedule'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddSchedule(false)
        setEditScheduleData(emptyScheduleForm)
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Collection Schedules Grid */}
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Loading schedules...
          </Card>
        ) : schedules.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No collection schedules available</p>
          </Card>
        ) : editingSchedule ? (
          <Card className="p-4 border-2 border-primary">
            <h4 className="font-semibold text-sm mb-3">Edit Collection Schedule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Location Name"
                value={editScheduleData.location_name}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, location_name: e.target.value })}
                className="bg-background"
              />
              <Input
                placeholder="District"
                value={editScheduleData.district}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, district: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Input
                type="number"
                step="any"
                placeholder="Latitude"
                value={editScheduleData.latitude}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, latitude: e.target.value })}
                className="bg-background"
              />
              <Input
                type="number"
                step="any"
                placeholder="Longitude"
                value={editScheduleData.longitude}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, longitude: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <select
                value={editScheduleData.collection_day}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, collection_day: e.target.value })}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
                <option value="Daily">Daily</option>
              </select>
              <Input
                placeholder="Collection Time"
                value={editScheduleData.collection_time}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, collection_time: e.target.value })}
                className="bg-background"
              />
              <select
                value={editScheduleData.waste_type}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, waste_type: e.target.value })}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="General Waste">General Waste</option>
                <option value="Recycling">Recycling</option>
                <option value="Compost">Compost</option>
                <option value="Commercial Waste">Commercial Waste</option>
                <option value="Hazardous Waste">Hazardous Waste</option>
              </select>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                className="flex-1"
                onClick={handleSaveSchedule}
                disabled={updatingSchedule}
              >
                {updatingSchedule ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setEditingSchedule(null)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className={`p-4 hover:shadow-lg transition-shadow ${getDayColor(schedule.collection_day)}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold flex-1">{schedule.location_name}</h3>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSchedule(schedule)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">District: {schedule.district}</p>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Type: </span>
                    {schedule.waste_type}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Day: </span>
                    {schedule.collection_day}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Time: </span>
                    {schedule.collection_time}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Status: </span>
                    {schedule.collection_status || 'scheduled'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Assigned Truck: </span>
                    {getAssignedVehicle(schedule)?.id || 'None'}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-3">
                  <select
                    value={schedule.assigned_vehicle_id || ''}
                    onChange={(e) => handleAssignScheduleTruck(schedule.id, e.target.value)}
                    className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Assign truck</option>
                    {getAssignableVehicles(schedule.assigned_vehicle_id).map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.id} - {vehicle.name} ({vehicle.status})
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOpenScheduleRoute(schedule)}
                    disabled={!schedule.assigned_vehicle_id}
                  >
                    Open Google Maps Route
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAutoAssignSchedule(schedule)}
                      disabled={!!schedule.assigned_vehicle_id || !schedule.latitude || !schedule.longitude}
                    >
                      Auto Assign
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleScheduleCollected(schedule)}
                      disabled={!schedule.assigned_vehicle_id}
                    >
                      Collected
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Map Section - Full Width with Reduced Height */}
      <Card className="p-4 overflow-hidden relative">
        <h2 className="text-lg font-semibold text-primary mb-4">Live Map</h2>
        <div
          ref={mapContainer}
          className="w-full h-96 rounded-lg border border-border"
          style={{ zIndex: 1 }}
        />
          
        {/* Active Fleet Status Card */}
        <div className="absolute top-6 right-6 bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-green-200 dark:border-green-800 z-10 w-64 hidden lg:block">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 flex items-center gap-2">
              <span className="text-lg">🚛</span>
              Active Fleet
            </h4>
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading...</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{vehiclesByStatus.active.length}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{vehiclesByStatus.maintenance.length}</p>
                    <p className="text-xs text-muted-foreground">Maint.</p>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{vehiclesByStatus.inactive.length}</p>
                    <p className="text-xs text-muted-foreground">Inactive</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center pt-1">
                  ✓ {wastePoints.length} points mapped
                </p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Live Update Indicator */}
      <div className="text-center text-xs text-muted-foreground">
        🔄 Vehicle data refreshes every 5 seconds • Live API simulation
      </div>

      {/* Status Change Dialog */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Change Vehicle Status</h2>
                <button
                  onClick={() => {
                    setSelectedVehicle(null)
                    setNewStatus(null)
                  }}
                  className="p-1 hover:bg-accent rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Update status for <span className="font-semibold text-primary">{selectedVehicle.id}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedVehicle.name}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-primary">New Status</label>
                <div className="grid gap-2">
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => setNewStatus(status)}
                      disabled={!!getVehicleAssignment(selectedVehicle.id)}
                      className={`p-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                        newStatus === status
                          ? `border-${status === 'active' ? 'green' : status === 'maintenance' ? 'yellow' : 'red'}-500 bg-${status === 'active' ? 'green' : status === 'maintenance' ? 'yellow' : 'red'}-50 dark:bg-${status === 'active' ? 'green' : status === 'maintenance' ? 'yellow' : 'red'}-900/20`
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {status === 'active' ? '🟢' : status === 'maintenance' ? '🟡' : '🔴'}
                        </span>
                        <span className="capitalize">{status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setSelectedVehicle(null)
                    setNewStatus(null)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={newStatus === selectedVehicle.status || updatingVehicle || !!getVehicleAssignment(selectedVehicle.id)}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {updatingVehicle ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
