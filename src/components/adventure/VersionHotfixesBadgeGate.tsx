import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { VersionHotfixesBadge } from './VersionHotfixesBadge';
import { loadSettings } from '@/lib/gameSettings';

/**
 * Only shows the floating hotfix badge on the main menu ("/").
 * Hidden entirely when the user toggles `hideHotfixBadge` in settings.
 */
export function VersionHotfixesBadgeGate() {
  const location = useLocation();
  const [hidden, setHidden] = useState<boolean>(() => !!loadSettings().hideHotfixBadge);

  useEffect(() => {
    const refresh = () => setHidden(!!loadSettings().hideHotfixBadge);
    window.addEventListener('storage', refresh);
    window.addEventListener('settings:updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('settings:updated', refresh);
    };
  }, []);

  if (hidden) return null;
  if (location.pathname !== '/') return null;
  return <VersionHotfixesBadge />;
}

export default VersionHotfixesBadgeGate;
