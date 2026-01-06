import { useLiveQuery } from 'dexie-react-hooks';
import { characterRepo } from '../characterRepo';
import type { Character } from '@/types';

export function useCharacterRepo() {
  const characters = useLiveQuery(() => characterRepo.getAll(), []);

  const createCharacter = async (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) => {
    return characterRepo.create(character);
  };

  const updateCharacter = async (id: string, updates: Partial<Omit<Character, 'id' | 'createdAt' | 'deletedAt'>>) => {
    return characterRepo.update(id, updates);
  };

  const deleteCharacter = async (id: string) => {
    return characterRepo.delete(id);
  };

  return {
    characters: characters ?? [],
    createCharacter,
    updateCharacter,
    deleteCharacter,
    isLoading: characters === undefined,
  };
}

export function useCharacterRepoById(id: string | undefined) {
  const character = useLiveQuery(
    () => (id ? characterRepo.getById(id) : undefined),
    [id]
  );

  return {
    character,
    isLoading: character === undefined && id !== undefined,
  };
}
