import { cloneElement, Fragment, isValidElement, useEffect, useMemo, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { Plus, Pin, PinOff, Search, Tag, CheckCircle2, X, ExternalLink, ListChecks, Link2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useGoals } from '../hooks/useGoals';
import { useNotes } from '../hooks/useNotes';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useTeams } from '@/features/roster/hooks/useTeams';
import type { Goal, GoalCategory, GoalStatus, Note } from '@/types';

type NoteDraft = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;
type GoalDraft = Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>;

const goalCategoryOptions: { value: GoalCategory; label: string }[] = [
  { value: 'character', label: 'Character' },
  { value: 'team', label: 'Team' },
  { value: 'abyss', label: 'Abyss' },
  { value: 'exploration', label: 'Exploration' },
  { value: 'pull', label: 'Pull Planning' },
  { value: 'other', label: 'Other' },
];

const goalStatusOptions: { value: GoalStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightText = (text: string, query: string): ReactNode => {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  const lowerQuery = query.toLowerCase();

  return text.split(regex).map((part, index) => {
    const isMatch = part.toLowerCase() === lowerQuery;
    if (!isMatch) return <Fragment key={index}>{part}</Fragment>;
    return (
      <mark key={index} className="bg-primary-700/60 text-white rounded px-0.5">
        {part}
      </mark>
    );
  });
};

const highlightNodes = (content: ReactNode, query: string): ReactNode => {
  if (!query) return content;

  const processNode = (node: ReactNode, prefix = 'node'): ReactNode => {
    if (typeof node === 'string') {
      return highlightText(node, query);
    }

    if (Array.isArray(node)) {
      return node.map((child, idx) => <Fragment key={`${prefix}-${idx}`}>{processNode(child, `${prefix}-${idx}`)}</Fragment>);
    }

    if (isValidElement(node) && node.props?.children) {
      return cloneElement(node, { ...node.props, children: processNode(node.props.children, prefix) });
    }

    return node;
  };

  return processNode(content);
};

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: NoteDraft, existingId?: string) => Promise<void>;
  initialNote?: Note | null;
  characters: { key: string; name: string }[];
  teams: { id: string; name: string }[];
}

function NoteModal({ isOpen, onClose, onSave, initialNote, characters, teams }: NoteModalProps) {
  const [form, setForm] = useState<NoteDraft>({
    title: initialNote?.title ?? '',
    content: initialNote?.content ?? '',
    tags: initialNote?.tags ?? [],
    pinned: initialNote?.pinned ?? false,
    linkedCharacterKey: initialNote?.linkedCharacterKey,
    linkedTeamId: initialNote?.linkedTeamId,
  });
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({
      title: initialNote?.title ?? '',
      content: initialNote?.content ?? '',
      tags: initialNote?.tags ?? [],
      pinned: initialNote?.pinned ?? false,
      linkedCharacterKey: initialNote?.linkedCharacterKey,
      linkedTeamId: initialNote?.linkedTeamId,
    });
    setTagInput('');
  }, [initialNote]);

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      tags: [],
      pinned: false,
      linkedCharacterKey: undefined,
      linkedTeamId: undefined,
    });
    setTagInput('');
  };

  const handleAddTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (form.tags.includes(value)) {
      setTagInput('');
      return;
    }
    setForm((prev) => ({ ...prev, tags: [...prev.tags, value] }));
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(form, initialNote?.id);
    setIsSaving(false);
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialNote ? 'Edit Note' : 'Create Note'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="e.g., Weekly To-Dos or Build Notes"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Content (Markdown)</label>
              <textarea
                className="w-full h-64 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write your note using markdown. Use # headings, **bold**, lists, etc."
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Linked Character (optional)"
                value={form.linkedCharacterKey ?? ''}
                onChange={(e) => setForm({ ...form, linkedCharacterKey: e.target.value || undefined })}
                options={[{ value: '', label: 'None' }, ...characters.map((char) => ({ value: char.key, label: char.name }))]}
              />
              <Select
                label="Linked Team (optional)"
                value={form.linkedTeamId ?? ''}
                onChange={(e) => setForm({ ...form, linkedTeamId: e.target.value || undefined })}
                options={[{ value: '', label: 'None' }, ...teams.map((team) => ({ value: team.id, label: team.name }))]}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Tags</label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddTag}>
                  <Tag className="w-4 h-4" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <Badge key={tag} className="flex items-center gap-2 bg-primary-900 border border-primary-700">
                    {tag}
                    <button type="button" className="text-slate-300 hover:text-white" onClick={() => handleRemoveTag(tag)} aria-label={`Remove tag ${tag}`}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {form.tags.length === 0 && <p className="text-sm text-slate-500">No tags yet.</p>}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-700 px-3 py-2 bg-slate-900">
              <div>
                <p className="text-sm font-medium text-slate-200">Pin to top</p>
                <p className="text-xs text-slate-500">Pinned notes show before others.</p>
              </div>
              <Button
                type="button"
                variant={form.pinned ? 'primary' : 'secondary'}
                onClick={() => setForm((prev) => ({ ...prev, pinned: !prev.pinned }))}
              >
                {form.pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                {form.pinned ? 'Pinned' : 'Pin note'}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Preview</h3>
              <span className="text-xs text-slate-500">Markdown rendered</span>
            </div>
            <Card className="h-full">
              <CardContent className="prose prose-invert max-w-none space-y-2">
                {form.content ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p>{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
                    }}
                  >
                    {form.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-slate-500">Write some markdown to see it render here.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving}>
            <CheckCircle2 className="w-4 h-4" />
            {initialNote ? 'Save Changes' : 'Create Note'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: GoalDraft, existingId?: string) => Promise<void>;
  initialGoal?: Goal | null;
  characters: { key: string; name: string }[];
  teams: { id: string; name: string }[];
}

function GoalModal({ isOpen, onClose, onSave, initialGoal, characters, teams }: GoalModalProps) {
  const [form, setForm] = useState<GoalDraft>({
    title: initialGoal?.title ?? '',
    description: initialGoal?.description ?? '',
    category: initialGoal?.category ?? 'other',
    status: initialGoal?.status ?? 'active',
    checklist: initialGoal?.checklist ?? [],
    linkedCharacterKey: initialGoal?.linkedCharacterKey,
    linkedTeamId: initialGoal?.linkedTeamId,
    completedAt: initialGoal?.completedAt,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({
      title: initialGoal?.title ?? '',
      description: initialGoal?.description ?? '',
      category: initialGoal?.category ?? 'other',
      status: initialGoal?.status ?? 'active',
      checklist: initialGoal?.checklist ?? [],
      linkedCharacterKey: initialGoal?.linkedCharacterKey,
      linkedTeamId: initialGoal?.linkedTeamId,
      completedAt: initialGoal?.completedAt,
    });
  }, [initialGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const completedAt = form.status === 'completed' ? form.completedAt ?? new Date().toISOString() : undefined;
    await onSave({ ...form, completedAt }, initialGoal?.id);
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialGoal ? 'Edit Goal' : 'Create Goal'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Goal Title"
          placeholder="E.g., Build Furina, Clear Floor 12"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
          <textarea
            className="w-full h-32 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add details or requirements for this goal"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as GoalCategory })}
            options={goalCategoryOptions}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as GoalStatus, completedAt: e.target.value === 'completed' ? form.completedAt ?? new Date().toISOString() : undefined })}
            options={goalStatusOptions}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Linked Character (optional)"
            value={form.linkedCharacterKey ?? ''}
            onChange={(e) => setForm({ ...form, linkedCharacterKey: e.target.value || undefined })}
            options={[{ value: '', label: 'None' }, ...characters.map((char) => ({ value: char.key, label: char.name }))]}
          />
          <Select
            label="Linked Team (optional)"
            value={form.linkedTeamId ?? ''}
            onChange={(e) => setForm({ ...form, linkedTeamId: e.target.value || undefined })}
            options={[{ value: '', label: 'None' }, ...teams.map((team) => ({ value: team.id, label: team.name }))]}
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving}>
            <CheckCircle2 className="w-4 h-4" />
            {initialGoal ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface ChecklistProps {
  goal: Goal;
  onAdd: (text: string) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

function Checklist({ goal, onAdd, onToggle, onRemove }: ChecklistProps) {
  const [itemText, setItemText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = async () => {
    if (!itemText.trim()) return;
    setIsSubmitting(true);
    await onAdd(itemText.trim());
    setItemText('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold uppercase tracking-wide">
          <ListChecks className="w-4 h-4" />
          Checklist
        </div>
        <span className="text-xs text-slate-500">
          {goal.checklist.filter((item) => item.completed).length}/{goal.checklist.length} complete
        </span>
      </div>
      <div className="space-y-2">
        {goal.checklist.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded border border-slate-700 bg-slate-800 px-3 py-2"
          >
            <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => onToggle(item.id)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary-500 focus:ring-primary-500"
              />
              <span className={item.completed ? 'line-through text-slate-500' : ''}>{item.text}</span>
            </label>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-slate-400 hover:text-red-400 transition-colors"
              aria-label={`Remove ${item.text}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {goal.checklist.length === 0 && <p className="text-sm text-slate-500">No items yet.</p>}
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Add checklist item"
          value={itemText}
          onChange={(e) => setItemText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddItem();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={handleAddItem} loading={isSubmitting}>
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  characterName?: string;
  teamName?: string;
  onStatusChange: (status: GoalStatus) => Promise<void>;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => Promise<void>;
  onAddChecklist: (text: string) => Promise<void>;
  onToggleChecklist: (id: string) => Promise<void>;
  onRemoveChecklist: (id: string) => Promise<void>;
}

function GoalCard({
  goal,
  characterName,
  teamName,
  onStatusChange,
  onEdit,
  onDelete,
  onAddChecklist,
  onToggleChecklist,
  onRemoveChecklist,
}: GoalCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{goal.title}</h3>
            <p className="text-sm text-slate-400">{goal.description || 'No description yet.'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={goal.status}
              onChange={(e) => onStatusChange(e.target.value as GoalStatus)}
              options={goalStatusOptions}
              className="w-36"
            />
            <Button variant="ghost" size="sm" onClick={() => onEdit(goal)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(goal)}>
              Delete
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{goalCategoryOptions.find((c) => c.value === goal.category)?.label ?? goal.category}</Badge>
          <Badge variant={goal.status === 'completed' ? 'success' : goal.status === 'abandoned' ? 'warning' : 'default'}>
            {goalStatusOptions.find((s) => s.value === goal.status)?.label ?? goal.status}
          </Badge>
          {goal.completedAt && <Badge variant="success">Completed {new Date(goal.completedAt).toLocaleDateString()}</Badge>}
          <Badge className="bg-slate-700 text-slate-200">Updated {new Date(goal.updatedAt).toLocaleString()}</Badge>
        </div>
        {(characterName || teamName) && (
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Link2 className="w-4 h-4 text-primary-400" />
            {characterName && (
              <span className="flex items-center gap-1">
                <span className="text-slate-400">Character:</span> {characterName}
              </span>
            )}
            {teamName && (
              <span className="flex items-center gap-1">
                <span className="text-slate-400">Team:</span> {teamName}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <Checklist goal={goal} onAdd={onAddChecklist} onToggle={onToggleChecklist} onRemove={onRemoveChecklist} />
      </CardContent>
    </Card>
  );
}

interface NoteCardProps {
  note: Note;
  characterName?: string;
  teamName?: string;
  searchQuery: string;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => Promise<void>;
  onTogglePin: (note: Note) => Promise<void>;
}

function NoteCard({ note, characterName, teamName, searchQuery, onEdit, onDelete, onTogglePin }: NoteCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{highlightText(note.title, searchQuery)}</h3>
            <p className="text-xs text-slate-500">Updated {new Date(note.updatedAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onTogglePin(note)}>
              {note.pinned ? <Pin className="w-4 h-4 text-amber-300" /> : <PinOff className="w-4 h-4" />}
              {note.pinned ? 'Unpin' : 'Pin'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(note)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(note)}>
              Delete
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <Badge key={tag} className="bg-slate-700 text-slate-200">
              #{highlightText(tag, searchQuery)}
            </Badge>
          ))}
          {note.tags.length === 0 && <Badge className="bg-slate-700 text-slate-300">No tags</Badge>}
        </div>
        {(note.linkedCharacterKey || note.linkedTeamId) && (
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <ExternalLink className="w-4 h-4 text-primary-400" />
            {characterName && (
              <span className="flex items-center gap-1">
                <span className="text-slate-400">Character:</span> {characterName}
              </span>
            )}
            {teamName && (
              <span className="flex items-center gap-1">
                <span className="text-slate-400">Team:</span> {teamName}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 prose prose-invert max-w-none text-sm text-slate-200 space-y-2">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p>{highlightNodes(children, searchQuery)}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5">{highlightNodes(children, searchQuery)}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5">{highlightNodes(children, searchQuery)}</ol>,
            li: ({ children }) => <li>{highlightNodes(children, searchQuery)}</li>,
          }}
        >
          {note.content}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
}

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<GoalCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('all');
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [tagFilterInput, setTagFilterInput] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const { notes, allNotes, createNote, updateNote, deleteNote, isLoading: notesLoading } = useNotes({
    search: searchQuery,
    tags: tagFilters,
  });
  const {
    goals,
    createGoal,
    updateGoal,
    deleteGoal,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    isLoading: goalsLoading,
  } = useGoals({
    search: searchQuery,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const { allCharacters } = useCharacters();
  const { teams } = useTeams();

  const characterOptions = useMemo(
    () => (allCharacters ?? []).map((char) => ({ key: char.key, name: char.key })),
    [allCharacters]
  );
  const teamOptions = useMemo(() => teams.map((team) => ({ id: team.id, name: team.name })), [teams]);

  const characterNameByKey = useMemo(() => {
    const map = new Map<string, string>();
    (allCharacters ?? []).forEach((char) => map.set(char.key, char.key));
    return map;
  }, [allCharacters]);

  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((team) => map.set(team.id, team.name));
    return map;
  }, [teams]);

  const tags = useMemo(() => {
    const collected = new Set<string>();
    allNotes.forEach((note) => note.tags.forEach((tag) => collected.add(tag)));
    return Array.from(collected).sort();
  }, [allNotes]);

  const isLoading = goalsLoading || notesLoading;

  const handleSaveNote = async (noteDraft: NoteDraft, existingId?: string) => {
    if (existingId) {
      await updateNote(existingId, noteDraft);
    } else {
      await createNote(noteDraft);
    }
  };

  const handleSaveGoal = async (goalDraft: GoalDraft, existingId?: string) => {
    if (existingId) {
      await updateGoal(existingId, goalDraft);
    } else {
      await createGoal(goalDraft);
    }
  };

  const handleStatusChange = async (goal: Goal, status: GoalStatus) => {
    await updateGoal(goal.id, {
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    });
  };

  const handleTagFilterAdd = () => {
    const value = tagFilterInput.trim();
    if (!value) return;
    if (tagFilters.includes(value)) {
      setTagFilterInput('');
      return;
    }
    setTagFilters((prev) => [...prev, value]);
    setTagFilterInput('');
  };

  const toggleTagFilter = (tag: string) => {
    setTagFilters((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading goals and notes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Goals & Notes</h1>
          <p className="text-slate-400">Track priorities, checklists, and detailed notes with quick filtering.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}>
            <Plus className="w-4 h-4" />
            New Goal
          </Button>
          <Button onClick={() => { setEditingNote(null); setShowNoteModal(true); }}>
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2 flex items-center gap-2">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  className="pl-9"
                  placeholder="Search titles, content, or checklist items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select
              label="Goal Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter((e.target.value as GoalCategory) || 'all')}
              options={[{ value: 'all', label: 'All Categories' }, ...goalCategoryOptions]}
            />
            <Select
              label="Goal Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.target.value as GoalStatus) || 'all')}
              options={[{ value: 'all', label: 'All Statuses' }, ...goalStatusOptions]}
            />
          </div>
          <div className="border border-slate-800 rounded-lg p-4 bg-slate-900 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary-400" />
                <p className="text-sm font-medium text-slate-200">Tag Filters</p>
              </div>
              {tagFilters.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setTagFilters([])}>
                  Clear
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add a tag filter"
                value={tagFilterInput}
                onChange={(e) => setTagFilterInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTagFilterAdd();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleTagFilterAdd}>
                Add Tag
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 && <p className="text-sm text-slate-500">No tags yet.</p>}
              {tags.map((tag) => (
                <Button
                  key={tag}
                  variant={tagFilters.includes(tag) ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => toggleTagFilter(tag)}
                  className="border border-slate-700"
                >
                  #{tag}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Goals</h2>
            <span className="text-sm text-slate-500">{goals.length} total</span>
          </div>

          {goals.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center space-y-3">
                <p className="text-lg font-semibold text-slate-200">No goals yet</p>
                <p className="text-slate-400">Create your first goal to start tracking progress.</p>
                <Button variant="secondary" onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}>
                  <Plus className="w-4 h-4" />
                  Add Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  characterName={goal.linkedCharacterKey ? characterNameByKey.get(goal.linkedCharacterKey) : undefined}
                  teamName={goal.linkedTeamId ? teamNameById.get(goal.linkedTeamId) : undefined}
                  onStatusChange={(status) => handleStatusChange(goal, status)}
                  onEdit={(g) => { setEditingGoal(g); setShowGoalModal(true); }}
                  onDelete={(g) => deleteGoal(g.id)}
                  onAddChecklist={(text) => addChecklistItem(goal.id, text)}
                  onToggleChecklist={(itemId) => toggleChecklistItem(goal.id, itemId)}
                  onRemoveChecklist={(itemId) => removeChecklistItem(goal.id, itemId)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Notes</h2>
            <span className="text-sm text-slate-500">{notes.length} total</span>
          </div>

          {notes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center space-y-3">
                <p className="text-lg font-semibold text-slate-200">No notes yet</p>
                <p className="text-slate-400">Capture farming plans, team ideas, or wish planning here.</p>
                <Button onClick={() => { setEditingNote(null); setShowNoteModal(true); }}>
                  <Plus className="w-4 h-4" />
                  Add Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  characterName={note.linkedCharacterKey ? characterNameByKey.get(note.linkedCharacterKey) : undefined}
                  teamName={note.linkedTeamId ? teamNameById.get(note.linkedTeamId) : undefined}
                  searchQuery={searchQuery}
                  onEdit={(n) => { setEditingNote(n); setShowNoteModal(true); }}
                  onDelete={(n) => deleteNote(n.id)}
                  onTogglePin={(n) => updateNote(n.id, { pinned: !n.pinned })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <NoteModal
        isOpen={showNoteModal}
        onClose={() => { setShowNoteModal(false); setEditingNote(null); }}
        onSave={handleSaveNote}
        initialNote={editingNote}
        characters={characterOptions}
        teams={teamOptions}
      />

      <GoalModal
        isOpen={showGoalModal}
        onClose={() => { setShowGoalModal(false); setEditingGoal(null); }}
        onSave={handleSaveGoal}
        initialGoal={editingGoal}
        characters={characterOptions}
        teams={teamOptions}
      />
    </div>
  );
}
