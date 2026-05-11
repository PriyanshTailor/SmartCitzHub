import { Button } from '@/components/ui/button'
import { ReportsList } from '@/components/reports/reports-list'
import { Link } from 'react-router-dom'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Reports</h1>
          <p className="text-muted-foreground">
            Track all the issues you've reported and their status.
          </p>
        </div>
        <Link to="/dashboard/reports/new">
          <Button>+ New Report</Button>
        </Link>
      </div>

      <ReportsList />
    </div>
  )
}
