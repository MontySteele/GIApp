import { describe, it, expect } from 'vitest';
import type { WishRecord } from '@/types';
import { replayWishHistory } from './wishReplay';

type TestWish = WishRecord & { isFeatured?: boolean };

let wishCounter = 0;

function createWish(override: Partial<TestWish>): TestWish {
  const timestamp = override.timestamp ?? '2024-01-01T00:00:00.000Z';
  wishCounter += 1;

  return {
    id: override.id ?? `wish-${wishCounter}`,
    gachaId: override.gachaId ?? override.id ?? `gacha-${wishCounter}`,
    bannerType: override.bannerType ?? 'character',
    bannerVersion: override.bannerVersion ?? '5.0',
    timestamp,
    itemType: override.itemType ?? 'character',
    itemKey: override.itemKey ?? 'Item',
    rarity: override.rarity ?? 3,
    isFeatured: override.isFeatured,
    chartedWeapon: override.chartedWeapon ?? null,
    createdAt: override.createdAt ?? timestamp,
    updatedAt: override.updatedAt ?? timestamp,
  };
}

describe('replayWishHistory', () => {
  it('orders wishes in a 10-pull by gachaId when timestamps are identical', () => {
    // Simulate a 10-pull where all wishes have identical timestamp and createdAt
    // but different gachaIds (original API IDs) that indicate actual order
    const batchTime = '2024-01-01T12:00:00.000Z';
    const wishes: TestWish[] = [
      // Deliberately pass these out of gachaId order to test sorting
      createWish({
        id: 'uuid-zzz', // alphabetically last
        gachaId: '1704110400000000003', // third pull
        rarity: 5,
        isFeatured: true, // This would be a 50/50 win
        timestamp: batchTime,
        createdAt: batchTime,
      }),
      createWish({
        id: 'uuid-aaa', // alphabetically first
        gachaId: '1704110400000000001', // first pull
        rarity: 5,
        isFeatured: false, // This should be the 50/50 loss (comes first)
        timestamp: batchTime,
        createdAt: batchTime,
      }),
      createWish({
        id: 'uuid-mmm', // alphabetically middle
        gachaId: '1704110400000000002', // second pull (filler)
        rarity: 3,
        timestamp: batchTime,
        createdAt: batchTime,
      }),
    ];

    const result = replayWishHistory(wishes);

    // If sorted correctly by gachaId:
    // 1. First 5★ (gachaId ...001) loses 50/50 -> guaranteed becomes true
    // 2. Second (gachaId ...002) is 3★ filler
    // 3. Third 5★ (gachaId ...003) should be guaranteed
    expect(result.computed['uuid-aaa'].wasGuaranteed).toBe(false);
    expect(result.computed['uuid-aaa'].won5050).toBe(false);
    expect(result.computed['uuid-zzz'].wasGuaranteed).toBe(true);
    expect(result.pityState.character.guaranteed).toBe(false);
  });

  it('orders wishes with identical timestamps by creation time', () => {
    const wishes: TestWish[] = [
      createWish({
        id: 'first-loss',
        rarity: 5,
        isFeatured: false,
        createdAt: '2024-01-01T00:00:00.000Z',
      }),
      createWish({
        id: 'second-win',
        rarity: 5,
        isFeatured: true,
        createdAt: '2024-01-01T00:00:01.000Z',
      }),
    ];

    const result = replayWishHistory(wishes);

    expect(result.computed['second-win'].wasGuaranteed).toBe(true);
    expect(result.pityState.character.guaranteed).toBe(false);
  });

  it('tracks 50/50 loss then guaranteed win sequences', () => {
    const wishes: TestWish[] = [
      createWish({ id: 'three-star', rarity: 3 }),
      createWish({
        id: 'lost-5050',
        rarity: 5,
        isFeatured: false,
        timestamp: '2024-01-01T00:00:01.000Z',
      }),
      createWish({ id: 'filler', rarity: 3, timestamp: '2024-01-01T00:00:02.000Z' }),
      createWish({
        id: 'guaranteed-win',
        rarity: 5,
        isFeatured: true,
        timestamp: '2024-01-01T00:00:03.000Z',
      }),
      createWish({ id: 'latest', rarity: 3, timestamp: '2024-01-01T00:00:04.000Z' }),
    ];

    const result = replayWishHistory(wishes);

    expect(result.computed['lost-5050'].wasGuaranteed).toBe(false);
    expect(result.computed['lost-5050'].won5050).toBe(false);
    expect(result.computed['guaranteed-win'].wasGuaranteed).toBe(true);
    expect(result.pityState.character.guaranteed).toBe(false);
    expect(result.pityState.character.pity).toBe(1);
  });

  it('activates Capturing Radiance streak after consecutive 50/50 losses', () => {
    // With threshold=3, need 3 consecutive 50/50 losses to trigger radiance
    // Guaranteed wins do NOT reset streak, only 50/50 wins do
    const wishes: TestWish[] = [
      createWish({ id: 'loss-1', rarity: 5, isFeatured: false }),
      createWish({
        id: 'guaranteed-reset-1',
        rarity: 5,
        isFeatured: true,
        timestamp: '2024-01-01T00:01:00.000Z',
      }),
      createWish({
        id: 'loss-2',
        rarity: 5,
        isFeatured: false,
        timestamp: '2024-01-01T00:02:00.000Z',
      }),
      createWish({
        id: 'guaranteed-reset-2',
        rarity: 5,
        isFeatured: true,
        timestamp: '2024-01-01T00:03:00.000Z',
      }),
      createWish({
        id: 'loss-3',
        rarity: 5,
        isFeatured: false,
        timestamp: '2024-01-01T00:04:00.000Z',
      }),
      createWish({
        id: 'guaranteed-reset-3',
        rarity: 5,
        isFeatured: true,
        timestamp: '2024-01-01T00:05:00.000Z',
      }),
      createWish({
        id: 'radiance-pull',
        rarity: 5,
        isFeatured: true,
        timestamp: '2024-01-01T00:06:00.000Z',
      }),
    ];

    const result = replayWishHistory(wishes);

    expect(result.computed['radiance-pull'].triggeredRadiance).toBe(true);
    expect(result.pityState.character.radiantStreak).toBe(0);
  });

  it('accrues and spends weapon fate points against charted weapon', () => {
    const wishes: TestWish[] = [
      createWish({
        id: 'wrong-weapon-1',
        bannerType: 'weapon',
        itemType: 'weapon',
        itemKey: 'Primordial Jade Winged-Spear',
        rarity: 5,
      }),
      createWish({
        id: 'wrong-weapon-2',
        bannerType: 'weapon',
        itemType: 'weapon',
        itemKey: 'Redhorn Stonethresher',
        rarity: 5,
        timestamp: '2024-01-01T00:01:00.000Z',
      }),
      createWish({
        id: 'charted-hit',
        bannerType: 'weapon',
        itemType: 'weapon',
        itemKey: 'Aqua Simulacra',
        rarity: 5,
        timestamp: '2024-01-01T00:02:00.000Z',
      }),
    ];

    const result = replayWishHistory(wishes, { chartedWeapon: 'Aqua Simulacra' });

    expect(result.computed['wrong-weapon-2'].wasGuaranteed).toBe(false);
    expect(result.computed['charted-hit'].wasGuaranteed).toBe(true);
    expect(result.pityState.weapon.fatePoints).toBe(0);
  });

  it('tracks chronicled banner guarantee after losing featured pull', () => {
    const wishes: TestWish[] = [
      createWish({
        id: 'chronicled-loss',
        bannerType: 'chronicled',
        rarity: 5,
        isFeatured: false,
      }),
      createWish({
        id: 'chronicled-guaranteed',
        bannerType: 'chronicled',
        rarity: 5,
        isFeatured: true,
        timestamp: '2024-01-01T00:01:00.000Z',
      }),
    ];

    const result = replayWishHistory(wishes);

    expect(result.computed['chronicled-guaranteed'].wasGuaranteed).toBe(true);
    expect(result.pityState.chronicled.guaranteed).toBe(false);
  });
});
