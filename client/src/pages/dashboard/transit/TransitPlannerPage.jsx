import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Navigation, Leaf, ArrowRight } from 'lucide-react'

export default function TransitPlannerPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [routes, setRoutes] = useState([])

  const handleSearch = (e) => {
    e.preventDefault()
    setLoading(true)

    setTimeout(() => {
      setRoutes([
        {
          id: 1,
          duration: '45 min',
          arrival: '10:30 AM',
          cost: '$2.75',
          co2: '0.4 kg',
          mode: 'bus',
          steps: ['Walk to Main St', 'Bus M15 to 86th St', 'Walk to destination'],
          bestFor: 'Cheapest',
        },
        {
          id: 2,
          duration: '32 min',
          arrival: '10:17 AM',
          cost: '$4.50',
          co2: '0.3 kg',
          mode: 'subway',
          steps: ['Walk to Station', 'Subway Line 4', 'Walk to destination'],
          bestFor: 'Fastest',
        },
        {
          id: 3,
          duration: '55 min',
          arrival: '10:40 AM',
          cost: '$0.00',
          co2: '0.0 kg',
          mode: 'bike',
          steps: ['Bike along Hudson Greenway'],
          bestFor: 'Eco-Friendly',
        },
      ])
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5" /> Plan Your Trip
          </h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label>From</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Current Location"
                  className="pl-9"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>To</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-primary" />
                <Input
                  placeholder="Destination"
                  className="pl-9"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Depart At</Label>
                <Input type="time" className="mt-1" defaultValue="09:45" />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" className="mt-1" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Finding Best Routes...' : 'Search Routes'}
            </Button>
          </form>
        </Card>

        <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4 text-green-500" />
            <strong>Did you know?</strong>
          </p>
          Taking public transit instead of driving saves an average of 20lbs of CO₂ per day.
        </div>
      </div>

      <div className="md:col-span-2 space-y-4">
        {routes.length > 0 ? (
          <>
            <h3 className="text-lg font-medium">Suggested Routes</h3>
            {routes.map((route) => (
              <Card key={route.id} className="p-4 hover:border-primary transition-colors cursor-pointer group">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                      <span className="text-xl font-bold">{route.duration}</span>
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg">{route.arrival} Arrival</h4>
                        {route.bestFor && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-medium">
                            {route.bestFor}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {route.steps.join(' → ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{route.cost}</p>
                    <p className="text-xs text-green-600 flex items-center justify-end gap-1">
                      <Leaf className="w-3 h-3" /> {route.co2} CO₂
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">Detailed Steps</Button>
                  <Button size="sm" className="gap-2">
                    Start Navigation <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
            <Navigation className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Where do you want to go today?</p>
            <p className="text-sm">Enter your destination to see real-time route options.</p>
          </div>
        )}
      </div>
    </div>
  )
}
