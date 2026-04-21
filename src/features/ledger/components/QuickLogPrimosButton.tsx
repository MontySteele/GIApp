import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { resourceSnapshotRepo } from '../repo/resourceSnapshotRepo';
import { buildQuickPrimoSnapshot } from '../domain/quickSnapshot';
import type { ResourceSnapshot } from '@/types';

interface QuickLogPrimosButtonProps {
  latestSnapshot: ResourceSnapshot | undefined;
}

export default function QuickLogPrimosButton({ latestSnapshot }: QuickLogPrimosButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isOpen]);

  const handleOpen = () => {
    setValue(latestSnapshot ? String(latestSnapshot.primogems) : '');
    setIsOpen(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setValue('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Invalid primogem count', 'Enter a non-negative number.');
      return;
    }

    setIsSaving(true);
    try {
      const snapshot = buildQuickPrimoSnapshot(latestSnapshot, Math.floor(parsed));
      await resourceSnapshotRepo.create(snapshot);
      toast.success('Primogem snapshot saved', `${Math.floor(parsed).toLocaleString()} primogems logged.`);
      setIsOpen(false);
      setValue('');
    } catch (err) {
      toast.error('Failed to save snapshot', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={handleOpen}
        aria-label="Quick log current primogems"
      >
        <Plus className="w-4 h-4" />
        Quick log primos
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
      aria-label="Quick log primogems"
    >
      <label htmlFor="quick-log-primos-input" className="sr-only">
        Current primogems
      </label>
      <input
        id="quick-log-primos-input"
        ref={inputRef}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
          }
        }}
        placeholder="Current primogems"
        className="w-36 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <Button type="submit" size="sm" loading={isSaving}>
        Save
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        aria-label="Cancel quick log"
        disabled={isSaving}
      >
        <X className="w-4 h-4" />
      </Button>
    </form>
  );
}
