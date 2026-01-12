import { useState } from 'react';
import {
  CalendarDays,
  Gem,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import {
  useBannerPlanner,
  formatPrimos,
  type IncomeMode,
  type BannerForecast,
} from '../hooks/useBannerPlanner';
import type { PlannedBanner } from '@/types';
import { PRIMOS_PER_PULL } from '@/lib/constants';

export default function BannerPlannerPage() {
  const {
    banners,
    isLoading,
    plan,
    currentPrimos,
    setCurrentPrimos,
    currentFates,
    setCurrentFates,
    incomeMode,
    setIncomeMode,
    addBanner,
    updateBanner,
    deleteBanner,
  } = useBannerPlanner();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const totalCurrentPulls = currentFates + Math.floor(currentPrimos / PRIMOS_PER_PULL);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Banner Planner</h1>
        <p className="text-slate-400">Plan your pulls and track primogem savings</p>
      </div>

      {/* Resource Tracker */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Gem className="w-5 h-5 text-yellow-400" />
            Current Resources
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Primogems</label>
              <input
                type="number"
                value={currentPrimos}
                onChange={(e) => setCurrentPrimos(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Intertwined Fates</label>
              <input
                type="number"
                value={currentFates}
                onChange={(e) => setCurrentFates(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Income Mode</label>
              <Select
                value={incomeMode}
                onChange={(e) => setIncomeMode(e.target.value as IncomeMode)}
                options={[
                  { value: 'f2p', label: 'F2P (~60/day)' },
                  { value: 'welkin', label: 'Welkin (~150/day)' },
                  { value: 'events', label: 'Active (~200/day)' },
                ]}
              />
            </div>
            <div className="bg-slate-900 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Total Pulls Available</div>
              <div className="text-2xl font-bold text-yellow-400">{totalCurrentPulls}</div>
              <div className="text-xs text-slate-500">
                {formatPrimos(currentPrimos)} primos + {currentFates} fates
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-100">{banners.length}</p>
            <p className="text-xs text-slate-400">Planned Banners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{plan.totalPullsNeeded}</p>
            <p className="text-xs text-slate-400">Pulls Needed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary-400">{formatPrimos(plan.totalPrimosNeeded)}</p>
            <p className="text-xs text-slate-400">Primos Needed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-100">{plan.daysUntilGoal}</p>
            <p className="text-xs text-slate-400">Days to Goal</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Banner Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-lg text-slate-400 hover:text-slate-200 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Planned Banner
        </button>
      )}

      {/* Add Banner Form */}
      {showAddForm && (
        <BannerForm
          onSubmit={async (banner) => {
            await addBanner(banner);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Banner Timeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Banner Timeline
        </h2>

        {plan.bannerForecasts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No banners planned yet</p>
              <p className="text-sm text-slate-500 mt-2">
                Add upcoming banners to track your primogem savings goals
              </p>
            </CardContent>
          </Card>
        ) : (
          plan.bannerForecasts.map((forecast) => (
            <BannerCard
              key={forecast.banner.id}
              forecast={forecast}
              isEditing={editingId === forecast.banner.id}
              onEdit={() => setEditingId(forecast.banner.id)}
              onSave={async (updates) => {
                await updateBanner(forecast.banner.id, updates);
                setEditingId(null);
              }}
              onDelete={() => deleteBanner(forecast.banner.id)}
              onCancelEdit={() => setEditingId(null)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface BannerFormProps {
  initialData?: Partial<PlannedBanner>;
  onSubmit: (banner: Omit<PlannedBanner, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

function BannerForm({ initialData, onSubmit, onCancel }: BannerFormProps) {
  const [characterKey, setCharacterKey] = useState(initialData?.characterKey ?? '');
  const [startDate, setStartDate] = useState<string>(
    initialData?.expectedStartDate?.split('T')[0] ?? new Date().toISOString().split('T')[0] ?? ''
  );
  const [endDate, setEndDate] = useState<string>(
    initialData?.expectedEndDate?.split('T')[0] ??
      new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? ''
  );
  const [priority, setPriority] = useState<1 | 2 | 3 | 4 | 5>(initialData?.priority ?? 3);
  const [maxPulls, setMaxPulls] = useState(initialData?.maxPullBudget ?? 90);
  const [isConfirmed, setIsConfirmed] = useState(initialData?.isConfirmed ?? false);
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!characterKey.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        characterKey: characterKey.trim(),
        expectedStartDate: new Date(startDate).toISOString(),
        expectedEndDate: new Date(endDate).toISOString(),
        priority,
        maxPullBudget: maxPulls > 0 ? maxPulls : null,
        isConfirmed,
        notes,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">{initialData ? 'Edit Banner' : 'Add Planned Banner'}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Character Name</label>
            <input
              type="text"
              value={characterKey}
              onChange={(e) => setCharacterKey(e.target.value)}
              placeholder="e.g., Furina"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Priority</label>
            <Select
              value={String(priority)}
              onChange={(e) => setPriority(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
              options={[
                { value: '1', label: '1 - Must Pull' },
                { value: '2', label: '2 - High Priority' },
                { value: '3', label: '3 - Want' },
                { value: '4', label: '4 - Maybe' },
                { value: '5', label: '5 - Skip Unless Lucky' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Pull Budget</label>
            <input
              type="number"
              value={maxPulls}
              onChange={(e) => setMaxPulls(Number(e.target.value))}
              placeholder="90"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800"
            />
            <span className="text-sm text-slate-300">Officially Confirmed</span>
          </label>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            rows={2}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!characterKey.trim() || isSubmitting}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded text-white"
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Banner'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

interface BannerCardProps {
  forecast: BannerForecast;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<PlannedBanner>) => Promise<void>;
  onDelete: () => void;
  onCancelEdit: () => void;
}

function BannerCard({ forecast, isEditing, onEdit, onSave, onDelete, onCancelEdit }: BannerCardProps) {
  const { banner, daysUntilBanner, primosAvailable, pullsAvailable, canReachGoal, pullDeficit } = forecast;

  const priorityColors: Record<number, string> = {
    1: 'bg-red-900/30 border-red-700',
    2: 'bg-orange-900/30 border-orange-700',
    3: 'bg-yellow-900/30 border-yellow-700',
    4: 'bg-blue-900/30 border-blue-700',
    5: 'bg-slate-800 border-slate-700',
  };

  const priorityLabels: Record<number, string> = {
    1: 'Must Pull',
    2: 'High Priority',
    3: 'Want',
    4: 'Maybe',
    5: 'Skip',
  };

  if (isEditing) {
    return (
      <BannerForm
        initialData={banner}
        onSubmit={onSave}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <Card className={`${priorityColors[banner.priority]} border`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-slate-100">{banner.characterKey}</h3>
              <Badge variant={banner.isConfirmed ? 'success' : 'warning'}>
                {banner.isConfirmed ? 'Confirmed' : 'Speculation'}
              </Badge>
              <Badge variant="default">{priorityLabels[banner.priority]}</Badge>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                {new Date(banner.expectedStartDate).toLocaleDateString()} -{' '}
                {new Date(banner.expectedEndDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {daysUntilBanner > 0 ? `${daysUntilBanner} days away` : 'Active now'}
              </span>
            </div>

            {/* Forecast */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="bg-slate-900/50 rounded p-2">
                <div className="text-xs text-slate-500">Pulls Budget</div>
                <div className="font-bold text-slate-200">
                  {banner.maxPullBudget ?? 'Unlimited'}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded p-2">
                <div className="text-xs text-slate-500">Pulls Available</div>
                <div className="font-bold text-slate-200">{pullsAvailable}</div>
              </div>
              <div className="bg-slate-900/50 rounded p-2">
                <div className="text-xs text-slate-500">Primos by Banner</div>
                <div className="font-bold text-yellow-400">{formatPrimos(primosAvailable)}</div>
              </div>
              <div className="bg-slate-900/50 rounded p-2">
                <div className="text-xs text-slate-500">Status</div>
                {canReachGoal ? (
                  <div className="font-bold text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    On Track
                  </div>
                ) : (
                  <div className="font-bold text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    -{pullDeficit} pulls
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {banner.notes && (
              <p className="text-sm text-slate-400 italic">{banner.notes}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 ml-4">
            <button
              onClick={onEdit}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
