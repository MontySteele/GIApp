import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { characterRepo } from '../repo/characterRepo';
import { filterAndSortCharacters, type CharacterQuery } from '../selectors/characterSelectors';
import type { Character } from '@/types';

export function useCharacters(query?: CharacterQuery) {
  const characters = useLiveQuery(() => characterRepo.getAll(), []);
  const filters = query?.filters;
  const sort = query?.sort;
  const hasQuery = query !== undefined;
  const element = filters?.element;
  const weaponType = filters?.weaponType;
  const rarity = filters?.rarity;
  const priority = filters?.priority;
  const search = filters?.search;
  const sortField = sort?.field;
  const sortDirection = sort?.direction;

  const filteredCharacters = useMemo(() => {
    const stableQuery = hasQuery
      ? {
          filters: {
            element,
            weaponType,
            rarity,
            priority,
            search,
          },
          sort: sortField
            ? {
                field: sortField,
                direction: sortDirection,
              }
            : undefined,
        }
      : undefined;
    return filterAndSortCharacters(characters ?? [], stableQuery);
  }, [characters, element, hasQuery, priority, rarity, search, sortDirection, sortField, weaponType]);

  const createCharacter = async (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => {
    return characterRepo.create(character);
  };

  const updateCharacter = async (id: string, updates: Partial<Omit<Character, 'id' | 'createdAt'>>) => {
    return characterRepo.update(id, updates);
  };

  const deleteCharacter = async (id: string) => {
    return characterRepo.delete(id);
  };

  return {
    characters: filteredCharacters,
    allCharacters: characters ?? [],
    createCharacter,
    updateCharacter,
    deleteCharacter,
    isLoading: characters === undefined,
  };
}

export function useCharacter(id: string | undefined) {
  const character = useLiveQuery(
    () => (id ? characterRepo.getById(id) : undefined),
    [id]
  );

  return {
    character,
    isLoading: character === undefined && id !== undefined,
  };
}
