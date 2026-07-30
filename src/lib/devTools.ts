/**
 * Creator / workshop tooling gates.
 * Workshop routes and always-on diagnostics stay out of the public play surface.
 * Explicit cheat commands (/cheat) remain available for Creators Mark iteration.
 */

export const IS_DEV = import.meta.env.DEV;

/** True when workshop routes and always-on diagnostics may surface. */
export function isWorkshopEnabled(): boolean {
  if (IS_DEV) return true;
  try {
    return localStorage.getItem('untold-workshop') === '1';
  } catch {
    return false;
  }
}

/** Ctrl+Shift+D save diagnostics and similar creator panels. */
export function isDiagnosticsHotkeyEnabled(): boolean {
  return isWorkshopEnabled();
}
