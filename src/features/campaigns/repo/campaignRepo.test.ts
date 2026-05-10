import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/schema';
import type { Campaign } from '@/types';
import { campaignRepo } from './campaignRepo';

const baseCampaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> = {
  type: 'character-acquisition',
  name: 'Recruit Furina',
  status: 'active',
  priority: 1,
  deadline: '2026-06-01',
  pullTargets: [
    {
      id: 'pull-furina-c0',
      itemKey: 'Furina',
      itemType: 'character',
      bannerType: 'character',
      desiredCopies: 1,
      maxPullBudget: 180,
      isConfirmed: false,
    },
  ],
  characterTargets: [
    {
      id: 'character-furina',
      characterKey: 'Furina',
      ownership: 'wishlist',
      buildGoal: 'comfortable',
    },
  ],
  notes: 'Save and pre-farm.',
};

describe('campaignRepo', () => {
  beforeEach(async () => {
    await db.campaigns.clear();
  });

  afterEach(async () => {
    await db.campaigns.clear();
  });

  it('creates and retrieves a campaign with metadata', async () => {
    const id = await campaignRepo.create(baseCampaign);
    const stored = await campaignRepo.getById(id);

    expect(stored?.id).toBe(id);
    expect(stored?.name).toBe(baseCampaign.name);
    expect(stored?.createdAt).toBeTruthy();
    expect(stored?.updatedAt).toBe(stored?.createdAt);
  });

  it('returns campaigns ordered by updatedAt descending', async () => {
    const firstId = await campaignRepo.create(baseCampaign);
    await new Promise((resolve) => setTimeout(resolve, 5));
    const secondId = await campaignRepo.create({
      ...baseCampaign,
      name: 'Polish Hyperbloom',
      type: 'team-polish',
      characterTargets: [],
      pullTargets: [],
      teamTarget: {
        name: 'Hyperbloom',
        memberKeys: ['Nahida', 'KukiShinobu', 'Xingqiu', 'Alhaitham'],
      },
    });

    const campaigns = await campaignRepo.getAll();
    expect(campaigns.map((campaign) => campaign.id)).toEqual([secondId, firstId]);
  });

  it('updates campaign status and timestamp', async () => {
    const id = await campaignRepo.create(baseCampaign);
    const original = await campaignRepo.getById(id);

    await new Promise((resolve) => setTimeout(resolve, 5));
    await campaignRepo.updateStatus(id, 'paused');

    const updated = await campaignRepo.getById(id);
    expect(updated?.status).toBe('paused');
    expect(updated?.createdAt).toBe(original?.createdAt);
    expect(updated?.updatedAt && original?.updatedAt && updated.updatedAt > original.updatedAt).toBe(true);
  });

  it('deletes a campaign', async () => {
    const id = await campaignRepo.create(baseCampaign);
    await campaignRepo.delete(id);

    await expect(campaignRepo.getById(id)).resolves.toBeUndefined();
  });
});
