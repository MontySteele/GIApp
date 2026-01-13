import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, Edit2, Users, Package, Skull, Layers, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { useTeam, useTeams } from '@/features/roster/hooks/useTeams';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import TeamForm from '@/features/roster/components/TeamForm';
import { WfpsimExportModal, TeamMemberCard } from '@/features/teams';
import { WeeklyBossTracker, type RequiredWeeklyMaterial } from '@/features/bosses';
import GoalsSection from '@/features/notes/components/GoalsSection';
import {
  calculateFromRoster,
  type AggregatedMaterialSummary,
} from '@/features/planner/domain/multiCharacterCalculator';
import type { Team, Character, BuildTemplate } from '@/types';

type GoalType = 'full' | 'comfortable' | 'functional' | 'next';

const GOAL_OPTIONS: { value: GoalType; label: string; description: string }[] = [
  { value: 'full', label: 'Full Build', description: '90/10/10/10' },
  { value: 'comfortable', label: 'Comfortable', description: '80/8/8/8' },
  { value: 'functional', label: 'Functional', description: '80/6/6' },
  { value: 'next', label: 'Next Ascension', description: 'Next phase only' },
];

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { team, isLoading: teamLoading } = useTeam(id);
  const { updateTeam } = useTeams();
  const { characters, isLoading: charsLoading } = useCharacters();

  const [goalType, setGoalType] = useState<GoalType>('comfortable');
  const [materialSummary, setMaterialSummary] = useState<AggregatedMaterialSummary | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const isLoading = teamLoading || charsLoading;

  // Get applied templates for this team (from team data)
  const teamAppliedTemplates = useMemo(() => {
    return team?.memberBuildTemplates || {};
  }, [team]);

  // Handle applying a template to a team member
  const handleApplyTemplate = useCallback(async (characterKey: string, template: BuildTemplate) => {
    if (!team) return;

    const updatedTemplates = {
      ...(team.memberBuildTemplates || {}),
      [characterKey]: template.id,
    };

    await updateTeam(team.id, {
      ...team,
      memberBuildTemplates: updatedTemplates,
    });
  }, [team, updateTeam]);

  const characterByKey = useMemo(() => {
    const map = new Map<string, Character>();
    characters.forEach((char) => {
      map.set(char.key.toLowerCase(), char);
    });
    return map;
  }, [characters]);

  const teamMembers = useMemo(() => {
    if (!team) return [];
    return team.characterKeys
      .map((key) => characterByKey.get(key.toLowerCase()))
      .filter(Boolean) as Character[];
  }, [team, characterByKey]);

  // Calculate materials when team or goal type changes
  useEffect(() => {
    if (!team || teamMembers.length === 0) {
      setMaterialSummary(null);
      return;
    }

    setIsCalculating(true);
    calculateFromRoster(
      team.characterKeys,
      teamMembers.map((c) => ({
        key: c.key,
        level: c.level,
        ascension: c.ascension,
        talent: c.talent,
      })),
      {}, // Empty inventory for now - shows total requirements
      goalType
    )
      .then(setMaterialSummary)
      .finally(() => setIsCalculating(false));
  }, [team, teamMembers, goalType]);

  // Extract required weekly boss materials for filtering
  const requiredWeeklyMaterials: RequiredWeeklyMaterial[] = useMemo(() => {
    if (!materialSummary) return [];

    return materialSummary.groupedMaterials.weekly.map((mat) => ({
      name: mat.name,
      required: mat.required,
    }));
  }, [materialSummary]);

  const handleSaveTeam = async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (team) {
      await updateTeam(team.id, teamData);
      setShowEditModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading team...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-lg mb-4">Team not found</p>
        <Button variant="secondary" onClick={() => navigate('/teams')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Teams', path: '/teams' },
          { label: team.name, path: `/teams/${team.id}` },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-slate-400">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
            {team.tags && team.tags.length > 0 && (
              <span className="ml-2">
                •{' '}
                {team.tags.map((tag) => (
                  <Badge key={tag} variant="default" className="ml-1 text-xs">
                    {tag}
                  </Badge>
                ))}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowEditModal(true)}>
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="primary" onClick={() => setShowExportModal(true)}>
            <Zap className="w-4 h-4" />
            Export to wfpsim
          </Button>
        </div>
      </div>

      {/* Team Composition */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold">Team Composition</h2>
            </div>
            {Object.keys(teamAppliedTemplates).length > 0 && (
              <Badge className="text-xs bg-primary-900/30 text-primary-300 border border-primary-700/50">
                <Layers className="w-3 h-3 mr-1" />
                {Object.keys(teamAppliedTemplates).length} templates applied
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-slate-500 text-center py-4">
              No members in this team. Edit the team to add characters.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map((char, idx) => (
                <TeamMemberCard
                  key={char.id}
                  character={char}
                  position={idx + 1}
                  appliedTemplateId={teamAppliedTemplates[char.key]}
                  onApplyTemplate={handleApplyTemplate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materials Needed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold">Materials Needed</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Goal:</span>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as GoalType)}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200"
              >
                {GOAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.description})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-slate-500 text-center py-4">
              Add team members to see material requirements.
            </p>
          ) : isCalculating ? (
            <p className="text-slate-400 text-center py-4">Calculating...</p>
          ) : materialSummary ? (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Total Mora</div>
                  <div className="text-lg font-semibold text-yellow-400">
                    {materialSummary.totalMora.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-500">EXP Books</div>
                  <div className="text-lg font-semibold text-purple-400">
                    {materialSummary.totalExp.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Est. Resin</div>
                  <div className="text-lg font-semibold text-blue-400">
                    {materialSummary.totalEstimatedResin.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Est. Days</div>
                  <div className="text-lg font-semibold text-green-400">
                    {materialSummary.totalEstimatedDays}
                  </div>
                </div>
              </div>

              {/* Material Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MaterialCategory
                  title="Weekly Boss Materials"
                  materials={materialSummary.groupedMaterials.weekly}
                  emptyText="No weekly boss materials needed"
                />
                <MaterialCategory
                  title="Talent Books"
                  materials={materialSummary.groupedMaterials.talent}
                  emptyText="No talent books needed"
                />
                <MaterialCategory
                  title="Boss Materials"
                  materials={materialSummary.groupedMaterials.boss}
                  emptyText="No boss materials needed"
                />
                <MaterialCategory
                  title="Gems"
                  materials={materialSummary.groupedMaterials.gem}
                  emptyText="No gems needed"
                />
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">
              Could not calculate materials.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Weekly Boss Tracker */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold">Weekly Boss Tracker</h2>
            {requiredWeeklyMaterials.length > 0 && (
              <Badge className="text-xs bg-primary-900/30 text-primary-300 border border-primary-700/50">
                {requiredWeeklyMaterials.length} materials needed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <WeeklyBossTracker
            requiredMaterials={requiredWeeklyMaterials}
            filterByTeamNeeds={requiredWeeklyMaterials.length > 0}
          />
        </CardContent>
      </Card>

      {/* Team Goals */}
      <GoalsSection linkedTeamId={team.id} title="Team Goals" />

      {/* Edit Team Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Team"
      >
        <TeamForm
          initialData={team}
          characters={characters}
          onSubmit={handleSaveTeam}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Wfpsim Export Modal */}
      {showExportModal && (
        <WfpsimExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          team={team}
          characters={teamMembers}
        />
      )}
    </div>
  );
}

interface MaterialCategoryProps {
  title: string;
  materials: Array<{ name: string; required: number; owned: number; deficit: number }>;
  emptyText: string;
}

function MaterialCategory({ title, materials, emptyText }: MaterialCategoryProps) {
  if (materials.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
        <p className="text-xs text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
      <div className="space-y-1">
        {materials.slice(0, 6).map((mat, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-slate-300 truncate flex-1">{mat.name}</span>
            <span className="text-slate-400 ml-2">{mat.required}</span>
          </div>
        ))}
        {materials.length > 6 && (
          <p className="text-xs text-slate-500 mt-2">
            +{materials.length - 6} more...
          </p>
        )}
      </div>
    </div>
  );
}
