import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '@/db/schema';
import { fetchEnkaData, fromEnka, type EnkaResponse } from './enka';

describe('Enka Mapper', () => {
  const mockEnkaResponse: EnkaResponse = {
    playerInfo: {
      nickname: 'TestPlayer',
      level: 60,
      signature: 'Test signature',
      nameCardId: 210001,
      finishAchievementNum: 800,
      towerFloorIndex: 12,
      towerLevelIndex: 3,
      showAvatarInfoList: [
        { avatarId: 10000089, level: 90 },
      ],
    },
    avatarInfoList: [
      {
        avatarId: 10000089, // Furina
        propMap: {
          '4001': { type: 4001, ival: '90' }, // Level
          '1002': { type: 1002, ival: '6' }, // Ascension
        },
        talentIdList: [899, 890], // C2
        fightPropMap: {},
        skillDepotId: 8901,
        inherentProudSkillList: [],
        skillLevelMap: {
          '10891': 9, // Auto
          '10892': 10, // Skill
          '10895': 10, // Burst
        },
        equipList: [
          // Weapon
          {
            itemId: 11511, // Splendor of Tranquil Waters
            flat: {
              nameTextMapHash: '1234567890',
              rankLevel: 5,
              itemType: 'ITEM_WEAPON',
              icon: 'UI_EquipIcon_Sword_Resurrection',
            },
            weapon: {
              level: 90,
              promoteLevel: 6,
              affixMap: { '111511': 0 }, // R1 (0-indexed)
            },
          },
          // Flower
          {
            itemId: 81024,
            reliquary: {
              level: 20,
              mainPropId: 14001,
              appendPropIdList: [],
            },
            flat: {
              nameTextMapHash: '2345678901',
              setNameTextMapHash: 'GoldenTroupe',
              rankLevel: 5,
              itemType: 'ITEM_RELIQUARY',
              icon: 'UI_RelicIcon_15025_4',
              equipType: 'EQUIP_BRACER',
              reliquaryMainstat: {
                mainPropId: 'FIGHT_PROP_HP',
                statValue: 4780,
              },
              reliquarySubstats: [
                { appendPropId: 'FIGHT_PROP_CRITICAL',statValue: 3.9 },
                { appendPropId: 'FIGHT_PROP_CRITICAL_HURT', statValue: 14.8 },
              ],
            },
          },
        ],
        fetterInfo: {
          expLevel: 10,
        },
      },
    ],
    ttl: 60,
    uid: '689094170',
  };

  describe('fromEnka', () => {
    it('should convert Enka response to internal format', () => {
      const result = fromEnka(mockEnkaResponse);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('Furina'); // Should map 10000089 to Furina
    });

    it('should extract character level and ascension', () => {
      const result = fromEnka(mockEnkaResponse);

      expect(result[0].level).toBe(90);
      expect(result[0].ascension).toBe(6);
    });

    it('should extract constellation from talentIdList length', () => {
      const result = fromEnka(mockEnkaResponse);

      expect(result[0].constellation).toBe(2); // 2 constellation items
    });

    it('should extract talent levels', () => {
      const result = fromEnka(mockEnkaResponse);

      expect(result[0].talent).toEqual({
        auto: 9,
        skill: 10,
        burst: 10,
      });
    });

    it('should map weapon ID to weapon name', () => {
      const result = fromEnka(mockEnkaResponse);

      expect(result[0].weapon.key).toBe('Splendor of Tranquil Waters'); // ID 11511
      expect(result[0].weapon.level).toBe(90);
      expect(result[0].weapon.ascension).toBe(6);
      expect(result[0].weapon.refinement).toBe(1); // affixMap 0 + 1
    });

    it('should show unknown weapon ID if not in mapping', () => {
      const responseWithUnknownWeapon: EnkaResponse = {
        ...mockEnkaResponse,
        avatarInfoList: [
          {
            ...mockEnkaResponse.avatarInfoList![0],
            equipList: [
              {
                itemId: 99999, // Unknown weapon ID
                flat: {
                  nameTextMapHash: '1234567890',
                  rankLevel: 5,
                  itemType: 'ITEM_WEAPON',
                  icon: 'test',
                },
                weapon: {
                  level: 90,
                  promoteLevel: 6,
                  affixMap: { '111511': 0 },
                },
              },
            ],
          },
        ],
      };

      const result = fromEnka(responseWithUnknownWeapon);

      expect(result[0].weapon.key).toBe('Unknown Weapon (ID: 99999)');
    });

    it('should extract artifacts', () => {
      const result = fromEnka(mockEnkaResponse);

      expect(result[0].artifacts).toHaveLength(1); // 1 artifact in mock
      expect(result[0].artifacts[0].slotKey).toBe('flower'); // EQUIP_BRACER
      expect(result[0].artifacts[0].level).toBe(20);
      expect(result[0].artifacts[0].rarity).toBe(5);
    });

    it('should set default notes and priority', () => {
      const result = fromEnka(mockEnkaResponse);

      expect(result[0].notes).toContain('Imported from Enka.network');
      expect(result[0].notes).toContain('689094170');
      expect(result[0].priority).toBe('unbuilt');
      expect(result[0].teamIds).toEqual([]);
    });

    it('should skip characters without weapons', () => {
      const responseNoWeapon: EnkaResponse = {
        ...mockEnkaResponse,
        avatarInfoList: [
          {
            ...mockEnkaResponse.avatarInfoList![0],
            equipList: [], // No weapon
          },
        ],
      };

      const result = fromEnka(responseNoWeapon);

      expect(result).toHaveLength(0); // Character skipped
    });

    it('should throw error if no character data', () => {
      const responseNoChars: EnkaResponse = {
        ...mockEnkaResponse,
        avatarInfoList: [],
      };

      expect(() => fromEnka(responseNoChars)).toThrow('No character data found in showcase');
    });

    it('should handle multiple characters', () => {
      const responseMultiple: EnkaResponse = {
        ...mockEnkaResponse,
        avatarInfoList: [
          mockEnkaResponse.avatarInfoList![0],
          {
            ...mockEnkaResponse.avatarInfoList![0],
            avatarId: 10000088, // Charlotte
          },
        ],
      };

      const result = fromEnka(responseMultiple);

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('Furina');
      expect(result[1].key).toBe('Charlotte');
    });

    it('should handle characters with unknown IDs', () => {
      const responseUnknown: EnkaResponse = {
        ...mockEnkaResponse,
        avatarInfoList: [
          {
            ...mockEnkaResponse.avatarInfoList![0],
            avatarId: 99999999, // Unknown character ID
          },
        ],
      };

      const result = fromEnka(responseUnknown);

      expect(result[0].key).toBe('Unknown_99999999');
    });

    it('should handle missing skill levels', () => {
      const responseNoSkills: EnkaResponse = {
        ...mockEnkaResponse,
        avatarInfoList: [
          {
            ...mockEnkaResponse.avatarInfoList![0],
            skillLevelMap: {}, // No skills
          },
        ],
      };

      const result = fromEnka(responseNoSkills);

      expect(result[0].talent).toEqual({
        auto: 1,
        skill: 1,
        burst: 1,
      });
    });

    it('should handle missing constellation', () => {
      const responseNoConst: EnkaResponse = {
        ...mockEnkaResponse,
        avatarInfoList: [
          {
            ...mockEnkaResponse.avatarInfoList![0],
            talentIdList: undefined,
          },
        ],
      };

      const result = fromEnka(responseNoConst);

      expect(result[0].constellation).toBe(0);
    });

    it('should map character IDs correctly for recent characters', () => {
      const testCases = [
        { id: 10000088, expected: 'Charlotte' },
        { id: 10000089, expected: 'Furina' },
        { id: 10000090, expected: 'Chevreuse' },
        { id: 10000103, expected: 'Xilonen' },
        { id: 10000104, expected: 'Mavuika' },
      ];

      for (const testCase of testCases) {
        const response: EnkaResponse = {
          ...mockEnkaResponse,
          avatarInfoList: [
            {
              ...mockEnkaResponse.avatarInfoList![0],
              avatarId: testCase.id,
            },
          ],
        };

        const result = fromEnka(response);
        expect(result[0].key).toBe(testCase.expected);
      }
    });

    it('should map weapon IDs correctly for popular weapons', () => {
      const testCases = [
        { id: 11511, expected: 'Splendor of Tranquil Waters' },
        { id: 11426, expected: 'Fleuve Cendre Ferryman' },
        { id: 13501, expected: 'Staff of Homa' },
        { id: 15508, expected: 'Aqua Simulacra' },
        { id: 14509, expected: 'A Thousand Floating Dreams' },
      ];

      for (const testCase of testCases) {
        const response: EnkaResponse = {
          ...mockEnkaResponse,
          avatarInfoList: [
            {
              ...mockEnkaResponse.avatarInfoList![0],
              equipList: [
                {
                  itemId: testCase.id,
                  flat: {
                    nameTextMapHash: '123',
                    rankLevel: 5,
                    itemType: 'ITEM_WEAPON',
                    icon: 'test',
                  },
                  weapon: {
                    level: 90,
                    promoteLevel: 6,
                    affixMap: { '0': 0 },
                  },
                },
              ],
            },
          ],
        };

        const result = fromEnka(response);
        expect(result[0].weapon.key).toBe(testCase.expected);
      }
    });
  });

  describe('fetchEnkaData', () => {
    const uid = '123456789';
    const baseEnkaResponse: EnkaResponse = {
      playerInfo: {
        nickname: 'Tester',
        level: 60,
        signature: 'Testing',
        nameCardId: 1,
        finishAchievementNum: 1,
        towerFloorIndex: 1,
        towerLevelIndex: 1,
        showAvatarInfoList: [],
      },
      avatarInfoList: [],
      ttl: 60,
      uid,
    };

    const originalFetch = globalThis.fetch;

    beforeEach(async () => {
      await db.externalCache.clear();
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.useRealTimers();
      globalThis.fetch = originalFetch;
    });

    it('returns cached data when cache entry is still valid', async () => {
      const future = new Date(Date.now() + 60_000).toISOString();
      await db.externalCache.add({
        id: 'cache-1',
        cacheKey: `enka:${uid}`,
        data: baseEnkaResponse,
        fetchedAt: new Date().toISOString(),
        expiresAt: future,
      });

      globalThis.fetch = vi.fn() as any;

      const result = await fetchEnkaData(uid);

      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(result.uid).toBe(uid);
    });

    it('fetches and caches data when cache is expired', async () => {
      const expired = new Date(Date.now() - 1000).toISOString();
      await db.externalCache.add({
        id: 'cache-1',
        cacheKey: `enka:${uid}`,
        data: baseEnkaResponse,
        fetchedAt: expired,
        expiresAt: expired,
      });

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ...baseEnkaResponse, ttl: 120 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ) as any;

      const result = await fetchEnkaData(uid);

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(result.ttl).toBe(120);

      const cached = await db.externalCache.where('cacheKey').equals(`enka:${uid}`).first();
      expect(cached?.data.uid).toBe(uid);
      expect(new Date(cached!.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('retries on retryable errors before succeeding', async () => {
      vi.useFakeTimers();
      globalThis.fetch = (vi
        .fn()
        .mockResolvedValueOnce(new Response('Server error', { status: 500, statusText: 'Server Error' }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify(baseEnkaResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )) as any;

      const fetchPromise = fetchEnkaData(uid);
      await vi.runAllTimersAsync();
      const result = await fetchPromise;

      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      expect(result.uid).toBe(uid);
    });

    it('throws helpful errors for API failures', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response('Not found', {
          status: 404,
          statusText: 'Not Found',
        }),
      ) as any;

      await expect(fetchEnkaData(uid)).rejects.toThrow('UID not found');
    });
  });
});
