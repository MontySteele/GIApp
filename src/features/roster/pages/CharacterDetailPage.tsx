import { Star, Pencil, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCharacter } from '../hooks/useCharacters';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatArtifactSetName, formatSlotName, formatStatName, formatStatValue } from '@/lib/gameData';

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { character, isLoading } = useCharacter(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading character...</div>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/roster')}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-1">{character.key}</h1>
            <p className="text-slate-400">
              Level {character.level}/{character.ascension * 10 + 20} • C{character.constellation}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="danger">
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
                  {character.level}/{character.ascension * 10 + 20}
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
                    Level {character.weapon.level}/{character.weapon.ascension * 10 + 20}
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

        {/* Artifacts Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Artifacts</h2>
          </CardHeader>
          <CardContent>
            {character.artifacts.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No artifacts equipped
              </p>
            ) : (
              <div className="grid gap-4">
                {character.artifacts.map((artifact, index) => (
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
                      <Badge variant={artifact.rarity === 5 ? 'warning' : 'default'}>
                        {artifact.rarity}★
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-slate-500 mb-1">Main Stat</div>
                      <div className="text-sm text-slate-200 font-medium">
                        {formatStatName(artifact.mainStatKey)}
                      </div>
                    </div>

                    {artifact.substats.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-500 mb-2">Substats</div>
                        <div className="grid grid-cols-2 gap-2">
                          {artifact.substats.map((substat, subIndex) => (
                            <div
                              key={subIndex}
                              className="text-xs text-slate-300"
                            >
                              {formatStatName(substat.key)}: {formatStatValue(substat.key, substat.value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
    </div>
  );
}
