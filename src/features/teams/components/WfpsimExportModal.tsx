import { useState, useCallback } from 'react';
import { Copy, ExternalLink, Check, AlertTriangle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { Character, Team } from '@/types';
import {
  generateGcsimConfig,
  validateTeamForExport,
  type GcsimExportOptions,
} from '../domain/gcsimConfigGenerator';

interface WfpsimExportModalProps {
  team: Team;
  characters: Character[];
  isOpen: boolean;
  onClose: () => void;
}

const WFPSIM_URL = 'https://wfpsim.com/';

export default function WfpsimExportModal({
  team,
  characters,
  isOpen,
  onClose,
}: WfpsimExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<GcsimExportOptions>({
    iterations: 1000,
    duration: 90,
    targetLevel: 100,
    targetResist: 0.1,
    includeComments: true,
  });

  // Validate team data
  const validation = validateTeamForExport(team, characters);

  // Generate config
  let config = '';
  let error: string | null = null;

  try {
    if (validation.valid) {
      config = generateGcsimConfig(team, characters, options);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error generating config';
  }

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(config);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
    }
  }, [config]);

  const handleOpenWfpsim = useCallback(() => {
    window.open(WFPSIM_URL, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export to wfpsim" size="lg">
      <div className="space-y-4">
        {/* Validation Warnings */}
        {!validation.valid && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-200">Missing Data</h4>
                <ul className="mt-1 text-sm text-yellow-300 space-y-1">
                  {validation.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Iterations</label>
            <input
              type="number"
              value={options.iterations}
              onChange={(e) => setOptions({ ...options, iterations: parseInt(e.target.value) || 1000 })}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100"
              min={100}
              max={100000}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Duration (s)</label>
            <input
              type="number"
              value={options.duration}
              onChange={(e) => setOptions({ ...options, duration: parseInt(e.target.value) || 90 })}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100"
              min={10}
              max={600}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Target Level</label>
            <input
              type="number"
              value={options.targetLevel}
              onChange={(e) => setOptions({ ...options, targetLevel: parseInt(e.target.value) || 100 })}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100"
              min={1}
              max={200}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Resist (%)</label>
            <input
              type="number"
              value={(options.targetResist || 0.1) * 100}
              onChange={(e) => setOptions({ ...options, targetResist: (parseFloat(e.target.value) || 10) / 100 })}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100"
              min={-100}
              max={100}
              step={5}
            />
          </div>
        </div>

        {/* Config Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">Generated Config</label>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={options.includeComments}
                onChange={(e) => setOptions({ ...options, includeComments: e.target.checked })}
                className="rounded bg-slate-700 border-slate-600"
              />
              Include comments
            </label>
          </div>
          <div className="relative">
            <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-xs font-mono text-slate-300 overflow-auto max-h-80 whitespace-pre">
              {validation.valid ? config : '// Fix validation errors above to generate config'}
            </pre>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-200 mb-2">How to use</h4>
          <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
            <li>Copy the config above</li>
            <li>Open wfpsim.com and paste into the config editor</li>
            <li>Add your team&apos;s rotation at the bottom</li>
            <li>Run the simulation to see DPS results</li>
          </ol>
          <p className="mt-3 text-xs text-slate-500">
            Rotations must be added manually. See{' '}
            <a
              href="https://docs.gcsim.app/guides/building_a_simulation_basic_tutorial/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:underline"
            >
              gcsim docs
            </a>{' '}
            for rotation syntax.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={handleOpenWfpsim}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open wfpsim
          </Button>
          <Button
            variant="primary"
            onClick={handleCopy}
            disabled={!validation.valid || !config}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Config
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
