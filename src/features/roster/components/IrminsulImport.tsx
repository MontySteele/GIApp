import { useState, useCallback } from 'react';
import {
  Upload,
  FileJson,
  CheckCircle,
  AlertCircle,
  Users,
  Swords,
  Shield,
  Package,
  Settings,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  parseIrminsulJson,
  previewImport,
  importIrminsul,
  type ImportOptions,
  type ImportSummary,
} from '../services/irminsulImport';
import type { IrminsulImportResult } from '@/mappers/irminsul';

interface IrminsulImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function IrminsulImport({ onSuccess, onCancel }: IrminsulImportProps) {
  const [jsonText, setJsonText] = useState('');
  const [filename, setFilename] = useState<string>();
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<IrminsulImportResult | null>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);

  // Import options
  const [options, setOptions] = useState<ImportOptions>({
    replaceAll: false,
    importCharacters: true,
    importArtifacts: true,
    importWeapons: true,
    importMaterials: true,
  });

  const [showOptions, setShowOptions] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setJsonText(text);
      setError('');
      setPreview(null);
      setImportResult(null);

      // Auto-preview
      try {
        const data = parseIrminsulJson(text);
        const result = previewImport(data);
        setPreview(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }, []);

  const handleTextChange = useCallback((text: string) => {
    setJsonText(text);
    setError('');
    setPreview(null);
    setImportResult(null);

    if (text.trim()) {
      try {
        const data = parseIrminsulJson(text);
        const result = previewImport(data);
        setPreview(result);
      } catch (err) {
        // Don't show error while typing, only on import
      }
    }
  }, []);

  const handleImport = async () => {
    setError('');
    setImporting(true);
    setImportResult(null);

    try {
      const data = parseIrminsulJson(jsonText);
      const result = await importIrminsul(data, options, filename);

      setImportResult(result);

      if (result.success) {
        // Auto-close after 2 seconds on success
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(result.error || 'Import failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const toggleOption = (key: keyof ImportOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-slate-400 mb-4">
          Import your character data, artifacts, weapons, and materials from Irminsul.
          Irminsul exports in GOOD format which is compatible with various community tools.
        </p>

        {/* File Upload */}
        <div className="mb-4">
          <label
            htmlFor="irminsul-file"
            className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
          >
            <Upload className="w-5 h-5 text-slate-400" />
            <span className="text-slate-300">
              {filename ? filename : 'Click to upload Irminsul JSON file'}
            </span>
            <input
              id="irminsul-file"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Or paste JSON */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Or paste JSON directly:
          </label>
          <textarea
            className="w-full h-40 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder='{"format":"GOOD","version":3,"source":"Irminsul",...}'
            value={jsonText}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-slate-200 mb-3">Import Preview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <PreviewStat
                icon={Users}
                label="Characters"
                count={preview.stats.characterCount}
                enabled={options.importCharacters}
              />
              <PreviewStat
                icon={Shield}
                label="Artifacts"
                count={preview.stats.artifactCount}
                enabled={options.importArtifacts}
              />
              <PreviewStat
                icon={Swords}
                label="Weapons"
                count={preview.stats.weaponCount}
                enabled={options.importWeapons}
              />
              <PreviewStat
                icon={Package}
                label="Materials"
                count={preview.stats.materialCount}
                enabled={options.importMaterials}
              />
            </div>
          </div>
        )}

        {/* Options */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
          >
            <Settings className="w-4 h-4" />
            {showOptions ? 'Hide options' : 'Show options'}
          </button>

          {showOptions && (
            <div className="mt-3 p-4 bg-slate-800/50 border border-slate-700 rounded-lg space-y-3">
              <OptionToggle
                label="Import Characters"
                description="Character levels, talents, constellations"
                checked={options.importCharacters!}
                onChange={() => toggleOption('importCharacters')}
              />
              <OptionToggle
                label="Import Artifacts"
                description="All artifacts (equipped and unequipped)"
                checked={options.importArtifacts!}
                onChange={() => toggleOption('importArtifacts')}
              />
              <OptionToggle
                label="Import Weapons"
                description="All weapons (equipped and unequipped)"
                checked={options.importWeapons!}
                onChange={() => toggleOption('importWeapons')}
              />
              <OptionToggle
                label="Import Materials"
                description="Material inventory counts"
                checked={options.importMaterials!}
                onChange={() => toggleOption('importMaterials')}
              />
              <div className="pt-2 border-t border-slate-700">
                <OptionToggle
                  label="Replace All Data"
                  description="Clear existing data before import (otherwise merge)"
                  checked={options.replaceAll!}
                  onChange={() => toggleOption('replaceAll')}
                  danger
                />
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}

        {/* Success */}
        {importResult?.success && (
          <div className="flex items-start gap-2 p-3 bg-green-900/20 border border-green-700 rounded-lg mb-4">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-200">
              <p className="font-medium">Import successful!</p>
              <ul className="mt-1 text-xs text-green-300/80">
                {importResult.charactersImported > 0 && (
                  <li>{importResult.charactersImported} characters imported</li>
                )}
                {importResult.charactersUpdated > 0 && (
                  <li>{importResult.charactersUpdated} characters updated</li>
                )}
                {importResult.artifactsImported > 0 && (
                  <li>{importResult.artifactsImported} artifacts imported</li>
                )}
                {importResult.weaponsImported > 0 && (
                  <li>{importResult.weaponsImported} weapons imported</li>
                )}
                {importResult.materialsImported > 0 && (
                  <li>{importResult.materialsImported} material types imported</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
        <Button variant="ghost" onClick={onCancel} disabled={importing}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          loading={importing}
          disabled={!jsonText || importing || !preview}
        >
          <FileJson className="w-4 h-4" />
          Import Data
        </Button>
      </div>
    </div>
  );
}

// Helper Components

function PreviewStat({
  icon: Icon,
  label,
  count,
  enabled,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  enabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg ${
        enabled ? 'bg-slate-700/50' : 'bg-slate-800/30 opacity-50'
      }`}
    >
      <Icon className="w-4 h-4 text-primary-400" />
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-lg font-semibold text-slate-200">{count}</div>
      </div>
    </div>
  );
}

function OptionToggle({
  label,
  description,
  checked,
  onChange,
  danger,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  danger?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={`mt-1 w-4 h-4 rounded border-slate-600 ${
          danger
            ? 'text-red-500 focus:ring-red-500'
            : 'text-primary-500 focus:ring-primary-500'
        } bg-slate-700`}
      />
      <div>
        <div className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-slate-200'}`}>
          {label}
        </div>
        <div className="text-xs text-slate-400">{description}</div>
      </div>
    </label>
  );
}
