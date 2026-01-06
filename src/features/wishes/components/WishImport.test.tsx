import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GACHA_TYPE_MAP, WishImport } from './WishImport';
import { WISH_AUTH_SESSION_KEY } from '../lib/wishSession';

beforeEach(() => {
  global.fetch = vi.fn(() =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve({ data: { list: [] } }),
        });
      }, 0);
    })
  ) as any;
});

afterEach(() => {
  sessionStorage.clear();
  vi.resetAllMocks();
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
  });

  describe('Import process', () => {
    it('should show loading state during import', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn();
      render(<WishImport onImportComplete={onImportComplete} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      expect(await screen.findByText(/importing/i)).toBeInTheDocument();
      expect(importButton).toBeDisabled();
    });

    it('should show progress during import', async () => {
      const user = userEvent.setup();
      render(<WishImport onImportComplete={vi.fn()} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      expect(await screen.findByText(/fetching.*banner/i)).toBeInTheDocument();
    });

    it('should call onImportComplete with wish data on success', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn();

      // Mock successful fetch
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              list: [
                {
                  id: '1',
                  gacha_type: '301',
                  item_id: '10000089',
                  name: 'Furina',
                  item_type: 'Character',
                  rank_type: '5',
                  time: '2024-01-01 12:00:00',
                },
              ],
            },
          }),
        })
      ) as any;

      render(<WishImport onImportComplete={onImportComplete} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(onImportComplete).toHaveBeenCalled();
      });
    });

    it('should show error message on import failure', async () => {
      const user = userEvent.setup();

      // Mock failed fetch
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as any;

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
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            retcode: -101,
            message: 'authkey timeout',
          }),
        })
      ) as any;

      render(<WishImport onImportComplete={vi.fn()} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/wish url.*expired/i)).toBeInTheDocument();
      });

      expect(sessionStorage.getItem(WISH_AUTH_SESSION_KEY)).toBeNull();
    });
  });

  describe('Session handling', () => {
    it('should clear saved auth session when tab closes', async () => {
      const user = userEvent.setup();
      render(<WishImport onImportComplete={vi.fn()} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');
      await user.tab();

      await waitFor(() => {
        expect(sessionStorage.getItem(WISH_AUTH_SESSION_KEY)).not.toBeNull();
      });

      window.dispatchEvent(new Event('beforeunload'));

      expect(sessionStorage.getItem(WISH_AUTH_SESSION_KEY)).toBeNull();
    });
  });

  describe('Banner selection', () => {
    it('should fetch all banner types by default', async () => {
      const user = userEvent.setup();
      const fetchSpy = vi.fn(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { list: [] } }),
        });
      });
      global.fetch = fetchSpy as any;

      render(<WishImport onImportComplete={vi.fn()} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');
      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        // Should fetch character (301), weapon (302), standard (200), and chronicled (500)
        expect(fetchSpy).toHaveBeenCalledTimes(4);
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
      const onImportComplete = vi.fn();

      const fetchMock = vi.fn((url: string) => {
        const gachaType = new URL(url).searchParams.get('gacha_type');

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
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
          }),
        });
      });

      global.fetch = fetchMock as any;

      render(<WishImport onImportComplete={onImportComplete} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(onImportComplete).toHaveBeenCalledTimes(1);
      });

      const aggregatedWishes = onImportComplete.mock.calls[0][0];
      const banners = aggregatedWishes.map((wish: any) => wish.banner);

      expect(fetchMock).toHaveBeenCalledTimes(4);
      expect(banners).toEqual(
        expect.arrayContaining(['character', 'weapon', 'standard', 'chronicled'])
      );
    });

    it('should keep chronicled wishes when paginating with duplicate pages', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn();

      const responsesByPage: Record<string, any[]> = {
        '500-1': [
          { id: '500-a', gacha_type: '500', rank_type: '5', name: 'Diluc', item_type: 'Character', time: '2024-01-01 00:00:00' },
        ],
        '500-2': [
          // Same end_id should stop the loop without dropping the item
          { id: '500-a', gacha_type: '500', rank_type: '4', name: 'Amber', item_type: 'Character', time: '2024-01-01 00:00:00' },
        ],
      };

      const fetchMock = vi.fn((url: string) => {
        const parsed = new URL(url);
        const gachaType = parsed.searchParams.get('gacha_type');
        const page = parsed.searchParams.get('page');
        const key = `${gachaType}-${page}`;
        const list = responsesByPage[key] ?? [];

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { list } }),
        });
      });
      global.fetch = fetchMock as any;

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
      const onImportComplete = vi.fn();

      const fetchMock = vi.fn((url: string) => {
        const gachaType = new URL(url).searchParams.get('gacha_type');

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
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
          }),
        });
      });

      global.fetch = fetchMock as any;

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
      const banners = aggregatedWishes.map((wish: any) => wish.banner);
      const fetchedGachaTypes = fetchMock.mock.calls.map((call) => new URL(call[0]).searchParams.get('gacha_type'));

      expect(fetchMock).toHaveBeenCalledTimes(3);
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
      const onImportComplete = vi.fn();

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              list: [
                { id: '1', gacha_type: '301', rank_type: '5', name: 'Furina', item_type: 'Character', time: '2024-01-01 12:00:00' },
                { id: '2', gacha_type: '301', rank_type: '4', name: 'Fischl', item_type: 'Character', time: '2024-01-01 11:00:00' },
              ],
            },
          }),
        })
      ) as any;

      render(<WishImport onImportComplete={onImportComplete} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/imported.*2.*wishes/i)).toBeInTheDocument();
      });
    });

    it('should include all banner counts when each gacha type returns data', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn();

      const bannerResponses: Record<string, any[]> = {
        '301': [{ id: '1', gacha_type: 301, rank_type: '5', name: 'Furina', item_type: 'Character', time: '2024-01-01 12:00:00' }],
        '302': [{ id: '2', gacha_type: 302, rank_type: '5', name: 'Aqua Simulacra', item_type: 'Weapon', time: '2024-01-01 12:10:00' }],
        '200': [{ id: '3', gacha_type: 200, rank_type: '4', name: 'Jean', item_type: 'Character', time: '2024-01-01 12:20:00' }],
        '500': [{ id: '4', gacha_type: 500, rank_type: '4', name: 'Diluc', item_type: 'Character', time: '2024-01-01 12:30:00' }],
      };

      global.fetch = vi.fn((url: string) => {
        const gachaType = new URL(url).searchParams.get('gacha_type') || '';
        const list = bannerResponses[gachaType] ?? [];
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { list } }),
        });
      }) as any;

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
      expect(allWishes.map((wish: any) => wish.banner).sort()).toEqual(
        ['character', 'weapon', 'standard', 'chronicled'].sort()
      );

      expect(screen.getByText(/character event: 1 wishes/i)).toBeInTheDocument();
      expect(screen.getByText(/weapon event: 1 wishes/i)).toBeInTheDocument();
      expect(screen.getByText(/standard: 1 wishes/i)).toBeInTheDocument();
      expect(screen.getByText(/chronicled wish: 1 wishes/i)).toBeInTheDocument();
    });

    it('should show breakdown by banner type', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn((url: string) => {
        const gachaType = new URL(url).searchParams.get('gacha_type');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              list: gachaType === '301'
                ? [{ id: '1', gacha_type: '301', rank_type: '5', name: 'Furina', item_type: 'Character', time: '2024-01-01 12:00:00' }]
                : [],
            },
          }),
        });
      }) as any;

      render(<WishImport onImportComplete={vi.fn()} />);

      const urlInput = screen.getByLabelText(/wish history url/i);
      await user.type(urlInput, 'https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=test');

      const importButton = screen.getByRole('button', { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/character.*event.*1/i)).toBeInTheDocument();
      });
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
