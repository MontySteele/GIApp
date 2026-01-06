import { useLiveQuery } from 'dexie-react-hooks';
import type { WishRecord } from '@/types';
import { wishRepo } from '../wishRepo';

export function useWishRecords() {
  const wishes = useLiveQuery(() => wishRepo.getAll(), []);

  const addWishes = async (records: Array<Omit<WishRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>) => {
    return wishRepo.bulkCreate(records);
  };

  const clearWishes = async () => {
    return wishRepo.deleteAll();
  };

  return {
    wishes: wishes ?? [],
    isLoading: wishes === undefined,
    addWishes,
    clearWishes,
  };
}
