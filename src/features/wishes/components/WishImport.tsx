import { useState } from 'react';
import type { BannerType } from '@/types';
import type { WishHistoryItem } from '../domain/wishAnalyzer';

interface WishImportProps {
  onImportComplete: (wishes: WishHistoryItem[]) => void;
}

// Banner type mapping
const GACHA_TYPE_MAP: Record<string, BannerType> = {
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
  const validateUrl = (inputUrl: string) => {
    if (!inputUrl) {
      setUrlError('');
      return false;
    }

    try {
      const normalizedUrl = normalizeUrl(inputUrl);
      const parsedUrl = new URL(normalizedUrl);

      if (!parsedUrl.hostname.includes('hoyoverse.com') && !parsedUrl.hostname.includes('mihoyo.com')) {
        setUrlError('Invalid URL format. Must be a HoYoverse wish history URL.');
        return false;
      }

      if (!parsedUrl.searchParams.has('authkey')) {
        setUrlError('Missing authkey parameter. Please run the script and copy the complete URL.');
        return false;
      }

      setUrlError('');
      return true;
    } catch {
      setUrlError('Invalid URL format');
      return false;
    }
  };

  // Handle URL change
  const handleUrlChange = (value: string) => {
    // Automatically normalize the URL
    const normalized = normalizeUrl(value);
    setUrl(normalized);
    setImportError('');
    setImportSummary(null);
  };

  // Handle URL blur
  const handleUrlBlur = () => {
    validateUrl(url);
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

    while (true) {
      const fetchUrl = new URL(baseUrl.toString());
      fetchUrl.searchParams.set('gacha_type', gachaType);
      fetchUrl.searchParams.set('page', page.toString());
      fetchUrl.searchParams.set('size', pageSize.toString());
      fetchUrl.searchParams.set('end_id', endId);

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
        !seenIds.has(item.id) && item.gacha_type === gachaType
      );
      if (newItems.length === 0) {
        break; // All items already seen or wrong banner type, we've reached the end
      }

      // Transform API data to WishHistoryItem
      for (const item of newItems) {
        seenIds.add(item.id);
        wishes.push({
          id: item.id,
          name: item.name,
          rarity: parseInt(item.rank_type) as 3 | 4 | 5,
          itemType: item.item_type.toLowerCase() === 'character' ? 'character' : 'weapon',
          time: item.time,
          banner: GACHA_TYPE_MAP[item.gacha_type],
        });
      }

      // If we got fewer items than requested, we've reached the end
      if (list.length < pageSize) {
        break;
      }

      endId = list[list.length - 1].id;
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
    if (!validateUrl(url)) {
      return;
    }

    setIsImporting(true);
    setImportError('');
    setImportSummary(null);

    try {
      const baseUrl = new URL(url);
      const allWishes: WishHistoryItem[] = [];
      const summary: Record<BannerType, number> = {
        character: 0,
        weapon: 0,
        standard: 0,
        chronicled: 0,
      };

      // Fetch selected banners
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
        summary[bannerType] = wishes.length;
      }

      setImportSummary(summary);
      setCurrentBanner('');
      onImportComplete(allWishes);
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Detect CORS errors
      if (error instanceof TypeError && errorMessage.includes('Failed to fetch')) {
        errorMessage = 'CORS_ERROR';
      }

      setImportError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const isValidUrl = url.length > 0 && !urlError;
  const canImport = isValidUrl && selectedBanners.size > 0 && !isImporting;
  const totalImported = importSummary ? Object.values(importSummary).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Import Wish History</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Import your wish history from the game to track your pity and statistics.
        </p>
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
          ⚠ Note: The wish history URL will expire after 24 hours. Run the script again if expired.
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          🔒 Your wish history data is private and will not be shared with anyone.
        </p>
      </div>

      {/* Script instructions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Step 1: Get Your Wish History URL</h3>

        {/* Windows PowerShell */}
        <div className="border rounded-lg p-4 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Windows (PowerShell)</h4>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => copyScript('windows')}
              >
                Copy Script
              </button>
              <button
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => downloadScript('windows')}
              >
                Download Windows (PowerShell) Script
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Run this script in PowerShell after closing the game:
          </p>
          <pre
            role="code"
            className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto"
          >
            ./get-wish-url.ps1
          </pre>
        </div>

        {/* macOS/Linux Bash */}
        <div className="border rounded-lg p-4 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">macOS / Linux (Bash)</h4>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => copyScript('macos')}
              >
                Copy Script
              </button>
              <button
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => downloadScript('macos')}
              >
                Download Mac/Linux (Bash) Script
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Run this script in Bash after closing the game:
          </p>
          <pre
            role="code"
            className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto"
          >
            bash get-wish-url.sh
          </pre>
        </div>
      </div>

      {/* URL Input */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Step 2: Paste Your Wish History URL</h3>
        <div className="space-y-2">
          <label htmlFor="wish-url" className="block text-sm font-medium">
            Wish History URL
          </label>
          <input
            id="wish-url"
            type="text"
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            placeholder="https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/log?authkey=..."
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onBlur={handleUrlBlur}
            disabled={isImporting}
          />
          {urlError && (
            <p className="text-sm text-red-600 dark:text-red-400">{urlError}</p>
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
              className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
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
        <div className="p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md">
          <p className="text-sm">{currentBanner}</p>
        </div>
      )}

      {/* Error */}
      {importError && (
        <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
          {importError === 'CORS_ERROR' ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-red-800 dark:text-red-200">
                Browser Security Restriction (CORS)
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200">
                Browsers block direct requests to HoYoverse's API for security reasons. This is a limitation of web-based apps.
              </p>
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-medium mb-2">Workarounds:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>
                    <strong>Use a CORS proxy:</strong> Set up a local proxy server (requires technical setup)
                  </li>
                  <li>
                    <strong>Desktop app:</strong> Request this app be converted to Tauri/Electron (no CORS restrictions)
                  </li>
                  <li>
                    <strong>Manual export:</strong> Use a third-party tool to export wish history as JSON, then import the file here
                  </li>
                </ol>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                Note: This is not a bug - it's a fundamental limitation of Progressive Web Apps (PWAs) running in browsers.
              </p>
            </div>
          ) : (
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to import wish history: {importError}
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      {importSummary && (
        <div className="p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            Import Complete! Imported {totalImported} wishes
          </h4>
          <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
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
