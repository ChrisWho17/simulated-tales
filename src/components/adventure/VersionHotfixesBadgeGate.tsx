import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { VersionHotfixesBadge } from './VersionHotfixesBadge';
import { loadSettings } from '@/lib/gameSettings';

/**
 * Floating hotfix badge visibility rules:
 *  - Hidden entirely when the user toggles `hideHotfixBadge` in settings.
 *  - Only shown on the main menu (route "/" and game phase is not "playing").
 */
export function VersionHotfixesBadgeGate() {
  const location = useLocation();
  const [hidden, setHidden] = useState<boolean>(() => !!loadSettings().hideHotfixBadge);
  const [phase, setPhase] = useState<string>(() => {
    try { return document.body.dataset.gamePhase ?? 'loading'; } catch { return 'loading'; }
  });

  useEffect(() => {
    const refreshSettings = () => setHidden(!!loadSettings().hideHotfixBadge);
    const onPhase = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') setPhase(detail);
    };
    window.addEventListener('storage', refreshSettings);
    window.addEventListener('settings:updated', refreshSettings);
    window.addEventListener('game:phase', onPhase as EventListener);
    return () => {
      window.removeEventListener('storage', refreshSettings);
      window.removeEventListener('settings:updated', refreshSettings);
      window.removeEventListener('game:phase', onPhase as EventListener);
    };
  }, []);

  if (hidden) return null;
  // Only render on the routes that can show the main menu.
  if (location.pathname !== '/' && location.pathname !== '/play' && location.pathname !== '/campaigns/new') return null;
  // Hide once the user has entered actual gameplay.
  if (phase === 'playing') return null;
  return <VersionHotfixesBadge />;
}

export default VersionHotfixesBadgeGate;
