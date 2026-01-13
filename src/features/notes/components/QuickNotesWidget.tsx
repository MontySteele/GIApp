import { Link } from 'react-router-dom';
import { StickyNote, Pin, Plus, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useGoals } from '../hooks/useGoals';
import { useNotes } from '../hooks/useNotes';

const STICKY_COLORS = [
  { bg: 'bg-amber-900/40', border: 'border-amber-700/50', text: 'text-amber-100' },
  { bg: 'bg-emerald-900/40', border: 'border-emerald-700/50', text: 'text-emerald-100' },
  { bg: 'bg-sky-900/40', border: 'border-sky-700/50', text: 'text-sky-100' },
  { bg: 'bg-violet-900/40', border: 'border-violet-700/50', text: 'text-violet-100' },
  { bg: 'bg-pink-900/40', border: 'border-pink-700/50', text: 'text-pink-100' },
  { bg: 'bg-orange-900/40', border: 'border-orange-700/50', text: 'text-orange-100' },
];

function getColorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % STICKY_COLORS.length;
  return STICKY_COLORS[index]!;
}

interface QuickNotesWidgetProps {
  maxStickies?: number;
  maxNotes?: number;
}

export default function QuickNotesWidget({
  maxStickies = 4,
  maxNotes = 2,
}: QuickNotesWidgetProps) {
  const { goals: stickies, isLoading: stickiesLoading } = useGoals();
  const { notes, isLoading: notesLoading } = useNotes({});

  const isLoading = stickiesLoading || notesLoading;

  // Get pinned notes first, then recent
  const pinnedNotes = notes.filter((n) => n.pinned).slice(0, maxNotes);
  const recentStickies = stickies.slice(0, maxStickies);

  const hasContent = pinnedNotes.length > 0 || recentStickies.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-24 flex items-center justify-center">
            <div className="text-slate-500">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold">Notes & Reminders</h3>
        </div>
        <Link
          to="/notes"
          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
        >
          All Notes <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {!hasContent ? (
          <div className="text-center py-4">
            <p className="text-slate-500 text-sm mb-3">
              No pinned notes or stickies yet
            </p>
            <Link to="/notes">
              <Button variant="secondary" size="sm">
                <Plus className="w-4 h-4" />
                Add a Note
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stickies */}
            {recentStickies.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {recentStickies.map((sticky) => {
                  const color = getColorForId(sticky.id);
                  return (
                    <Link
                      key={sticky.id}
                      to="/notes"
                      className={`${color.bg} ${color.border} border rounded-lg p-3 hover:scale-[1.02] transition-transform`}
                    >
                      <h4 className={`font-medium ${color.text} text-sm line-clamp-1`}>
                        {sticky.title || 'Untitled'}
                      </h4>
                      <p className={`text-xs ${color.text} opacity-70 line-clamp-2 mt-1`}>
                        {sticky.description || 'No description'}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-2">
                {pinnedNotes.map((note) => (
                  <Link
                    key={note.id}
                    to="/notes"
                    className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Pin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-200 text-sm truncate">
                        {note.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {note.content.substring(0, 100)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
