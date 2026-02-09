import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Bell, Shield, LogOut, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and application settings.</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates about your reports via email.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get real-time alerts on your device.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Service Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify me about public transit delays and waste collection changes.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Privacy & Appearance</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Use a dark theme for low-light environments.</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Anonymous Reporting</Label>
                <p className="text-sm text-muted-foreground">Hide your name on public reports by default.</p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-destructive/20 bg-destructive/5">
          <h2 className="text-xl font-semibold text-destructive mb-4">Danger Zone</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sign Out</p>
                <p className="text-sm text-muted-foreground">Sign out of your account on all devices.</p>
              </div>
              <Button variant="outline" className="border-destructive/50 hover:bg-destructive/10 text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
            <Separator className="bg-destructive/10" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently remove your account and all data.</p>
              </div>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
