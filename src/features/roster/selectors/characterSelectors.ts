import { getCharacterMetadata } from '../data/characterMetadata';
import type { Character, CharacterPriority } from '@/types';

export type CharacterSortField = 'name' | 'priority' | 'level';
export type SortDirection = 'asc' | 'desc';

export interface CharacterQuery {
  filters?: {
    element?: string | null;
    weaponType?: string | null;
    rarity?: number | null;
    priority?: CharacterPriority | null;
    search?: string;
  };
  sort?: {
    field: CharacterSortField;
    direction?: SortDirection;
  };
}

const PRIORITY_ORDER: CharacterPriority[] = ['main', 'secondary', 'bench', 'unbuilt'];

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? '';

export function filterAndSortCharacters(characters: Character[], query?: CharacterQuery): Character[] {
  if (!query) {
    return characters;
  }

  const { filters, sort } = query;
  const normalizedSearch = normalize(filters?.search);

  const withMetadata = characters
    .map((character, index) => ({
      character,
      metadata: getCharacterMetadata(character.key),
      index,
    }))
    .filter(({ metadata }) => {
      if (!filters) return true;

      if (filters.element && metadata?.element !== filters.element) {
        return false;
      }

      if (filters.weaponType && metadata?.weaponType !== filters.weaponType) {
        return false;
      }

      if (filters.rarity && metadata?.rarity !== filters.rarity) {
        return false;
      }

      if (filters.priority && character.priority !== filters.priority) {
        return false;
      }

      if (normalizedSearch) {
        const matchesName = normalize(character.key).includes(normalizedSearch);
        if (!matchesName) {
          return false;
        }
      }

      return true;
    });

  if (!sort) {
    return withMetadata.map((item) => item.character);
  }

  const directionMultiplier = sort.direction === 'desc' ? -1 : 1;

  const sorted = [...withMetadata].sort((a, b) => {
    if (sort.field === 'name') {
      const result = a.character.key.localeCompare(b.character.key);
      if (result !== 0) return result * directionMultiplier;
    } else if (sort.field === 'priority') {
      const aIndex = PRIORITY_ORDER.indexOf(a.character.priority);
      const bIndex = PRIORITY_ORDER.indexOf(b.character.priority);
      if (aIndex !== bIndex) {
        return (aIndex - bIndex) * directionMultiplier;
      }
    } else if (sort.field === 'level') {
      const result = a.character.level - b.character.level;
      if (result !== 0) {
        return result * directionMultiplier;
      }
    }

    return a.index - b.index;
  });

  return sorted.map((item) => item.character);
}
