import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { characterRepo } from '../repo/characterRepo';
import { filterAndSortCharacters, type CharacterQuery } from '../selectors/characterSelectors';
import type { Character } from '@/types';

export function useCharacters(query?: CharacterQuery) {
  const characters = useLiveQuery(() => characterRepo.getAll(), []);

  const filteredCharacters = useMemo(
    () => filterAndSortCharacters(characters ?? [], query),
    [
      characters,
      query?.filters?.element,
      query?.filters?.weaponType,
      query?.filters?.rarity,
      query?.filters?.priority,
      query?.filters?.search,
      query?.sort?.field,
      query?.sort?.direction,
    ]
  );

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
