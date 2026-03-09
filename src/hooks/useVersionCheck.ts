import { useEffect, useRef, useCallback } from 'react';
import config from '@/config/env';

/**
 * Build version stored at load time.
 * Compared against /version.json on interval to detect new deploys.
 */
let currentVersion: string | null = null;

/**
 * Fetch the latest version hash from the server.
 * Returns null if fetch fails (offline, dev mode, etc.)
 */
async function fetchLatestVersion(): Promise<string | null> {
  try {
    // Cache-bust the request so the browser never serves a stale version.json
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.version || null;
  } catch {
    return null;
  }
}

interface UseVersionCheckOptions {
  /** Polling interval in ms. Default: 5 minutes */
  interval?: number;
  /** Callback when a new version is detected */
  onNewVersion?: (newVersion: string) => void;
}

/**
 * Hook that polls /version.json to detect new deployments.
 *
 * In development mode this hook does nothing.
 * In production it:
 *  - Records the current version on first load
 *  - Polls every `interval` ms (default 5 min)
 *  - Also checks on window focus (user switching back to tab)
 *  - Calls `onNewVersion` when a mismatch is found
 */
export function useVersionCheck(options: UseVersionCheckOptions = {}) {
  const {
    interval = 5 * 60 * 1000, // 5 minutes
    onNewVersion,
  } = options;

  const hasNotified = useRef(false);

  const checkVersion = useCallback(async () => {
    // Skip in development
    if (config.isDev) return;
    // Don't notify more than once per session
    if (hasNotified.current) return;

    const latestVersion = await fetchLatestVersion();
    if (!latestVersion) return;

    // First load — store the version
    if (currentVersion === null) {
      currentVersion = latestVersion;
      if (config.enableDebug) {
        console.debug('[VersionCheck] Initial version:', currentVersion);
      }
      return;
    }

    // Version changed → new deploy detected
    if (latestVersion !== currentVersion) {
      hasNotified.current = true;
      if (config.enableDebug) {
        console.debug('[VersionCheck] New version detected:', latestVersion, '(was:', currentVersion, ')');
      }
      onNewVersion?.(latestVersion);
    }
  }, [onNewVersion]);

  useEffect(() => {
    if (config.isDev) return;

    // Check immediately on mount
    checkVersion();

    // Poll on interval
    const timer = setInterval(checkVersion, interval);

    // Also check when user returns to the tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Also check on window focus (covers alt-tab scenarios)
    const handleFocus = () => checkVersion();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkVersion, interval]);
}
