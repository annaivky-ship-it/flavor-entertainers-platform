import { PerformerGrid } from '@/components/performers/performer-grid'
import { PerformerFilters } from '@/components/performers/performer-filters'
import { Navbar } from '@/components/navigation/navbar'
import { Suspense } from 'react'

export default function PerformersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            Find Your Perfect <span className="text-orange-600">Performer</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Browse our vetted professional entertainers. All performers are background-checked,
            insured, and ready to make your event unforgettable.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Suspense fallback={<div>Loading filters...</div>}>
                <PerformerFilters />
              </Suspense>
            </div>
          </div>

          {/* Performers Grid */}
          <div className="lg:col-span-3">
            <Suspense fallback={<div>Loading performers...</div>}>
              <PerformerGrid />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}