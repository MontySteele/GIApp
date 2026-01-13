import { useState, useMemo } from 'react';
import { Search, Check, Layers } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useCharacterBuildTemplates } from '../hooks/useBuildTemplates';
import BuildGapDisplay from './BuildGapDisplay';
import type { Character, BuildTemplate, CharacterRole, BuildDifficulty, BuildBudget } from '@/types';

interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onApply: (template: BuildTemplate) => void;
  currentTemplateId?: string;
}

const roleLabels: Record<CharacterRole, string> = {
  dps: 'DPS',
  'sub-dps': 'Sub DPS',
  support: 'Support',
  healer: 'Healer',
  shielder: 'Shielder',
};

const difficultyColors: Record<BuildDifficulty, string> = {
  beginner: 'bg-green-900/30 text-green-300',
  intermediate: 'bg-yellow-900/30 text-yellow-300',
  advanced: 'bg-red-900/30 text-red-300',
};

const budgetColors: Record<BuildBudget, string> = {
  f2p: 'bg-emerald-900/30 text-emerald-300',
  '4-star': 'bg-purple-900/30 text-purple-300',
  mixed: 'bg-blue-900/30 text-blue-300',
  whale: 'bg-amber-900/30 text-amber-300',
};

export default function ApplyTemplateModal({
  isOpen,
  onClose,
  character,
  onApply,
  currentTemplateId,
}: ApplyTemplateModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<BuildTemplate | null>(null);
  const [roleFilter, setRoleFilter] = useState<CharacterRole | ''>('');

  const { templates, isLoading } = useCharacterBuildTemplates(character.key);

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];

    return templates.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = !roleFilter || t.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [templates, searchQuery, roleFilter]);

  const handleApply = () => {
    if (selectedTemplate) {
      onApply(selectedTemplate);
      onClose();
    }
  };

  const handleTemplateClick = (template: BuildTemplate) => {
    setSelectedTemplate((prev) =>
      prev?.id === template.id ? null : template
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Apply Build Template - ${character.key}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Search and filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as CharacterRole | '')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value="">All Roles</option>
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Template list */}
        <div className="border border-slate-700 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-8 text-center">
              <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No templates found for {character.key}</p>
              <p className="text-sm text-slate-500 mt-1">
                Create a build template in Teams &gt; Templates
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-700">
              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id;
                const isCurrent = template.id === currentTemplateId;

                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateClick(template)}
                    className={`w-full p-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-primary-900/30'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-200 truncate">
                            {template.name}
                          </span>
                          {template.isOfficial && (
                            <Badge className="text-xs bg-primary-900/30 text-primary-300">
                              Official
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge className="text-xs bg-green-900/30 text-green-300">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Badge className={`${difficultyColors[template.difficulty]}`}>
                            {template.difficulty}
                          </Badge>
                          <Badge className={`${budgetColors[template.budget]}`}>
                            {template.budget}
                          </Badge>
                          <span className="capitalize">{roleLabels[template.role]}</span>
                          {template.source && (
                            <span className="text-slate-500">• {template.source}</span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected template preview */}
        {selectedTemplate && (
          <div className="border-t border-slate-700 pt-4">
            <BuildGapDisplay
              character={character}
              template={selectedTemplate}
              compact
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!selectedTemplate}>
            {selectedTemplate?.id === currentTemplateId
              ? 'Keep Current'
              : 'Apply Template'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
