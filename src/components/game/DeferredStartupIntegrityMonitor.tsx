// ============================================================================
// DEFERRED STARTUP INTEGRITY MONITOR
// ----------------------------------------------------------------------------
// The integrity scan is a diagnostic, not a gameplay system. On dev builds and
// for Creators Mark users it mounts immediately (as before). On the public play
// surface it is deferred until the browser is idle after first paint, so it
// never competes with the opening render.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { StartupIntegrityMonitor } from './StartupIntegrityMonitor';
import { isDevSurfaceEnabled } from '@/components/routing/DevOnlyRoute';

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

export const DeferredStartupIntegrityMonitor: React.FC = () => {
  const [mounted, setMounted] = useState(() => isDevSurfaceEnabled());

  useEffect(() => {
    if (mounted) return;
    const w = window as IdleWindow;
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const run = () => setMounted(true);

    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(run, { timeout: 8000 });
    } else {
      timeoutId = window.setTimeout(run, 5000);
    }

    return () => {
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [mounted]);

  if (!mounted) return null;
  return <StartupIntegrityMonitor />;
};

export default DeferredStartupIntegrityMonitor;
