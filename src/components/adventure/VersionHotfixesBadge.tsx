const CHANGELOG_UPDATED_EVENT = 'untold-changelog-updated';

/**
 * Kept for compatibility with the changelog update path. The old fixed
 * top-right version/highlight/hotfix controls were removed from the play and
 * creation UI because they obscured mobile content.
 */
export function notifyChangelogUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CHANGELOG_UPDATED_EVENT));
  }
}

/**
 * Intentionally renders nothing. Changelog data and What's New remain intact;
 * only the always-on floating production badge was retired.
 */
export function VersionHotfixesBadge() {
  return null;
}
