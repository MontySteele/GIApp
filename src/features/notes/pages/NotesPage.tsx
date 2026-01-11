import { Fragment, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Plus, Pin, PinOff, Search, Tag, X, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useGoals } from '../hooks/useGoals';
import { useNotes } from '../hooks/useNotes';
import type { Goal, Note } from '@/types';

type NoteDraft = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;

// Sticky colors for visual variety
const STICKY_COLORS = [
  { name: 'Yellow', bg: 'bg-amber-900/40', border: 'border-amber-700/50', text: 'text-amber-100' },
  { name: 'Green', bg: 'bg-emerald-900/40', border: 'border-emerald-700/50', text: 'text-emerald-100' },
  { name: 'Blue', bg: 'bg-sky-900/40', border: 'border-sky-700/50', text: 'text-sky-100' },
  { name: 'Purple', bg: 'bg-violet-900/40', border: 'border-violet-700/50', text: 'text-violet-100' },
  { name: 'Pink', bg: 'bg-pink-900/40', border: 'border-pink-700/50', text: 'text-pink-100' },
  { name: 'Orange', bg: 'bg-orange-900/40', border: 'border-orange-700/50', text: 'text-orange-100' },
];

// Get a color based on string hash for consistent coloring
function getColorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % STICKY_COLORS.length;
  return STICKY_COLORS[index]!;
}

interface StickyNoteProps {
  id: string;
  title: string;
  content: string;
  onEdit: () => void;
  onDelete: () => void;
}

function StickyNote({ id, title, content, onEdit, onDelete }: StickyNoteProps) {
  const color = getColorForId(id);

  return (
    <div
      className={`${color.bg} ${color.border} border-2 rounded-lg p-4 cursor-pointer hover:scale-[1.02] transition-transform shadow-lg`}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className={`font-semibold ${color.text} line-clamp-1`}>{title || 'Untitled'}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <p className={`text-sm ${color.text} opacity-80 line-clamp-4 whitespace-pre-wrap`}>
        {content || 'Click to add content...'}
      </p>
    </div>
  );
}

interface StickyEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => void;
  initialTitle?: string;
  initialContent?: string;
  isNew?: boolean;
}

function StickyEditor({ isOpen, onClose, onSave, initialTitle = '', initialContent = '', isNew = false }: StickyEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent]);

  const handleSave = () => {
    onSave(title.trim(), content.trim());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isNew ? 'New Sticky' : 'Edit Sticky'} size="md">
      <div className="space-y-4">
        <Input
          label="Title"
          placeholder="Quick note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Content</label>
          <textarea
            className="w-full h-40 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here..."
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isNew ? 'Create' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: NoteDraft, existingId?: string) => Promise<void>;
  initialNote?: Note | null;
}

function NoteModal({ isOpen, onClose, onSave, initialNote }: NoteModalProps) {
  const [form, setForm] = useState<NoteDraft>({
    title: initialNote?.title ?? '',
    content: initialNote?.content ?? '',
    tags: initialNote?.tags ?? [],
    pinned: initialNote?.pinned ?? false,
  });
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({
      title: initialNote?.title ?? '',
      content: initialNote?.content ?? '',
      tags: initialNote?.tags ?? [],
      pinned: initialNote?.pinned ?? false,
    });
    setTagInput('');
  }, [initialNote]);

  const resetForm = () => {
    setForm({ title: '', content: '', tags: [], pinned: false });
    setTagInput('');
  };

  const handleAddTag = () => {
    const value = tagInput.trim();
    if (!value || form.tags.includes(value)) {
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
              placeholder="Note title..."
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
                placeholder="Write using markdown..."
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Tags</label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add tag..."
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
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <Badge key={tag} className="flex items-center gap-2 bg-primary-900 border border-primary-700">
                    {tag}
                    <button type="button" className="text-slate-300 hover:text-white" onClick={() => handleRemoveTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-700 px-3 py-2 bg-slate-900">
              <span className="text-sm text-slate-200">Pin to top</span>
              <Button
                type="button"
                variant={form.pinned ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setForm((prev) => ({ ...prev, pinned: !prev.pinned }))}
              >
                {form.pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Preview</h3>
            <Card className="h-full max-h-96 overflow-auto">
              <CardContent className="prose prose-invert max-w-none">
                {form.content ? (
                  <ReactMarkdown>{form.content}</ReactMarkdown>
                ) : (
                  <p className="text-slate-500">Write some markdown to see preview.</p>
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
            {initialNote ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface NoteCardProps {
  note: Note;
  searchQuery: string;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

function NoteCard({ note, searchQuery, onEdit, onDelete, onTogglePin }: NoteCardProps) {
  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={i} className="bg-primary-700/60 text-white rounded px-0.5">{part}</mark>
        : <Fragment key={i}>{part}</Fragment>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-slate-100 truncate">{highlightText(note.title)}</h3>
            <p className="text-xs text-slate-500">{new Date(note.updatedAt).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onTogglePin} className="p-1.5 text-slate-400 hover:text-amber-300 transition-colors">
              {note.pinned ? <Pin className="w-4 h-4 text-amber-300" /> : <PinOff className="w-4 h-4" />}
            </button>
            <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-primary-400 transition-colors">
              Edit
            </button>
            <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.map((tag) => (
              <Badge key={tag} className="text-xs bg-slate-700 text-slate-300">#{tag}</Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 prose prose-invert prose-sm max-w-none text-slate-300 overflow-hidden">
        <div className="line-clamp-6">
          <ReactMarkdown>{note.content}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showStickyEditor, setShowStickyEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingSticky, setEditingSticky] = useState<Goal | null>(null);

  const { notes, allNotes, createNote, updateNote, deleteNote, isLoading: notesLoading } = useNotes({
    search: searchQuery,
    tags: tagFilters,
  });
  const { goals: stickies, createGoal, updateGoal, deleteGoal, isLoading: stickiesLoading } = useGoals({
    search: searchQuery,
  });

  // Collect all tags from notes
  const allTags = useMemo(() => {
    const collected = new Set<string>();
    allNotes.forEach((note) => note.tags.forEach((tag) => collected.add(tag)));
    return Array.from(collected).sort();
  }, [allNotes]);

  const isLoading = stickiesLoading || notesLoading;

  const handleSaveNote = async (noteDraft: NoteDraft, existingId?: string) => {
    if (existingId) {
      await updateNote(existingId, noteDraft);
    } else {
      await createNote(noteDraft);
    }
  };

  const handleSaveSticky = async (title: string, content: string) => {
    if (editingSticky) {
      await updateGoal(editingSticky.id, { title, description: content });
    } else {
      await createGoal({
        title,
        description: content,
        category: 'other',
        status: 'active',
        checklist: [],
      });
    }
    setEditingSticky(null);
  };

  const handleDeleteSticky = async (id: string) => {
    await deleteGoal(id);
  };

  const toggleTagFilter = (tag: string) => {
    setTagFilters((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Notes & Stickies</h1>
          <p className="text-slate-400">Quick stickies for reminders, detailed notes for everything else.</p>
        </div>
      </div>

      {/* Stickies Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Quick Stickies</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditingSticky(null);
              setShowStickyEditor(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Sticky
          </Button>
        </div>

        {stickies.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-lg p-8 text-center">
            <p className="text-slate-400 mb-3">No stickies yet. Add quick notes for reminders!</p>
            <Button
              variant="secondary"
              onClick={() => {
                setEditingSticky(null);
                setShowStickyEditor(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Create your first sticky
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {stickies.map((sticky) => (
              <StickyNote
                key={sticky.id}
                id={sticky.id}
                title={sticky.title}
                content={sticky.description}
                onEdit={() => {
                  setEditingSticky(sticky);
                  setShowStickyEditor(true);
                }}
                onDelete={() => handleDeleteSticky(sticky.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Notes Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Notes</h2>
          <Button
            onClick={() => {
              setEditingNote(null);
              setShowNoteModal(true);
            }}
          >
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  className="pl-9"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {tagFilters.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setTagFilters([])}>
                  Clear filters
                </Button>
              )}
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTagFilter(tag)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      tagFilters.includes(tag)
                        ? 'bg-primary-600 border-primary-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {notes.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-lg p-8 text-center">
            <p className="text-slate-400 mb-3">
              {searchQuery || tagFilters.length > 0
                ? 'No notes match your search.'
                : 'No notes yet. Create detailed markdown notes here.'}
            </p>
            {!searchQuery && tagFilters.length === 0 && (
              <Button onClick={() => { setEditingNote(null); setShowNoteModal(true); }}>
                <Plus className="w-4 h-4" />
                Create your first note
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                searchQuery={searchQuery}
                onEdit={() => { setEditingNote(note); setShowNoteModal(true); }}
                onDelete={() => deleteNote(note.id)}
                onTogglePin={() => updateNote(note.id, { pinned: !note.pinned })}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <NoteModal
        isOpen={showNoteModal}
        onClose={() => { setShowNoteModal(false); setEditingNote(null); }}
        onSave={handleSaveNote}
        initialNote={editingNote}
      />

      <StickyEditor
        isOpen={showStickyEditor}
        onClose={() => { setShowStickyEditor(false); setEditingSticky(null); }}
        onSave={handleSaveSticky}
        initialTitle={editingSticky?.title ?? ''}
        initialContent={editingSticky?.description ?? ''}
        isNew={!editingSticky}
      />
    </div>
  );
}
