import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Users, CheckCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export default function InitiativeDetailsPage() {
  const { id } = useParams()
  const [initiative, setInitiative] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    const fetchInit = async () => {
      try {
        setLoading(true)
        // Direct fetch by ID (new Endpoint)
        // Fallback: If new endpoint isn't ready or returns specific error, we might fallback
        // But since we just added it, let's assume it works. 
        // Note: The previous code was fetching ALL and finding. That's inefficient.

        try {
          const data = await apiFetch(`/api/initiatives/${id}`)
          if (data && !data.error) {
            setInitiative(data)
          } else {
            throw new Error("Not found")
          }
        } catch (e) {
          // Fallback for safety or mock data if we were offline (not needed now)
          console.error("Direct fetch failed", e)
        }
      } catch (error) {
        console.error('Failed to load initiative', error)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchInit()
  }, [id])

  const handleJoin = async () => {
    try {
      const res = await apiFetch(`/api/initiatives/${id}/join`, { method: 'POST' })
      if (res.success) {
        setJoined(true)
        // Update local count
        setInitiative(prev => ({
          ...prev,
          participants_count: res.participants_count
        }))
      }
    } catch (err) {
      console.error("Failed to join", err)
      alert("Failed to join initiative")
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading initiative details...</div>
  if (!initiative) return <div className="p-8 text-center">Initiative not found</div>

  return (
    <div className="space-y-6">
      <Link to="/dashboard/initiatives" className="text-sm text-muted-foreground hover:text-primary">← Back to Initiatives</Link>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex gap-3 mb-2">
              <Badge variant="outline">{initiative.category?.toUpperCase()}</Badge>
              <Badge className={initiative.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {initiative.status}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold mb-4">{initiative.title}</h1>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(initiative.start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{initiative.location_name || 'TBD'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{initiative.participants_count + (joined ? 1 : 0)} Participants</span>
              </div>
            </div>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">About this Initiative</h3>
            <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{initiative.description}</p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Volunteer Duties</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Arrive 15 mins early</li>
                <li>Bring own water bottle</li>
                <li>Follow safety guidelines</li>
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Contact Organizer</h3>
              <Button variant="outline" className="w-full">Message Organizer</Button>
            </Card>
          </div>
        </div>

        <Card className="p-6 w-full md:w-80 space-y-4">
          <h3 className="font-bold text-lg">Join the Cause</h3>
          <p className="text-sm text-muted-foreground">
            Your participation makes a difference. Sign up to receive updates and reminders.
          </p>

          {joined ? (
            <div className="bg-green-50 text-green-800 p-4 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">You are registered!</span>
            </div>
          ) : (
            <Button className="w-full h-12 text-lg" onClick={handleJoin}>
              Join Initiative
            </Button>
          )}

          <div className="text-xs text-center text-muted-foreground pt-2">
            {initiative.participants_count} people are already going
          </div>
        </Card>
      </div>
    </div>
  )
}
