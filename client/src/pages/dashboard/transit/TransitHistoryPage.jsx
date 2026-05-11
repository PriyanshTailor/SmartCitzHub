import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, TrendingUp, DollarSign, Leaf, Calendar, ArrowRight } from 'lucide-react'

const recentTrips = [
  { id: 1, date: 'Today, 8:45 AM', from: 'Home', to: 'Downtown Office', duration: '32 min', mode: 'subway', cost: '$2.75', saved: '$12.50' },
  { id: 2, date: 'Yesterday, 5:30 PM', from: 'Downtown Office', to: 'Home', duration: '35 min', mode: 'subway', cost: '$2.75', saved: '$12.50' },
  { id: 3, date: 'Yesterday, 8:50 AM', from: 'Home', to: 'Downtown Office', duration: '30 min', mode: 'subway', cost: '$2.75', saved: '$12.50' },
  { id: 4, date: 'Mon, 6:00 PM', from: 'Gym', to: 'Home', duration: '15 min', mode: 'bus', cost: '$2.75', saved: '$8.00' },
]

export default function TransitHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-primary/5 border-primary/20">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Total Trips
          </p>
          <h3 className="text-2xl font-bold mt-1">42</h3>
          <p className="text-xs text-green-600 mt-1">↑ 12% this month</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" /> Time Saved
          </p>
          <h3 className="text-2xl font-bold mt-1">14 hrs</h3>
          <p className="text-xs text-muted-foreground mt-1">vs driving</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Money Saved
          </p>
          <h3 className="text-2xl font-bold mt-1">$450</h3>
          <p className="text-xs text-green-600 mt-1">on gas & parking</p>
        </Card>
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
          <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
            <Leaf className="w-4 h-4" /> CO₂ Avoided
          </p>
          <h3 className="text-2xl font-bold mt-1 text-green-700 dark:text-green-300">128 kg</h3>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">Eq. to 6 trees</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recent Commutes</h3>
            <Button variant="outline" size="sm">Download Report</Button>
          </div>

          <div className="space-y-3">
            {recentTrips.map((trip) => (
              <Card key={trip.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
                    {trip.mode === 'subway' ? '🚇' : '🚌'}
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {trip.from} <ArrowRight className="w-3 h-3 text-muted-foreground" /> {trip.to}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> {trip.date} • {trip.duration}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-1">{trip.cost}</Badge>
                  <p className="text-xs text-green-600">Saved {trip.saved}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-6">
          <h3 className="font-medium mb-6">Monthly Commute Cost</h3>
          <div className="space-y-4 h-64 flex flex-col justify-end pb-6 border-b">
            <div className="flex items-end justify-between h-full gap-2 px-2">
              <div className="w-full flex flex-col items-center gap-2">
                <div className="w-full bg-primary/20 rounded-t-sm h-[40%]" />
                <span className="text-xs text-muted-foreground">Jan</span>
              </div>
              <div className="w-full flex flex-col items-center gap-2">
                <div className="w-full bg-primary/20 rounded-t-sm h-[35%]" />
                <span className="text-xs text-muted-foreground">Feb</span>
              </div>
              <div className="w-full flex flex-col items-center gap-2">
                <div className="w-full bg-primary/20 rounded-t-sm h-[50%]" />
                <span className="text-xs text-muted-foreground">Mar</span>
              </div>
              <div className="w-full flex flex-col items-center gap-2">
                <div className="w-full bg-primary rounded-t-sm h-[65%]" />
                <span className="text-xs font-semibold">Apr</span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">This month</p>
            <p className="text-2xl font-bold">$78.50</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
