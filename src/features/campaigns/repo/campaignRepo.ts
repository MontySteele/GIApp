import { db } from '@/db/schema';
import type { Campaign, CampaignStatus, CampaignType } from '@/types';

export const campaignRepo = {
  async getAll(): Promise<Campaign[]> {
    return db.campaigns.orderBy('updatedAt').reverse().toArray();
  },

  async getActive(): Promise<Campaign[]> {
    const campaigns = await db.campaigns.where('status').anyOf(['active', 'paused']).toArray();
    return campaigns.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async getById(id: string): Promise<Campaign | undefined> {
    return db.campaigns.get(id);
  },

  async getByType(type: CampaignType): Promise<Campaign[]> {
    const campaigns = await db.campaigns.where('type').equals(type).toArray();
    return campaigns.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async create(campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.campaigns.add({
      ...campaign,
      id,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },

  async update(
    id: string,
    updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>
  ): Promise<void> {
    await db.campaigns.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async updateStatus(id: string, status: CampaignStatus): Promise<void> {
    await this.update(id, { status });
  },

  async delete(id: string): Promise<void> {
    await db.campaigns.delete(id);
  },
};
