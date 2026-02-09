import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AlertTriangle, Info, Siren } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export function RealTimeAlerts() {
    const [alerts, setAlerts] = useState([])

    const fetchAlerts = async () => {
        try {
            const data = await apiFetch('/api/dashboard/alerts')
            setAlerts(data || [])
        } catch (e) {
            console.error("Failed to fetch alerts", e)
        }
    }

    useEffect(() => {
        fetchAlerts()
        const interval = setInterval(fetchAlerts, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [])

    if (alerts.length === 0) return null

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Siren className="w-5 h-5 text-red-500 animate-pulse" />
                Live City Alerts
            </h3>

            <div className="space-y-3">
                {alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                ))}
            </div>
        </div>
    )
}

function AlertCard({ alert }) {
    const styles = {
        high: "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900",
        medium: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-900",
        low: "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-900"
    }

    const icons = {
        high: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
        medium: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
        low: <Info className="w-5 h-5 flex-shrink-0" />
    }

    return (
        <div className={`p-4 rounded-lg border flex gap-3 animate-in slide-in-from-top-2 duration-300 ${styles[alert.severity] || styles.low}`}>
            {icons[alert.severity] || icons.low}
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm uppercase tracking-wide">{alert.type} • {alert.area}</h4>
                    <span className="text-xs opacity-80 whitespace-nowrap">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <p className="text-sm mt-1 font-medium leading-relaxed">
                    {alert.message}
                </p>
            </div>
        </div>
    )
}
