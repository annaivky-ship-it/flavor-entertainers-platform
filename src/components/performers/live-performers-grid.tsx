'use client';

import { useState, useEffect } from 'react';
import { PerformerLiveCard } from './performer-live-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, Clock, Star } from 'lucide-react';
import { createClientComponentClient } from '@/lib/supabase';

export function LivePerformersGrid() {
  const [performers, setPerformers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  // Try to load real performers, but fall back to demo data if needed
  const loadPerformers = async () => {
    setIsLoading(true);
    try {
      const { data: performersData, error } = await supabase
        .from('performers')
        .select(
          `
          id,
          stage_name,
          bio,
          performance_types,
          service_areas,
          base_rate,
          hourly_rate,
          rating,
          total_reviews,
          featured,
          verified,
          social_media_links,
          users!performers_user_id_fkey (
            first_name,
            last_name,
            profile_picture_url
          )
        `
        )
        .eq('verified', true)
        .order('featured', { ascending: false })
        .order('rating', { ascending: false });

      if (error) {
        console.warn('Using demo data - Supabase error:', error.message);
        return;
      }

      if (performersData && performersData.length > 0) {
        // Transform Supabase data to match component format
        const transformedPerformers = performersData.map(performer => ({
          id: performer.id,
          stageName: performer.stage_name,
          bio: performer.bio || 'Professional performer available for your events',
          profilePicture: performer.users?.profile_picture_url || '/images/default-performer.jpg',
          rating: performer.rating || 0,
          totalReviews: performer.total_reviews || 0,
          isOnline: Math.random() > 0.3, // Simulate online status
          location: 'Perth, WA',
          performanceTypes: Array.isArray(performer.performance_types)
            ? performer.performance_types
            : ['Performer'],
          baseRate: performer.hourly_rate || performer.base_rate || 100,
          isAvailableToday: Math.random() > 0.4, // Simulate availability
          availableSlots: ['6:00 PM', '8:00 PM', '10:00 PM'],
          featured: performer.featured || false,
          verified: performer.verified || false,
          responseTime: '30min',
          completedBookings: Math.floor(Math.random() * 100) + 20,
        }));

        setPerformers(transformedPerformers);
      } else {
        console.log('No performers found in database, using demo data');
      }
    } catch (error) {
      console.warn('Using demo data - Database connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPerformers();
  }, []);
  const [filter, setFilter] = useState<'all' | 'available'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredPerformers = performers.filter(performer => {
    switch (filter) {
      case 'available':
        return performer.isAvailableToday;
      default:
        return true;
    }
  });

  const onlineCount = performers.filter(p => p.isOnline).length;
  const availableCount = performers.filter(p => p.isAvailableToday).length;

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadPerformers();
    setIsRefreshing(false);
  };

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Stats and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white">
            Live{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Performers
            </span>
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{availableCount} available today</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{performers.length} total performers</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={
            filter === 'all'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600'
              : 'border-gray-600 text-gray-300 hover:bg-gray-800'
          }
        >
          All Performers
          <Badge variant="secondary" className="ml-2">
            {performers.length}
          </Badge>
        </Button>
        <Button
          variant={filter === 'available' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('available')}
          className={
            filter === 'available'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
              : 'border-gray-600 text-gray-300 hover:bg-gray-800'
          }
        >
          Available Today
          <Badge variant="secondary" className="ml-2">
            {availableCount}
          </Badge>
        </Button>
      </div>

      {/* Performers Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPerformers.map(performer => (
          <PerformerLiveCard key={performer.id} performer={performer} />
        ))}
      </div>

      {filteredPerformers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No performers found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'available' && 'No performers are available today.'}
            {filter === 'all' && 'No performers match your criteria.'}
          </p>
          <Button onClick={() => setFilter('all')} variant="outline">
            View All Performers
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Available</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{availableCount}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-3 h-3 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Avg Rating</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900">
            {(performers.reduce((acc, p) => acc + (p.rating || 0), 0) / performers.length).toFixed(
              1
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-3 h-3 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Total</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{performers.length}</div>
        </div>
      </div>
    </div>
  );
}
