import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { db } from '@/db/schema';
import { teamRepo } from './teamRepo';
import { characterRepo } from './characterRepo';
import type { Team, Character } from '@/types';

const mockTeamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Hyperbloom Raiden',
  characterKeys: ['RaidenShogun', 'Nahida', 'Yelan', 'Kazuha'],
  rotationNotes: 'Rotation notes here',
  tags: ['hyperbloom', 'spiral-abyss'],
};

const mockCharacter = (key: string): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> => ({
  key,
  level: 90,
  ascension: 6,
  constellation: 0,
  talent: {
    auto: 1,
    skill: 1,
    burst: 1,
  },
  weapon: {
    key: `${key}-weapon`,
    level: 90,
    ascension: 6,
    refinement: 1,
  },
  artifacts: [],
  notes: '',
  priority: 'main',
  teamIds: [],
});

describe('Team Repository', () => {
  beforeEach(async () => {
    await db.teams.clear();
    await db.characters.clear();
  });

  afterEach(async () => {
    await db.teams.clear();
    await db.characters.clear();
  });

  describe('create', () => {
    it('creates a team and returns id', async () => {
      const id = await teamRepo.create(mockTeamData);

      expect(id).toBeDefined();
      const team = await teamRepo.getById(id);
      expect(team?.name).toBe(mockTeamData.name);
      expect(team?.characterKeys).toEqual(mockTeamData.characterKeys);
      expect(team?.createdAt).toBeDefined();
      expect(team?.updatedAt).toBeDefined();
    });

    it('adds teamId to linked characters', async () => {
      await characterRepo.bulkCreate([
        mockCharacter('RaidenShogun'),
        mockCharacter('Nahida'),
        mockCharacter('Yelan'),
        mockCharacter('Kazuha'),
      ]);

      const id = await teamRepo.create(mockTeamData);

      const characters = await characterRepo.getAll();
      for (const character of characters) {
        expect(character.teamIds).toContain(id);
      }
    });
  });

  describe('update', () => {
    it('updates fields and timestamps', async () => {
      const id = await teamRepo.create(mockTeamData);
      const original = await teamRepo.getById(id);

      await new Promise((resolve) => setTimeout(resolve, 10));
      await teamRepo.update(id, { name: 'New Name' });

      const updated = await teamRepo.getById(id);
      expect(updated?.name).toBe('New Name');
      expect(updated?.createdAt).toBe(original?.createdAt);
      expect(updated?.updatedAt).not.toBe(original?.updatedAt);
    });

    it('syncs added and removed character teamIds', async () => {
      await characterRepo.bulkCreate([
        mockCharacter('RaidenShogun'),
        mockCharacter('Nahida'),
        mockCharacter('Yelan'),
        mockCharacter('Kazuha'),
        mockCharacter('Bennett'),
      ]);

      const id = await teamRepo.create(mockTeamData);

      await teamRepo.update(id, {
        characterKeys: ['RaidenShogun', 'Nahida', 'Bennett'],
      });

      const bennett = await characterRepo.getByKey('Bennett');
      expect(bennett?.teamIds).toContain(id);

      const yelan = await characterRepo.getByKey('Yelan');
      expect(yelan?.teamIds).not.toContain(id);
    });

    it('no-ops when team not found', async () => {
      await expect(teamRepo.update('missing', { name: 'x' })).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('removes team and clears teamIds from characters', async () => {
      await characterRepo.bulkCreate([
        mockCharacter('RaidenShogun'),
        mockCharacter('Nahida'),
        mockCharacter('Yelan'),
        mockCharacter('Kazuha'),
      ]);

      const id = await teamRepo.create(mockTeamData);

      await teamRepo.delete(id);

      const teams = await teamRepo.getAll();
      expect(teams).toHaveLength(0);

      const characters = await characterRepo.getAll();
      for (const character of characters) {
        expect(character.teamIds).not.toContain(id);
      }
    });
  });
});
