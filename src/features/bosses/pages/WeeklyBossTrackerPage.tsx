import { Info } from 'lucide-react';
import WeeklyBossTracker from '../components/WeeklyBossTracker';

export default function WeeklyBossTrackerPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Weekly Bosses</h1>

      {/* Main Tracker */}
      <WeeklyBossTracker />

      {/* Info footer */}
      <div className="bg-slate-800/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-slate-500">
          <p>
            Track your weekly boss completions. The first 3 bosses cost{' '}
            <strong>30 Original Resin</strong> (discounted), while additional bosses cost{' '}
            <strong>60 Original Resin</strong>.
          </p>
          <p className="mt-2">
            Weekly bosses reset every <strong>Monday at 4:00 AM (US Server, UTC-5)</strong>.
            Your progress is saved locally and resets automatically each week.
          </p>
        </div>
      </div>
    </div>
  );
}
