import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Users, Target, Zap, Github, Twitter, Linkedin } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] light:bg-grid-slate-400/[0.05]" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <Badge variant="outline" className="px-4 py-1.5 text-sm uppercase tracking-wider border-primary text-primary bg-primary/5">
            Our Mission
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Empowering Citizens,<br /> Building Smarter Cities.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We believe that the future of urban living lies in the hands of its people.
            Smart Citizen Hub connects communities with city officials to solve real problems in real-time.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <h3 className="text-4xl font-bold text-primary">50k+</h3>
            <p className="text-muted-foreground font-medium">Active Citizens</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl font-bold text-primary">12k+</h3>
            <p className="text-muted-foreground font-medium">Issues Resolved</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl font-bold text-primary">89%</h3>
            <p className="text-muted-foreground font-medium">Response Rate</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl font-bold text-primary">5</h3>
            <p className="text-muted-foreground font-medium">Partner Cities</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our platform bridges the gap between problem identification and solution execution
            through a transparent, 4-step process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: Target, title: 'Report', desc: 'Snap a photo and pin the location of any civic issue.' },
            { icon: Users, title: 'Verify', desc: 'Community members upvote and verify the report authenticity.' },
            { icon: Zap, title: 'Resolve', desc: 'City officials are notified and dispatch teams to fix it.' },
            { icon: CheckCircle2, title: 'Update', desc: 'Get notified when the issue is resolved and rate the quality.' },
          ].map((step, i) => (
            <Card key={i} className="p-6 text-center space-y-4 hover:shadow-lg transition-shadow border-none bg-muted/50">
              <div className="mx-auto w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-sm">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold">Meet The Team</h2>
            <p className="text-muted-foreground">The passionate minds behind the platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Sarah Johnson', role: 'Chief Executive Officer', bg: 'bg-blue-100' },
              { name: 'David Chen', role: 'CTO & Lead Architect', bg: 'bg-green-100' },
              { name: 'Maria Rodriguez', role: 'Head of Community', bg: 'bg-orange-100' },
            ].map((member, i) => (
              <Card key={i} className="overflow-hidden border-none shadow-md group">
                <div className={`h-48 ${member.bg} relative`}>
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                      <div className="w-full h-full rounded-full bg-slate-200" />
                    </div>
                  </div>
                </div>
                <div className="pt-16 pb-8 px-6 text-center space-y-2">
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <p className="text-sm text-primary font-medium">{member.role}</p>
                  <p className="text-sm text-muted-foreground">
                    Passionate about using technology to solve real-world problems.
                  </p>
                  <div className="flex justify-center gap-4 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Twitter className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Linkedin className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Github className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-12 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-8">
            Built with modern technologies
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all">
            {['React', 'JavaScript', 'Tailwind CSS', 'MongoDB', 'Express.js', 'Leaflet'].map((tech) => (
              <span key={tech} className="text-xl font-bold">{tech}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
