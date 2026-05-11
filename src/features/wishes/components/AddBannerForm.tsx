import { FormEvent, useMemo, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SearchableSelect, { type SearchableOption } from '@/components/ui/SearchableSelect';
import Select from '@/components/ui/Select';
import type { Campaign, PlannedBanner } from '@/types';
import { addDaysToDateInput, getInitialDateRange } from '../lib/bannerDates';

export type PlannedBannerDraft = Omit<PlannedBanner, 'id' | 'createdAt' | 'updatedAt'>;

const PRIORITY_OPTIONS = [
  { value: '1', label: '1 - Must pull' },
  { value: '2', label: '2 - High' },
  { value: '3', label: '3 - Maybe' },
  { value: '4', label: '4 - Low' },
  { value: '5', label: '5 - Watchlist' },
];

const STATUS_OPTIONS = [
  { value: 'speculative', label: 'Speculative' },
  { value: 'confirmed', label: 'Confirmed' },
];

interface AddBannerFormProps {
  characterOptions: SearchableOption[];
  onCreate: (draft: PlannedBannerDraft) => Promise<void>;
}

export default function AddBannerForm({ characterOptions, onCreate }: AddBannerFormProps) {
  const dateRange = useMemo(() => getInitialDateRange(), []);
  const [characterKey, setCharacterKey] = useState('');
  const [expectedStartDate, setExpectedStartDate] = useState(dateRange.start);
  const [expectedEndDate, setExpectedEndDate] = useState(dateRange.end);
  const [priority, setPriority] = useState<Campaign['priority']>(2);
  const [maxPullBudget, setMaxPullBudget] = useState('');
  const [status, setStatus] = useState('speculative');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const resetDraft = () => {
    const nextRange = getInitialDateRange();
    setCharacterKey('');
    setExpectedStartDate(nextRange.start);
    setExpectedEndDate(nextRange.end);
    setMaxPullBudget('');
    setStatus('speculative');
    setNotes('');
    setError('');
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const normalizedCharacterKey = characterKey.trim();
    if (!normalizedCharacterKey) {
      setError('Choose a banner character.');
      return;
    }
    if (!expectedStartDate || !expectedEndDate) {
      setError('Choose the expected banner window.');
      return;
    }
    if (expectedEndDate < expectedStartDate) {
      setError('Expected end date must be after the start date.');
      return;
    }

    const parsedBudget = Number(maxPullBudget);
    setIsCreating(true);
    try {
      await onCreate({
        characterKey: normalizedCharacterKey,
        expectedStartDate,
        expectedEndDate,
        priority,
        maxPullBudget: Number.isFinite(parsedBudget) && parsedBudget > 0 ? Math.floor(parsedBudget) : null,
        isConfirmed: status === 'confirmed',
        notes,
      });
      resetDraft();
    } catch {
      setError('Failed to save planned banner. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">Add Planned Banner</h2>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
            <SearchableSelect
              label="Banner character"
              placeholder="Search or type an unreleased character..."
              options={characterOptions}
              value={characterKey}
              onChange={setCharacterKey}
              allowFreeText
              required
            />
            <Input
              label="Expected start"
              type="date"
              value={expectedStartDate}
              onChange={(event) => {
                const nextStart = event.target.value;
                setExpectedStartDate(nextStart);
                if (!expectedEndDate || expectedEndDate < nextStart) {
                  setExpectedEndDate(addDaysToDateInput(nextStart, 20));
                }
              }}
              required
            />
            <Input
              label="Expected end"
              type="date"
              value={expectedEndDate}
              onChange={(event) => setExpectedEndDate(event.target.value)}
              required
            />
            <Select
              label="Priority"
              value={String(priority)}
              onChange={(event) => setPriority(Number(event.target.value) as Campaign['priority'])}
              options={PRIORITY_OPTIONS}
            />
            <Input
              label="Pull budget"
              type="number"
              min="0"
              value={maxPullBudget}
              onChange={(event) => setMaxPullBudget(event.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]">
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={STATUS_OPTIONS}
            />
            <Input
              label="Notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Source, rerun confidence, weapon pairing, or savings note"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" loading={isCreating}>
            <Plus className="w-4 h-4" />
            Add Banner
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
