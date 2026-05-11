import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Activity, Clock, MapPin } from 'lucide-react'

export function PredictiveWidget({ predictions }) {
    if (!predictions) return (
        <Card className="h-full min-h-[200px] flex items-center justify-center border-dashed">
            <p className="text-muted-foreground text-sm">Loading predictions...</p>
        </Card>
    )

    const { crowdRisk, wasteRisk, transportDelay } = predictions

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Crowd Prediction */}
            <PredictionCard
                title="Crowd Risk"
                icon={<Activity className="w-4 h-4" />}
                data={crowdRisk}
                color="bg-indigo-500"
                type="risk"
            />

            {/* Waste Levels */}
            <PredictionCard
                title="Waste Overflow"
                icon={<TrendingUp className="w-4 h-4" />}
                data={wasteRisk}
                color="bg-rose-500"
                type="risk"
            />

            {/* Traffic */}
            <PredictionCard
                title="Transport Delay"
                icon={<Clock className="w-4 h-4" />}
                data={transportDelay}
                color="bg-amber-500"
                type="delay"
            />
        </div>
    )
}

function PredictionCard({ title, icon, data, color, type }) {
    if (!data) return null

    // Helper to format display value
    let displayValue = ""
    let progressValue = 0

    if (type === 'risk') {
        progressValue = (data.probability || 0) * 100
        displayValue = progressValue > 70 ? 'High Risk' : progressValue > 40 ? 'Medium Risk' : 'Low Risk'
    } else {
        // Delay type
        // Mocking progress for delay (e.g. 60mins max)
        progressValue = Math.min(((data.delayMinutes || 0) / 60) * 100, 100)
        displayValue = `${data.delayMinutes} min delay`
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2 bg-muted/30">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {icon} {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">

                {/* Main Value */}
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-2xl font-bold">{displayValue}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />
                            {data.area || data.zone || data.route}
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full ${color} transition-all duration-1000 ease-out`}
                            style={{ width: `${progressValue}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">{Math.round(progressValue)}% Severity</p>
                </div>

                {/* Reason / Details */}
                <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Why: </span>
                    {data.reason}
                    {data.timeWindow && <div className="mt-1 text-[10px] opacity-80">🕒 {data.timeWindow}</div>}
                </div>

            </CardContent>
        </Card>
    )
}
