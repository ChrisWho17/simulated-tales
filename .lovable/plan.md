## Goal

Make "The Untold Stories" installable as an app on Android and iOS with a proper launcher icon, and surface an install button inside the Main Menu (CampaignManager) where world/campaign creation lives.

This is manifest-only PWA per Lovable PWA skill — no service worker, no offline support (not requested).

## 1. Generate icon set

Use the existing `public/images/untold-logo.png` as the source and generate a full PWA icon set into `public/icons/`:

- `icon-192.png` (192×192, maskable + any)
- `icon-512.png` (512×512, maskable + any)
- `apple-touch-icon.png` (180×180, opaque background — iOS does not honor transparency)
- `icon-maskable-512.png` (512×512 with safe-zone padding for Android adaptive icons)
- `favicon-32.png`, `favicon-16.png`

Generated via ImageMagick (`nix run nixpkgs#imagemagick`) from the existing logo. Background uses the app theme color `#1a1a2e` for opaque variants.

## 2. Web app manifest

Create `public/manifest.webmanifest`:

```json
{
  "name": "The Untold Stories",
  "short_name": "Untold Stories",
  "description": "AI-powered text adventure RPG with a living world.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#1a1a2e",
  "theme_color": "#1a1a2e",
  "categories": ["games", "entertainment"],
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## 3. Wire manifest + icon tags in `index.html`

Add to `<head>`:

- `<link rel="manifest" href="/manifest.webmanifest" />`
- `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />`
- `<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />`
- `<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />`

Keep existing `apple-mobile-web-app-*` tags and `theme-color`. Delete `public/favicon.ico` so the new PNG favicon takes over.

No service worker registration. No `vite-plugin-pwa`. No reload loops.

## 4. Install prompt hook

New file `src/hooks/usePwaInstall.ts`:

- Listens for `beforeinstallprompt`, stashes the event, exposes `{ canInstall, isInstalled, promptInstall, isIOS, isStandalone }`.
- `isStandalone` detects `display-mode: standalone` or iOS `navigator.standalone` to hide the button once installed.
- iOS path: `canInstall` is false but `isIOS` is true → component shows manual "Add to Home Screen" instructions.

## 5. Install UI in Main Menu

New component `src/components/adventure/InstallAppButton.tsx`:

- Renders nothing when `isStandalone` is true.
- On Android/desktop Chromium with `canInstall`: shows a glassmorphism button "Install App" that calls `promptInstall()`.
- On iOS Safari: shows the same button which opens a small modal with the Share → Add to Home Screen instructions and a screenshot-free, text-only walkthrough.
- Uses existing design tokens (primary `#8B5CF6`, glass surfaces) — no hardcoded colors beyond what's already standard.

Mount it in `src/components/campaign/CampaignManager.tsx` near the "New Campaign" header area so it sits with world-creation actions. Not added anywhere else (per request: Main Menu only).

## 6. Files

**New:**
- `public/manifest.webmanifest`
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon-32.png`, `favicon-16.png`
- `src/hooks/usePwaInstall.ts`
- `src/components/adventure/InstallAppButton.tsx`

**Edited:**
- `index.html` (manifest + icon links)
- `src/components/campaign/CampaignManager.tsx` (mount InstallAppButton)

**Deleted:**
- `public/favicon.ico`

## Notes

- Manifest-only — no offline support, no service worker, no cache-busting. Matches Lovable PWA guidance.
- The browser install prompt only appears on Chromium browsers after a user-engagement heuristic; iOS users always see the manual instructions modal.
- Once installed, the button hides itself via `isStandalone` check.
