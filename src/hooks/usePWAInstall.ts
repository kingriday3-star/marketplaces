import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as unknown as { deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).deferredPWAInstallPrompt) {
      return (window as unknown as { deferredPWAInstallPrompt: BeforeInstallPromptEvent }).deferredPWAInstallPrompt;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIframe, setIsIframe] = useState(false);

  // Standalone live production URL for direct mobile installation
  const fallbackStandaloneUrl = 'https://ais-pre-kzmx5l3uac4a3lv7cxr3sf-870223207021.europe-west2.run.app';
  const standaloneUrl =
    typeof window !== 'undefined' &&
    window.self === window.top &&
    !window.location.hostname.includes('ais-dev')
      ? window.location.origin
      : fallbackStandaloneUrl;

  useEffect(() => {
    // 1. Detect if inside an iframe (like AI Studio preview)
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    setIsIframe(inIframe);

    // 2. Detect standalone mode (already installed on phone screen)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // 3. Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 4. Listen to native prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as unknown as { deferredPWAInstallPrompt: unknown }).deferredPWAInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleCustomCanInstall = () => {
      if ((window as unknown as { deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).deferredPWAInstallPrompt) {
        setDeferredPrompt((window as unknown as { deferredPWAInstallPrompt: BeforeInstallPromptEvent }).deferredPWAInstallPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa:can-install', handleCustomCanInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if auto-install was requested via URL parameter
    if (window.location.search.includes('direct_install=true') || window.location.search.includes('install=1')) {
      setTimeout(() => {
        if ((window as unknown as { deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).deferredPWAInstallPrompt) {
          (window as unknown as { deferredPWAInstallPrompt: BeforeInstallPromptEvent }).deferredPWAInstallPrompt.prompt().catch(() => {});
        }
      }, 1000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa:can-install', handleCustomCanInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    // 1. If inside an iframe (like AI Studio preview), open the standalone app in new window/tab to trigger native install
    if (typeof window !== 'undefined' && window.self !== window.top) {
      try {
        window.open(`${standaloneUrl}?direct_install=true`, '_blank');
        return true;
      } catch {
        window.location.href = `${standaloneUrl}?direct_install=true`;
        return true;
      }
    }

    // 2. Direct browser install prompt
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' && (window as unknown as { deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).deferredPWAInstallPrompt);
    
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return true;
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
    return false;
  }, [deferredPrompt]);

  return {
    isInstallable: !!deferredPrompt || isIOS,
    hasNativePrompt: !!deferredPrompt,
    isInstalled,
    isIOS,
    isIframe,
    standaloneUrl,
    install,
  };
}
