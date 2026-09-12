import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GACHA_TYPE_MAP, WishImport } from './WishImport';
import { db } from '@/db/schema';
import { wishRepo } from '../repo/wishRepo';
import type { Campaign } from '@/types';
import type { WishHistoryItem } from '../domain/wishAnalyzer';

/** Raw item shape returned by the Genshin gacha log API. */
interface GachaLogItem {
  id: string;
  gacha_type: string;
  item_id?: string;
  name: string;
  item_type: string;
  rank_type: string;
  time: string;
}

/** Builds the minimal Response surface WishImport reads (`ok` + `json()`). */
function jsonResponse(body: unknown): Response {
  return { ok: true, json: () => Promise.resolve(body) } as Response;
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.href : input.url;
}

/** Installs a typed fetch mock; the implementation receives the request URL as a string. */
function mockFetch(impl: (url: string) => Promise<Response>) {
  const spy = vi.fn<typeof fetch>((input) => impl(requestUrl(input)));
  global.fetch = spy;
  return spy;
}

const campaignMocks = vi.hoisted(() => ({
  activeCampaigns: [] as Campaign[],
}));

vi.mock('@/features/campaigns/hooks/useCampaigns', () => ({
  useCampaigns: () => ({
    campaigns: campaignMocks.activeCampaigns,
    activeCampaigns: campaignMocks.activeCampaigns,
    createCampaign: vi.fn(),
    updateCampaign: vi.fn(),
    deleteCampaign: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('@/db/schema', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/db/schema')>();
  return {
    ...actual,
  };
});

beforeEach(async () => {
  await db.wishRecords.clear();
  localStorage.clear();
  campaignMocks.activeCampaigns = [];
  mockFetch(() =>
    Promise.resolve(jsonResponse({ retcode: 0, data: { list: [] } }))
  );
});

afterEach(async () => {
  await db.wishRecords.clear();
  vi.restoreAllMocks();
});

describe('WishImport', () => {
  describe('GACHA_TYPE_MAP', () => {
    it('should map gacha types to banner types', () => {
      expect(GACHA_TYPE_MAP['301']).toBe('character');
      expect(GACHA_TYPE_MAP['302']).toBe('weapon');
      expect(GACHA_TYPE_MAP['200']).toBe('standard');
      expect(GACHA_TYPE_MAP['500']).toBe('chronicled');
    });
  });

  describe('Initial render', () => {
    it('should render import instructions', () => {
      render(<WishImport onImportComplete={vi.fn()} />);

      expect(screen.getByText(/import wish history/i)).toBeInTheDocument();
    });

    it('should show script download buttons', () => {
      render(<WishImport onImportComplete={vi.fn()} />);

      expect(screen.getByRole('button', { name: /windows.*powershell/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mac.*linux.*bash/i })).toBeInTheDocument();
    });

    it('should show URL input field', () => {
      render(<WishImport onImportComplete={vi.fn()} />);

      expect(screen.getByLabelText(/wish history url/i)).toBeInTheDocument();
    });

    it('should show import button', () => {
      render(<WishImport onImportComplete={vi.fn()} />);

      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
    });
  });

  describe('Script instructions', () => {
    it('should show Windows instructions', () => {
      render(<WishImport onImportComplete={vi.fn()} />);

      expect(screen.getByText(/run.*powershell/i)).toBeInTheDocument();
    });

    it('should show macOS/Linux instructions', () => {
      render(<WishImport onImportComplete={vi.fn()} />);

      expect(screen.getByText(/run.*bash/i)).toBeInTheDocument();
    });

    it('should display script code blocks', () => {
      render(<WishImport onImportComplete={vi.fn()} />);

      const codeBlocks = screen.getAllByRole('code');
      expect(codeBlocks.length).toBeGreaterThan(0);
    });

    it('should have copy buttons for scripts', () => {
      render(<WishImport onImportComplete={vi.fn()} />);

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      expect(copyButtons.length).toBeGreaterThanOrEqual(2); // Windows + Mac/Linux
    });
  });

  describe('URL validation', () => {
    it('should disable import button when URL is empty', () => {
      render(<WishImport onImportComplete={vi.fn()} />);

      const importButton = screen.getByRole('button', { name: /^import$/i });
      expect(importButton).toBeDisabled();
    });

    it('should enable import button when valid URL is entered', async () => {
      const user = userEvent.setup();
      render(<WishImport onImportComplete={vi.fn()} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      expect(importButton).toBeEnabled();
    });

    it('should show error for invalid URL format', async () => {
      const user = userEvent.setup();
      render(<WishImport onImportComplete={vi.fn()} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'not-a-valid-url');
      await user.tab(); // Trigger blur validation

      expect(screen.getByText(/hoyoverse link/i)).toBeInTheDocument();
    });

    it('should show error if URL is missing authkey', async () => {
      const user = userEvent.setup();
      render(<WishImport onImportComplete={vi.fn()} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/missing.*authkey/i)).toBeInTheDocument();
      });
    });

    it('should normalize legacy index.html URLs on blur', async () => {
      const user = userEvent.setup();
      render(<WishImport onImportComplete={vi.fn()} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(
        urlInput,
        'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/index.html?authkey=test'
      );
      await user.tab(); // triggers blur/normalize

      await waitFor(() => {
        expect((screen.getByLabelText(/wish history url/i) as HTMLInputElement).value).toContain(
          '/log?authkey=test'
        );
      });
    });
  });

  describe('Import process', () => {
    it('should show loading state during import', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn<(wishes: WishHistoryItem[]) => void>();
      mockFetch(
        () =>
          new Promise<Response>((resolve) =>
            setTimeout(
              () =>
                resolve(jsonResponse({ retcode: 0, data: { list: [] } })),
              50
            )
          )
      );
      render(<WishImport onImportComplete={onImportComplete} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/importing/i)).toBeInTheDocument();
        expect(importButton).toBeDisabled();
      });
    });

    it('should show progress during import', async () => {
      const user = userEvent.setup();
      mockFetch(
        () =>
          new Promise<Response>((resolve) =>
            setTimeout(
              () =>
                resolve(jsonResponse({ retcode: 0, data: { list: [] } })),
              50
            )
          )
      );
      render(<WishImport onImportComplete={vi.fn()} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/fetching.*character.*banner/i)).toBeInTheDocument();
      });
    });

    it('should call onImportComplete with wish data on success', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn<(wishes: WishHistoryItem[]) => void>();

      // Mock successful fetch
      mockFetch((url: string) => {
        const gachaType = new URL(url).searchParams.get('gacha_type');
        return Promise.resolve(jsonResponse({
            retcode: 0,
            data: {
              list: gachaType === '301'
                ? [
                  {
                    id: '1',
                    gacha_type: '301',
                    item_id: '10000089',
                    name: 'Furina',
                    item_type: 'Character',
                    rank_type: '5',
                    time: '2024-01-01 12:00:00',
                  },
                ]
                : [],
            },
          }));
      });

      render(<WishImport onImportComplete={onImportComplete} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(async () => {
        expect(onImportComplete).toHaveBeenCalled();
        const stored = await wishRepo.getAll();
        expect(stored).toHaveLength(1);
        expect(JSON.parse(localStorage.getItem('onboarding_checklist') ?? '{}')).toMatchObject({
          hasImportedWishHistory: true,
        });
      });
    });

    it.each([
      ['os_usa', '2024-01-01T17:00:00.000Z'],
      ['os_euro', '2024-01-01T11:00:00.000Z'],
      ['os_asia', '2024-01-01T04:00:00.000Z'],
      ['os_cht', '2024-01-01T04:00:00.000Z'],
    ])('interprets API timestamps in the server timezone of region=%s', async (region, expectedIso) => {
      const user = userEvent.setup();
      mockFetch((url: string) => {
        const gachaType = new URL(url).searchParams.get('gacha_type');
        return Promise.resolve(jsonResponse({
            retcode: 0,
            data: {
              list: gachaType === '301'
                ? [{ id: '1', gacha_type: '301', item_id: '10000089', name: 'Furina', item_type: 'Character', rank_type: '5', time: '2024-01-01 12:00:00' }]
                : [],
            },
          }));
      });

      render(<WishImport onImportComplete={vi.fn()} />);
      await user.type(
        screen.getByLabelText(/wish history url/i),
        `https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test&region=${region}`
      );
      await user.click(screen.getByRole('button', { name: /^import$/i }));

      await waitFor(async () => {
        const stored = await wishRepo.getAll();
        expect(stored).toHaveLength(1);
        expect(stored[0]?.timestamp).toBe(expectedIso);
      });
    });

    it('should show error message on import failure', async () => {
      const user = userEvent.setup();

      // Mock failed fetch
      mockFetch(() =>
        Promise.reject(new Error('Network error'))
      );

      render(<WishImport onImportComplete={vi.fn()} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/failed.*import/i)).toBeInTheDocument();
      });
    });

    it('should handle expired authkey error', async () => {
      const user = userEvent.setup();

      // Mock authkey expired response
      mockFetch(() =>
        Promise.resolve(jsonResponse({
            retcode: -101,
            message: 'authkey timeout',
          }))
      );

      render(<WishImport onImportComplete={vi.fn()} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/authkey.*expired/i)).toBeInTheDocument();
      });
    });
  });

  describe('Banner selection', () => {
    it('should fetch all banner types by default', async () => {
      const user = userEvent.setup();
      const fetchSpy = mockFetch(() => {
        return Promise.resolve(jsonResponse({ retcode: 0, data: { list: [] } }));
      });

      render(<WishImport onImportComplete={vi.fn()} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');
      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        // Should fetch character (301 + 400), weapon (302), standard (200), and chronicled (500)
        expect(fetchSpy).toHaveBeenCalledTimes(5);
        const gachaTypes = fetchSpy.mock.calls.map((call) => new URL(requestUrl(call[0])).searchParams.get('gacha_type'));
        expect(gachaTypes).toEqual(expect.arrayContaining(['301', '400', '302', '200', '500']));
      });
    });

    it('should allow selecting specific banners to import', async () => {
      const user = userEvent.setup();
      render(<WishImport onImportComplete={vi.fn()} />);

      const characterCheckbox = screen.getByLabelText(/character.*event/i);
      await user.click(characterCheckbox);

      expect(characterCheckbox).not.toBeChecked();
    });

    it('should aggregate wishes from all selected banners', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn<(wishes: WishHistoryItem[]) => void>();

      const fetchMock = mockFetch((url: string) => {
        const gachaType = new URL(url).searchParams.get('gacha_type');

        return Promise.resolve(jsonResponse({
            retcode: 0,
            data: {
              list: gachaType
                ? [{
                    id: `${gachaType}-id`,
                    gacha_type: gachaType,
                    rank_type: '5',
                    name: `Item ${gachaType}`,
                    item_type: gachaType === '302' ? 'Weapon' : 'Character',
                    time: '2024-01-01 00:00:00',
                  }]
                : [],
            },
          }));
      });

      render(<WishImport onImportComplete={onImportComplete} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(onImportComplete).toHaveBeenCalledTimes(1);
      });

      const aggregatedWishes = onImportComplete.mock.calls[0][0];
      const banners = aggregatedWishes.map((wish) => wish.banner);
      const gachaTypes = fetchMock.mock.calls.map((call) => new URL(requestUrl(call[0])).searchParams.get('gacha_type'));

      expect(fetchMock).toHaveBeenCalledTimes(5);
      expect(gachaTypes).toEqual(expect.arrayContaining(['301', '400', '302', '200', '500']));
      expect(banners).toEqual(
        expect.arrayContaining(['character', 'weapon', 'standard', 'chronicled'])
      );
    });

    it('should keep chronicled wishes when paginating with duplicate pages', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn<(wishes: WishHistoryItem[]) => void>();

      const responsesByPage: Record<string, GachaLogItem[]> = {
        '500-1': [
          { id: '500-a', gacha_type: '500', rank_type: '5', name: 'Diluc', item_type: 'Character', time: '2024-01-01 00:00:00' },
        ],
        '500-2': [
          // Same end_id should stop the loop without dropping the item
          { id: '500-a', gacha_type: '500', rank_type: '4', name: 'Amber', item_type: 'Character', time: '2024-01-01 00:00:00' },
        ],
      };

      const fetchMock = mockFetch((url: string) => {
        const parsed = new URL(url);
        const gachaType = parsed.searchParams.get('gacha_type');
        const page = parsed.searchParams.get('page');
        const key = `${gachaType}-${page}`;
        const list = responsesByPage[key] ?? [];

        return Promise.resolve(jsonResponse({ retcode: 0, data: { list } }));
      });

      render(<WishImport onImportComplete={onImportComplete} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(onImportComplete).toHaveBeenCalled();
      });

      const aggregatedWishes = onImportComplete.mock.calls[0][0];
      expect(aggregatedWishes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: '500-a', banner: 'chronicled' }),
        ])
      );
    });

    it('should fetch only selected banners when some are deselected', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn<(wishes: WishHistoryItem[]) => void>();

      const fetchMock = mockFetch((url: string) => {
        const gachaType = new URL(url).searchParams.get('gacha_type');

        return Promise.resolve(jsonResponse({
            retcode: 0,
            data: {
              list: gachaType && gachaType !== '302'
                ? [{
                    id: `${gachaType}-id`,
                    gacha_type: gachaType,
                    rank_type: '4',
                    name: `Item ${gachaType}`,
                    item_type: 'Character',
                    time: '2024-01-01 00:00:00',
                  }]
                : [],
            },
          }));
      });

      render(<WishImport onImportComplete={onImportComplete} />);

      const weaponCheckbox = screen.getByLabelText(/weapon event/i);
      await user.click(weaponCheckbox);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(onImportComplete).toHaveBeenCalledTimes(1);
      });

      const aggregatedWishes = onImportComplete.mock.calls[0][0];
      const banners = aggregatedWishes.map((wish) => wish.banner);
      const fetchedGachaTypes = fetchMock.mock.calls.map((call) => new URL(requestUrl(call[0])).searchParams.get('gacha_type'));

      expect(fetchMock).toHaveBeenCalledTimes(4);
      expect(fetchedGachaTypes).toEqual(expect.arrayContaining(['301', '400', '200', '500']));
      expect(fetchedGachaTypes).not.toContain('302');
      expect(banners).not.toContain('weapon');
      expect(banners).toEqual(
        expect.arrayContaining(['character', 'standard', 'chronicled'])
      );
    });
  });

  describe('Import summary', () => {
    it('should show summary of imported wishes', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn<(wishes: WishHistoryItem[]) => void>();

      mockFetch(() =>
        Promise.resolve(jsonResponse({
            retcode: 0,
            data: {
              list: [
                { id: '1', gacha_type: '301', rank_type: '5', name: 'Furina', item_type: 'Character', time: '2024-01-01 12:00:00' },
                { id: '2', gacha_type: '301', rank_type: '4', name: 'Fischl', item_type: 'Character', time: '2024-01-01 11:00:00' },
              ],
            },
          }))
      );

      render(<WishImport onImportComplete={onImportComplete} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(async () => {
        expect(screen.getByText(/imported.*2.*wishes/i)).toBeInTheDocument();
        const stored = await wishRepo.getAll();
        expect(stored).toHaveLength(2);
      });
    });

    it('should include all banner counts when each gacha type returns data', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn<(wishes: WishHistoryItem[]) => void>();

      const bannerResponses: Record<string, GachaLogItem[]> = {
        '301': [{ id: '1', gacha_type: '301', rank_type: '5', name: 'Furina', item_type: 'Character', time: '2024-01-01 12:00:00' }],
        '302': [{ id: '2', gacha_type: '302', rank_type: '5', name: 'Aqua Simulacra', item_type: 'Weapon', time: '2024-01-01 12:10:00' }],
        '200': [{ id: '3', gacha_type: '200', rank_type: '4', name: 'Jean', item_type: 'Character', time: '2024-01-01 12:20:00' }],
        '500': [{ id: '4', gacha_type: '500', rank_type: '4', name: 'Diluc', item_type: 'Character', time: '2024-01-01 12:30:00' }],
      };

      mockFetch((url: string) => {
        const gachaType = new URL(url).searchParams.get('gacha_type') || '';
        const list = bannerResponses[gachaType] ?? [];
        return Promise.resolve(jsonResponse({ retcode: 0, data: { list } }));
      });

      render(<WishImport onImportComplete={onImportComplete} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(onImportComplete).toHaveBeenCalled();
      });

      const allWishes = onImportComplete.mock.calls[0][0];
      expect(allWishes).toHaveLength(4);
      expect(allWishes.map((wish) => wish.banner).sort()).toEqual(
        ['character', 'weapon', 'standard', 'chronicled'].sort()
      );

      expect(screen.getByText(/character event: 1 wishes/i)).toBeInTheDocument();
      expect(screen.getByText(/weapon event: 1 wishes/i)).toBeInTheDocument();
      expect(screen.getByText(/standard: 1 wishes/i)).toBeInTheDocument();
      expect(screen.getByText(/chronicled wish: 1 wishes/i)).toBeInTheDocument();
    });

    it('should show breakdown by banner type', async () => {
      const user = userEvent.setup();

      mockFetch((url: string) => {
        const gachaType = new URL(url).searchParams.get('gacha_type');
        return Promise.resolve(jsonResponse({
            retcode: 0,
            data: {
              list: gachaType === '301'
                ? [{ id: '1', gacha_type: '301', rank_type: '5', name: 'Furina', item_type: 'Character', time: '2024-01-01 12:00:00' }]
                : [],
            },
          }));
      });

      render(
        <MemoryRouter>
          <WishImport onImportComplete={vi.fn()} />
        </MemoryRouter>
      );

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(async () => {
        expect(screen.getByText(/character.*event.*1/i)).toBeInTheDocument();
        const stored = await wishRepo.getAll();
        expect(stored).toHaveLength(1);
      });
      expect(screen.queryByRole('link', { name: /review target odds/i })).not.toBeInTheDocument();
    });

    it('shows pity and campaign odds impact after import', async () => {
      const user = userEvent.setup();
      campaignMocks.activeCampaigns = [
        {
          id: 'campaign-1',
          type: 'character-acquisition',
          name: 'Recruit Furina',
          status: 'active',
          priority: 1,
          pullTargets: [
            {
              id: 'pull-1',
              itemKey: 'Furina',
              itemType: 'character',
              bannerType: 'character',
              desiredCopies: 1,
              maxPullBudget: null,
              isConfirmed: true,
            },
          ],
          characterTargets: [],
          notes: '',
          createdAt: '',
          updatedAt: '',
        },
      ];

      mockFetch((url: string) => {
        const gachaType = new URL(url).searchParams.get('gacha_type');
        return Promise.resolve(jsonResponse({
            retcode: 0,
            data: {
              list: gachaType === '301'
                ? [{ id: '1', gacha_type: '301', rank_type: '3', name: 'Cool Steel', item_type: 'Weapon', time: '2024-01-01 12:00:00' }]
                : [],
            },
          }));
      });

      render(
        <MemoryRouter>
          <WishImport onImportComplete={vi.fn()} />
        </MemoryRouter>
      );

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      await user.click(screen.getByRole('button', { name: /^import$/i }));

      await waitFor(() => {
        expect(screen.getByText('Import Impact')).toBeInTheDocument();
        expect(screen.getByText('0 → 1')).toBeInTheDocument();
      });
      expect(screen.getByRole('link', { name: /review target odds/i })).toHaveAttribute(
        'href',
        '/campaigns'
      );
    });
  });

  describe('Help and information', () => {
    it('should show help text about URL expiration', () => {
      render(<WishImport onImportComplete={vi.fn()} />);

      expect(screen.getByText(/url.*expire/i)).toBeInTheDocument();
    });

    it('should show privacy notice', () => {
      render(<WishImport onImportComplete={vi.fn()} />);

      expect(screen.getByText(/private.*share/i)).toBeInTheDocument();
    });

    it('should link to script download', () => {
      render(<WishImport onImportComplete={vi.fn()} />);

      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
  });
});
