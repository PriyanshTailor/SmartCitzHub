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
  { id: 1, label: 'Photo' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Review' },
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
  const [mlPrediction, setMlPrediction] = useState(null)
  const [isClassifying, setIsClassifying] = useState(false)

  const [file, setFile] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, isAnonymous: checked }))
  }

  const handleImageUpload = async (e) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      const previewUrl = URL.createObjectURL(selectedFile)
      setFormData((prev) => ({ ...prev, image_url: previewUrl }))
      
      // Classify image with ML
      await classifyImage(selectedFile)
    }
  }

  const classifyImage = async (imageFile) => {
    setIsClassifying(true)
    try {
      // 1. Start fetching location immediately in parallel
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setFormData((prev) => ({
              ...prev,
              latitude: pos.coords.latitude.toString(),
              longitude: pos.coords.longitude.toString(),
            }))
          },
          (error) => console.warn('Location access failed during auto-fetch:', error)
        )
      }

      // 2. Classify image with ML
      const formDataObj = new FormData()
      formDataObj.append('image', imageFile)
      
      const response = await fetch('http://localhost:5000/classify-issue', {
        method: 'POST',
        body: formDataObj
      })
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.success) {
          const prediction = result.prediction
          const categoryLabels = {
            pothole: 'Pothole / Road Damage',
            broken_light: 'Broken Street Light',
            garbage: 'Garbage / Waste Pile',
            graffiti: 'Vandalism / Graffiti',
            flooding: 'Water Leakage / Flooding',
            other: 'Civic Issue'
          }

          setFormData((prev) => ({
            ...prev,
            category: prediction.predicted_class,
            title: `${prediction.predicted_class.replace('_', ' ').toUpperCase()} Detected`,
            description: `Auto-detected ${prediction.predicted_class.replace('_', ' ')} with ${Math.round(
              prediction.confidence * 100
            )}% confidence via Smart Citizen Hub AI. Please verify details.`,
          }))
          
          setMlPrediction(prediction)
          
          const label = categoryLabels[prediction.predicted_class] || prediction.predicted_class
          toast.success(`AI classified: ${label}`)

          // Automatically move to next step after a short delay
          setTimeout(() => {
            setCurrentStep(2)
          }, 2000)
        }
      }
    } catch (error) {
      console.warn('ML classification failed:', error)
    } finally {
      setIsClassifying(false)
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
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <Label htmlFor="image" className="text-base font-semibold">Upload Photo of Issue</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Our AI will automatically detect the type of issue from your photo
              </p>
              <div className="mt-4 border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isClassifying}
                />
                <label htmlFor="image" className="cursor-pointer">
                  {formData.image_url ? (
                    <div className="space-y-4">
                      <img src={formData.image_url} alt="Preview" className="mx-auto max-h-48 rounded-md shadow-md" />
                      <p className="text-sm text-muted-foreground">Click to change photo</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Camera className="mx-auto w-12 h-12 text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium">Click to upload photo</p>
                        <p className="text-sm text-muted-foreground">or drag and drop</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {isClassifying && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <p className="text-blue-700">🤖 AI is analyzing your photo...</p>
                </div>
              </div>
            )}

            {mlPrediction && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="space-y-2">
                  <p className="font-semibold text-green-800">✅ AI Analysis Complete</p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Detected Issue:</span> {mlPrediction.predicted_class.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Confidence:</span> {(mlPrediction.confidence * 100).toFixed(1)}%
                    </p>
                    {mlPrediction.top_predictions && mlPrediction.top_predictions.length > 1 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Other possibilities:</span>
                        {mlPrediction.top_predictions.slice(1).map(pred => 
                          ` ${pred.class} (${(pred.confidence * 100).toFixed(1)}%)`
                        ).join(',')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!formData.image_url && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm">⚠️ Photo is required to submit a report</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <Label className="text-base font-semibold">Location</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Confirm the location where this issue was found
              </p>
            </div>
            
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
              <span className="flex items-center gap-2"><MapPin /> Interactive Map</span>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => {
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
                      console.error('Location access denied:', error);
                      setFormData((prev) => ({
                        ...prev,
                        latitude: '22.3072',
                        longitude: '73.1812',
                      }))
                    }
                  )
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    latitude: '22.3072',
                    longitude: '73.1812',
                  }))
                }
              }}
            >
              <MapPin className="w-4 h-4 mr-2" /> Use Current Location
            </Button>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                💡 Your current location will help us respond faster to this issue
              </p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <Label className="text-base font-semibold">Review & Submit</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Review your report details before submitting
              </p>
            </div>

            {/* Review Summary */}
            <div className="space-y-4">
              {formData.image_url && (
                <div className="flex gap-4 p-4 border rounded-lg">
                  <img src={formData.image_url} alt="Issue" className="w-24 h-24 object-cover rounded-md" />
                  <div className="flex-1">
                    <p className="font-medium">Photo uploaded</p>
                    {mlPrediction && (
                      <p className="text-sm text-green-600">
                        AI: {mlPrediction.predicted_class.replace('_', ' ').toUpperCase()} ({(mlPrediction.confidence * 100).toFixed(1)}% confidence)
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add any additional details..."
                  className="w-full mt-2 min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
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

              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                <Checkbox 
                  id="anonymous" 
                  checked={formData.isAnonymous} 
                  onCheckedChange={handleCheckboxChange} 
                />
                <Label htmlFor="anonymous" className="text-sm">
                  Submit this report anonymously
                </Label>
              </div>

              {formData.latitude && formData.longitude && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📍 Location: {formData.latitude}, {formData.longitude}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          Back
        </Button>
        {currentStep < 3 ? (
          <Button 
            type="button" 
            onClick={nextStep}
            disabled={currentStep === 1 && !formData.image_url}
          >
            {currentStep === 1 ? 'Continue to Location' : 'Review Report'}
          </Button>
        ) : (
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={loading || !formData.image_url}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        )}
      </div>
    </form>
  )
}
