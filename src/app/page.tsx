import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Users, Shield, Clock, Star, Music, Heart, Sparkles, CheckCircle, Calendar, Globe } from 'lucide-react'
import { LivePerformersGrid } from '@/components/performers/live-performers-grid'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-background">
      {/* Hero Section - Mobile First */}
      <section className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                <Star className="w-4 h-4 mr-1 fill-current" />
                5-Star Rated Platform
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Book <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Vetted Performers</span>
              <br className="hidden sm:block" />
              For Your Perth Events
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Australia's premier platform connecting event organizers with professional,
              background-checked entertainers across Perth and Western Australia.
            </p>

            {/* Mobile-first CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700" asChild>
                <Link href="/performers">
                  Find Performers Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-4" asChild>
                <Link href="/vetting/apply">
                  Become a Performer
                </Link>
              </Button>
            </div>

            {/* Trust indicators - Mobile optimized */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div className="flex flex-col items-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">500+</div>
                <div className="text-muted-foreground">Performers</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">2000+</div>
                <div className="text-muted-foreground">Events</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">4.9★</div>
                <div className="text-muted-foreground">Rating</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">24h</div>
                <div className="text-muted-foreground">Response</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-20 dark-hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Book <span className="brand-gradient-text">Vetted Performers</span><br />
              For Your Next Event
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Australia's premier platform connecting event organizers with professional,
              background-checked entertainers. From musicians to magicians, we've got your event covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8 brand-gradient hover:opacity-90 transition-opacity">
                  Find Performers
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="text-lg px-8 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                  Become a Performer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Mobile First */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Flavor Entertainers?</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              We take the stress out of booking entertainment with our comprehensive vetting process and seamless platform.
            </p>
          </div>

          <div className="grid gap-6 md:gap-8 md:grid-cols-3">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">Vetted Professionals</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center">
                  All performers undergo thorough background checks, document verification, and skill assessments
                  before joining our platform.
                </CardDescription>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Background checks
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Identity verification
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Skill assessments
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">Real-Time Booking</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center">
                  Browse available performers, check their calendars, and book instantly with our
                  real-time availability system.
                </CardDescription>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Live availability
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Instant confirmation
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Mobile optimized
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">PayID & Safety</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center">
                  Secure, instant payments with Australia's PayID system plus comprehensive safety features
                  for peace of mind.
                </CardDescription>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    PayID integration
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Safety tracking
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    24/7 support
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Performer Categories - Mobile First */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Find the Perfect Performer</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              From intimate gatherings to large corporate events, we have entertainers for every occasion in Perth and WA.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Music, name: 'Musicians', count: '150+', href: '/performers?category=musicians' },
              { icon: Heart, name: 'Dancers', count: '80+', href: '/performers?category=dancers' },
              { icon: Sparkles, name: 'Magicians', count: '45+', href: '/performers?category=magicians' },
              { icon: Users, name: 'Comedians', count: '60+', href: '/performers?category=comedians' },
            ].map((type, index) => (
              <Link key={index} href={type.href}>
                <Card className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-0 bg-background">
                  <CardContent className="pt-6 pb-6">
                    <type.icon className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-1 text-sm md:text-base">{type.name}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{type.count} performers</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg" asChild>
              <Link href="/performers">
                View All Categories
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Live Performers Section */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <LivePerformersGrid />
        </div>
      </section>

      {/* CTA Section - Mobile First */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            Ready to Make Your Event Unforgettable?
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied clients who trust Flavor Entertainers for their Perth events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button size="lg" variant="secondary" className="flex-1 sm:flex-none text-lg px-8" asChild>
              <Link href="/performers">
                Book Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="flex-1 sm:flex-none text-lg px-8 bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/vetting/apply">
                Join as Performer
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
