import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Users, Shield, Clock, Star, Music, Heart, Sparkles, CheckCircle, Calendar, Globe } from 'lucide-react'
import { LivePerformersGrid } from '@/components/performers/live-performers-grid'
import { AgeGateModal } from '@/components/compliance/AgeGateModal'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <AgeGateModal />
      {/* Hero Section - Dark Theme */}
      <section className="relative dark-hero-gradient py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-orange-500/5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 orange-glow">
                <Star className="w-4 h-4 mr-2 fill-current" />
                Australia's #1 Entertainment Platform
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white">
              Book <span className="text-shimmer">Elite Performers</span>
              <br className="hidden sm:block" />
              For Your Next Event
            </h1>

            <p className="text-lg md:text-xl text-zinc-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Australia's premier platform connecting event organizers with professional,
              background-checked entertainers. From intimate gatherings to corporate events.
            </p>

            {/* CTA buttons with orange theme */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4 btn-premium orange-glow" asChild>
                <Link href="/performers">
                  Find Performers Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-4 border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-300" asChild>
                <Link href="/vetting/apply">
                  Become a Performer
                </Link>
              </Button>
            </div>

            {/* Trust indicators with orange accents */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-400">500+</div>
                <div className="text-zinc-400 text-sm">Verified Performers</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-400">2000+</div>
                <div className="text-zinc-400 text-sm">Successful Events</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-400">4.9★</div>
                <div className="text-zinc-400 text-sm">Average Rating</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-400">24h</div>
                <div className="text-zinc-400 text-sm">Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Dark Theme */}
      <section className="py-16 md:py-24 bg-zinc-950/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Why Choose Flavor Entertainers?</h2>
            <p className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
              We take the stress out of booking entertainment with our comprehensive vetting process and seamless platform.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="card-premium card-hover">
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-6 orange-glow">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Vetted Professionals</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center text-zinc-300 mb-6">
                  All performers undergo thorough background checks, document verification, and skill assessments
                  before joining our platform.
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-orange-400 mr-3" />
                    Background checks
                  </div>
                  <div className="flex items-center text-sm text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-orange-400 mr-3" />
                    Identity verification
                  </div>
                  <div className="flex items-center text-sm text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-orange-400 mr-3" />
                    Skill assessments
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium card-hover">
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-6 orange-glow">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Real-Time Booking</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center text-zinc-300 mb-6">
                  Browse available performers, check their calendars, and book instantly with our
                  real-time availability system.
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-orange-400 mr-3" />
                    Live availability
                  </div>
                  <div className="flex items-center text-sm text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-orange-400 mr-3" />
                    Instant confirmation
                  </div>
                  <div className="flex items-center text-sm text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-orange-400 mr-3" />
                    Mobile optimized
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium card-hover">
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-6 orange-glow">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl text-white">PayID & Safety</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center text-zinc-300 mb-6">
                  Secure, instant payments with Australia's PayID system plus comprehensive safety features
                  for peace of mind.
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-orange-400 mr-3" />
                    PayID integration
                  </div>
                  <div className="flex items-center text-sm text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-orange-400 mr-3" />
                    Safety tracking
                  </div>
                  <div className="flex items-center text-sm text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-orange-400 mr-3" />
                    24/7 support
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Performer Categories - Dark Theme */}
      <section className="py-16 md:py-24 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Find the Perfect Performer</h2>
            <p className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
              From intimate gatherings to large corporate events, we have entertainers for every occasion across Australia.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Music, name: 'Musicians', count: '150+', href: '/performers?category=musicians' },
              { icon: Heart, name: 'Dancers', count: '80+', href: '/performers?category=dancers' },
              { icon: Sparkles, name: 'Magicians', count: '45+', href: '/performers?category=magicians' },
              { icon: Users, name: 'Comedians', count: '60+', href: '/performers?category=comedians' },
            ].map((type, index) => (
              <Link key={index} href={type.href}>
                <Card className="text-center card-premium card-hover cursor-pointer group">
                  <CardContent className="pt-8 pb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 orange-glow group-hover:scale-110 transition-transform duration-300">
                      <type.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2 text-white text-lg">{type.name}</h3>
                    <p className="text-sm text-zinc-400">{type.count} performers</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-300" asChild>
              <Link href="/performers">
                View All Categories
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Live Performers Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <LivePerformersGrid />
        </div>
      </section>

      {/* CTA Section - Dark Theme with Orange Gradient */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-orange-600 to-orange-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Ready to Make Your Event Unforgettable?
          </h2>
          <p className="text-lg md:text-xl text-orange-100 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join thousands of satisfied clients who trust Flavor Entertainers for their events across Australia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
            <Button size="lg" variant="secondary" className="flex-1 sm:flex-none text-lg px-8 py-4 bg-white text-orange-600 hover:bg-gray-100 font-semibold" asChild>
              <Link href="/performers">
                Book Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="flex-1 sm:flex-none text-lg px-8 py-4 bg-transparent border-white text-white hover:bg-white hover:text-orange-600 transition-all duration-300" asChild>
              <Link href="/vetting/apply">
                Join as Performer
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
