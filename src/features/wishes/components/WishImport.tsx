import { useReducer, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { BannerType } from '@/types';
import type { WishHistoryItem } from '../domain/wishAnalyzer';
import { wishRepo } from '../repo/wishRepo';
import {
  loadWishHistoryFromRepo,
  summarizeWishRecords,
  wishHistoryItemToRecord,
} from '../utils/wishHistory';
import { resolveIsFeatured } from '../data/standardPool';

// Check if running in Tauri
const isTauri = '__TAURI__' in window;

interface WishImportProps {
  onImportComplete: (wishes: WishHistoryItem[]) => void;
}

// Banner type mapping
export const GACHA_TYPE_MAP: Record<string, BannerType> = {
  '301': 'character',
  '400': 'character',
  '302': 'weapon',
  '200': 'standard',
  '500': 'chronicled',
};

const GACHA_TYPES_BY_BANNER: Record<BannerType, string[]> = {
  character: ['301', '400'], // Character Event Wish-1 & Wish-2
  weapon: ['302'],
  standard: ['200'],
  chronicled: ['500'],
};

const BANNER_NAMES: Record<BannerType, string> = {
  character: 'Character Event',
  weapon: 'Weapon Event',
  standard: 'Standard',
  chronicled: 'Chronicled Wish',
};

// State management with useReducer
interface WishImportState {
  url: string;
  urlError: string;
  isImporting: boolean;
  importError: string;
  currentBanner: string;
  importSummary: Record<BannerType, number> | null;
  selectedBanners: Set<BannerType>;
}

type WishImportAction =
  | { type: 'SET_URL'; payload: string }
  | { type: 'SET_URL_ERROR'; payload: string }
  | { type: 'SET_IS_IMPORTING'; payload: boolean }
  | { type: 'SET_IMPORT_ERROR'; payload: string }
  | { type: 'SET_CURRENT_BANNER'; payload: string }
  | { type: 'SET_IMPORT_SUMMARY'; payload: Record<BannerType, number> | null }
  | { type: 'TOGGLE_BANNER'; payload: BannerType }
  | { type: 'RESET_IMPORT_STATE' };

const initialState: WishImportState = {
  url: '',
  urlError: '',
  isImporting: false,
  importError: '',
  currentBanner: '',
  importSummary: null,
  selectedBanners: new Set(['character', 'weapon', 'standard', 'chronicled']),
};

function wishImportReducer(state: WishImportState, action: WishImportAction): WishImportState {
  switch (action.type) {
    case 'SET_URL':
      return { ...state, url: action.payload };
    case 'SET_URL_ERROR':
      return { ...state, urlError: action.payload };
    case 'SET_IS_IMPORTING':
      return { ...state, isImporting: action.payload };
    case 'SET_IMPORT_ERROR':
      return { ...state, importError: action.payload };
    case 'SET_CURRENT_BANNER':
      return { ...state, currentBanner: action.payload };
    case 'SET_IMPORT_SUMMARY':
      return { ...state, importSummary: action.payload };
    case 'TOGGLE_BANNER': {
      const newSelection = new Set(state.selectedBanners);
      if (newSelection.has(action.payload)) {
        newSelection.delete(action.payload);
      } else {
        newSelection.add(action.payload);
      }
      return { ...state, selectedBanners: newSelection };
    }
    case 'RESET_IMPORT_STATE':
      return {
        ...state,
        importError: '',
        importSummary: null,
      };
    default:
      return state;
  }
}

export function WishImport({ onImportComplete }: WishImportProps) {
  const [state, dispatch] = useReducer(wishImportReducer, initialState);

  // Normalize URL - convert /index.html to /log
  const normalizeUrl = (inputUrl: string): string => {
    try {
      const url = new URL(inputUrl);
      // Replace /index.html with /log if present
      url.pathname = url.pathname.replace(/\/index\.html$/, '/log');
      return url.toString();
    } catch {
      return inputUrl;
    }
  };

  // Validate URL
  const validateUrl = useCallback((inputUrl: string, options: { normalize?: boolean } = {}) => {
    if (!inputUrl) {
      dispatch({ type: 'SET_URL_ERROR', payload: '' });
      return false;
    }

    try {
      const normalizedUrl = normalizeUrl(inputUrl);
      const parsedUrl = new URL(normalizedUrl);
      if (options.normalize && normalizedUrl !== inputUrl) {
        dispatch({ type: 'SET_URL', payload: normalizedUrl });
      }

      if (!parsedUrl.hostname.includes('hoyoverse.com') && !parsedUrl.hostname.includes('mihoyo.com')) {
        dispatch({ type: 'SET_URL_ERROR', payload: 'Invalid wish history URL. Please paste the full HoYoverse link from the script.' });
        return false;
      }

      if (!parsedUrl.searchParams.has('authkey')) {
        dispatch({ type: 'SET_URL_ERROR', payload: 'Missing authkey parameter. Please run the script and copy the complete URL.' });
        return false;
      }

      dispatch({ type: 'SET_URL_ERROR', payload: '' });
      return true;
    } catch {
      dispatch({ type: 'SET_URL_ERROR', payload: 'Invalid wish history URL. Please paste the full HoYoverse link from the script.' });
      return false;
    }
  }, []);

  // Handle URL change
  const handleUrlChange = useCallback((value: string) => {
    dispatch({ type: 'SET_URL', payload: value });
    dispatch({ type: 'RESET_IMPORT_STATE' });
  }, []);

  // Handle URL blur
  const handleUrlBlur = useCallback(() => {
    validateUrl(state.url, { normalize: true });
  }, [state.url, validateUrl]);

  // Toggle banner selection
  const toggleBanner = useCallback((banner: BannerType) => {
    dispatch({ type: 'TOGGLE_BANNER', payload: banner });
  }, []);

  // Auto-extract wish URL from game logs (Tauri only)
  const handleAutoExtract = useCallback(async () => {
    if (!isTauri) {
      dispatch({ type: 'SET_URL_ERROR', payload: 'Auto-extract is only available in the desktop app version.' });
      return;
    }

    try {
      dispatch({ type: 'SET_URL_ERROR', payload: '' });
      const extractedUrl = await invoke<string>('extract_wish_url');
      dispatch({ type: 'SET_URL', payload: extractedUrl });
    } catch (error) {
      dispatch({ type: 'SET_URL_ERROR', payload: error as string });
    }
  }, []);

  // Copy script to clipboard
  const copyScript = useCallback(async (scriptType: 'windows' | 'macos') => {
    const scriptPath = scriptType === 'windows'
      ? '/scripts/get-wish-url.ps1'
      : '/scripts/get-wish-url.sh';

    try {
      const response = await fetch(scriptPath);
      const script = await response.text();
      await navigator.clipboard.writeText(script);
    } catch (error) {
      // Failed to copy script - silently ignore
    }
  }, []);

  // Download script
  const downloadScript = useCallback(async (scriptType: 'windows' | 'macos') => {
    const scriptPath = scriptType === 'windows'
      ? '/scripts/get-wish-url.ps1'
      : '/scripts/get-wish-url.sh';
    const filename = scriptType === 'windows' ? 'get-wish-url.ps1' : 'get-wish-url.sh';

    try {
      const response = await fetch(scriptPath);
      const script = await response.text();
      const blob = new Blob([script], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      // Failed to download script - silently ignore
    }
  }, []);

  // Fetch wish history for a specific banner
  const fetchBannerHistory = useCallback(async (baseUrl: URL, gachaType: string): Promise<WishHistoryItem[]> => {
    const wishes: WishHistoryItem[] = [];
    const seenIds = new Set<string>();
    let page = 1;
    let endId = '0';
    const pageSize = 20;
    const normalizedGachaType = String(gachaType);

    while (true) {
      const fetchUrl = new URL(baseUrl.toString());
      fetchUrl.searchParams.set('gacha_type', normalizedGachaType);
      fetchUrl.searchParams.set('page', page.toString());
      fetchUrl.searchParams.set('size', pageSize.toString());
      fetchUrl.searchParams.set('end_id', endId);
      const previousEndId = endId;

      const response = await fetch(fetchUrl.toString());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check for API errors
      if (data.retcode !== 0 && data.retcode !== undefined) {
        if (data.retcode === -101) {
          throw new Error('Authkey has expired. Please run the script again to get a new URL.');
        }
        throw new Error(data.message || `API error: ${data.retcode}`);
      }

      const list = data.data?.list || [];

      if (list.length === 0) {
        break;
      }

      // Filter for items that match the requested banner type and haven't been seen
      const newItems = list.filter((item: any) =>
        !seenIds.has(item.id) && String(item.gacha_type) === normalizedGachaType
      );

      // Transform API data to WishHistoryItem
      for (const item of newItems) {
        seenIds.add(item.id);
        const bannerType = GACHA_TYPE_MAP[String(item.gacha_type)];
        if (bannerType) {
          const itemType = item.item_type.toLowerCase() === 'character' ? 'character' : 'weapon';
          const rarity = parseInt(item.rank_type) as 3 | 4 | 5;
          wishes.push({
            id: item.id,
            name: item.name,
            rarity,
            itemType,
            time: item.time,
            banner: bannerType,
            isFeatured: resolveIsFeatured(item.name, bannerType, itemType, rarity),
          });
        }
      }

      // If we got fewer items than requested, we've reached the end
      if (list.length < pageSize) {
        break;
      }

      const nextEndId = list[list.length - 1]?.id;

      // Prevent infinite loops if the API returns duplicate pages
      if (!nextEndId || nextEndId === previousEndId) {
        break;
      }

      endId = nextEndId;
      page++;

      // Rate limiting (skip in test environment)
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return wishes;
  }, []);

  // Import wish history
  const handleImport = useCallback(async () => {
    if (!validateUrl(state.url, { normalize: true })) {
      return;
    }

    dispatch({ type: 'SET_IS_IMPORTING', payload: true });
    dispatch({ type: 'RESET_IMPORT_STATE' });

    try {
      let allWishes: WishHistoryItem[];

      // Use Tauri invoke if running in desktop app
      if (isTauri) {
        dispatch({ type: 'SET_CURRENT_BANNER', payload: 'Fetching wish history...' });
        const selectedBannersList = Array.from(state.selectedBanners);
        allWishes = await invoke<WishHistoryItem[]>('fetch_wish_history', {
          url: state.url,
          selectedBanners: selectedBannersList,
        });
      } else {
        // Fallback to browser fetch (will hit CORS)
        const baseUrl = new URL(state.url);
        allWishes = [];
        const bannersToFetch = Array.from(state.selectedBanners) as BannerType[];

        for (const bannerType of bannersToFetch) {
          for (const gachaType of GACHA_TYPES_BY_BANNER[bannerType]) {
            dispatch({ type: 'SET_CURRENT_BANNER', payload: `Fetching ${BANNER_NAMES[bannerType]} banner...` });
            const wishes = await fetchBannerHistory(baseUrl, gachaType);
            allWishes.push(...wishes);
          }
        }
      }

      const existingRecords = await wishRepo.getAll();
      const existingIds = new Set(existingRecords.map((record) => record.gachaId));
      const wishesToStore = allWishes
        .filter((wish) => !existingIds.has(wish.id))
        .map(wishHistoryItemToRecord);

      if (wishesToStore.length > 0) {
        await wishRepo.bulkCreate(wishesToStore);
      }

      const persistedRecords = await wishRepo.getAll();
      const persistedSummary = summarizeWishRecords(persistedRecords);
      const persistedHistory = await loadWishHistoryFromRepo();

      dispatch({ type: 'SET_IMPORT_SUMMARY', payload: persistedSummary });
      dispatch({ type: 'SET_CURRENT_BANNER', payload: '' });
      onImportComplete(persistedHistory);
    } catch (error) {
      let errorMessage: string;

      // Handle different error types
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      } else {
        errorMessage = 'Unknown error occurred';
      }

      // Detect CORS errors (browser only)
      if (!isTauri && error instanceof TypeError && errorMessage.includes('Failed to fetch')) {
        errorMessage = 'CORS_ERROR';
      }

      dispatch({ type: 'SET_IMPORT_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_IS_IMPORTING', payload: false });
    }
  }, [state.url, state.selectedBanners, validateUrl, fetchBannerHistory, onImportComplete]);

  // Memoized computed values
  const isValidUrl = useMemo(
    () => state.url.length > 0 && !state.urlError,
    [state.url, state.urlError]
  );

  const canImport = useMemo(
    () => isValidUrl && state.selectedBanners.size > 0 && !state.isImporting,
    [isValidUrl, state.selectedBanners, state.isImporting]
  );

  const totalImported = useMemo(
    () => state.importSummary ? Object.values(state.importSummary).reduce((a, b) => a + b, 0) : 0,
    [state.importSummary]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Import Wish History</h2>
        <p className="text-sm text-slate-400">
          Import your wish history from the game to track your pity and statistics.
        </p>
        <p className="text-xs text-yellow-400 mt-1">
          ⚠ Note: The wish history URL will expire after 24 hours. Run the script again if expired.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          🔒 Your wish history data is private and will not be shared with anyone.
        </p>
      </div>

      {!isTauri && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-100">
          <p className="font-semibold">Browser security limitations</p>
          <p className="text-sm mt-1">
            Web browsers block wish history requests because of CORS. Run the desktop app or route requests through a local proxy to import successfully.
          </p>
        </div>
      )}

      {/* Script instructions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Step 1: Get Your Wish History URL</h3>

        {/* Windows PowerShell */}
        <div className="border border-slate-700 rounded-lg p-4 bg-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Windows (PowerShell)</h4>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
                onClick={() => copyScript('windows')}
              >
                Copy Script
              </button>
              <button
                className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
                onClick={() => downloadScript('windows')}
              >
                Download Windows (PowerShell) Script
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-2">
            Run this script in PowerShell after closing the game:
          </p>
          <pre
            role="code"
            className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-slate-200"
          >
            ./get-wish-url.ps1
          </pre>
        </div>

        {/* macOS/Linux Bash */}
        <div className="border border-slate-700 rounded-lg p-4 bg-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">macOS / Linux (Bash)</h4>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
                onClick={() => copyScript('macos')}
              >
                Copy Script
              </button>
              <button
                className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
                onClick={() => downloadScript('macos')}
              >
                Download Mac/Linux (Bash) Script
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-2">
            Run this script in Bash after closing the game:
          </p>
          <pre
            role="code"
            className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-slate-200"
          >
            bash get-wish-url.sh
          </pre>
        </div>
      </div>

      {/* URL Input */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Step 2: Paste Your Wish History URL</h3>
          {isTauri && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              onClick={handleAutoExtract}
            >
              Auto-Extract from Game Logs
            </button>
          )}
        </div>
        {isTauri && (
          <p className="text-sm text-blue-400 mb-3">
            Desktop app detected! Click "Auto-Extract" to automatically find the URL from your Genshin Impact game logs, or paste manually below.
          </p>
        )}
        <div className="space-y-2">
          <label htmlFor="wish-url" className="block text-sm font-medium text-slate-300">
            Wish History URL
          </label>
          <input
            id="wish-url"
            type="text"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=..."
            value={state.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onBlur={handleUrlBlur}
            disabled={state.isImporting}
          />
          {state.urlError && (
            <p className="text-sm text-red-400">{state.urlError}</p>
          )}
        </div>
      </div>

      {/* Banner Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Step 3: Select Banners to Import</h3>
        <div className="grid grid-cols-2 gap-3">
          {(['character', 'weapon', 'standard', 'chronicled'] as BannerType[]).map((banner) => (
            <label
              key={banner}
              className="flex items-center gap-2 p-3 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
            >
              <input
                type="checkbox"
                checked={state.selectedBanners.has(banner)}
                onChange={() => toggleBanner(banner)}
                disabled={state.isImporting}
              />
              <span>{BANNER_NAMES[banner]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Import Button */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Step 4: Import</h3>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
          onClick={handleImport}
          disabled={!canImport}
        >
          {state.isImporting ? 'Importing...' : 'Import'}
        </button>
      </div>

      {/* Progress */}
      {state.isImporting && state.currentBanner && (
        <div className="p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
          <p className="text-sm text-blue-200">{state.currentBanner}</p>
        </div>
      )}

      {/* Error */}
      {state.importError && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          {state.importError === 'CORS_ERROR' ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-red-200">Browser path blocked by CORS</h4>
              <p className="text-sm text-red-200">
                The HoYoverse wish API rejects requests from browsers. Switch to the desktop app (Tauri) or run imports through a trusted local proxy to bypass CORS.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-200">
                <li>Desktop app: supports direct imports via Tauri&apos;s native <code className="rounded bg-white/10 px-1">invoke</code> calls.</li>
                <li>Local proxy: forward traffic to the HoYoverse domain from your machine, then paste the proxied URL here.</li>
                <li>Manual: export wish history JSON from another tool and import the file.</li>
              </ul>
              <p className="text-xs text-red-300 mt-2">Browser CORS protections block requests and will continue to fail without one of the options above.</p>
            </div>
          ) : (
            <p className="text-sm text-red-200">
              Failed to import wish history: {state.importError}
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      {state.importSummary && (
        <div className="p-4 bg-green-900/30 border border-green-500 rounded-lg">
          <h4 className="font-semibold text-green-200 mb-2">
            Import Complete! Imported {totalImported} wishes
          </h4>
          <ul className="space-y-1 text-sm text-green-300">
            {Object.entries(state.importSummary).map(([banner, count]) => (
              count > 0 && (
                <li key={banner}>
                  {BANNER_NAMES[banner as BannerType]}: {count} wishes
                </li>
              )
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
