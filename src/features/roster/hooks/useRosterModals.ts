import { useState, useCallback } from 'react';
import type { Character, Team } from '@/types';

type ExportModalView = null | 'good' | 'teams';
type TeamModalMode = 'create' | 'edit';

interface RosterModalsState {
  // Add character modal
  showAddModal: boolean;
  // Edit character modal
  editingCharacter: Character | null;
  // Delete character modal
  deletingCharacter: Character | null;
  // Export modal
  exportModalView: ExportModalView;
  // Team modal
  showTeamModal: boolean;
  teamModalMode: TeamModalMode;
  activeTeam: Team | null;
  // Delete team modal
  deletingTeam: Team | null;
}

export function useRosterModals() {
  const [state, setState] = useState<RosterModalsState>({
    showAddModal: false,
    editingCharacter: null,
    deletingCharacter: null,
    exportModalView: null,
    showTeamModal: false,
    teamModalMode: 'create',
    activeTeam: null,
    deletingTeam: null,
  });

  // Add Character Modal
  const openAddModal = useCallback(() => {
    setState((s) => ({ ...s, showAddModal: true }));
  }, []);

  const closeAddModal = useCallback(() => {
    setState((s) => ({ ...s, showAddModal: false }));
  }, []);

  // Edit Character Modal
  const openEditModal = useCallback((character: Character) => {
    setState((s) => ({ ...s, editingCharacter: character }));
  }, []);

  const closeEditModal = useCallback(() => {
    setState((s) => ({ ...s, editingCharacter: null }));
  }, []);

  // Delete Character Modal
  const openDeleteModal = useCallback((character: Character) => {
    setState((s) => ({ ...s, deletingCharacter: character }));
  }, []);

  const closeDeleteModal = useCallback(() => {
    setState((s) => ({ ...s, deletingCharacter: null }));
  }, []);

  // Export Modal
  const openExportModal = useCallback((view: 'good' | 'teams') => {
    setState((s) => ({ ...s, exportModalView: view }));
  }, []);

  const closeExportModal = useCallback(() => {
    setState((s) => ({ ...s, exportModalView: null }));
  }, []);

  // Team Modal
  const openCreateTeamModal = useCallback(() => {
    setState((s) => ({
      ...s,
      showTeamModal: true,
      teamModalMode: 'create',
      activeTeam: null,
    }));
  }, []);

  const openEditTeamModal = useCallback((team: Team) => {
    setState((s) => ({
      ...s,
      showTeamModal: true,
      teamModalMode: 'edit',
      activeTeam: team,
    }));
  }, []);

  const closeTeamModal = useCallback(() => {
    setState((s) => ({ ...s, showTeamModal: false, activeTeam: null }));
  }, []);

  // Delete Team Modal
  const openDeleteTeamModal = useCallback((team: Team) => {
    setState((s) => ({ ...s, deletingTeam: team }));
  }, []);

  const closeDeleteTeamModal = useCallback(() => {
    setState((s) => ({ ...s, deletingTeam: null }));
  }, []);

  return {
    // State
    showAddModal: state.showAddModal,
    editingCharacter: state.editingCharacter,
    deletingCharacter: state.deletingCharacter,
    exportModalView: state.exportModalView,
    showTeamModal: state.showTeamModal,
    teamModalMode: state.teamModalMode,
    activeTeam: state.activeTeam,
    deletingTeam: state.deletingTeam,

    // Actions
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    openExportModal,
    closeExportModal,
    openCreateTeamModal,
    openEditTeamModal,
    closeTeamModal,
    openDeleteTeamModal,
    closeDeleteTeamModal,
  };
}
