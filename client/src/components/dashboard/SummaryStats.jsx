import { Card, CardContent } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

export function SummaryStats({ stats }) {
    if (!stats) return null

    // Normalized data structure handling
    const items = [
        {
            label: "Active Reports",
            value: stats.openReports ?? stats.submitted ?? 0,
            trend: "up",
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20"
        },
        {
            label: "Resolved",
            value: stats.resolvedReports ?? stats.resolved ?? 0,
            trend: "up",
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-900/20"
        },
        {
            label: "High Priority",
            value: stats.highPriority ?? 0,
            trend: "down", // Good if down
            color: "text-orange-600",
            bg: "bg-orange-50 dark:bg-orange-900/20"
        },
        {
            label: "Community Impact",
            value: stats.points ?? stats.totalUsers ?? 0,
            trend: "steady",
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-900/20"
        }
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item, idx) => (
                <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                                <h3 className="text-3xl font-bold mt-2">{item.value}</h3>
                            </div>
                            <div className={`p-2 rounded-lg ${item.bg}`}>
                                {item.trend === 'up' && <ArrowUp className={`w-5 h-5 ${item.color}`} />}
                                {item.trend === 'down' && <ArrowDown className={`w-5 h-5 ${item.color}`} />}
                                {item.trend === 'steady' && <Minus className={`w-5 h-5 ${item.color}`} />}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
