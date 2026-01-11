import { ExternalLink, Clock, AlertCircle } from 'lucide-react';
import type { ParsedEvent } from '../domain/eventTypes';
import { EVENT_TYPE_COLORS } from '../domain/eventTypes';

interface EventCardProps {
  event: ParsedEvent;
  showImage?: boolean;
}

function EventCard({ event, showImage = false }: EventCardProps) {
  const colorClasses = EVENT_TYPE_COLORS[event.type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      {showImage && event.img && (
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={event.img}
            alt={event.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colorClasses}`}>
                {event.type}
              </span>
              {event.isActive && (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-500/20 text-green-400 border border-green-500/30">
                  Active
                </span>
              )}
            </div>
            <h3 className="font-medium text-slate-200 line-clamp-2">{event.name}</h3>
            <div className="mt-2 space-y-1 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {event.isActive && event.timeUntilEnd && (
                    <>Ends in <span className="text-amber-400">{event.timeUntilEnd}</span></>
                  )}
                  {event.isUpcoming && event.timeUntilStart && (
                    <>Starts in <span className="text-primary-400">{event.timeUntilStart}</span></>
                  )}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {formatDate(event.startDate)}
                {event.endDate && <> — {formatDate(event.endDate)}</>}
              </div>
            </div>
          </div>
          {event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-primary-400 transition-colors"
              title="View details"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface EventListProps {
  title: string;
  events: ParsedEvent[];
  emptyMessage?: string;
  showImages?: boolean;
  maxItems?: number;
}

export default function EventList({
  title,
  events,
  emptyMessage = 'No events',
  showImages = false,
  maxItems,
}: EventListProps) {
  const displayEvents = maxItems ? events.slice(0, maxItems) : events;
  const hasMore = maxItems && events.length > maxItems;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
        <span className="text-sm text-slate-500">{events.length} events</span>
      </div>

      {displayEvents.length === 0 ? (
        <div className="bg-slate-800/30 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayEvents.map((event) => (
              <EventCard key={event.id} event={event} showImage={showImages} />
            ))}
          </div>
          {hasMore && (
            <p className="text-center text-sm text-slate-500">
              +{events.length - maxItems} more events
            </p>
          )}
        </>
      )}
    </div>
  );
}
