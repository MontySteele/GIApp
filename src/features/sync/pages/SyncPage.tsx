import { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useDateFormatter } from '@/lib/dateFormat';
import { DEFAULT_SETTINGS, useUIStore } from '@/stores/uiStore';

const DATE_FORMAT_PRESETS = [
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (01/05/2025)' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (05/01/2025)' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (2025-01-05)' },
  { value: 'MMMM d, yyyy', label: 'Month D, YYYY (January 5, 2025)' },
  { value: 'EEE, MMM d', label: 'Day, Month D (Sun, Jan 5)' },
  { value: 'custom', label: 'Custom format' },
];

export default function SyncPage() {
  const { settings, updateSettings } = useUIStore((state) => ({
    settings: state.settings,
    updateSettings: state.updateSettings,
  }));
  const [customFormat, setCustomFormat] = useState(settings.dateFormat);

  const isCustomFormat = !DATE_FORMAT_PRESETS.some((preset) => preset.value === settings.dateFormat);
  const selectedPreset = isCustomFormat ? 'custom' : settings.dateFormat;

  const formatDate = useDateFormatter();
  const previewDate = formatDate(new Date());

  useEffect(() => {
    if (isCustomFormat) {
      setCustomFormat(settings.dateFormat);
    }
  }, [isCustomFormat, settings.dateFormat]);

  const handlePresetChange = (value: string) => {
    if (value === 'custom') {
      const fallbackFormat = customFormat || DEFAULT_SETTINGS.dateFormat;
      updateSettings({ dateFormat: fallbackFormat });
      return;
    }

    updateSettings({ dateFormat: value });
  };

  const handleCustomChange = (value: string) => {
    setCustomFormat(value);
    const sanitizedValue = value.trim();
    updateSettings({ dateFormat: sanitizedValue || DEFAULT_SETTINGS.dateFormat });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings & Sync</h1>
        <p className="text-slate-400">Customize your experience and manage your data.</p>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Date format</h2>
            <p className="text-slate-400 text-sm">
              Choose how dates are displayed across wishes, ledger entries, and more.
            </p>
          </div>
          <div className="text-sm text-slate-300">
            Preview:{' '}
            <span className="font-semibold text-slate-100">
              {previewDate || formatDate(new Date(), { formatOverride: DEFAULT_SETTINGS.dateFormat })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Preset"
            value={selectedPreset}
            onChange={(event) => handlePresetChange(event.target.value)}
            options={DATE_FORMAT_PRESETS}
          />
          <Input
            label="Custom format"
            placeholder="e.g. yyyy/MM/dd"
            value={customFormat}
            onChange={(event) => handleCustomChange(event.target.value)}
            disabled={!isCustomFormat}
          />
        </div>

        <p className="text-xs text-slate-500">
          Uses date-fns tokens (e.g. yyyy, MM, dd, MMMM). Invalid formats fall back to the default.
        </p>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
        <h2 className="text-xl font-semibold">Data sync & backup</h2>
        <p className="text-slate-400 text-sm">
          Cloud sync and export tools are in progress. Stay tuned for upcoming releases.
        </p>
      </section>
    </div>
  );
}
