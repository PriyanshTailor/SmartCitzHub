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
  const [expandedComplaint, setExpandedComplaint] = useState(null)
  const [editingPoint, setEditingPoint] = useState(null)
  const [editPointData, setEditPointData] = useState({
    name: '',
    location_name: '',
    waste_type: 'general',
    status: 'operational',
  })
  const [showAddPoint, setShowAddPoint] = useState(false)
  const [updatingPoint, setUpdatingPoint] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [editScheduleData, setEditScheduleData] = useState({
    location_name: '',
    district: 'Vadodara',
    collection_day: 'Monday',
    collection_time: '6:00 AM',
    waste_type: 'General Waste',
  })
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

        setVehicles(vehicleData || [])
        setWastePoints(wasteData || [])
        setComplaints(complaintsData || [])
        setSchedules(schedulesData || [])
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
            .bindPopup(`<b>${point.name || 'Waste Point'}</b><br>Type: ${point.type || 'general'}<br>Status: ${point.status || 'operational'}`)
            .addTo(map.current)
        }
      })

      // Add vehicles to map
      vehicles.forEach((v) => {
        const config = STATUS_CONFIG[v.status] || STATUS_CONFIG.inactive
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
              Load: ${v.load.toFixed(1)}%<br>
              Last Updated: ${new Date(v.lastUpdated).toLocaleTimeString()}
            </div>
          `)
          .addTo(map.current)
      })
      } catch (err) {
        console.error('[Map] Error updating markers:', err)
      }
    })
  }, [vehicles, wastePoints]) // Update markers when data changes

  // Handle vehicle status update
  const handleStatusUpdate = async () => {
    if (!selectedVehicle || !newStatus) return

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

  const handleComplaintStatusUpdate = async (complaintId, newComplaintStatus) => {
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

  const getDayColor = (day) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    return day === today ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''
  }

  const handleEditPoint = (point) => {
    setEditingPoint(point.id)
    setEditPointData({
      name: point.name,
      location_name: point.address || '',
      waste_type: point.type === 'recycling' ? 'recyclable' : point.type === 'composting' ? 'organic' : 'general',
      status: point.status || 'operational',
    })
  }

  const handleSavePoint = async () => {
    if (!editingPoint) return

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
                type: editPointData.waste_type === 'recyclable' ? 'recycling' : editPointData.waste_type === 'organic' ? 'composting' : 'landfill',
                status: editPointData.status,
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

  const handleAddPoint = async () => {
    if (!editPointData.name || !editPointData.location_name || !editPointData.waste_type) {
      setError('Please fill in all required fields')
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
          {
            id: response.id,
            name: editPointData.name,
            address: editPointData.location_name,
            type: editPointData.waste_type === 'recyclable' ? 'recycling' : editPointData.waste_type === 'organic' ? 'composting' : 'landfill',
            status: editPointData.status,
            hours: '8:00 AM - 6:00 PM',
          },
        ])

        // Reset form
        setEditPointData({
          name: '',
          location_name: '',
          waste_type: 'general',
          status: 'operational',
        })
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
      collection_day: schedule.collection_day,
      collection_time: schedule.collection_time,
      waste_type: schedule.waste_type,
    })
  }

  const handleSaveSchedule = async () => {
    if (!editingSchedule) return

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
          {
            id: response.id,
            ...editScheduleData,
          },
        ])

        // Reset form
        setEditScheduleData({
          location_name: '',
          district: 'Vadodara',
          collection_day: 'Monday',
          collection_time: '6:00 AM',
          waste_type: 'General Waste',
        })
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
            Urgent Collections & High Priority Complaints ({urgentCollections.length + complaints.filter(c => c.priority === 'urgent' || c.priority === 'high').length})
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
                        <div>
                          <p className="text-sm font-medium text-red-900 dark:text-red-200">{point.name || 'Waste Point'}</p>
                          <p className="text-xs text-red-700 dark:text-red-300">Full • {point.type || 'general'}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* High Priority Complaints */}
                {complaints.filter(c => c.priority === 'urgent' || c.priority === 'high').length > 0 && (
                  <>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">High Priority Complaints</div>
                    {complaints
                      .filter(c => c.priority === 'urgent' || c.priority === 'high')
                      .map((complaint) => (
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

                {urgentCollections.length === 0 && complaints.filter(c => c.priority === 'urgent' || c.priority === 'high').length === 0 && (
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
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Fleet Vehicles ({vehicles.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vehicles available</p>
          ) : (
            vehicles.map((v) => (
              <div
                key={v.id}
                onClick={() => {
                  setSelectedVehicle(v)
                  setNewStatus(v.status)
                }}
                className="flex items-start justify-between gap-2 p-3 rounded-md border border-border cursor-pointer transition-colors hover:border-primary/50 hover:shadow-sm"
              >
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Truck className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-primary">{v.id}</p>
                    <p className="text-xs text-muted-foreground break-words">{v.name}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-semibold text-primary whitespace-nowrap">{v.load.toFixed(0)}%</span>
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
                </div>
              </div>
            ))
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
                          {['open', 'acknowledged', 'in_progress', 'resolved', 'closed'].map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant={complaint.status === status ? 'default' : 'outline'}
                              className="text-xs"
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
                  setEditPointData({
                    name: '',
                    location_name: '',
                    waste_type: 'general',
                    status: 'operational',
                  })
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
                  setEditScheduleData({
                    location_name: '',
                    district: 'Vadodara',
                    collection_day: 'Monday',
                    collection_time: '6:00 AM',
                    waste_type: 'General Waste',
                  })
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
                  disabled={newStatus === selectedVehicle.status || updatingVehicle}
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
