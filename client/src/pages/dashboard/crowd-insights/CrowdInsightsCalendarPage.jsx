import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, MapPin, Users, ChevronLeft, ChevronRight, Plus } from 'lucide-react'

const events = [
  { id: 1, title: 'City Marathon', date: 15, type: 'Sports', crowd: 'High', time: '08:00 AM' },
  { id: 2, title: 'Food Festival', date: 18, type: 'Cultural', crowd: 'High', time: '11:00 AM' },
  { id: 3, title: 'Tech Summit', date: 22, type: 'Conference', crowd: 'Medium', time: '09:00 AM' },
  { id: 4, title: 'Jazz in Park', date: 25, type: 'Music', crowd: 'Medium', time: '06:00 PM' },
]

export default function CrowdInsightsCalendarPage() {
  const [currentMonth] = useState('October 2026')
  const [selectedDate, setSelectedDate] = useState(null)

  const daysInMonth = 31
  const startDay = 4

  const renderCalendar = () => {
    const days = []
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-muted/20 border border-border/50" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = events.filter((e) => e.date === day)
      const isSelected = selectedDate === day

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(day)}
          className={`h-32 p-2 border border-border/50 transition-colors cursor-pointer relative group ${isSelected ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'hover:bg-muted/50'
            }`}
        >
          <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
            {day}
          </span>

          {day % 7 === 0 || day % 6 === 0 ? (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" title="High Crowd Expected" />
          ) : (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500" title="Low Crowd Expected" />
          )}

          <div className="mt-2 space-y-1">
            {dayEvents.map((evt) => (
              <div key={evt.id} className="text-xs bg-primary/10 text-primary truncate px-1 py-0.5 rounded">
                {evt.title}
              </div>
            ))}
          </div>
        </div>
      )
    }
    return days
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crowd Calendar</h1>
          <p className="text-muted-foreground">Plan ahead by checking scheduled events and predicted crowd levels.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon"><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-medium min-w-[120px] text-center">{currentMonth}</span>
          <Button variant="outline" size="icon"><ChevronRight className="w-4 h-4" /></Button>
          <Button className="ml-2">
            <Plus className="w-4 h-4 mr-2" /> Add Reminder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 p-0 overflow-hidden">
          <div className="grid grid-cols-7 text-center py-2 border-b bg-muted/50 text-sm font-medium">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>
          <div className="grid grid-cols-7 bg-background">
            {renderCalendar()}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 bg-muted/30">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Legend
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>High Crowd (90%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Medium Crowd (50-90%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Low Crowd (&lt;50%)</span>
              </div>
            </div>
          </Card>

          {selectedDate && (
            <Card className="p-4 border-primary">
              <h3 className="font-semibold mb-4">Events on Oct {selectedDate}</h3>
              {events.filter((e) => e.date === selectedDate).length > 0 ? (
                <div className="space-y-3">
                  {events.filter((e) => e.date === selectedDate).map((evt) => (
                    <div key={evt.id} className="pb-3 border-b last:border-0 last:pb-0">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{evt.title}</span>
                        <Badge variant="outline">{evt.type}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" /> Central Park
                        <span className="mx-1">•</span>
                        <Users className="w-3 h-3" /> {evt.crowd}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No events scheduled. Great day for a quiet walk!</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
