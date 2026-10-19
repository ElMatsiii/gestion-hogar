export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAInstallContextType {
  canInstall: boolean;
  showBanner: boolean;
  isStandalone: boolean;
  isInstalled: boolean;
  isInstalling: boolean;
  installApp: () => Promise<boolean>;
  dismissBanner: () => void;
}

export const STORAGE_KEY_DISMISSED = 'hogarsync_pwa_banner_dismissed';

/**
 * Pure helper to determine standalone display mode across platforms.
 */
export function isStandaloneMode(
  mediaMatcher?: (query: string) => boolean,
  navStandalone?: boolean,
  referrer?: string
): boolean {
  if (mediaMatcher) {
    try {
      if (
        mediaMatcher('(display-mode: standalone)') ||
        mediaMatcher('(display-mode: fullscreen)') ||
        mediaMatcher('(display-mode: minimal-ui)')
      ) {
        return true;
      }
    } catch {
      // Safe fallback on media query evaluation error
    }
  }
  if (navStandalone === true) return true;
  if (typeof referrer === 'string' && referrer.includes('android-app://')) return true;
  return false;
}

/**
 * Safe browser environment checker for standalone display mode.
 */
export function checkStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  const mediaMatcher = typeof window.matchMedia === 'function'
    ? (query: string) => {
        try {
          return Boolean(window.matchMedia(query)?.matches);
        } catch {
          return false;
        }
      }
    : undefined;
  const navStandalone = (window.navigator as unknown as { standalone?: boolean })?.standalone;
  const referrer = typeof document !== 'undefined' ? document.referrer : '';
  return isStandaloneMode(mediaMatcher, navStandalone, referrer);
}

export interface PromptRunner {
  isPrompting: () => boolean;
  executePrompt: (
    promptEvent: BeforeInstallPromptEvent | null,
    onBeforePrompt?: () => void
  ) => Promise<boolean>;
}

/**
 * Creates a concurrency-guarded prompt runner for beforeinstallprompt events.
 */
export function createPromptRunner(
  onSuccess?: () => void
): PromptRunner {
  let isPrompting = false;

  return {
    isPrompting: () => isPrompting,
    executePrompt: async (
      promptEvent: BeforeInstallPromptEvent | null,
      onBeforePrompt?: () => void
    ): Promise<boolean> => {
      if (isPrompting) {
        console.warn('Install prompt already in progress');
        return false;
      }
      if (!promptEvent) {
        console.warn('Install prompt is not available yet');
        return false;
      }

      isPrompting = true;
      // Invalidate caller's reference immediately to prevent concurrent tap re-use
      onBeforePrompt?.();

      try {
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult?.outcome === 'accepted') {
          onSuccess?.();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error during HogarSync PWA installation:', err);
        return false;
      } finally {
        isPrompting = false;
      }
    },
  };
}
