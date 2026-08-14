/**
 * Imaginarium Theatre tab
 *
 * Season picker plus per-difficulty readiness for the player's roster.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Drama, Info } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import DifficultyReadinessCard from '../components/DifficultyReadinessCard';
import type { TheaterElement } from '../data/theaterSeasons';
import { useTheaterReadiness } from '../hooks/useTheaterReadiness';

const ELEMENT_BADGE_VARIANTS: Record<
  TheaterElement,
  'pyro' | 'hydro' | 'anemo' | 'electro' | 'dendro' | 'cryo' | 'geo'
> = {
  Pyro: 'pyro',
  Hydro: 'hydro',
  Anemo: 'anemo',
  Electro: 'electro',
  Dendro: 'dendro',
  Cryo: 'cryo',
  Geo: 'geo',
};

export default function TheaterTab() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(undefined);
  const { seasons, season, readiness, characters, isLoading } =
    useTheaterReadiness(selectedSeasonId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Drama className="h-5 w-5 text-primary-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-100">Imaginarium Theatre</h2>
        </div>

        {seasons.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="theater-season" className="text-xs text-slate-400">
              Season
            </label>
            <select
              id="theater-season"
              value={season?.id ?? ''}
              onChange={(event) => setSelectedSeasonId(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100"
            >
              {seasons.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.id}
                  {entry.source === 'beta' ? ' (beta)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!season ? (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-300">No Imaginarium Theatre season data yet.</p>
            <p className="mt-1 text-xs text-slate-500">
              Season line-ups are added with each patch update.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {season.elements.map((element) => (
                  <Badge
                    key={element}
                    variant={ELEMENT_BADGE_VARIANTS[element]}
                    className="text-xs"
                  >
                    {element}
                  </Badge>
                ))}
                {season.source === 'beta' && (
                  <Badge variant="warning" className="text-xs">
                    Beta — subject to change
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Openers (free trials available): {season.openingCharacters.join(', ')}
              </p>
              <p className="text-xs text-slate-400">
                Special guests (must be owned): {season.specialGuests.join(', ')}
              </p>
              {season.advantageNotes && (
                <p className="flex items-start gap-2 text-xs text-slate-300">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {season.advantageNotes}
                </p>
              )}
            </CardContent>
          </Card>

          {!isLoading && characters.length === 0 && (
            <Card>
              <CardContent>
                <p className="text-sm text-slate-300">
                  No characters in your roster yet — only the free opener trials are counted
                  below.
                </p>
                <Link
                  to="/imports"
                  className="mt-1 inline-block text-xs text-primary-400 hover:text-primary-300"
                >
                  Import your roster to see real readiness
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {readiness?.difficulties.map((difficulty) => (
              <DifficultyReadinessCard
                key={difficulty.difficulty}
                readiness={difficulty}
                characters={characters}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
