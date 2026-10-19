import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  BeforeInstallPromptEvent,
  PWAInstallContextType,
  STORAGE_KEY_DISMISSED,
  checkStandaloneMode,
} from './pwaUtils';

export type { BeforeInstallPromptEvent, PWAInstallContextType };

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

// Eagerly attach beforeinstallprompt listener at module level to prevent missing early events
let capturedPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    capturedPrompt = e as BeforeInstallPromptEvent;
    console.log('Eagerly captured beforeinstallprompt event for HogarSync PWA');
  });

  // If installed outside React lifecycle, clear eagerly captured prompt
  window.addEventListener('appinstalled', () => {
    capturedPrompt = null;
  });
}

export const PWAInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => capturedPrompt);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_DISMISSED) === 'true';
    } catch {
      return false;
    }
  });
  const [isStandalone, setIsStandalone] = useState<boolean>(() => checkStandaloneMode());
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkStandaloneMode());
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // Guard against concurrent/re-entrant prompt calls (e.g. rapid double tap)
  const isPromptingRef = useRef(false);

  useEffect(() => {
    // Check standalone mode on mount and resize / display-mode change
    const mediaQueries = typeof window.matchMedia === 'function'
      ? [
          window.matchMedia('(display-mode: standalone)'),
          window.matchMedia('(display-mode: fullscreen)'),
          window.matchMedia('(display-mode: minimal-ui)'),
        ].filter(Boolean)
      : [];

    const handleDisplayModeChange = () => {
      const standalone = checkStandaloneMode();
      setIsStandalone(standalone);
      if (standalone) {
        setIsInstalled(true);
      }
    };

    mediaQueries.forEach((mq) => {
      if (mq?.addEventListener) {
        mq.addEventListener('change', handleDisplayModeChange);
      } else if (mq?.addListener) {
        mq.addListener(handleDisplayModeChange);
      }
    });

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      capturedPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      console.log('Captured beforeinstallprompt event for HogarSync PWA');
    };

    // Capture appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      capturedPrompt = null;
      setDeferredPrompt(null);
      setIsBannerDismissed(true);
      try {
        sessionStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
      } catch {
        // Ignore session storage errors
      }
      console.log('HogarSync PWA was successfully installed on the device');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQueries.forEach((mq) => {
        if (mq?.removeEventListener) {
          mq.removeEventListener('change', handleDisplayModeChange);
        } else if (mq?.removeListener) {
          mq.removeListener(handleDisplayModeChange);
        }
      });
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (isPromptingRef.current) {
      console.warn('Install prompt already in progress');
      return false;
    }

    const promptEvent = deferredPrompt || capturedPrompt;
    if (!promptEvent) {
      console.warn('Install prompt is not available yet');
      return false;
    }

    isPromptingRef.current = true;
    setIsInstalling(true);

    // Consume the prompt immediately so that concurrent or subsequent taps cannot re-invoke prompt()
    capturedPrompt = null;
    setDeferredPrompt(null);

    try {
      // Trigger the native Android installation dialog
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      console.log(`User response to HogarSync install prompt: ${choiceResult.outcome}`);

      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsBannerDismissed(true);
        try {
          sessionStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
        } catch {
          // Ignore
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error during HogarSync PWA installation:', err);
      return false;
    } finally {
      isPromptingRef.current = false;
      setIsInstalling(false);
    }
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
    } catch {
      // Ignore
    }
  }, []);

  const canInstall = Boolean(deferredPrompt || capturedPrompt) && !isStandalone && !isInstalled;
  const showBanner = canInstall && !isBannerDismissed;

  return (
    <PWAInstallContext.Provider
      value={{
        canInstall,
        showBanner,
        isStandalone,
        isInstalled,
        isInstalling,
        installApp,
        dismissBanner,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
};

export const usePWAInstall = () => {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
};
