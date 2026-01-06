import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import {
  CalendarRange,
  Calculator,
  CheckCircle2,
  CloudDownload,
  Info,
  MonitorSmartphone,
  Palette,
  RefreshCcw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { DEFAULT_SETTINGS, useUIStore } from '@/stores/uiStore';

type SettingsFormState = typeof DEFAULT_SETTINGS;

const dateFormatOptions = [
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (US)' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (EU)' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (ISO)' },
];

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Match system' },
];

const simulationOptions: Array<5000 | 20000 | 100000> = [5000, 20000, 100000];
const confidenceOptions: Array<50 | 80 | 90 | 99> = [50, 80, 90, 99];

export default function SyncPage() {
  const { settings, updateSettings, resetSettings, setTheme } = useUIStore();
  const [formState, setFormState] = useState<SettingsFormState>({
    ...DEFAULT_SETTINGS,
    ...settings,
    calculatorDefaults: { ...DEFAULT_SETTINGS.calculatorDefaults, ...settings.calculatorDefaults },
  });
  const [pwaStatus, setPwaStatus] = useState({ installed: false, hasServiceWorker: false });

  const backupSummary = useMemo(() => {
    const cadence = formState.backupReminderCadenceDays;
    if (cadence <= 3) {
      return 'Daily backups recommended for active raiders';
    }
    if (cadence <= 7) {
      return 'Weekly reminders to export your roster safely';
    }
    return 'Occasional prompts so you never lose progress';
  }, [formState.backupReminderCadenceDays]);

  const previewDates = useMemo(
    () => ({
      event: format(new Date('2025-05-28T12:00:00Z'), formState.dateFormat),
      wish: format(new Date('2025-12-01T12:00:00Z'), formState.dateFormat),
    }),
    [formState.dateFormat],
  );

  useEffect(() => {
    setFormState({
      ...DEFAULT_SETTINGS,
      ...settings,
      calculatorDefaults: { ...DEFAULT_SETTINGS.calculatorDefaults, ...settings.calculatorDefaults },
    });
  }, [settings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const installed =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean })?.standalone === true;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
          setPwaStatus({
            installed,
            hasServiceWorker: Boolean(registration),
          });
        })
        .catch(() => {
          setPwaStatus({
            installed,
            hasServiceWorker: false,
          });
        });
    } else {
      setPwaStatus({
        installed,
        hasServiceWorker: false,
      });
    }
  }, []);

  const handleSave = () => {
    updateSettings({
      defaultTheme: formState.defaultTheme,
      dateFormat: formState.dateFormat,
      backupReminderCadenceDays: formState.backupReminderCadenceDays,
      calculatorDefaults: { ...formState.calculatorDefaults },
    });
    setTheme(formState.defaultTheme);
  };

  const handleReset = () => {
    resetSettings();
    setTheme(DEFAULT_SETTINGS.defaultTheme);
    setFormState({
      ...DEFAULT_SETTINGS,
      calculatorDefaults: { ...DEFAULT_SETTINGS.calculatorDefaults },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings & Sync</h1>
        <p className="text-slate-400">
          Tune how the app looks, how often you are reminded to back up, and how the calculator
          behaves by default.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatusCard
          icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
          title="Backup health"
          subtitle={backupSummary}
          detail={`Reminder every ${formState.backupReminderCadenceDays} day${
            formState.backupReminderCadenceDays === 1 ? '' : 's'
          }`}
        />
        <StatusCard
          icon={<MonitorSmartphone className="w-5 h-5 text-primary-300" />}
          title="Install status"
          subtitle={pwaStatus.installed ? 'App is already installed' : 'Install for offline use'}
          detail={pwaStatus.hasServiceWorker ? 'Offline cache is ready' : 'Waiting for PWA setup'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            icon={<Palette className="w-5 h-5 text-primary-300" />}
            title="Appearance"
            description="Control the interface theme. System mode follows your device setting automatically."
          >
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-2">
              Theme preference
              <Info
                className="w-4 h-4 text-slate-400"
                title="Use system to automatically follow your OS light/dark preference."
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormState((prev) => ({ ...prev, defaultTheme: option.value as SettingsFormState['defaultTheme'] }))
                  }
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                    formState.defaultTheme === option.value
                      ? 'border-primary-500 bg-primary-500/10 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  {formState.defaultTheme === option.value && (
                    <CheckCircle2 className="w-4 h-4 text-primary-400" />
                  )}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            icon={<CalendarRange className="w-5 h-5 text-amber-300" />}
            title="Date format"
            description="Choose how dates are displayed across history, pull logs, and reminders."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-2">
                  Preferred pattern
                  <Info
                    className="w-4 h-4 text-slate-400"
                    title="This controls how event timelines and wish history are rendered."
                  />
                </label>
                <select
                  value={formState.dateFormat}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, dateFormat: event.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100 focus:border-primary-500 focus:outline-none"
                >
                  {dateFormatOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300">
                <p className="font-semibold mb-1 text-slate-100">Preview</p>
                <p className="text-slate-300">Event start: {previewDates.event}</p>
                <p className="text-slate-300">Wish logged: {previewDates.wish}</p>
                <p className="text-slate-400 mt-2">
                  Pattern updates immediately after saving your changes.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<Calculator className="w-5 h-5 text-emerald-300" />}
            title="Calculator defaults"
            description="Set the initial values for probability simulations and reverse calculations."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  Starting pulls
                  <Info
                    className="w-4 h-4 text-slate-400"
                    title="Used as the default balance when opening the calculator."
                  />
                </label>
                <input
                  type="number"
                  min={0}
                  value={formState.calculatorDefaults.availablePulls}
                  onChange={(event) =>
                    setFormState((prev) => {
                      const value = Number(event.target.value);
                      return {
                        ...prev,
                        calculatorDefaults: {
                          ...prev.calculatorDefaults,
                          availablePulls: Number.isNaN(value) ? 0 : value,
                        },
                      };
                    })
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100 focus:border-primary-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400">Remember to include starglitter conversions.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  Simulation depth
                  <Info
                    className="w-4 h-4 text-slate-400"
                    title="Higher counts improve accuracy but take longer to compute."
                  />
                </label>
                <select
                  value={formState.calculatorDefaults.simulationCount}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      calculatorDefaults: {
                        ...prev.calculatorDefaults,
                        simulationCount: Number(event.target.value) as SettingsFormState['calculatorDefaults']['simulationCount'],
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100 focus:border-primary-500 focus:outline-none"
                >
                  {simulationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.toLocaleString()} runs
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">
                  20,000 runs balances speed and reliability for most devices.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  Confidence level
                  <Info
                    className="w-4 h-4 text-slate-400"
                    title="Sets the risk tolerance shown in success chance summaries."
                  />
                </label>
                <select
                  value={formState.calculatorDefaults.confidenceLevel}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      calculatorDefaults: {
                        ...prev.calculatorDefaults,
                        confidenceLevel: Number(event.target.value) as SettingsFormState['calculatorDefaults']['confidenceLevel'],
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100 focus:border-primary-500 focus:outline-none"
                >
                  {confidenceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}% certainty
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">99% gives the most conservative estimates.</p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            icon={<CloudDownload className="w-5 h-5 text-sky-300" />}
            title="PWA & installability"
            description="Install the app for faster launches, offline access, and a distraction-free experience."
          >
            <div className="space-y-3 text-sm text-slate-300">
              <StatusPill
                label={pwaStatus.installed ? 'Installed on this device' : 'Install not detected'}
                tone={pwaStatus.installed ? 'success' : 'muted'}
              />
              <StatusPill
                label={pwaStatus.hasServiceWorker ? 'Offline cache configured' : 'Waiting for service worker'}
                tone={pwaStatus.hasServiceWorker ? 'success' : 'warn'}
              />
              <ul className="list-disc pl-5 space-y-2 text-slate-400">
                <li>On desktop: click your browser&apos;s install or download icon in the address bar.</li>
                <li>On mobile: open the menu and choose &quot;Add to Home Screen&quot;.</li>
                <li>
                  Keep the app open once after installing so the offline cache can finish preparing.
                </li>
              </ul>
            </div>
          </SectionCard>

          <SectionCard
            icon={<ShieldCheck className="w-5 h-5 text-emerald-300" />}
            title="Backup reminders"
            description="Set how often we nudge you to export your progress to a safe place."
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  Reminder cadence (days)
                  <Info
                    className="w-4 h-4 text-slate-400"
                    title="Lower numbers mean more frequent reminders to export or sync data."
                  />
                </label>
                <input
                  type="number"
                  min={1}
                  value={formState.backupReminderCadenceDays}
                  onChange={(event) =>
                    setFormState((prev) => {
                      const value = Number(event.target.value);
                      return {
                        ...prev,
                        backupReminderCadenceDays: Number.isNaN(value) ? 1 : Math.max(1, value),
                      };
                    })
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100 focus:border-primary-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400">
                  Tip: align reminders with your usual patch note review or resin reset schedule.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300">
                <p className="font-semibold mb-1 text-slate-100">Backup summary</p>
                <p className="text-slate-300">{backupSummary}</p>
                <p className="text-slate-400 mt-2">
                  Export your data regularly to cloud storage or a password manager note for safekeeping.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-slate-200 transition-colors hover:border-slate-700"
        >
          <RefreshCcw className="w-4 h-4" />
          Reset to defaults
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-500"
        >
          <Save className="w-4 h-4" />
          Save changes
        </button>
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 shadow-sm shadow-slate-900/30">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-slate-900 p-2">{icon}</div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function StatusCard({
  icon,
  title,
  subtitle,
  detail,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-sm shadow-slate-900/30">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">{icon}</div>
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-base font-semibold text-white">{subtitle}</p>
        </div>
      </div>
      <p className="text-sm text-slate-400">{detail}</p>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'success' | 'warn' | 'muted' }) {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/40'
      : tone === 'warn'
        ? 'bg-amber-500/10 text-amber-200 border-amber-500/40'
        : 'bg-slate-800 text-slate-200 border-slate-700';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>
      <CheckCircle2 className="w-3 h-3" />
      {label}
    </div>
  );
}
