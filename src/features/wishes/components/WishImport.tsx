import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { BannerType } from '@/types';
import type { WishHistoryItem } from '../domain/wishAnalyzer';
import {
  clearWishSession,
  getWishSessionExpiry,
  isWishSessionExpired,
  loadWishSession,
  saveWishSession,
} from '../lib/wishSession';

// Check if running in Tauri
const isTauri = '__TAURI__' in window;

interface WishImportProps {
  onImportComplete: (wishes: WishHistoryItem[]) => void | Promise<void>;
}

// Banner type mapping
export const GACHA_TYPE_MAP: Record<string, BannerType> = {
  '301': 'character',
  '302': 'weapon',
  '200': 'standard',
  '500': 'chronicled',
};

const BANNER_NAMES: Record<BannerType, string> = {
  character: 'Character Event',
  weapon: 'Weapon Event',
  standard: 'Standard',
  chronicled: 'Chronicled Wish',
};

function formatRemainingTime(ms: number | null): string | null {
  if (ms === null || Number.isNaN(ms)) {
    return null;
  }

  const minutes = Math.max(1, Math.ceil(ms / (1000 * 60)));
  if (minutes >= 120) {
    const hours = Math.ceil(minutes / 60);
    return `${hours}h`;
  }

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes - hours * 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

export function WishImport({ onImportComplete }: WishImportProps) {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [currentBanner, setCurrentBanner] = useState('');
  const [importSummary, setImportSummary] = useState<Record<BannerType, number> | null>(null);
  const [selectedBanners, setSelectedBanners] = useState<Set<BannerType>>(
    new Set(['character', 'weapon', 'standard', 'chronicled'])
  );
  const [wishSession, setWishSession] = useState<Awaited<ReturnType<typeof loadWishSession>>>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      try {
        const existingSession = await loadWishSession();
        if (!isMounted) {
          return;
        }

        if (existingSession) {
          setWishSession(existingSession);
          setUrl(existingSession.url);
          if (isWishSessionExpired(existingSession)) {
            setUrlError('Your saved wish URL has expired. Please refresh the link to continue.');
          }
        }
      } catch (error) {
        console.error('[WishImport] Failed to hydrate wish session metadata', error);
      }
    };

    void hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

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
  const validateUrl = (inputUrl: string, options: { normalize?: boolean } = {}) => {
    if (!inputUrl) {
      setUrlError('');
      return false;
    }

    try {
      const normalizedUrl = normalizeUrl(inputUrl);
      const parsedUrl = new URL(normalizedUrl);
      if (options.normalize && normalizedUrl !== inputUrl) {
        setUrl(normalizedUrl);
      }

      if (!parsedUrl.hostname.includes('hoyoverse.com') && !parsedUrl.hostname.includes('mihoyo.com')) {
        setUrlError('Invalid wish history URL. Please paste the full HoYoverse link from the script.');
        return false;
      }

      if (!parsedUrl.searchParams.has('authkey')) {
        setUrlError('Missing authkey parameter. Please run the script and copy the complete URL.');
        return false;
      }

      setUrlError('');
      return true;
    } catch {
      setUrlError('Invalid wish history URL. Please paste the full HoYoverse link from the script.');
      return false;
    }
  };

  // Handle URL change
  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError('');
    setImportError('');
    setImportSummary(null);
  };

  // Handle URL blur
  const handleUrlBlur = async () => {
    const isValid = validateUrl(url, { normalize: true });
    if (isValid) {
      const session = await saveWishSession(url);
      setWishSession(session);
    } else {
      await clearWishSession();
      setWishSession(null);
    }
  };

  const handleRefreshLink = async () => {
    await clearWishSession();
    setWishSession(null);
    setUrl('');
    setUrlError('');
    setImportError('');
    setImportSummary(null);
  };

  // Toggle banner selection
  const toggleBanner = (banner: BannerType) => {
    const newSelection = new Set(selectedBanners);
    if (newSelection.has(banner)) {
      newSelection.delete(banner);
    } else {
      newSelection.add(banner);
    }
    setSelectedBanners(newSelection);
  };

  // Auto-extract wish URL from game logs (Tauri only)
  const handleAutoExtract = async () => {
    if (!isTauri) {
      setUrlError('Auto-extract is only available in the desktop app version.');
      return;
    }

    try {
      setUrlError('');
      const extractedUrl = await invoke<string>('extract_wish_url');
      setUrl(extractedUrl);
    } catch (error) {
      setUrlError(error as string);
    }
  };

  // Copy script to clipboard
  const copyScript = async (scriptType: 'windows' | 'macos') => {
    const scriptPath = scriptType === 'windows'
      ? '/scripts/get-wish-url.ps1'
      : '/scripts/get-wish-url.sh';

    try {
      const response = await fetch(scriptPath);
      const script = await response.text();
      await navigator.clipboard.writeText(script);
    } catch (error) {
      console.error('Failed to copy script:', error);
    }
  };

  // Download script
  const downloadScript = async (scriptType: 'windows' | 'macos') => {
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
      console.error('Failed to download script:', error);
    }
  };

  // Fetch wish history for a specific banner
  const fetchBannerHistory = async (baseUrl: URL, gachaType: string): Promise<WishHistoryItem[]> => {
    const wishes: WishHistoryItem[] = [];
    const seenIds = new Set<string>();
    let page = 1;
    let endId = '0';
    const pageSize = 20;
    const normalizedGachaType = String(gachaType);
    const apiHost = baseUrl.hostname;

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
          console.warn('[WishImport] Authkey expired or invalid when fetching wishes', {
            host: apiHost,
            gachaType: normalizedGachaType,
          });
          throw new Error('Authkey has expired. Please run the script again to get a new URL.');
        }
        if (
          data.message?.toString().toLowerCase().includes('rate') ||
          data.message?.toString().toLowerCase().includes('limit')
        ) {
          console.warn('[WishImport] Possible rate limit detected while fetching wishes', {
            host: apiHost,
            gachaType: normalizedGachaType,
            retcode: data.retcode,
          });
        }

        console.error('[WishImport] API error response from wish history endpoint', {
          host: apiHost,
          gachaType: normalizedGachaType,
          retcode: data.retcode,
          message: data.message,
        });
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
          wishes.push({
            id: item.id,
            name: item.name,
            rarity: parseInt(item.rank_type) as 3 | 4 | 5,
            itemType: item.item_type.toLowerCase() === 'character' ? 'character' : 'weapon',
            time: item.time,
            banner: bannerType,
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
  };

  // Import wish history
  const handleImport = async () => {
    if (!validateUrl(url, { normalize: true })) {
      return;
    }

    const session = await loadWishSession();
    if (isWishSessionExpired(session)) {
      await clearWishSession();
      setWishSession(null);
      setImportError('Your wish URL has expired. Please run the script again to get a new one.');
      setUrlError('Your saved wish URL has expired. Use refresh to generate a new link.');
      return;
    }

    setIsImporting(true);
    setImportError('');
    setImportSummary(null);
    const persistedSession = session ?? (await saveWishSession(url));
    setWishSession(persistedSession);

    try {
      let allWishes: WishHistoryItem[];

      // Use Tauri invoke if running in desktop app
      if (isTauri) {
        setCurrentBanner('Fetching wish history...');
        const selectedBannersList = Array.from(selectedBanners);
        allWishes = await invoke<WishHistoryItem[]>('fetch_wish_history', {
          url,
          selectedBanners: selectedBannersList,
        });
      } else {
        // Fallback to browser fetch (will hit CORS)
        const baseUrl = new URL(url);
        allWishes = [];
        const bannersToFetch: Array<[BannerType, string]> = [
          ['character', '301'],
          ['weapon', '302'],
          ['standard', '200'],
          ['chronicled', '500'],
        ].filter(([bannerType]) => selectedBanners.has(bannerType as BannerType)) as Array<[BannerType, string]>;

        for (const [bannerType, gachaType] of bannersToFetch) {
          setCurrentBanner(`Fetching ${BANNER_NAMES[bannerType]} banner...`);
          const wishes = await fetchBannerHistory(baseUrl, gachaType);
          allWishes.push(...wishes);
        }
      }

      // Calculate summary
      const summary: Record<BannerType, number> = {
        character: 0,
        weapon: 0,
        standard: 0,
        chronicled: 0,
      };

      for (const wish of allWishes) {
        if (wish.banner in summary) {
          summary[wish.banner as BannerType]++;
        }
      }

      setImportSummary(summary);
      setCurrentBanner('');
      await onImportComplete(allWishes);
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

      if (errorMessage.toLowerCase().includes('authkey') && errorMessage.toLowerCase().includes('expire')) {
        await clearWishSession();
        setWishSession(null);
        errorMessage = 'Your wish URL has expired. Please run the script again for a fresh link.';
      }

      console.error('[WishImport] Import failed', { reason: errorMessage });
      setImportError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const isValidUrl = url.length > 0 && !urlError;
  const canImport = isValidUrl && selectedBanners.size > 0 && !isImporting;
  const totalImported = importSummary ? Object.values(importSummary).reduce((a, b) => a + b, 0) : 0;
  const sessionExpiry = useMemo(() => getWishSessionExpiry(wishSession), [wishSession]);
  const sessionExpiryLabel = useMemo(() => {
    if (!wishSession) {
      return null;
    }

    if (sessionExpiry.expired) {
      return 'Saved wish URL expired. Refresh to continue.';
    }

    const formatted = formatRemainingTime(sessionExpiry.remainingMs);
    return formatted ? `Saved wish URL expires in ${formatted}.` : null;
  }, [sessionExpiry, wishSession]);

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
          <h3 className="text-lg font-semibold">Step 2: Get Your Wish History URL</h3>
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
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onBlur={() => void handleUrlBlur()}
            disabled={isImporting}
          />
          {urlError && (
            <p className="text-sm text-red-400">{urlError}</p>
          )}
          {sessionExpiryLabel && (
            <div
              className={`mt-2 flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
                sessionExpiry.expired
                  ? 'border-red-500/70 bg-red-900/30 text-red-100'
                  : 'border-amber-500/60 bg-amber-500/10 text-amber-50'
              }`}
            >
              <div className="space-y-1">
                <p className="font-medium">{sessionExpiry.expired ? 'Wish URL expired' : 'Wish URL expiry'}</p>
                <p>{sessionExpiryLabel}</p>
              </div>
              <button
                className="rounded-md border border-current px-3 py-1 text-xs font-semibold hover:bg-white/10"
                onClick={() => void handleRefreshLink()}
                type="button"
              >
                Refresh link
              </button>
            </div>
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
                checked={selectedBanners.has(banner)}
                onChange={() => toggleBanner(banner)}
                disabled={isImporting}
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
          {isImporting ? 'Importing...' : 'Import'}
        </button>
      </div>

      {/* Progress */}
      {isImporting && currentBanner && (
        <div className="p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
          <p className="text-sm text-blue-200">{currentBanner}</p>
        </div>
      )}

      {/* Error */}
      {importError && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          {importError === 'CORS_ERROR' ? (
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
              Failed to import wish history: {importError}
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      {importSummary && (
        <div className="p-4 bg-green-900/30 border border-green-500 rounded-lg">
          <h4 className="font-semibold text-green-200 mb-2">
            Import Complete! Imported {totalImported} wishes
          </h4>
          <ul className="space-y-1 text-sm text-green-300">
            {Object.entries(importSummary).map(([banner, count]) => (
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
