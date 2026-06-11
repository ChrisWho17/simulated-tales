// Aggregated PWA health for the header indicator and debug page.
import { useEffect, useState } from 'react';
import {
  PWA_ACTIVATED_EVENT,
  PWA_UPDATE_EVENT,
  getLastUpdateAppliedAt,
} from '@/pwa/registerSW';

export interface PwaStatus {
  online: boolean;
  swSupported: boolean;
  swControlled: boolean;
  swState: 'unsupported' | 'none' | 'installing' | 'waiting' | 'active' | 'redundant';
  updateAvailable: boolean;
  lastUpdateAppliedAt: number | null;
  cacheNames: string[];
  cachedEntryCount: number;
}

const INITIAL: PwaStatus = {
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  swSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  swControlled: false,
  swState: 'none',
  updateAvailable: false,
  lastUpdateAppliedAt: null,
  cacheNames: [],
  cachedEntryCount: 0,
};

async function readCacheHealth(): Promise<{ names: string[]; count: number }> {
  try {
    if (typeof caches === 'undefined') return { names: [], count: 0 };
    const names = await caches.keys();
    let total = 0;
    for (const name of names) {
      try {
        const c = await caches.open(name);
        const keys = await c.keys();
        total += keys.length;
      } catch {
        /* ignore */
      }
    }
    return { names, count: total };
  } catch {
    return { names: [], count: 0 };
  }
}

async function readSwState(): Promise<Pick<PwaStatus, 'swControlled' | 'swState'>> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return { swControlled: false, swState: 'unsupported' };
  }
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return { swControlled: false, swState: 'none' };
  const controlled = Boolean(navigator.serviceWorker.controller);
  if (reg.installing) return { swControlled: controlled, swState: 'installing' };
  if (reg.waiting) return { swControlled: controlled, swState: 'waiting' };
  if (reg.active) return { swControlled: controlled, swState: 'active' };
  return { swControlled: controlled, swState: 'none' };
}

export function usePwaStatus(pollMs = 15000): PwaStatus {
  const [status, setStatus] = useState<PwaStatus>(INITIAL);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const [sw, cache] = await Promise.all([readSwState(), readCacheHealth()]);
      if (cancelled) return;
      setStatus((prev) => ({
        ...prev,
        ...sw,
        cacheNames: cache.names,
        cachedEntryCount: cache.count,
        online: navigator.onLine,
        lastUpdateAppliedAt: getLastUpdateAppliedAt(),
      }));
    };

    refresh();
    const interval = window.setInterval(refresh, pollMs);

    const onOnline = () => setStatus((s) => ({ ...s, online: true }));
    const onOffline = () => setStatus((s) => ({ ...s, online: false }));
    const onUpdate = () => setStatus((s) => ({ ...s, updateAvailable: true }));
    const onActivated = () =>
      setStatus((s) => ({
        ...s,
        updateAvailable: false,
        lastUpdateAppliedAt: getLastUpdateAppliedAt(),
      }));

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener(PWA_UPDATE_EVENT, onUpdate as EventListener);
    window.addEventListener(PWA_ACTIVATED_EVENT, onActivated as EventListener);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener(PWA_UPDATE_EVENT, onUpdate as EventListener);
      window.removeEventListener(PWA_ACTIVATED_EVENT, onActivated as EventListener);
    };
  }, [pollMs]);

  return status;
}
