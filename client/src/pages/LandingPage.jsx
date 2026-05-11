import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-white/10 supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="/logo_smartcitizen.png"
              alt="SmartCitizen"
              className="h-16 w-auto"
              onError={(e) => e.target.src = '/placeholder-logo.png'}
            />
          </div>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost" className="hover:bg-gray-500/80 cursor-pointer">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20 cursor-pointer">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-40 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[80vh] flex items-center">
        <img
          src="/smart-city-hero-premium.png"
          alt="Smart City Future"
          className="absolute inset-0 w-full h-full object-cover -z-20"
          onError={(e) => e.target.style.display = 'none'}
        />
        <div className="absolute inset-0 bg-background/80 dark:bg-background/70 -z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent -z-10" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-7xl font-bold text-balance mb-6 tracking-tight text-foreground drop-shadow-sm">
            Making Cities <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Smarter Together</span>
          </h1>
          <p className="text-xl text-muted-foreground text-balance mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Connect with your city like never before. Report issues, track services, and shape the future of your neighborhood in real-time.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transition-transform shadow-xl shadow-blue-500/25 border-0">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="-mt-32 relative z-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Report Issues', icon: '📸', desc: 'Snap & report civic problems instantly.', img: '/issue-reporting.jpg' },
            { title: 'Waste Tracking', icon: '♻️', desc: 'Real-time bin status & schedules.', img: '/waste-tracking.jpg' },
            { title: 'Crowd Insights', icon: '👥', desc: 'Live crowd density & predictions.', img: '/crowd-insights.jpg' },
            { title: 'Live Transit', icon: '🚌', desc: 'Track buses & subways in real-time.', img: '/live-transit.png' },
          ].map((feature, i) => (
            <div key={i} className="group rounded-2xl bg-card border border-border/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <img
                  src={feature.img}
                  alt={feature.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentElement.className = 'relative h-48 overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center'
                    const placeholder = document.createElement('div')
                    placeholder.className = 'text-3xl'
                    placeholder.textContent = feature.icon
                    e.target.parentElement.appendChild(placeholder)
                  }}
                />
                <div className="absolute bottom-4 left-4 z-20 text-white text-3xl">{feature.icon}</div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      

      {/* Stats Counter */}
      <section className="py-20 bg-muted/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border/50">
            {stats.map((stat, idx) => (
              <div key={idx} className="py-4">
                <div className="text-5xl font-bold bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Community Pulse</h2>
            <p className="text-muted-foreground">See what's happening in your city right now.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ActivityFeed />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <img
                src="/logo_smartcitizen.png"
                alt="SmartCitizen"
                className="h-12 w-auto"
                onError={(e) => e.target.src = '/placeholder-logo.png'}
              />
              <p className="text-muted-foreground text-sm">Empowering communities through technology and transparency.</p>
              <div className="flex gap-4">
                {/* Social icons placeholder */}
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">𝕏</div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">in</div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">G</div>
              </div>
            </div>
            {footerLinks.map((column, idx) => (
              <div key={idx}>
                <h4 className="font-semibold mb-4">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link to="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border/50 pt-8 text-center text-muted-foreground text-sm">
            <p>&copy; 2026 SmartCitizen Hub. Built for the future.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

function ActivityFeed() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  // Map categories to different images for variety
  const categoryImages = {
    pothole: '/issue-reporting.jpg',
    'broken light': '/crowd-insights.jpg',
    noise: '/community-engagement.jpg',
    trash: '/waste-tracking.jpg',
    waste: '/waste-tracking.jpg',
    crowd: '/crowd-insights.jpg',
    traffic: '/hero-smart-city.jpg',
    transit: '/live-transit.png',
    electrical: '/community-engagement.jpg',
    'low voltage': '/hero-smart-city.jpg',
    default: '/issue-reporting.jpg'
  }

  const getImageForCategory = (category) => {
    if (!category) return categoryImages.default
    const key = category.toLowerCase().trim()
    // Try exact match first
    if (categoryImages[key]) return categoryImages[key]
    // Try partial match
    for (const [catKey, image] of Object.entries(categoryImages)) {
      if (key.includes(catKey) || catKey.includes(key)) return image
    }
    // Rotate through available images based on hash of category
    const images = ['/issue-reporting.jpg', '/waste-tracking.jpg', '/crowd-insights.jpg', '/live-transit.png', '/community-engagement.jpg', '/hero-smart-city.jpg']
    const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return images[hash % images.length]
  }

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await apiFetch('/api/public/reports')
        setActivities(data || [])
      } catch (error) {
        console.error('Failed to load public reports', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  if (loading) {
    return null
  }

  if (activities.length === 0) {
    return (
      <div className="col-span-3 text-center py-10 text-muted-foreground">
        <p>No recent activity. Be the first to report an issue!</p>
      </div>
    )
  }

  return (
    <>
      {activities.map((item, index) => {
        // Rotate through different images for variety
        const images = ['/issue-reporting.jpg', '/waste-tracking.jpg', '/crowd-insights.jpg', '/live-transit.png', '/community-engagement.jpg', '/hero-smart-city.jpg']
        const imageUrl = item.image || images[index % images.length]

        // Match content to image - use themed content for rotated images
        const contentMap = {
          '/issue-reporting.jpg': { title: 'Street Light Maintenance', location: 'City Center', category: 'infrastructure', status: 'open' },
          '/waste-tracking.jpg': { title: 'Overflowing Waste Bin', location: 'Market Area', category: 'waste', status: 'open' },
          '/crowd-insights.jpg': { title: 'High Crowd Density', location: 'Downtown Plaza', category: 'crowd', status: 'open' },
          '/live-transit.png': { title: 'Bus Schedule Update', location: 'Transit Hub', category: 'transit', status: 'open' },
          '/community-engagement.jpg': { title: 'Community Mural Project', location: 'Public Street', category: 'community', status: 'in_progress' },
          '/hero-smart-city.jpg': { title: 'Smart City Initiative', location: 'Vadodara', category: 'infrastructure', status: 'open' }
        }

        // Use mapped content for rotated images (when item.image is not provided)
        // Use API data when image is from API
        const displayContent = !item.image ? contentMap[imageUrl] : {
          title: item.title,
          location: item.location,
          category: item.category,
          status: item.status
        }

        return (
          <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary/50">
            <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
              <img
                src={imageUrl}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  e.target.style.display = 'none'
                  const parent = e.target.parentElement
                  if (!parent.querySelector('.fallback-icon')) {
                    const fallback = document.createElement('div')
                    fallback.className = 'fallback-icon absolute inset-0 flex items-center justify-center text-4xl'
                    fallback.textContent = '📋'
                    parent.appendChild(fallback)
                  }
                }}
              />
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="backdrop-blur-md bg-background/80 capitalize">{displayContent.category}</Badge>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.time}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2 line-clamp-1">{displayContent.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span>{displayContent.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${displayContent.status === 'open' ? 'bg-yellow-500' : displayContent.status === 'in_progress' ? 'bg-blue-500' : 'bg-green-500'}`} />
                <span className="text-xs font-medium capitalize text-muted-foreground">{displayContent.status}</span>
              </div>
            </div>
          </Card>
        )
      })}
    </>
  )
}

const stats = [
  { value: '12k+', label: 'Issues Resolved' },
  { value: '1,500', label: 'Bins Monitored' },
  { value: '50k+', label: 'Active Users' },
]

const features = [
  {
    icon: '📸',
    title: 'Issue Reporting',
    description: 'Report potholes, broken lights, and other street issues directly from your mobile device.',
  },
  {
    icon: '♻️',
    title: 'Waste Tracking',
    description: 'Track waste management schedules and view collection points near you.',
  },
  {
    icon: '👥',
    title: 'Crowd Insights',
    description: 'Real-time data about crowd density and traffic patterns in your area.',
  },
  {
    icon: '🌟',
    title: 'Community Initiatives',
    description: 'Participate in and create community projects to improve your neighborhood.',
  },
]

const howItWorks = [
  {
    title: 'Report',
    description: 'Take a photo and report issues in your neighborhood with just a few taps.',
  },
  {
    title: 'Track',
    description: 'Monitor the status of your reports and see what the city is doing to fix issues.',
  },
  {
    title: 'Engage',
    description: 'Participate in community discussions and initiatives to make your city better.',
  },
]

const footerLinks = [
  {
    title: 'Product',
    links: ['Features', 'Pricing', 'Security', 'Roadmap'],
  },
  {
    title: 'Company',
    links: ['About', 'Blog', 'Careers', 'Contact'],
  },
  {
    title: 'Legal',
    links: ['Privacy', 'Terms', 'Cookies', 'License'],
  },
]
