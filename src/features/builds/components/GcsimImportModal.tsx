/**
 * GcsimImportModal
 *
 * Modal for importing build templates from gcsim/wfpsim config text.
 * Parses the config and allows users to select which builds to import.
 */

import { useState, useMemo } from 'react';
import { FileCode, Check, AlertCircle, Import } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { parseGcsimConfig, parsedBuildToTemplate, type ParsedCharacterBuild } from '../domain/gcsimParser';
import { WEAPONS, ARTIFACT_SETS } from '@/lib/data/equipmentData';

interface GcsimImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (builds: Array<{
    name: string;
    characterKey: string;
    role: 'dps' | 'sub-dps' | 'support';
    weapons: { primary: string[]; alternatives: string[] };
    artifacts: {
      sets: string[];
      mainStats: { sands: string[]; goblet: string[]; circlet: string[] };
      substats: string[];
    };
  }>) => Promise<void>;
}

export default function GcsimImportModal({
  isOpen,
  onClose,
  onImport,
}: GcsimImportModalProps) {
  const [configText, setConfigText] = useState('');
  const [selectedBuilds, setSelectedBuilds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Parse the config when text changes
  const parseResult = useMemo(() => {
    if (!configText.trim()) return null;
    return parseGcsimConfig(configText);
  }, [configText]);

  // Toggle build selection
  const toggleBuild = (gcsimKey: string) => {
    setSelectedBuilds((prev) => {
      const next = new Set(prev);
      if (next.has(gcsimKey)) {
        next.delete(gcsimKey);
      } else {
        next.add(gcsimKey);
      }
      return next;
    });
  };

  // Select/deselect all
  const toggleAll = () => {
    if (!parseResult) return;
    if (selectedBuilds.size === parseResult.characters.length) {
      setSelectedBuilds(new Set());
    } else {
      setSelectedBuilds(new Set(parseResult.characters.map((c) => c.gcsimKey)));
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!parseResult || selectedBuilds.size === 0) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const buildsToImport = parseResult.characters
        .filter((c) => selectedBuilds.has(c.gcsimKey))
        .map((build) => {
          const template = parsedBuildToTemplate(build);
          return {
            ...template,
            name: `${build.characterKey} Build`,
          };
        });

      await onImport(buildsToImport);

      // Reset and close
      setConfigText('');
      setSelectedBuilds(new Set());
      onClose();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import builds');
    } finally {
      setIsImporting(false);
    }
  };

  // Reset when modal closes
  const handleClose = () => {
    setConfigText('');
    setSelectedBuilds(new Set());
    setImportError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import from gcsim Config">
      <div className="space-y-4">
        {/* Instructions */}
        <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <FileCode className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="font-medium mb-1">Paste your gcsim/wfpsim config below</p>
            <p className="text-slate-400 text-xs">
              Character builds will be extracted and converted to templates.
              Supports character stats, weapons, and artifact sets.
            </p>
          </div>
        </div>

        {/* Config input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            gcsim Config
          </label>
          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            placeholder={`# Paste your gcsim config here
# Example:
raiden char lvl=90/90 cons=0 talent=9,9,10;
raiden add weapon="engulfinglightning" refine=1 lvl=90/90;
raiden add set="emblemofseveredfate" count=4;
raiden add stats hp=4780 atk=311 er=0.518 electro%=0.466 cr=0.311;`}
            className="w-full h-40 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 font-mono text-sm resize-none"
          />
        </div>

        {/* Parse results */}
        {parseResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-200">
                Found {parseResult.characters.length} character{parseResult.characters.length !== 1 ? 's' : ''}
              </h4>
              {parseResult.characters.length > 0 && (
                <Button variant="ghost" size="sm" onClick={toggleAll}>
                  {selectedBuilds.size === parseResult.characters.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>

            {parseResult.characters.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg text-yellow-300 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>No character builds found in the config. Make sure it contains character definitions.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {parseResult.characters.map((build) => (
                  <BuildPreviewCard
                    key={build.gcsimKey}
                    build={build}
                    isSelected={selectedBuilds.has(build.gcsimKey)}
                    onToggle={() => toggleBuild(build.gcsimKey)}
                  />
                ))}
              </div>
            )}

            {parseResult.errors.length > 0 && (
              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer hover:text-slate-400">
                  {parseResult.errors.length} line{parseResult.errors.length !== 1 ? 's' : ''} not recognized
                </summary>
                <pre className="mt-1 p-2 bg-slate-900 rounded text-slate-600 overflow-x-auto">
                  {parseResult.errors.slice(0, 5).join('\n')}
                  {parseResult.errors.length > 5 && `\n... and ${parseResult.errors.length - 5} more`}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Error message */}
        {importError && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-700">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!parseResult || selectedBuilds.size === 0 || isImporting}
          >
            <Import className="w-4 h-4" />
            {isImporting ? 'Importing...' : `Import ${selectedBuilds.size} Build${selectedBuilds.size !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Build preview card component
function BuildPreviewCard({
  build,
  isSelected,
  onToggle,
}: {
  build: ParsedCharacterBuild;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const weapon = build.weapon ? WEAPONS.find((w) => w.key === build.weapon?.key) : null;
  const artifactSets = build.artifactSets
    .map((s) => ARTIFACT_SETS.find((a) => a.key === s.key))
    .filter(Boolean);

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isSelected ? 'ring-2 ring-primary-500 bg-primary-900/20' : 'hover:bg-slate-800/50'
      }`}
      onClick={onToggle}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-200">{build.characterKey}</span>
              <Badge variant="outline" className="text-xs">
                Lv.{build.level}
              </Badge>
              {build.constellation > 0 && (
                <Badge variant="secondary" className="text-xs">
                  C{build.constellation}
                </Badge>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
              {weapon && (
                <span className="text-yellow-400">
                  {weapon.rarity}★ {weapon.name}
                  {build.weapon?.refinement && build.weapon.refinement > 1 && ` R${build.weapon.refinement}`}
                </span>
              )}
              {artifactSets.map((set, i) => (
                <span key={i} className="text-purple-400">
                  {build.artifactSets[i]?.count}pc {set?.name}
                </span>
              ))}
            </div>

            {build.talents && (
              <div className="mt-1 text-xs text-slate-500">
                Talents: {build.talents.join('/')}
              </div>
            )}
          </div>

          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'border-slate-600'
          }`}>
            {isSelected && <Check className="w-3 h-3" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
