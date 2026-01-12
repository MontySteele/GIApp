import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Search } from 'lucide-react';
import { useCharacters } from '../hooks/useCharacters';
import { useTeams } from '../hooks/useTeams';
import { useRosterModals } from '../hooks/useRosterModals';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import { CharacterCardSkeleton } from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import CharacterCard from '../components/CharacterCard';
import CharacterForm from '../components/CharacterForm';
import CharacterToolbar, { type FilterState } from '../components/CharacterToolbar';
import TeamSection from '../components/TeamSection';
import TeamForm from '../components/TeamForm';
import AddCharacterModal from '../components/AddCharacterModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import EmptyState from '../components/EmptyState';
import GOODExport from '../components/GOODExport';
import TeamSnapshotExport from '../components/TeamSnapshotExport';
import WfpsimExportModal from '@/features/teams/components/WfpsimExportModal';
import type { Team } from '@/types';
import type { CharacterSortField } from '../selectors/characterSelectors';

interface RosterPageProps {
  enableFilters?: boolean;
  enableSorting?: boolean;
}

export default function RosterPage({ enableFilters = true, enableSorting = true }: RosterPageProps) {
  const navigate = useNavigate();
  const modals = useRosterModals();
  const toast = useToast();

  // Filter and sort state
  const [sortField, setSortField] = useState<CharacterSortField>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    element: null,
    weaponType: null,
    rarity: null,
    priority: null,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Data hooks
  const { characters, allCharacters, isLoading, createCharacter, updateCharacter, deleteCharacter } =
    useCharacters({
      filters: { ...filters, search: searchQuery },
      sort: enableSorting
        ? { field: sortField, direction: sortField === 'level' ? 'desc' : 'asc' }
        : undefined,
    });

  const { teams, isLoading: areTeamsLoading, createTeam, updateTeam, deleteTeam } = useTeams();

  // Memoized lookups
  const teamNameById = useMemo(() => new Map(teams.map((team) => [team.id, team.name])), [teams]);

  // Handlers with toast notifications
  const handleTeamSubmit = async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (modals.teamModalMode === 'create') {
        await createTeam(teamData);
        toast.success('Team Created', `${teamData.name} has been added to your roster.`);
      } else if (modals.activeTeam) {
        await updateTeam(modals.activeTeam.id, teamData);
        toast.success('Team Updated', `${teamData.name} has been updated.`);
      }
      modals.closeTeamModal();
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'Failed to save team.');
    }
  };

  const handleCreateCharacter = async (data: Parameters<typeof createCharacter>[0]) => {
    try {
      const id = await createCharacter(data);
      toast.success('Character Added', `${data.key} has been added to your roster.`);
      return id;
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'Failed to add character.');
      throw err;
    }
  };

  const handleUpdateCharacter = async (id: string, data: Parameters<typeof updateCharacter>[1]) => {
    try {
      await updateCharacter(id, data);
      toast.success('Character Updated', 'Character has been updated.');
      modals.closeEditModal();
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'Failed to update character.');
    }
  };

  const confirmCharacterDelete = async () => {
    if (modals.deletingCharacter) {
      try {
        const name = modals.deletingCharacter.key;
        await deleteCharacter(modals.deletingCharacter.id);
        toast.success('Character Deleted', `${name} has been removed from your roster.`);
        modals.closeDeleteModal();
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'Failed to delete character.');
      }
    }
  };

  const confirmTeamDelete = async () => {
    if (modals.deletingTeam) {
      try {
        const name = modals.deletingTeam.name;
        await deleteTeam(modals.deletingTeam.id);
        toast.success('Team Deleted', `${name} has been removed.`);
        modals.closeDeleteTeamModal();
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'Failed to delete team.');
      }
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-9 w-48 bg-slate-700 rounded animate-pulse mb-2" />
            <div className="h-5 w-32 bg-slate-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CharacterCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Character Roster</h1>
          <p className="text-slate-400">
            {characters.length} {characters.length === 1 ? 'character' : 'characters'} in your roster
          </p>
        </div>
        <div className="flex items-center gap-2">
          {characters.length > 0 && (
            <Button variant="ghost" onClick={() => modals.openExportModal('good')} aria-label="Export roster">
              <Download className="w-4 h-4" aria-hidden="true" />
              Export Roster
            </Button>
          )}
          <Button variant="secondary" onClick={modals.openAddModal}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Character
          </Button>
        </div>
      </header>

      {/* Teams Section */}
      <TeamSection
        teams={teams}
        allCharacters={allCharacters ?? []}
        isLoading={areTeamsLoading}
        onCreateTeam={modals.openCreateTeamModal}
        onEditTeam={modals.openEditTeamModal}
        onDeleteTeam={modals.openDeleteTeamModal}
        onExportTeams={() => modals.openExportModal('teams')}
        onExportToWfpsim={modals.openWfpsimExportModal}
      />

      {/* Characters Section */}
      {characters.length === 0 && (allCharacters?.length ?? 0) === 0 ? (
        <EmptyState onAddCharacter={modals.openAddModal} />
      ) : (
        <>
          <CharacterToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            sortField={sortField}
            onSortChange={setSortField}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            enableFilters={enableFilters}
            enableSorting={enableSorting}
          />

          {/* Character Grid/List */}
          {characters.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" aria-hidden="true" />
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
              {characters.map((character) => {
                const teamLabels = character.teamIds
                  .map((id) => teamNameById.get(id))
                  .filter((name): name is string => Boolean(name));

                return (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    teamNames={teamLabels}
                    onClick={() => navigate(`/roster/${character.id}`)}
                    onEdit={modals.openEditModal}
                    onDelete={modals.openDeleteModal}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddCharacterModal
        isOpen={modals.showAddModal}
        onClose={modals.closeAddModal}
        onCreateCharacter={handleCreateCharacter}
      />

      <Modal
        isOpen={modals.showTeamModal}
        onClose={modals.closeTeamModal}
        title={modals.teamModalMode === 'create' ? 'Create Team' : 'Edit Team'}
        size="lg"
      >
        <TeamForm
          characters={allCharacters}
          initialData={modals.teamModalMode === 'edit' ? modals.activeTeam ?? undefined : undefined}
          onSubmit={handleTeamSubmit}
          onCancel={modals.closeTeamModal}
        />
      </Modal>

      <Modal
        isOpen={modals.editingCharacter !== null}
        onClose={modals.closeEditModal}
        title="Edit Character"
        size="lg"
      >
        {modals.editingCharacter && (
          <CharacterForm
            initialData={modals.editingCharacter}
            onSubmit={(data) => handleUpdateCharacter(modals.editingCharacter!.id, data)}
            onCancel={modals.closeEditModal}
          />
        )}
      </Modal>

      <DeleteConfirmModal
        isOpen={modals.deletingCharacter !== null}
        onClose={modals.closeDeleteModal}
        onConfirm={confirmCharacterDelete}
        title="Delete Character"
        itemName={modals.deletingCharacter?.key ?? ''}
        description="This action cannot be undone. All character data including talents, weapon, and artifacts will be permanently removed."
        confirmLabel="Delete Character"
      />

      <DeleteConfirmModal
        isOpen={modals.deletingTeam !== null}
        onClose={modals.closeDeleteTeamModal}
        onConfirm={confirmTeamDelete}
        title="Delete Team"
        itemName={modals.deletingTeam?.name ?? ''}
        description="Linked characters will have this team removed from their profiles."
        confirmLabel="Delete Team"
      />

      <Modal
        isOpen={modals.exportModalView !== null}
        onClose={modals.closeExportModal}
        title={modals.exportModalView === 'teams' ? 'Export Teams' : 'Export Roster'}
        size="lg"
      >
        {modals.exportModalView === 'good' && <GOODExport onClose={modals.closeExportModal} />}
        {modals.exportModalView === 'teams' && <TeamSnapshotExport onClose={modals.closeExportModal} />}
      </Modal>

      {modals.wfpsimExportTeam && (
        <WfpsimExportModal
          team={modals.wfpsimExportTeam}
          characters={allCharacters ?? []}
          isOpen={modals.wfpsimExportTeam !== null}
          onClose={modals.closeWfpsimExportModal}
        />
      )}
    </div>
  );
}
