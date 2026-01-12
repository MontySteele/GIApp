import { useState, useEffect } from 'react';
import { Download, Copy, CheckCircle, Package } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toGOOD, toGOODWithInventory } from '@/mappers/good';
import { useCharacters } from '../hooks/useCharacters';
import { artifactRepo, weaponRepo, materialRepo } from '../repo/inventoryRepo';
import type { InventoryArtifact, InventoryWeapon } from '@/types';

interface GOODExportProps {
  onClose: () => void;
}

export default function GOODExport({ onClose }: GOODExportProps) {
  const { characters } = useCharacters();
  const [copied, setCopied] = useState(false);
  const [includeInventory, setIncludeInventory] = useState(true);
  const [inventoryArtifacts, setInventoryArtifacts] = useState<InventoryArtifact[]>([]);
  const [inventoryWeapons, setInventoryWeapons] = useState<InventoryWeapon[]>([]);
  const [materials, setMaterials] = useState<Record<string, number>>({});
  const [loadingInventory, setLoadingInventory] = useState(true);

  // Load inventory data
  useEffect(() => {
    async function loadInventory() {
      setLoadingInventory(true);
      try {
        const [artifacts, weapons, materialData] = await Promise.all([
          artifactRepo.getAll(),
          weaponRepo.getAll(),
          materialRepo.get(),
        ]);
        setInventoryArtifacts(artifacts);
        setInventoryWeapons(weapons);
        setMaterials(materialData?.materials ?? {});
      } catch (err) {
        console.error('Failed to load inventory:', err);
      } finally {
        setLoadingInventory(false);
      }
    }
    loadInventory();
  }, []);

  const hasInventoryData =
    inventoryArtifacts.length > 0 ||
    inventoryWeapons.length > 0 ||
    Object.keys(materials).length > 0;

  const goodData = includeInventory && hasInventoryData
    ? toGOODWithInventory({
        characters,
        inventoryArtifacts,
        inventoryWeapons,
        materials,
      })
    : toGOOD(characters);
  const jsonText = JSON.stringify(goodData, null, 2);

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genshin-roster-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-slate-400 mb-4">
          Export your roster in GOOD format (Genshin Open Object Description).
          This JSON can be imported into Genshin Optimizer and other community tools.
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4">
          <div className="text-sm text-slate-300 mb-2">
            Export includes:
          </div>
          <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
            <li>{characters.length} characters with equipped items</li>
            {includeInventory && hasInventoryData && (
              <>
                {inventoryArtifacts.length > 0 && (
                  <li>{inventoryArtifacts.length} inventory artifacts</li>
                )}
                {inventoryWeapons.length > 0 && (
                  <li>{inventoryWeapons.length} inventory weapons</li>
                )}
                {Object.keys(materials).length > 0 && (
                  <li>{Object.keys(materials).length} material types</li>
                )}
              </>
            )}
          </ul>
        </div>

        {/* Include Inventory Toggle */}
        {hasInventoryData && (
          <div className="mb-4 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInventory}
                onChange={(e) => setIncludeInventory(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-600 text-primary-500 focus:ring-primary-500 bg-slate-700"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Package className="w-4 h-4" />
                  Include Inventory Data
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Export unequipped artifacts, weapons, and materials from Irminsul imports.
                  Enable this for cross-platform sync (e.g., Windows to Mac).
                </div>
              </div>
            </label>
          </div>
        )}

        {loadingInventory && (
          <div className="text-sm text-slate-400 mb-4">Loading inventory data...</div>
        )}

        {/* JSON Preview */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            JSON Output (Preview):
          </label>
          <div className="relative">
            <textarea
              className="w-full h-64 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs resize-none"
              value={jsonText}
              readOnly
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="absolute top-2 right-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button onClick={handleDownload}>
          <Download className="w-4 h-4" />
          Download JSON
        </Button>
      </div>
    </div>
  );
}
