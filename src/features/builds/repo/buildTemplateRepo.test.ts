import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db/schema';
import { buildTemplateRepo } from './buildTemplateRepo';
import type { BuildTemplate } from '@/types';

type NewTemplate = Omit<BuildTemplate, 'id' | 'createdAt' | 'updatedAt'>;

function makeTemplate(overrides: Partial<NewTemplate> = {}): NewTemplate {
  return {
    name: 'Furina Sub-DPS',
    characterKey: 'Furina',
    description: 'HP scaling off-field damage',
    role: 'sub-dps',
    notes: '',
    weapons: { primary: ['SplendorOfTranquilWaters'], alternatives: ['FesteringDesire'] },
    artifacts: {
      sets: [[{ setKey: 'GoldenTroupe', pieces: 4 }]],
      mainStats: { sands: ['hp_'], goblet: ['hp_'], circlet: ['critRate_'] },
      substats: ['critRate_', 'critDMG_', 'hp_'],
    },
    leveling: { targetLevel: 90, targetAscension: 6, talentPriority: ['skill', 'burst', 'auto'] },
    tags: ['hydro'],
    difficulty: 'intermediate',
    budget: 'mixed',
    isOfficial: false,
    ...overrides,
  };
}

describe('buildTemplateRepo', () => {
  beforeEach(async () => {
    await db.buildTemplates.clear();
  });

  afterEach(async () => {
    await db.buildTemplates.clear();
  });

  describe('isOfficial filtering (boolean is not indexable in IndexedDB)', () => {
    let officialId: string;
    let customId: string;

    beforeEach(async () => {
      officialId = await buildTemplateRepo.create(
        makeTemplate({ name: 'Official Furina', isOfficial: true, source: 'KeqingMains' })
      );
      customId = await buildTemplateRepo.create(makeTemplate({ name: 'My Furina', isOfficial: false }));
    });

    it('getOfficialBuilds returns only official templates', async () => {
      const official = await buildTemplateRepo.getOfficialBuilds();
      expect(official.map((t) => t.id)).toEqual([officialId]);
    });

    it('getFiltered({ isOfficial: true }) returns only official templates', async () => {
      const results = await buildTemplateRepo.getFiltered({ isOfficial: true });
      expect(results.map((t) => t.id)).toEqual([officialId]);
    });

    it('getFiltered({ isOfficial: false }) returns only non-official templates', async () => {
      const results = await buildTemplateRepo.getFiltered({ isOfficial: false });
      expect(results.map((t) => t.id)).toEqual([customId]);
    });

    it('combines isOfficial with an indexed filter', async () => {
      await buildTemplateRepo.create(
        makeTemplate({ name: 'Official Neuvillette', characterKey: 'Neuvillette', isOfficial: true })
      );

      const results = await buildTemplateRepo.getFiltered({ characterKey: 'Furina', isOfficial: true });
      expect(results.map((t) => t.id)).toEqual([officialId]);
    });
  });

  describe('getFiltered', () => {
    it('applies every provided filter, not only the indexed one', async () => {
      await buildTemplateRepo.create(makeTemplate({ role: 'dps', difficulty: 'beginner', budget: 'f2p' }));
      const matchId = await buildTemplateRepo.create(
        makeTemplate({ role: 'dps', difficulty: 'advanced', budget: 'whale' })
      );
      await buildTemplateRepo.create(makeTemplate({ role: 'support', difficulty: 'advanced', budget: 'whale' }));

      const results = await buildTemplateRepo.getFiltered({ role: 'dps', difficulty: 'advanced', budget: 'whale' });
      expect(results.map((t) => t.id)).toEqual([matchId]);
    });

    it('matches any of the requested tags', async () => {
      const taggedId = await buildTemplateRepo.create(makeTemplate({ tags: ['hydro', 'abyss'] }));
      await buildTemplateRepo.create(makeTemplate({ tags: ['pyro'] }));

      const results = await buildTemplateRepo.getFiltered({ tags: ['abyss', 'overworld'] });
      expect(results.map((t) => t.id)).toEqual([taggedId]);
    });
  });
});
