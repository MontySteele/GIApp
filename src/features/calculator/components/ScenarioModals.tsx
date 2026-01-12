import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Trash2 } from 'lucide-react';
import type { CalculatorScenario } from '@/types';
import type { SimulationResult } from '@/workers/montecarlo.worker';
import type { Target } from './TargetCard';

interface SaveScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioName: string;
  onScenarioNameChange: (name: string) => void;
  targets: Target[];
  availablePulls: number;
  results: SimulationResult | null;
  isSaving: boolean;
  onSave: () => void;
}

export function SaveScenarioModal({
  isOpen,
  onClose,
  scenarioName,
  onScenarioNameChange,
  targets,
  availablePulls,
  results,
  isSaving,
  onSave,
}: SaveScenarioModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Scenario" size="sm">
      <div className="space-y-4">
        <Input
          label="Scenario Name"
          placeholder="e.g., Furina + Neuvillette plan"
          value={scenarioName}
          onChange={(e) => onScenarioNameChange(e.target.value)}
          autoFocus
        />
        <div className="text-sm text-slate-400">
          <p>{targets.length} target(s), {availablePulls} pulls available</p>
          {results && <p>Last result: {(results.allMustHavesProbability * 100).toFixed(1)}% success</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} loading={isSaving} disabled={!scenarioName.trim()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface LoadScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: CalculatorScenario[] | undefined;
  onLoad: (scenario: CalculatorScenario) => void;
  onDelete: (id: string) => void;
}

export function LoadScenarioModal({
  isOpen,
  onClose,
  scenarios,
  onLoad,
  onDelete,
}: LoadScenarioModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Load Scenario" size="md">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {scenarios?.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No saved scenarios yet.</p>
        ) : (
          scenarios?.map((scenario) => (
            <div
              key={scenario.id}
              className="p-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-100 truncate">{scenario.name}</h4>
                  <div className="text-sm text-slate-400 mt-1">
                    <span>{scenario.targets.length} target(s)</span>
                    <span className="mx-2">•</span>
                    <span>{scenario.availablePulls} pulls</span>
                    {scenario.resultProbability !== undefined && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-primary-400">{(scenario.resultProbability * 100).toFixed(1)}%</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {scenario.targets.map((t) => t.characterName || 'Unnamed').join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="primary" onClick={() => onLoad(scenario)}>
                    Load
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(scenario.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

interface CompareScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: CalculatorScenario[] | undefined;
  selectedScenarios: CalculatorScenario[];
  onToggleScenario: (scenario: CalculatorScenario) => void;
}

export function CompareScenarioModal({
  isOpen,
  onClose,
  scenarios,
  selectedScenarios,
  onToggleScenario,
}: CompareScenarioModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compare Scenarios" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-slate-400">Select scenarios to compare side by side.</p>

        {/* Scenario Selection */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {scenarios?.map((scenario) => {
            const isSelected = selectedScenarios.some((s) => s.id === scenario.id);
            return (
              <button
                key={scenario.id}
                onClick={() => onToggleScenario(scenario)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-primary-600/20 border-primary-500'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-100">{scenario.name}</span>
                    <span className="ml-2 text-sm text-slate-400">
                      ({scenario.targets.length} targets, {scenario.availablePulls} pulls)
                    </span>
                  </div>
                  {scenario.resultProbability !== undefined && (
                    <span className="text-primary-400 font-semibold">
                      {(scenario.resultProbability * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Comparison Table */}
        {selectedScenarios.length >= 2 && (
          <div className="mt-4 border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800">
                <tr>
                  <th className="p-2 text-left text-slate-300">Scenario</th>
                  <th className="p-2 text-right text-slate-300">Pulls</th>
                  <th className="p-2 text-right text-slate-300">Targets</th>
                  <th className="p-2 text-right text-slate-300">Probability</th>
                </tr>
              </thead>
              <tbody>
                {selectedScenarios.map((scenario, idx) => (
                  <tr key={scenario.id} className={idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/50'}>
                    <td className="p-2 font-medium text-slate-100">{scenario.name}</td>
                    <td className="p-2 text-right text-slate-300">{scenario.availablePulls}</td>
                    <td className="p-2 text-right text-slate-300">{scenario.targets.length}</td>
                    <td className="p-2 text-right">
                      {scenario.resultProbability !== undefined ? (
                        <span className={
                          scenario.resultProbability >= 0.8 ? 'text-green-400' :
                          scenario.resultProbability >= 0.5 ? 'text-yellow-400' :
                          'text-red-400'
                        }>
                          {(scenario.resultProbability * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedScenarios.length < 2 && (
          <p className="text-sm text-slate-500 text-center py-2">
            Select at least 2 scenarios to compare.
          </p>
        )}
      </div>
    </Modal>
  );
}
