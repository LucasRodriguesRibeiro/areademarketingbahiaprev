import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

// Register global beforeinstallprompt event as early as possible
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((listener) => listener());
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    localStorage.setItem('bahiaprev_pwa_installed', 'true');
    promptListeners.forEach((listener) => listener());
  });
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      localStorage.getItem('bahiaprev_pwa_installed') === 'true'
    );
  });

  useEffect(() => {
    const updateState = () => {
      setDeferredPrompt(globalDeferredPrompt);
      setIsInstalled(
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        localStorage.getItem('bahiaprev_pwa_installed') === 'true'
      );
    };

    promptListeners.add(updateState);
    return () => {
      promptListeners.delete(updateState);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (globalDeferredPrompt) {
      try {
        await globalDeferredPrompt.prompt();
        const choice = await globalDeferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          localStorage.setItem('bahiaprev_pwa_installed', 'true');
          setIsInstalled(true);
          globalDeferredPrompt = null;
          return true;
        }
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
    }
    return false;
  };

  return {
    canInstallNatively: Boolean(deferredPrompt && !isInstalled),
    isInstalled,
    triggerInstall,
  };
}
