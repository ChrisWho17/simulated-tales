import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALLED_KEY = 'pwa.installed.v1';
const DEBUG_FORCE_KEY = 'pwa.debug.forceShowInstall.v1';

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iPadOS = /Mac/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(mq || iosStandalone);
}

function readInstalledFlag(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeInstalledFlag(value: boolean): void {
  try {
    if (value) localStorage.setItem(INSTALLED_KEY, '1');
    else localStorage.removeItem(INSTALLED_KEY);
  } catch {
    /* ignore */
  }
}

function readForceShow(): boolean {
  try {
    return localStorage.getItem(DEBUG_FORCE_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearInstalledFlag(): void {
  writeInstalledFlag(false);
  window.dispatchEvent(new Event('pwa:installed-flag-changed'));
}

export function setForceShowInstall(force: boolean): void {
  try {
    if (force) localStorage.setItem(DEBUG_FORCE_KEY, '1');
    else localStorage.removeItem(DEBUG_FORCE_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('pwa:installed-flag-changed'));
}

export function getForceShowInstall(): boolean {
  return readForceShow();
}

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(detectStandalone());
  const [isIOS] = useState<boolean>(detectIOS());
  const [installedFlag, setInstalledFlag] = useState<boolean>(readInstalledFlag());
  const [forceShow, setForceShow] = useState<boolean>(readForceShow());

  // Mark installed flag if we boot into standalone (covers iOS Add-to-Home-Screen).
  useEffect(() => {
    if (detectStandalone() && !readInstalledFlag()) {
      writeInstalledFlag(true);
      setInstalledFlag(true);
    }
  }, []);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setIsStandalone(true);
      writeInstalledFlag(true);
      setInstalledFlag(true);
    };
    const onFlagChange = () => {
      setInstalledFlag(readInstalledFlag());
      setForceShow(readForceShow());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === INSTALLED_KEY || e.key === DEBUG_FORCE_KEY) onFlagChange();
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('pwa:installed-flag-changed', onFlagChange);
    window.addEventListener('storage', onStorage);

    const mq = window.matchMedia('(display-mode: standalone)');
    const onChange = () => setIsStandalone(detectStandalone());
    mq.addEventListener?.('change', onChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('pwa:installed-flag-changed', onFlagChange);
      window.removeEventListener('storage', onStorage);
      mq.removeEventListener?.('change', onChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return 'unavailable' as const;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') {
      writeInstalledFlag(true);
      setInstalledFlag(true);
    }
    setDeferred(null);
    return choice.outcome;
  }, [deferred]);

  // Visibility logic:
  // - Debug override always wins (forces button visible).
  // - Otherwise hide if we're standalone OR a previous install was recorded.
  const isHidden = !forceShow && (isStandalone || installedFlag);

  return {
    canInstall: !!deferred,
    isStandalone,
    isIOS,
    installedFlag,
    forceShow,
    isHidden,
    promptInstall,
  };
}
