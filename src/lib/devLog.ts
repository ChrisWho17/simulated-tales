/**
 * Environment-aware logging.
 *
 * Verbose `log`/`warn`/`debug` output is silenced in production builds so the
 * public play surface stays quiet, while errors always surface.
 *
 * Creators Mark / dev builds keep full output.
 */

export const IS_DEV: boolean = (() => {
  try {
    return !!import.meta.env?.DEV;
  } catch {
    return false;
  }
})();

/**
 * Verbose logging can be force-enabled at runtime (handy for debugging a
 * production build) via `localStorage.setItem('untold-verbose-logs', '1')`.
 */
function verboseEnabled(): boolean {
  if (IS_DEV) return true;
  try {
    return localStorage.getItem('untold-verbose-logs') === '1';
  } catch {
    return false;
  }
}

export const devLog = {
  log: (...args: unknown[]) => {
    if (verboseEnabled()) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (verboseEnabled()) console.warn(...args);
  },
  debug: (...args: unknown[]) => {
    if (verboseEnabled()) console.debug(...args);
  },
  /** Errors are never silenced. */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};

export default devLog;
