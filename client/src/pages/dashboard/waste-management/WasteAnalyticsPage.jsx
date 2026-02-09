import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Recycle, TrendingUp, Download, Truck } from 'lucide-react'

const BarChart = ({ data, color = 'bg-primary' }) => (
  <div className="flex items-end gap-2 h-40 w-full mt-4">
    {data.map((h, i) => (
      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
        <div className={`w-full ${color} rounded-t-sm transition-all group-hover:opacity-80`} style={{ height: `${h}%` }} />
      </div>
    ))}
  </div>
)

const LineChart = () => (
  <div className="relative h-40 w-full mt-4 border-l border-b flex items-end">
    <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
      <path d="M0,35 Q10,30 20,32 T40,25 T60,15 T80,20 T100,5" fill="none" className="stroke-primary" strokeWidth="2" />
      <path d="M0,35 L0,40 L100,40 L100,5" fill="url(#gradient)" className="opacity-20" />
      <defs>
        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" className="stop-primary" stopOpacity="0.5" />
          <stop offset="100%" className="stop-primary" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  </div>
)

export default function WasteAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Waste Analytics</h1>
          <p className="text-muted-foreground">Detailed insights into city waste generation and collection efficiency.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option>Last 30 Days</option>
            <option>This Year</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bins</p>
              <h3 className="text-2xl font-bold">1,248</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">+12 new this month</p>
        </Card>
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Fill Rate</p>
              <h3 className="text-2xl font-bold">68%</h3>
            </div>
            <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">stable vs last week</p>
        </Card>
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Collections</p>
              <h3 className="text-2xl font-bold">8,920</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">98% efficiency</p>
        </Card>
        <Card className="p-4 flex flex-col justify-between bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Recycling Rate</p>
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">42%</h3>
            </div>
            <div className="p-2 bg-green-200 dark:bg-green-800 rounded-full text-green-700 dark:text-green-200">
              <Recycle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">Target: 50% by 2025</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Waste Generation Trends</h3>
          <p className="text-sm text-muted-foreground mb-4">Daily volume in tons (Last 30 days)</p>
          <LineChart />
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Collection Efficiency by Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">Percentage of on-time pickups</p>
          <BarChart data={[85, 92, 78, 95, 88, 72, 98, 84]} />
          <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
            <span>Downtown</span>
            <span>North</span>
            <span>East</span>
            <span>West</span>
            <span>South</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-1">
          <h3 className="font-semibold mb-4">Waste Composition</h3>
          <div className="space-y-4">
            {[
              { label: 'General Waste', val: '45%', color: 'bg-gray-400' },
              { label: 'Recyclables', val: '30%', color: 'bg-green-500' },
              { label: 'Organic', val: '20%', color: 'bg-orange-400' },
              { label: 'Hazardous', val: '5%', color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="font-bold text-sm">{item.val}</span>
              </div>
            ))}
            <div className="h-4 w-full flex rounded-full overflow-hidden mt-4">
              <div className="bg-gray-400 w-[45%]" />
              <div className="bg-green-500 w-[30%]" />
              <div className="bg-orange-400 w-[20%]" />
              <div className="bg-red-500 w-[5%]" />
            </div>
          </div>
        </Card>

        <Card className="p-6 md:col-span-2">
          <h3 className="font-semibold mb-4">Top 5 High-Priority Bins</h3>
          <div className="space-y-4">
            {[
              { id: '#Bin-1024', loc: 'Times Square North', fill: '98%', status: 'Critical' },
              { id: '#Bin-0852', loc: 'Central Park West', fill: '95%', status: 'Critical' },
              { id: '#Bin-2301', loc: 'Broadway & 42nd', fill: '88%', status: 'High' },
              { id: '#Bin-1100', loc: 'Grand Central Terminal', fill: '85%', status: 'High' },
              { id: '#Bin-0056', loc: 'SoHo Shopping District', fill: '82%', status: 'High' },
            ].map((bin, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="font-mono text-xs bg-background border px-1 py-0.5 rounded">{bin.id}</div>
                  <span className="text-sm font-medium">{bin.loc}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-bold">{bin.fill}</div>
                  <div className={`text-xs px-2 py-1 rounded-full ${bin.status === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                    {bin.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
