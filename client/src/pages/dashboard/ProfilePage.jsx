
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Camera, MapPin, Mail, Calendar, Award, TrendingUp, ThumbsUp } from 'lucide-react'
import { apiFetch } from '@/lib/api'

import { setAuthSession, getAuthToken } from '@/lib/auth'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({})
  // const { toast } = useToast() // If toast is available, use it. For now alerting.

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/api/user/profile')
      setProfile(data)
      setFormData({
        full_name: data.full_name,
        phone: data.phone,
        location: data.location,
        district: data.district,
      })
    } catch (err) {
      console.error("Failed to fetch profile", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const res = await apiFetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.success) {
        setProfile(prev => ({ ...prev, ...formData }))
        // Update local storage user session to reflect new name
        const token = getAuthToken()
        setAuthSession({ token, user: res.user })
        setIsEditing(false)
        alert("Profile updated successfully!")
        window.location.reload() // Reload to update header name
      }
    } catch (err) {
      console.error("Update failed", err)
      alert("Failed to update profile.")
    }
  }

  if (loading) return <div>Loading Profile...</div>
  if (!profile) return <div>User not found.</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="text-2xl">{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div>
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4" /> {profile.email}
              </p>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {profile.location || 'Location not set'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Citizen
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.full_name || ''}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Location (City)</Label>
                <Input
                  id="address"
                  value={formData.location || ''}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Vadodara, Gujarat"
                  disabled={!isEditing}
                />
              </div>
            </div>
            {isEditing && (
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ... Other tabs kept as is for brevity/context ... */}
        <TabsContent value="overview" className="space-y-4">  
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-3 bg-primary/10 rounded-full">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">0</h3>
              <p className="text-sm text-muted-foreground">Issues Reported</p>
            </Card>

            <Card className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold">0</h3>
              <p className="text-sm text-muted-foreground">Impact Score</p>
            </Card>

            <Card className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <ThumbsUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold">0</h3>
              <p className="text-sm text-muted-foreground">Upvotes Received</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <div className="p-4 text-center text-muted-foreground">Achievements coming soon...</div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
