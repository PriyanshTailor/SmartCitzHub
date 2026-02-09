import { useNavigate } from 'react-router-dom'
import { CityMap } from '@/components/map/city-map'

export default function MapPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">City Map</h1>
        <p className="text-muted-foreground">
          View all reported issues and waste management points in your area.
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <CityMap />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-card rounded-lg border border-border">
          <h3 className="font-semibold mb-2">Crowd Insights</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Real-time crowd density information for busy areas.
          </p>
          <button onClick={()=> navigate('/dashboard/crowd-insights')} className="text-primary text-sm hover:underline">View Details →</button>
        </div>

        <div className="p-4 bg-card rounded-lg border border-border">
          <h3 className="font-semibold mb-2">Traffic Updates</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Current traffic conditions and congestion levels.
          </p>
          <button 
            onClick={() => navigate('/dashboard/traffic')}
            className="text-primary text-sm hover:underline"
          >
            View Details →
          </button>
        </div>

        <div className="p-4 bg-card rounded-lg border border-border">
          <h3 className="font-semibold mb-2">Environmental Data</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Air quality and environmental metrics for your area.
          </p>
          <button 
            onClick={() => navigate('/dashboard/environmental')}
            className="text-primary text-sm hover:underline"
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  )
}
