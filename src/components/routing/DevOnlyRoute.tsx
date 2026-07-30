import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { IS_DEV } from '@/lib/devLog';
import { loadSettings } from '@/lib/gameSettings';

/**
 * Gate for workshop / diagnostic routes.
 *
 * These harnesses stay in the codebase but must not be reachable from the
 * public play surface. They render when:
 *  - running the dev server, or
 *  - the player has Creators Mark (cheat mode) enabled.
 *
 * Otherwise the route falls through to the 404 page.
 */
export function isDevSurfaceEnabled(): boolean {
  if (IS_DEV) return true;
  try {
    return !!loadSettings().cheatModeEnabled;
  } catch {
    return false;
  }
}

export function DevOnlyRoute({ children }: { children: ReactNode }) {
  if (!isDevSurfaceEnabled()) {
    return <Navigate to="/404" replace />;
  }
  return <>{children}</>;
}

export default DevOnlyRoute;
