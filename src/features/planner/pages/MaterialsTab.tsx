/**
 * MaterialsTab - Dedicated material inventory and deficit tracking view
 *
 * Shows material inventory status and deficit priorities across all planned characters.
 */

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Package, AlertCircle, Coins, Pencil } from 'lucide-react';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useMaterials } from '../hooks/useMaterials';
import { useMultiCharacterPlan } from '../hooks/useMultiCharacterPlan';
import DeficitPriorityCard from '../components/DeficitPriorityCard';
import { MaterialsList } from '../components/MaterialsList';
import { Card } from '@/components/ui/Card';

export default function MaterialsTab() {
  const { characters, isLoading: loadingChars } = useCharacters();
  const { materials, isLoading: loadingMats, hasMaterials, totalMaterialTypes, setMaterial } = useMaterials();

  // Inline Mora editing state
  const [editingMora, setEditingMora] = useState(false);
  const [moraInput, setMoraInput] = useState('');
  const moraInputRef = useRef<HTMLInputElement>(null);

  // Get all main priority characters for material planning
  const mainCharacters = useMemo(
    () => characters.filter((c) => c.priority === 'main' || c.priority === 'secondary'),
    [characters]
  );

  // Multi-character plan for all priority characters
  const multiPlan = useMultiCharacterPlan({
    characters: mainCharacters,
    inventory: materials,
    initialGoalType: 'full',
  });

  const isLoading = loadingChars || loadingMats;

  const currentMora = materials['Mora'] ?? materials['mora'] ?? 0;

  const startEditingMora = useCallback(() => {
    setMoraInput(String(currentMora));
    setEditingMora(true);
  }, [currentMora]);

  const saveMora = useCallback(() => {
    setEditingMora(false);
    const parsed = parseInt(moraInput, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed !== currentMora) {
      setMaterial('Mora', parsed);
    }
  }, [moraInput, currentMora, setMaterial]);

  useEffect(() => {
    if (editingMora && moraInputRef.current) {
      moraInputRef.current.focus();
      moraInputRef.current.select();
    }
  }, [editingMora]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading materials...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Material Inventory</h1>
        <p className="text-slate-400">
          Track your materials and see what you need to farm for your priority characters
        </p>
      </div>

      {/* Inventory Status */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/20 rounded-lg">
            <Package className="w-5 h-5 text-primary-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">Material Inventory</span>
              <span className="text-sm text-slate-400">
                {hasMaterials ? `${totalMaterialTypes} types tracked` : 'No materials imported'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <Coins className="w-4 h-4 text-yellow-500" />
              {editingMora ? (
                <div className="flex items-center gap-2">
                  <label className="text-slate-400">Mora:</label>
                  <input
                    ref={moraInputRef}
                    type="text"
                    inputMode="numeric"
                    value={moraInput}
                    onChange={(e) => setMoraInput(e.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={saveMora}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveMora();
                      else if (e.key === 'Escape') setEditingMora(false);
                    }}
                    className="w-32 px-2 py-0.5 text-sm bg-slate-800 border border-primary-500 rounded text-slate-200 focus:outline-none"
                  />
                </div>
              ) : (
                <button
                  onClick={startEditingMora}
                  className="group flex items-center gap-1.5 text-slate-400 hover:text-primary-300 transition-colors"
                >
                  <span>
                    Mora: <span className="text-amber-400 font-medium">{currentMora.toLocaleString()}</span>
                  </span>
                  <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* No Materials Warning */}
      {!hasMaterials && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-400">No Materials Imported</h3>
              <p className="text-sm text-slate-400 mt-1">
                Import your materials using GOOD format or Irminsul export in Settings to track
                inventory and calculate deficits.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Deficit Priority */}
      {multiPlan.summary?.groupedMaterials && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Priority Deficits</h2>
          <DeficitPriorityCard
            groupedMaterials={multiPlan.summary.groupedMaterials}
            compact={false}
          />
        </div>
      )}

      {/* Full Materials List */}
      {multiPlan.summary?.aggregatedMaterials && multiPlan.summary.aggregatedMaterials.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">All Required Materials</h2>
          <MaterialsList materials={multiPlan.summary.aggregatedMaterials} onUpdateMaterial={setMaterial} />
        </div>
      )}

      {/* No Priority Characters */}
      {mainCharacters.length === 0 && (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No Priority Characters</h3>
          <p className="text-slate-400">
            Set some characters as "Main" or "Secondary" priority in your Roster
            to see their material requirements here.
          </p>
        </Card>
      )}
    </div>
  );
}
