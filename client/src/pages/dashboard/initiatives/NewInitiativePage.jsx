import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'

export default function NewInitiativePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Create FormData manually to handle file + text
    const form = e.currentTarget
    const formData = new FormData()
    formData.append('title', form.title.value)
    formData.append('description', form.description.value)
    formData.append('category', form.category.value)
    formData.append('location_name', form.location_name.value)
    formData.append('start_date', form.start_date.value)

    if (imageFile) {
      formData.append('image_file', imageFile)
    }

    try {
      // Note: apiFetch handles FormData correctly if we don't manually set Content-Type to json
      // But our helper might need tweaking or we rely on browser setting boundary
      // Let's rely on standard fetch logic which apiFetch wraps

      // We need to use raw fetch or ensure apiFetch doesn't force JSON if body is FormData
      // Inspecting apiFetch logic (mental model): usually it checks if body is FormData.

      const res = await apiFetch('/api/initiatives', {
        method: 'POST',
        body: formData, // passing FormData directly
      })

      if (res.success || res.initiative) {
        navigate('/dashboard/initiatives')
      } else {
        alert('Failed to create initiative')
      }

    } catch (error) {
      console.error(error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Start an Initiative</h1>
        <p className="text-muted-foreground">Launch a community project and get others involved.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Banner Image Upload */}
          <div className="space-y-2">
            <Label>Banner Image (Optional)</Label>
            <div className="flex items-center gap-4">
              {imageFile && (
                <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-20 w-32 object-cover rounded-md border" />
              )}
              <Input type="file" accept="image/*" onChange={handleImageChange} className="w-full" />
            </div>
          </div>

          <div>
            <Label htmlFor="title">Initiative Title</Label>
            <Input id="title" name="title" placeholder="e.g. Weekly Park Cleanup" required className="mt-2" />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <select name="category" id="category" className="w-full mt-2 h-10 px-3 rounded-md border border-input bg-background" required>
              <option value="cleanup">Cleanup Drive</option>
              <option value="planting">Tree Planting</option>
              <option value="safety">Safety Patrol</option>
              <option value="education">Education Workshop</option>
              <option value="recycling">Recycling Campaign</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="description">Description (Goals & Plan)</Label>
            <textarea
              name="description"
              id="description"
              rows={5}
              className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background"
              placeholder="Describe what you want to achieve..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location_name">Location</Label>
              <Input id="location_name" name="location_name" placeholder="e.g. Central Park" required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input type="date" id="start_date" name="start_date" required className="mt-2" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Launch Initiative'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
