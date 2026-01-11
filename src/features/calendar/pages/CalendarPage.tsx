import { RefreshCw, AlertTriangle, Info } from 'lucide-react';
import ResetTimers from '../components/ResetTimers';
import EventList from '../components/EventList';
import { useEvents } from '../hooks/useEvents';

export default function CalendarPage() {
  const {
    activeEvents,
    upcomingEvents,
    activeBanners,
    isLoading,
    error,
    lastUpdated,
    refresh,
  } = useEvents();

  // Separate active events by type for better organization
  const activeInGameEvents = activeEvents.filter((e) => e.type === 'In-game');
  const activeWebEvents = activeEvents.filter((e) => e.type === 'Web');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Failed to fetch events</p>
            <p className="text-sm text-red-400/70 mt-1">{error}</p>
            {lastUpdated && (
              <p className="text-xs text-slate-500 mt-2">
                Showing cached data from {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Reset Timers */}
      <ResetTimers />

      {/* Active Banners */}
      {activeBanners.length > 0 && (
        <EventList
          title="Current Banners"
          events={activeBanners}
          showImages
          emptyMessage="No active banners"
        />
      )}

      {/* Active In-Game Events */}
      <EventList
        title="Active Events"
        events={activeInGameEvents}
        showImages
        emptyMessage="No active in-game events"
      />

      {/* Active Web Events */}
      {activeWebEvents.length > 0 && (
        <EventList
          title="Web Events"
          events={activeWebEvents}
          emptyMessage="No active web events"
        />
      )}

      {/* Upcoming Events */}
      <EventList
        title="Upcoming Events"
        events={upcomingEvents}
        maxItems={6}
        emptyMessage="No upcoming events scheduled"
      />

      {/* Data source attribution */}
      <div className="bg-slate-800/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-slate-500">
          <p>
            Event data from{' '}
            <a
              href="https://github.com/Tibowl/HuTao"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:underline"
            >
              HuTao bot
            </a>
            . Reset times based on US Server (UTC-5).
          </p>
          {lastUpdated && !error && (
            <p className="mt-1 text-slate-600">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
