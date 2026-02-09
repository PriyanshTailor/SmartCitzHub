import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Search, Youtube, BookOpen, MessageCircle, Mail } from 'lucide-react'

const faqs = [
  {
    q: 'How do I report a civic issue?',
    a: "Navigate to the 'Report Issue' page from your dashboard. Select the category (e.g., Pothole, Waste), take a photo if possible, describe the issue, and set the severity. Click submit to generate a tracking ID.",
  },
  {
    q: 'Can I report issues anonymously?',
    a: "Yes! When filling out the report form, simply check the 'Submit Anonymously' box. Your name will not be displayed publicly, though admins can still contact you if more info is needed.",
  },
  {
    q: 'How does the points system work?',
    a: "You earn points for every verified report (10 pts), resolving an issue (50 pts), and participating in community polls (5 pts). Points contribute to your 'Community Impact Score' and unlock badges.",
  },
  {
    q: 'What is the Waste Management map?',
    a: "It's an interactive map showing all smart bins in the city. The markers are color-coded: Green (Empty), Yellow (Half-full), and Red (Full). You can check their status to know where to responsibly dispose of waste.",
  },
  {
    q: 'How accurate is the crowd prediction?',
    a: 'Our AI model uses historical data and real-time sensors to predict crowd levels with ~85% accuracy. It updates every 15 minutes to help you plan your visits to public spaces.',
  },
  {
    q: 'Is the Smart Citizen Hub app free?',
    a: 'Absolutely! The platform is a public service initiative funded by the city council to improve urban living standards through citizen participation.',
  },
  {
    q: 'How do I delete my account?',
    a: "Go to Settings > Danger Zone. Click 'Delete Account'. Please note this action is irreversible and will remove all your data and reports.",
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFaqs = faqs.filter((faq) =>
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">How can we help you?</h1>
        <p className="text-xl text-muted-foreground">Find answers, watch tutorials, or contact support.</p>

        <div className="relative max-w-lg mx-auto mt-6">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            className="pl-10 h-12 text-lg"
            placeholder="Search for help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="p-6 hover:border-primary cursor-pointer transition-colors text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Youtube className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Video Tutorials</h3>
            <p className="text-sm text-muted-foreground">Step-by-step guides on using features.</p>
          </div>
          <Button variant="outline" className="w-full">Watch Now</Button>
        </Card>

        <Card className="p-6 hover:border-primary cursor-pointer transition-colors text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Documentation</h3>
            <p className="text-sm text-muted-foreground">Read detailed feature guides.</p>
          </div>
          <Button variant="outline" className="w-full">Browse Docs</Button>
        </Card>

        <Card className="p-6 hover:border-primary cursor-pointer transition-colors text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Live Chat</h3>
            <p className="text-sm text-muted-foreground">Chat with our support team.</p>
          </div>
          <Button variant="outline" className="w-full">Start Chat</Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {filteredFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div>
          <Card className="p-6 sticky top-6">
            <h3 className="font-bold text-lg mb-4">Still need help?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Can't find what you're looking for? Send us a message and we'll get back to you within 24 hours.
            </p>
            <form className="space-y-4">
              <div className="space-y-2">
                <Input placeholder="Your Name" />
              </div>
              <div className="space-y-2">
                <Input type="email" placeholder="Your Email" />
              </div>
              <div className="space-y-2">
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe your issue..."
                />
              </div>
              <Button type="submit" className="w-full">
                <Mail className="w-4 h-4 mr-2" /> Send Message
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
