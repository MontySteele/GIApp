import { useState } from 'react';
import { Plus, Grid3x3, List, Search, Filter, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useCharacters } from '../hooks/useCharacters';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CharacterCard from '../components/CharacterCard';
import EmptyState from '../components/EmptyState';
import Modal from '@/components/ui/Modal';
import CharacterForm from '../components/CharacterForm';
import type { Character } from '@/types';

type AddModalView = 'options' | 'manual' | 'enka' | 'good';

export default function RosterPage() {
  const { characters, isLoading, createCharacter, updateCharacter, deleteCharacter } = useCharacters();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalView, setAddModalView] = useState<AddModalView>('options');
  const [showFilters, setShowFilters] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [deletingCharacter, setDeletingCharacter] = useState<Character | null>(null);

  const handleCloseModal = () => {
    setShowAddModal(false);
    setAddModalView('options');
  };

  const handleCloseEditModal = () => {
    setEditingCharacter(null);
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
  };

  const handleDelete = (character: Character) => {
    setDeletingCharacter(character);
  };

  const confirmDelete = async () => {
    if (deletingCharacter) {
      await deleteCharacter(deletingCharacter.id);
      setDeletingCharacter(null);
    }
  };

  // Filter characters based on search
  const filteredCharacters = characters.filter((char) =>
    char.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading characters...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Character Roster</h1>
          <p className="text-slate-400">
            {characters.length} {characters.length === 1 ? 'character' : 'characters'} in your roster
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Character
          </Button>
        </div>
      </div>

      {characters.length === 0 ? (
        <EmptyState onAddCharacter={() => setShowAddModal(true)} />
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters Toggle */}
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
              <div className="text-sm text-slate-400">
                Filters coming soon: Element, Weapon Type, Rarity, Priority
              </div>
            </div>
          )}

          {/* Character Grid/List */}
          {filteredCharacters.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No characters match your search</p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'space-y-3'
              }
            >
              {filteredCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onClick={() => console.log('View character:', character.id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Character Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={
          addModalView === 'options' ? 'Add Character' :
          addModalView === 'manual' ? 'Manual Entry' :
          addModalView === 'enka' ? 'Import from Enka.network' :
          'Import GOOD Format'
        }
        size="lg"
      >
        {addModalView === 'options' && (
          <div className="space-y-4">
            <p className="text-slate-400">
              Choose how you'd like to add characters to your roster:
            </p>
            <div className="grid gap-3">
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => setAddModalView('manual')}
              >
                Manual Entry
              </Button>
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => setAddModalView('enka')}
              >
                Import from Enka.network
              </Button>
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => setAddModalView('good')}
              >
                Import GOOD Format (JSON)
              </Button>
            </div>
          </div>
        )}

        {addModalView === 'manual' && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddModalView('options')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to options
            </Button>
            <CharacterForm
              onSubmit={async (data) => {
                await createCharacter(data);
                handleCloseModal();
              }}
              onCancel={handleCloseModal}
            />
          </div>
        )}

        {addModalView === 'enka' && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddModalView('options')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to options
            </Button>
            <p className="text-slate-400">Enka.network import coming soon...</p>
          </div>
        )}

        {addModalView === 'good' && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddModalView('options')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to options
            </Button>
            <p className="text-slate-400">GOOD format import coming soon...</p>
          </div>
        )}
      </Modal>

      {/* Edit Character Modal */}
      <Modal
        isOpen={editingCharacter !== null}
        onClose={handleCloseEditModal}
        title="Edit Character"
        size="lg"
      >
        {editingCharacter && (
          <CharacterForm
            initialData={editingCharacter}
            onSubmit={async (data) => {
              await updateCharacter(editingCharacter.id, data);
              handleCloseEditModal();
            }}
            onCancel={handleCloseEditModal}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingCharacter !== null}
        onClose={() => setDeletingCharacter(null)}
        title="Delete Character"
        size="sm"
      >
        {deletingCharacter && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-slate-200 font-medium mb-1">
                  Are you sure you want to delete {deletingCharacter.key}?
                </p>
                <p className="text-sm text-slate-400">
                  This action cannot be undone. All character data including talents, weapon, and artifacts will be permanently removed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
              <Button
                variant="ghost"
                onClick={() => setDeletingCharacter(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
              >
                Delete Character
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
