import { RefreshCw, X } from 'lucide-react';

interface UpdateBannerProps {
  visible: boolean;
  onRefresh: () => void;
  onDismiss: () => void;
}

/**
 * A small banner shown at the top of the screen when a new version is deployed.
 * Gives the user two choices: Refresh Now or Dismiss.
 */
export function UpdateBanner({ visible, onRefresh, onDismiss }: UpdateBannerProps) {
  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 shadow-lg animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>A new version is available! Refresh to get the latest updates.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1 text-xs font-semibold bg-white text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
          >
            Refresh Now
          </button>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
