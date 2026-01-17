// ============================================================================
// VERSION CONSTANTS - Update this file when releasing new versions
// ============================================================================

// Declare the build-time constant injected by Vite
declare const __BUILD_TIME__: string;

export const APP_VERSION = "0.4.2";
export const APP_STAGE = "alpha";

// Build timestamp - auto-generated at build/publish time
export const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();

// Generate build number from timestamp (YYMMDD.HHMM format)
const buildDate = new Date(BUILD_TIME);
const yy = String(buildDate.getFullYear()).slice(-2);
const mm = String(buildDate.getMonth() + 1).padStart(2, '0');
const dd = String(buildDate.getDate()).padStart(2, '0');
const hh = String(buildDate.getHours()).padStart(2, '0');
const min = String(buildDate.getMinutes()).padStart(2, '0');

export const BUILD_NUMBER = `${yy}${mm}${dd}.${hh}${min}`;

// Full version string for display
export const VERSION_STRING = `v${APP_VERSION}-${APP_STAGE}`;

// Version with build number for detailed display
export const VERSION_FULL = `v${APP_VERSION}-${APP_STAGE} (${BUILD_NUMBER})`;

// Short version for compact displays
export const VERSION_SHORT = `v${APP_VERSION}`;
