import { useState } from 'react';
import { Target, Plus, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useGoals } from '../hooks/useGoals';
import type { Goal } from '@/types';

interface GoalsSectionProps {
  linkedCharacterKey?: string;
  linkedTeamId?: string;
  title?: string;
}

type GoalDraft = Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>;

const INITIAL_DRAFT: GoalDraft = {
  title: '',
  description: '',
  category: 'character',
  status: 'active',
  checklist: [],
};

export default function GoalsSection({
  linkedCharacterKey,
  linkedTeamId,
  title = 'Goals',
}: GoalsSectionProps) {
  const { goals, createGoal, updateGoal, deleteGoal, toggleChecklistItem, isLoading } = useGoals({
    linkedCharacterKey,
    linkedTeamId,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [draft, setDraft] = useState<GoalDraft>(INITIAL_DRAFT);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  const handleCreate = () => {
    setEditingGoal(null);
    setDraft({
      ...INITIAL_DRAFT,
      category: linkedTeamId ? 'team' : 'character',
      linkedCharacterKey: linkedCharacterKey ?? undefined,
      linkedTeamId: linkedTeamId ?? undefined,
    });
    setShowModal(true);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setDraft({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      status: goal.status,
      checklist: goal.checklist,
      linkedCharacterKey: goal.linkedCharacterKey,
      linkedTeamId: goal.linkedTeamId,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, draft);
    } else {
      await createGoal(draft);
    }
    setShowModal(false);
    setEditingGoal(null);
    setDraft(INITIAL_DRAFT);
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setDraft((prev) => ({
      ...prev,
      checklist: [...prev.checklist, { id: crypto.randomUUID(), text: newChecklistItem.trim(), completed: false }],
    }));
    setNewChecklistItem('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index),
    }));
  };

  const toggleExpand = (goalId: string) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-16 flex items-center justify-center">
            <div className="text-slate-500">Loading goals...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCreate}>
            <Plus className="w-4 h-4" />
            Add Goal
          </Button>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm mb-3">No goals set yet</p>
              <Button variant="ghost" size="sm" onClick={handleCreate}>
                <Plus className="w-4 h-4" />
                Create your first goal
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => {
                const isExpanded = expandedGoals.has(goal.id);
                const completedCount = goal.checklist.filter((item) => item.completed).length;
                const totalCount = goal.checklist.length;
                const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                return (
                  <div
                    key={goal.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden"
                  >
                    <div
                      className="p-3 cursor-pointer hover:bg-slate-800/80 transition-colors"
                      onClick={() => toggleExpand(goal.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-200">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                              {goal.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {totalCount > 0 && (
                            <span className="text-xs text-slate-400">
                              {completedCount}/{totalCount}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {totalCount > 0 && (
                        <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-700 p-3 space-y-3">
                        {goal.checklist.length > 0 && (
                          <div className="space-y-2">
                            {goal.checklist.map((item) => (
                              <button
                                key={item.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleChecklistItem(goal.id, item.id);
                                }}
                                className="flex items-center gap-2 w-full text-left group"
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                    item.completed
                                      ? 'bg-emerald-600 border-emerald-600'
                                      : 'border-slate-600 group-hover:border-slate-500'
                                  }`}
                                >
                                  {item.completed && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span
                                  className={`text-sm ${
                                    item.completed ? 'text-slate-500 line-through' : 'text-slate-300'
                                  }`}
                                >
                                  {item.text}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(goal)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteGoal(goal.id)}
                            className="text-red-400 hover:text-red-300"
                            aria-label="Delete goal"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingGoal(null);
          setDraft(INITIAL_DRAFT);
        }}
        title={editingGoal ? 'Edit Goal' : 'New Goal'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Goal Title"
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Max out talents"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details..."
              className="w-full h-20 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Checklist</label>
            <div className="space-y-2 mb-2">
              {draft.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-slate-800 rounded px-3 py-2"
                >
                  <span className="flex-1 text-sm text-slate-300">{item.text}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(idx)}
                    className="text-slate-500 hover:text-red-400"
                    aria-label="Remove checklist item"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add checklist item..."
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleAddChecklistItem} aria-label="Add checklist item">
                <Plus className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <Button
              variant="ghost"
              onClick={() => {
                setShowModal(false);
                setEditingGoal(null);
                setDraft(INITIAL_DRAFT);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!draft.title.trim()}>
              {editingGoal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
