import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export default function WasteManagementPage() {
  const [wastePoints, setWastePoints] = useState([])
  const [schedules, setSchedules] = useState([])
  const [userComplaints, setUserComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    complaint_type: 'overflowing_bin',
    location_name: '',
    district: '',
    phone: '',
    priority: 'medium',
  })
  const [submittingComplaint, setSubmittingComplaint] = useState(false)
  const [complaintMessage, setComplaintMessage] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pointsRes, schedulesRes, complaintsRes] = await Promise.all([
          apiFetch('/api/waste/points'),
          apiFetch('/api/waste/schedules'),
          apiFetch('/api/waste/complaints/my-complaints'),
        ])

        setWastePoints(pointsRes || [])
        setSchedules(schedulesRes || [])
        setUserComplaints(complaintsRes || [])
      } catch (error) {
        console.error('Error fetching waste data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const typeEmojis = {
    recycling: '♻️',
    composting: '🌱',
    landfill: '🚚',
  }

  const typeColors = {
    recycling: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    composting: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    landfill: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
  }

  const getDayColor = (day) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    return day === today ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''
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

  const handleComplaintSubmit = async (e) => {
    e.preventDefault()
    setSubmittingComplaint(true)
    setComplaintMessage(null)

    try {
      const response = await apiFetch('/api/waste/complaints', {
        method: 'POST',
        body: JSON.stringify(complaintForm),
      })

      if (response.error) {
        setComplaintMessage({ type: 'error', text: response.error })
      } else {
        setComplaintMessage({ type: 'success', text: response.message || 'Complaint submitted successfully!' })
        setComplaintForm({
          title: '',
          description: '',
          complaint_type: 'overflowing_bin',
          location_name: '',
          district: '',
          phone: '',
          priority: 'medium',
        })
        setTimeout(() => setComplaintMessage(null), 5000)
      }
    } catch (error) {
      console.error('Error submitting complaint:', error)
      setComplaintMessage({ type: 'error', text: 'Failed to submit complaint. Please try again.' })
    } finally {
      setSubmittingComplaint(false)
    }
  }

  const handleGetDirections = (lat, lng) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
    } else {
      alert("Location coordinates not available.")
    }
  }



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Waste Management</h1>
        <p className="text-muted-foreground">
          Find waste collection points and check schedules for your area.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Collection Schedule</h2>
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Loading schedules...
          </Card>
        ) : schedules.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No schedules available for your area.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id || schedule._id} className={`p-4 ${getDayColor(schedule.collection_day)}`}>
                <h3 className="font-semibold mb-2">{schedule.location}</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Type: </span>
                    {schedule.type}
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

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Disposal Points</h2>
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Loading locations...
          </Card>
        ) : wastePoints.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No waste points available yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wastePoints.map((point) => (
              <Card key={point.id || point._id} className="p-4 hover:border-primary transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{typeEmojis[point.type]}</span>
                    <div>
                      <h3 className="font-semibold">{point.name}</h3>
                      <p className="text-sm text-muted-foreground">{point.address}</p>
                    </div>
                  </div>
                  <Badge className={typeColors[point.type]}>
                    {point.type.charAt(0).toUpperCase() + point.type.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Hours: {point.hours}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent hover:bg-blue-500/80"
                  onClick={() => handleGetDirections(point.latitude, point.longitude)}
                >
                  Get Directions
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Report Waste Issue or Request Collection */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Report an Issue or Request Collection</h3>
        </div>

        {complaintMessage && (
          <div className={`mb-4 p-3 rounded-lg ${complaintMessage.type === 'success'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}>
            {complaintMessage.text}
          </div>
        )}

        <form onSubmit={handleComplaintSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">
                What's the issue? *
              </label>
              <select
                value={complaintForm.complaint_type}
                onChange={(e) => setComplaintForm({ ...complaintForm, complaint_type: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="overflowing_bin">Overflowing Bin</option>
                <option value="collection_request">Collection Request</option>
                <option value="damaged_facility">Damaged Facility</option>
                <option value="improper_disposal">Improper Disposal</option>
                <option value="other">Other Issue</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">
                Priority *
              </label>
              <select
                value={complaintForm.priority}
                onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">
              Title *
            </label>
            <Input
              type="text"
              placeholder="Brief title of your issue"
              value={complaintForm.title}
              onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
              className="bg-background"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">
              Description *
            </label>
            <Textarea
              placeholder="Describe the issue in detail..."
              value={complaintForm.description}
              onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
              className="bg-background min-h-24"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">
                Location
              </label>
              <Input
                type="text"
                placeholder="Nearest area or landmark"
                value={complaintForm.location_name}
                onChange={(e) => setComplaintForm({ ...complaintForm, location_name: e.target.value })}
                className="bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">
                District
              </label>
              <Input
                type="text"
                placeholder="Your district"
                value={complaintForm.district}
                onChange={(e) => setComplaintForm({ ...complaintForm, district: e.target.value })}
                className="bg-background"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">
              Phone Number (Optional)
            </label>
            <Input
              type="tel"
              placeholder="Your contact number"
              value={complaintForm.phone}
              onChange={(e) => setComplaintForm({ ...complaintForm, phone: e.target.value })}
              className="bg-background"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={submittingComplaint}
          >
            {submittingComplaint ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </Card>

      {/* Your Complaints History */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 text-lg">Your Complaint History</h3>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : userComplaints.length === 0 ? (
          <p className="text-sm text-muted-foreground">No complaints submitted yet</p>
        ) : (
          <div className="space-y-3">
            {userComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{complaint.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {complaint.complaint_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <Badge className={`text-xs ${getComplaintStatusColor(complaint.status)}`}>
                      {complaint.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={`text-xs ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-2">{complaint.description}</p>

                {complaint.location_name && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Location:</span> {complaint.location_name}
                    {complaint.district && ` • ${complaint.district}`}
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  Submitted: {new Date(complaint.createdAt).toLocaleDateString()} at {new Date(complaint.createdAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
        <h3 className="font-semibold mb-3 text-green-900 dark:text-green-100">Waste Management Tips</h3>
        <ul className="text-sm text-green-800 dark:text-green-200 space-y-2">
          <li>✓ Separate waste according to local guidelines</li>
          <li>✓ Check collection schedules regularly</li>
          <li>✓ Arrive at collection points early</li>
          <li>✓ Report overflowing or damaged bins</li>
          <li>✓ Participate in community cleanup events</li>
        </ul>
      </Card>
    </div>
  )
}
