import { Card } from '@/components/ui/card'
import { ReportForm } from '@/components/reports/report-form'

export default function NewReportPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Report an Issue</h1>
        <p className="text-muted-foreground">
          Help us improve your neighborhood by reporting issues you've noticed.
        </p>
      </div>

      <Card className="p-6">
        <ReportForm />
      </Card>

      <div className="mt-8 p-4 bg-card border border-border rounded-lg">
        <h3 className="font-semibold mb-3">Tips for a Great Report:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>✓ Be specific and descriptive about the issue</li>
          <li>✓ Include photos if possible - they help us prioritize</li>
          <li>✓ Provide accurate location coordinates if you can</li>
          <li>✓ Check if the issue has already been reported</li>
          <li>✓ Follow up with updates as the issue is being addressed</li>
        </ul>
      </div>
    </div>
  )
}
