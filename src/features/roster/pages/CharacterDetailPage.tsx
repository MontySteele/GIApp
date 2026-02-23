import { useMemo, useState } from 'react';
import { Star, Pencil, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCharacter, useCharacters } from '../hooks/useCharacters';
import { useTeams } from '../hooks/useTeams';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { CardSkeleton } from '@/components/ui/Skeleton';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import CharacterForm from '../components/CharacterForm';
import CharacterProgression from '../components/CharacterProgression';
import GoalsSection from '@/features/notes/components/GoalsSection';
import { formatArtifactSetName, formatSlotName, formatStatName, formatStatValue } from '@/lib/gameData';
import { MAX_LEVEL_BY_ASCENSION } from '@/lib/constants';
import {
  calculateCharacterArtifactScore,
  scoreEquippedArtifact,
  getGradeColor,
  getGradeBgColor,
} from '@/features/artifacts/domain/artifactScoring';
import BuildRecommendations from '@/features/artifacts/components/BuildRecommendations';

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { character, isLoading } = useCharacter(id);
  const { updateCharacter, deleteCharacter } = useCharacters();
  const { teams } = useTeams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const linkedTeams = useMemo(
    () => (character ? teams.filter((team) => character.teamIds.includes(team.id)) : []),
    [teams, character?.teamIds]
  );

  // Calculate artifact scores
  const artifactScoreData = useMemo(() => {
    if (!character || character.artifacts.length === 0) return null;
    return calculateCharacterArtifactScore(character.artifacts);
  }, [character?.artifacts]);

  const handleUpdate = async (data: Parameters<typeof updateCharacter>[1]) => {
    if (!character) return;

    await updateCharacter(character.id, data);
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (!character) return;

    setIsDeleting(true);
    try {
      await deleteCharacter(character.id);
      navigate('/roster');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-1 bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-16 bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-1 bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
        </div>
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-9 w-48 bg-slate-700 rounded animate-pulse mb-2" />
            <div className="h-5 w-32 bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-slate-700 rounded animate-pulse" />
            <div className="h-10 w-20 bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="grid gap-4">
          <CardSkeleton className="h-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-slate-400 mb-4">Character not found</p>
        <Button onClick={() => navigate('/roster')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Roster
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Roster', path: '/roster' },
          { label: character.key, path: `/roster/${character.id}` },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">{character.key}</h1>
          <p className="text-slate-400">
            Level {character.level}/{MAX_LEVEL_BY_ASCENSION[character.ascension] ?? 90} • C{character.constellation}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Character Info</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-slate-400 mb-1">Level</div>
                <div className="text-lg font-medium">
                  {character.level}/{MAX_LEVEL_BY_ASCENSION[character.ascension] ?? 90}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Ascension</div>
                <div className="text-lg font-medium">{character.ascension}/6</div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Constellation</div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < character.constellation
                          ? 'fill-rarity-5 text-rarity-5'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Priority</div>
                <Badge variant="default">{character.priority}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teams Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Teams</h2>
          </CardHeader>
          <CardContent>
            {linkedTeams.length === 0 ? (
              <p className="text-slate-400 text-center py-4">This character is not assigned to any teams yet.</p>
            ) : (
              <div className="space-y-3">
                {linkedTeams.map((team) => (
                  <div
                    key={team.id}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-100">{team.name}</div>
                        <div className="text-xs text-slate-500">
                          Rotation: {team.characterKeys.join(' • ')}
                        </div>
                      </div>
                      {team.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {team.tags.map((tag) => (
                            <Badge key={`${team.id}-${tag}`} variant="outline" className="text-[11px] capitalize">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {team.rotationNotes && (
                      <p className="text-sm text-slate-300 whitespace-pre-line">{team.rotationNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Talents Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Talents</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Normal Attack</div>
                <div className="text-2xl font-bold text-slate-100">
                  {character.talent.auto}
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Elemental Skill</div>
                <div className="text-2xl font-bold text-slate-100">
                  {character.talent.skill}
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Elemental Burst</div>
                <div className="text-2xl font-bold text-slate-100">
                  {character.talent.burst}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weapon Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Weapon</h2>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-1">
                    {character.weapon.key}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Level {character.weapon.level}/{MAX_LEVEL_BY_ASCENSION[character.weapon.ascension] ?? 90}
                  </p>
                </div>
                <Badge variant="primary">R{character.weapon.refinement}</Badge>
              </div>
              <div className="text-sm text-slate-400">
                Ascension {character.weapon.ascension}/6
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Build Recommendations Card */}
        <BuildRecommendations character={character} />

        {/* Progression Card */}
        <CharacterProgression character={character} />

        {/* Artifacts Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Artifacts</h2>
              {artifactScoreData && (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-400">
                    Total CV: <span className="text-slate-200 font-medium">{artifactScoreData.totalCritValue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Avg:</span>
                    <span
                      className={`px-2 py-1 text-sm font-bold rounded border ${getGradeBgColor(artifactScoreData.averageGrade)} ${getGradeColor(artifactScoreData.averageGrade)}`}
                    >
                      {artifactScoreData.averageGrade}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {character.artifacts.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No artifacts equipped
              </p>
            ) : (
              <div className="grid gap-4">
                {character.artifacts.map((artifact, index) => {
                  const score = scoreEquippedArtifact(artifact);
                  return (
                    <div
                      key={index}
                      className="bg-slate-900 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-100 mb-1">
                            {formatArtifactSetName(artifact.setKey)}
                          </h4>
                          <p className="text-sm text-slate-400">
                            {formatSlotName(artifact.slotKey)} • +{artifact.level}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={artifact.rarity === 5 ? 'warning' : 'default'}>
                            {artifact.rarity}★
                          </Badge>
                          <span
                            className={`px-1.5 py-0.5 text-xs font-bold rounded border ${getGradeBgColor(score.grade)} ${getGradeColor(score.grade)}`}
                            title={`Score: ${score.score} | CV: ${score.critValue}`}
                          >
                            {score.grade}
                          </span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-xs text-slate-500 mb-1">Main Stat</div>
                        <div className="text-sm text-slate-200 font-medium">
                          {formatStatName(artifact.mainStatKey)}
                        </div>
                      </div>

                      {artifact.substats.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-slate-500">Substats</div>
                            <div className="text-xs text-slate-500">
                              CV: {score.critValue}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {artifact.substats.map((substat, subIndex) => {
                              const isCritStat = substat.key.toLowerCase().includes('crit');
                              return (
                                <div
                                  key={subIndex}
                                  className={`text-xs ${isCritStat ? 'text-yellow-400' : 'text-slate-300'}`}
                                >
                                  {formatStatName(substat.key)}: {formatStatValue(substat.key, substat.value)}
                                </div>
                              );
                            })}
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

        {/* Character Goals */}
        <GoalsSection
          linkedCharacterKey={character.key}
          title="Character Goals"
        />

        {/* Notes Card */}
        {character.notes && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Notes</h2>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 whitespace-pre-wrap">{character.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Character"
        size="lg"
      >
        {character && (
          <CharacterForm
            initialData={character}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
          />
        )}
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Character"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-900/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-slate-200 font-medium mb-1">
                Are you sure you want to delete {character?.key}?
              </p>
              <p className="text-sm text-slate-400">
                This action cannot be undone. All character data including talents, weapon, and artifacts will be permanently removed.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
              Delete Character
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
