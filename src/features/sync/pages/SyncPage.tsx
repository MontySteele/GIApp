import { useMemo, useState, type ChangeEvent } from 'react';
import { CheckCircle2, Clock3, Download, RefreshCw, Eye, EyeOff, Sun, Moon, Monitor } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAppMetaStatus } from '../hooks/useAppMetaStatus';
import { appMetaService, parseDateString, resolveBackupCadenceDays } from '../services/appMetaService';
import { useUIStore, type ThemeMode } from '@/stores/uiStore';
import { useTheme } from '@/hooks/useTheme';

function formatDate(dateString?: string | null) {
  const parsed = parseDateString(dateString ?? undefined);
  if (!parsed) return 'Not recorded yet';

  return parsed.toLocaleString();
}

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function SyncPage() {
  const { status, isLoading } = useAppMetaStatus();
  const { settings, updateSettings, resetSettings } = useUIStore();
  const { theme, setTheme } = useTheme();
  const [isMarking, setIsMarking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const cadenceDays = resolveBackupCadenceDays(settings.backupReminderCadenceDays);

  const referenceDate = parseDateString(status.lastBackupAt ?? status.createdAt);
  const nextBackupDate = useMemo(() => {
    if (!referenceDate) return null;
    const next = new Date(referenceDate);
    next.setDate(next.getDate() + cadenceDays);
    return next;
  }, [referenceDate, cadenceDays]);

  const handleMarkBackup = async () => {
    setIsMarking(true);
    setStatusMessage(null);
    try {
      await appMetaService.markBackupComplete();
      setStatusMessage('Backup timestamp updated');
    } catch (error) {
      console.error('Failed to mark backup complete', error);
      setStatusMessage('Failed to update backup timestamp. Please try again.');
    } finally {
      setIsMarking(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const backup = await appMetaService.exportBackup();
      const text = JSON.stringify(backup, null, 2);
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `giapp-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      await appMetaService.markBackupComplete();
      setStatusMessage('Backup exported and marked complete');
    } catch (error) {
      console.error('Failed to export backup', error);
      setStatusMessage('Failed to export backup. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCadenceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = Number(event.target.value);
    if (!Number.isFinite(rawValue)) {
      return;
    }

    updateSettings({ backupReminderCadenceDays: rawValue });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings & Sync</h1>
        <p className="text-slate-400">
          Manage backup reminders, export your data, and keep your progress safe.
        </p>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-primary-400" />
            ) : theme === 'light' ? (
              <Sun className="w-5 h-5 text-primary-400" />
            ) : (
              <Monitor className="w-5 h-5 text-primary-400" />
            )}
            <h2 className="text-xl font-semibold text-slate-100">Theme</h2>
          </div>
          <p className="text-slate-400 text-sm">
            Choose your preferred color scheme.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-primary-600 border-primary-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            {settings.showManualWishEntry || settings.showManualPrimogemEntry ? (
              <Eye className="w-5 h-5 text-primary-400" />
            ) : (
              <EyeOff className="w-5 h-5 text-primary-400" />
            )}
            <h2 className="text-xl font-semibold text-slate-100">Display preferences</h2>
          </div>
          <p className="text-slate-400 text-sm">
            Control which sections are expanded by default across the app.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
              <div>
                <p className="text-slate-100 font-medium">Show manual wish entry</p>
                <p className="text-slate-400 text-sm">Expand manual wish entry section by default on Wishes page</p>
              </div>
              <input
                type="checkbox"
                checked={settings.showManualWishEntry}
                onChange={(e) => updateSettings({ showManualWishEntry: e.target.checked })}
                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-900"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
              <div>
                <p className="text-slate-100 font-medium">Show manual primogem entry</p>
                <p className="text-slate-400 text-sm">Expand manual primogem/fate entry sections by default on Primogems page</p>
              </div>
              <input
                type="checkbox"
                checked={settings.showManualPrimogemEntry}
                onChange={(e) => updateSettings({ showManualPrimogemEntry: e.target.checked })}
                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-900"
              />
            </label>
          </div>
          <p className="text-xs text-slate-500">
            When disabled, manual entry sections are collapsed by default. You can still expand them manually on each page.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Clock3 className="w-5 h-5 text-primary-400" />
              <h2 className="text-xl font-semibold text-slate-100">Backup status</h2>
            </div>
            <p className="text-slate-400 text-sm">
              Track when you last exported your data and keep your backup cadence on schedule.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Last backup</p>
                <p className="text-lg font-semibold text-slate-100">{formatDate(status.lastBackupAt ?? status.createdAt)}</p>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Next suggested backup</p>
                <p className="text-lg font-semibold text-slate-100">
                  {nextBackupDate ? nextBackupDate.toLocaleString() : 'Not scheduled'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleExport} loading={isExporting}>
                <Download className="w-4 h-4" />
                Export data & mark done
              </Button>
              <Button variant="secondary" onClick={handleMarkBackup} loading={isMarking} disabled={isExporting}>
                <CheckCircle2 className="w-4 h-4" />
                Mark backup done
              </Button>
            </div>

            {statusMessage && (
              <div className="text-sm text-slate-300 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
                {statusMessage}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-primary-400" />
              <h2 className="text-xl font-semibold text-slate-100">Backup preferences</h2>
            </div>
            <p className="text-slate-400 text-sm">
              Configure how frequently GIApp reminds you to back up your data.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                min={1}
                label="Reminder cadence (days)"
                value={settings.backupReminderCadenceDays}
                onChange={handleCadenceChange}
              />
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Current cadence</p>
                <p className="text-lg font-semibold text-slate-100">
                  Every {cadenceDays} day{cadenceDays === 1 ? '' : 's'}
                </p>
                {settings.backupReminderCadenceDays !== cadenceDays && (
                  <p className="text-xs text-amber-300 mt-1">Using fallback due to invalid cadence value</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => resetSettings()}>
                Reset to defaults
              </Button>
              {!isLoading && status.needsBackup && (
                <p className="text-sm text-amber-200">Backup recommended based on your cadence.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
