import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useUIStore } from '@/stores/uiStore';

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

export default function SyncPage() {
  const { settings, theme, setTheme, updateSettings, resetSettings } = useUIStore((state) => ({
    settings: state.settings,
    theme: state.theme,
    setTheme: state.setTheme,
    updateSettings: state.updateSettings,
    resetSettings: state.resetSettings,
  }));

  const handleThemeChange = (nextTheme: 'light' | 'dark' | 'system') => {
    setTheme(nextTheme);
    updateSettings({ defaultTheme: nextTheme });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings & Sync</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage preferences, appearance, and data sync.</p>
        </div>
        <Button variant="ghost" onClick={resetSettings}>
          Reset to defaults
        </Button>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Theme</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Choose your default appearance. System will follow your OS setting automatically.
              </p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Active: <span className="font-medium text-slate-800 dark:text-slate-100">{theme}</span>
            </div>
          </div>
          <div className="max-w-sm">
            <Select
              label="Appearance"
              value={settings.defaultTheme}
              onChange={(event) => handleThemeChange(event.target.value as 'light' | 'dark' | 'system')}
              options={THEME_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Data & Sync</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cloud sync and backup options are coming soon. Your settings are saved locally until then.
          </p>
        </div>
      </section>
    </div>
  );
}
