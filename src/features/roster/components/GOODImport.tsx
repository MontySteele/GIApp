import { useState } from 'react';
import { Upload, FileJson, CheckCircle, AlertCircle, Package } from 'lucide-react';
import Button from '@/components/ui/Button';
import { fromGOODWithInventory, validateGOOD, type GOODFormat } from '@/mappers/good';
import { writeLastImportSummary } from '@/features/sync/domain/lastImportSummary';
import { buildRosterImportImpactSummary } from '@/features/sync/domain/rosterImportImpact';
import { characterRepo } from '../repo/characterRepo';
import { artifactRepo } from '@/features/artifacts/repo/artifactRepo';
import { weaponRepo } from '@/features/weapons/repo/weaponRepo';

interface GOODImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GOODImport({ onSuccess, onCancel }: GOODImportProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    characterCount: number;
    artifactCount: number;
    weaponCount: number;
  } | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setJsonText(text);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setError('');
    setImporting(true);
    setImportResult(null);

    try {
      // Parse JSON
      let data: unknown;
      try {
        data = JSON.parse(jsonText);
      } catch {
        throw new Error('Invalid JSON format');
      }

      // Validate GOOD format
      if (!validateGOOD(data)) {
        throw new Error('Not a valid GOOD format file');
      }

      const goodData = data as GOODFormat;

      // Convert to internal format (characters + inventory)
      const result = fromGOODWithInventory(goodData);

      if (result.characters.length === 0 && result.inventoryArtifacts.length === 0) {
        throw new Error('No characters or artifacts found in GOOD file');
      }

      // Import characters
      if (result.characters.length > 0) {
        await characterRepo.bulkCreate(result.characters);
      }

      // Import inventory artifacts
      if (result.inventoryArtifacts.length > 0) {
        await artifactRepo.bulkUpsert(result.inventoryArtifacts);
      }

      // Import inventory weapons
      if (result.inventoryWeapons.length > 0) {
        await weaponRepo.bulkUpsert(result.inventoryWeapons);
      }

      setImportResult({
        success: true,
        characterCount: result.characters.length,
        artifactCount: result.inventoryArtifacts.length,
        weaponCount: result.inventoryWeapons.length,
      });
      writeLastImportSummary(buildRosterImportImpactSummary({
        source: goodData.source || 'GOOD',
        charactersCreated: result.characters.length,
        artifactsChanged: result.inventoryArtifacts.length,
        weaponsChanged: result.inventoryWeapons.length,
      }));

      // Auto-close after 2 seconds
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setImportResult({
        success: false,
        characterCount: 0,
        artifactCount: 0,
        weaponCount: 0,
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-slate-400 mb-4">
          Import your character data from a GOOD format JSON file (Genshin Open Object Description).
          This format is compatible with Genshin Optimizer and other community tools.
        </p>

        {/* File Upload */}
        <div className="mb-4">
          <label
            htmlFor="good-file"
            className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
          >
            <Upload className="w-5 h-5 text-slate-400" />
            <span className="text-slate-300">
              Click to upload GOOD JSON file
            </span>
            <input
              id="good-file"
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
            className="w-full h-64 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder='{"format":"GOOD","version":2,...}'
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setError('');
            }}
          />
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
              <div>Import successful!</div>
              <ul className="mt-1 space-y-0.5 text-green-300">
                {importResult.characterCount > 0 && (
                  <li>{importResult.characterCount} character{importResult.characterCount !== 1 ? 's' : ''}</li>
                )}
                {importResult.artifactCount > 0 && (
                  <li>
                    <Package className="w-3 h-3 inline mr-1" />
                    {importResult.artifactCount} artifact{importResult.artifactCount !== 1 ? 's' : ''}
                  </li>
                )}
                {importResult.weaponCount > 0 && (
                  <li>{importResult.weaponCount} weapon{importResult.weaponCount !== 1 ? 's' : ''}</li>
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
          disabled={!jsonText || importing}
        >
          <FileJson className="w-4 h-4" />
          Import {jsonText && `(Preview: ${jsonText.length} chars)`}
        </Button>
      </div>
    </div>
  );
}
