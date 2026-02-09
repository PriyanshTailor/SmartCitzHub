import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Camera, MapPin, CheckCircle2 } from 'lucide-react'
import { getAuthToken } from '@/lib/auth'

const steps = [
  { id: 1, label: 'Details' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Media' },
]

export function ReportForm() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'pothole',
    priority: 'medium',
    latitude: '',
    longitude: '',
    image_url: '',
    isAnonymous: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [file, setFile] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, isAnonymous: checked }))
  }

  const handleImageUpload = (e) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      const previewUrl = URL.createObjectURL(selectedFile)
      setFormData((prev) => ({ ...prev, image_url: previewUrl }))
    }
  }

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formDataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'image_url') {
          formDataToSend.append(key, String(value))
        }
      })

      if (file) {
        formDataToSend.append('image_file', file)
      }

      const token = getAuthToken()
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create report')
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard/reports')
      }, 2000)
    } catch (err) {
      setError(err?.message || 'Failed to create report')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center space-y-4 border-green-200 bg-green-50 dark:bg-green-900/10">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-green-800 dark:text-green-300">Report Submitted!</h3>
          <p className="text-green-700 dark:text-green-400">Thank you for being an active citizen.</p>
        </div>
      </Card>
    )
  }

  return (
    <form
      className="space-y-8"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
        }
      }}
    >
      {/* Progress Indicator */}
      <div className="flex justify-between relative px-4">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10 -translate-y-1/2" />
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${currentStep >= step.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30 text-muted-foreground'
              }`}>
              {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
            </div>
            <span className={`text-xs font-medium ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm font-medium border border-destructive/20">
          {error}
        </div>
      )}

      <Card className="p-6">
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full mt-2 h-10 px-3 rounded-md border border-input bg-background"
                required
              >
                <option value="pothole">Pothole</option>
                <option value="broken_light">Broken Light</option>
                <option value="garbage">Garbage</option>
                <option value="graffiti">Graffiti</option>
                <option value="flooding">Flooding</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Brief summary"
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed explanation..."
                className="w-full mt-2 min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
                required
              />
            </div>
            <div>
              <Label htmlFor="priority">Severity Priority</Label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full mt-2 h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="low">Low - Cosmetic issue</option>
                <option value="medium">Medium - Needs attention</option>
                <option value="high">High - Affects usability</option>
                <option value="critical">Critical - Public safety hazard</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="22.3072"
                    className="pl-9"
                    type="number"
                    step="any"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="73.1812"
                    className="pl-9"
                    type="number"
                    step="any"
                  />
                </div>
              </div>
            </div>
            <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground border-2 border-dashed">
              <span className="flex items-center gap-2"><MapPin /> Map Selector Pending</span>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={() => {
              if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude: pos.coords.latitude.toString(),
                      longitude: pos.coords.longitude.toString(),
                    }))
                  },
                  (error) => {
                    // Fallback to Vadodara if location access denied
                    console.error('Location access denied:', error);
                    setFormData((prev) => ({
                      ...prev,
                      latitude: '22.3072',
                      longitude: '73.1812',
                    }))
                  }
                )
              } else {
                // Fallback to Vadodara if geolocation not supported
                setFormData((prev) => ({
                  ...prev,
                  latitude: '22.3072',
                  longitude: '73.1812',
                }))
              }
            }}>
              <MapPin className="w-4 h-4 mr-2" /> Use Current Location
            </Button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <Label htmlFor="image">Add Photo (Optional)</Label>
              <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="image" className="cursor-pointer">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Preview" className="mx-auto max-h-40 rounded-md" />
                  ) : (
                    <div className="space-y-2">
                      <Camera className="mx-auto w-8 h-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload image</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="anonymous" checked={formData.isAnonymous} onCheckedChange={handleCheckboxChange} />
              <Label htmlFor="anonymous">Submit Anonymously</Label>
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          Back
        </Button>
        {currentStep < 3 ? (
          <Button type="button" onClick={nextStep}>Next</Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        )}
      </div>
    </form>
  )
}
