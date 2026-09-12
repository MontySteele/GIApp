/**
 * openExternal - open a URL in the user's default browser.
 *
 * Keeps Tauri out of the web bundle's hot path: the shell plugin is only
 * imported (lazily) when the app is actually running inside Tauri. In a plain
 * browser `window.open` is called synchronously so the call stays inside the
 * originating user gesture and is not popup-blocked.
 */

/** True when running inside the Tauri webview (checked synchronously). */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export function openExternal(url: string): void {
  if (isTauri()) {
    import('@tauri-apps/plugin-shell')
      .then(({ open }) => open(url))
      .catch((err: unknown) => {
        console.error('Failed to open external URL:', err);
      });
    return;
  }

  // Must be synchronous - no awaits before this point.
  window.open(url, '_blank', 'noopener,noreferrer');
}
