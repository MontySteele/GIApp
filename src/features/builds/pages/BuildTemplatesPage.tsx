import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Filter, BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import BuildTemplateCard from '../components/BuildTemplateCard';
import BuildTemplateForm from '../components/BuildTemplateForm';
import { useBuildTemplates, type BuildTemplateQuery } from '../hooks/useBuildTemplates';
import type { CharacterRole, BuildDifficulty, BuildBudget, BuildTemplate } from '@/types';

export default function BuildTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState<CharacterRole | ''>('');
  const [difficultyFilter, setDifficultyFilter] = useState<BuildDifficulty | ''>('');
  const [budgetFilter, setBudgetFilter] = useState<BuildBudget | ''>('');
  const [officialOnly, setOfficialOnly] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BuildTemplate | null>(null);

  const query: BuildTemplateQuery = useMemo(
    () => ({
      filters: {
        role: roleFilter || undefined,
        difficulty: difficultyFilter || undefined,
        budget: budgetFilter || undefined,
        isOfficial: officialOnly ? true : undefined,
        search: searchQuery || undefined,
      },
      sort: { field: 'updatedAt', direction: 'desc' },
    }),
    [searchQuery, roleFilter, difficultyFilter, budgetFilter, officialOnly]
  );

  const { templates, allTemplates, stats, isLoading, createTemplate, updateTemplate, deleteTemplate } = useBuildTemplates(query);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this build template?')) {
      await deleteTemplate(id);
    }
  };

  const handleEdit = useCallback((template: BuildTemplate) => {
    setEditingTemplate(template);
    setShowFormModal(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingTemplate(null);
    setShowFormModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowFormModal(false);
    setEditingTemplate(null);
  }, []);

  const handleSave = useCallback(async (data: Omit<BuildTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, data);
    } else {
      await createTemplate(data);
    }
    handleCloseModal();
  }, [editingTemplate, createTemplate, updateTemplate, handleCloseModal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading build templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Build Templates</h1>
          <p className="text-slate-400">
            {allTemplates.length} templates available
            {stats?.official ? ` (${stats.official} official)` : ''}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-slate-100">{stats.total}</div>
              <div className="text-xs text-slate-400">Total Templates</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-primary-400">{stats.official}</div>
              <div className="text-xs text-slate-400">Official Builds</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.byBudget['f2p'] || 0}</div>
              <div className="text-xs text-slate-400">F2P Friendly</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.byRole['dps'] || 0}</div>
              <div className="text-xs text-slate-400">DPS Builds</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                className="pl-9"
                placeholder="Search templates by name, character, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
              <Select
                label="Role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as CharacterRole | '')}
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'dps', label: 'DPS' },
                  { value: 'sub-dps', label: 'Sub-DPS' },
                  { value: 'support', label: 'Support' },
                  { value: 'healer', label: 'Healer' },
                  { value: 'shielder', label: 'Shielder' },
                ]}
              />
              <Select
                label="Difficulty"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as BuildDifficulty | '')}
                options={[
                  { value: '', label: 'All Difficulties' },
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' },
                ]}
              />
              <Select
                label="Budget"
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value as BuildBudget | '')}
                options={[
                  { value: '', label: 'All Budgets' },
                  { value: 'f2p', label: 'F2P' },
                  { value: '4-star', label: '4-Star' },
                  { value: 'mixed', label: 'Mixed' },
                  { value: 'whale', label: 'Whale' },
                ]}
              />
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={officialOnly}
                    onChange={(e) => setOfficialOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-300">Official only</span>
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              {allTemplates.length === 0 ? 'No Build Templates Yet' : 'No Matching Templates'}
            </h3>
            <p className="text-slate-500 mb-4">
              {allTemplates.length === 0
                ? 'Create your first build template to save and share character builds.'
                : 'Try adjusting your search or filters.'}
            </p>
            {allTemplates.length === 0 && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-slate-400 mb-2">
            Showing {templates.length} of {allTemplates.length} templates
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <BuildTemplateCard
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        title={editingTemplate ? 'Edit Build Template' : 'Create Build Template'}
      >
        <BuildTemplateForm
          template={editingTemplate ?? undefined}
          onSave={handleSave}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
