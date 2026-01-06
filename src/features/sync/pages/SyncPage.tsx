import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DEFAULT_SETTINGS, useUIStore } from '@/stores/uiStore';
import type { BannerType } from '@/types';

export default function SyncPage() {
  const { settings, updateSettings, resetSettings } = useUIStore();

  const updateCalculatorDefaults = <Key extends keyof typeof settings.calculatorDefaults>(
    key: Key,
    value: (typeof settings.calculatorDefaults)[Key]
  ) => {
    updateSettings({
      calculatorDefaults: {
        [key]: value,
      },
    });
  };

  const updatePityPreset = (key: 'pity' | 'guaranteed' | 'radiantStreak', value: number | boolean) => {
    updateSettings({
      calculatorDefaults: {
        pityPreset: {
          ...settings.calculatorDefaults.pityPreset,
          [key]: value,
        },
      },
    });
  };

  const resetAllSettings = () => {
    resetSettings();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings & Sync</h1>
          <p className="text-slate-400">Configure calculator defaults and account preferences</p>
        </div>
        <Button variant="secondary" onClick={resetAllSettings}>
          Reset to factory defaults
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Calculator Defaults</h2>
          <p className="text-sm text-slate-400">
            These values are used to pre-fill the calculators and can be reset in each calculator view.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Preferred Banner Type"
              value={settings.calculatorDefaults.bannerType}
              onChange={(e) => updateCalculatorDefaults('bannerType', e.target.value as BannerType)}
              options={[
                { value: 'character', label: 'Character Event' },
                { value: 'weapon', label: 'Weapon Event' },
                { value: 'standard', label: 'Standard' },
                { value: 'chronicled', label: 'Chronicled' },
              ]}
            />
            <Select
              label="Simulation Count"
              value={settings.calculatorDefaults.simulationCount}
              onChange={(e) => updateCalculatorDefaults('simulationCount', Number(e.target.value))}
              options={[
                { value: 5000, label: '5,000 (fast)' },
                { value: 20000, label: '20,000 (balanced)' },
                { value: 100000, label: '100,000 (precise)' },
              ]}
            />
            <Input
              label="Default Confidence / Target Probability (%)"
              type="number"
              min={1}
              max={100}
              value={settings.calculatorDefaults.targetProbability}
              onChange={(e) => updateCalculatorDefaults('targetProbability', Number(e.target.value))}
            />
            <Input
              label="Default Available Pulls"
              type="number"
              min={0}
              value={settings.calculatorDefaults.availablePulls}
              onChange={(e) => updateCalculatorDefaults('availablePulls', Number(e.target.value))}
            />
            <Input
              label="Default Days Available (Reverse Calculator)"
              type="number"
              min={1}
              value={settings.calculatorDefaults.daysAvailable}
              onChange={(e) => updateCalculatorDefaults('daysAvailable', Number(e.target.value))}
            />
            <Input
              label="Daily Primogem Income"
              type="number"
              min={0}
              value={settings.calculatorDefaults.dailyPrimogemIncome}
              onChange={(e) => updateCalculatorDefaults('dailyPrimogemIncome', Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Default Pity"
              type="number"
              min={0}
              max={89}
              value={settings.calculatorDefaults.pityPreset.pity}
              onChange={(e) => updatePityPreset('pity', Number(e.target.value))}
            />
            <div className="flex items-end gap-2">
              <input
                id="default-guaranteed"
                type="checkbox"
                className="rounded"
                checked={settings.calculatorDefaults.pityPreset.guaranteed}
                onChange={(e) => updatePityPreset('guaranteed', e.target.checked)}
              />
              <label htmlFor="default-guaranteed" className="text-sm font-medium text-slate-200">
                Guaranteed
              </label>
            </div>
            <Input
              label="Default Radiant Streak"
              type="number"
              min={0}
              max={3}
              value={settings.calculatorDefaults.pityPreset.radiantStreak}
              onChange={(e) => updatePityPreset('radiantStreak', Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Date & Theme</h2>
          <p className="text-sm text-slate-400">
            Existing preferences are preserved when resetting calculator fields from the calculators.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Date Format"
              value={settings.dateFormat}
              onChange={(e) => updateSettings({ dateFormat: e.target.value })}
              placeholder={DEFAULT_SETTINGS.dateFormat}
            />
            <Select
              label="Default Theme"
              value={settings.defaultTheme}
              onChange={(e) =>
                updateSettings({
                  defaultTheme: e.target.value as typeof DEFAULT_SETTINGS.defaultTheme,
                })
              }
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
            <Input
              label="Backup Reminder Cadence (days)"
              type="number"
              min={1}
              value={settings.backupReminderCadenceDays}
              onChange={(e) => updateSettings({ backupReminderCadenceDays: Number(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
