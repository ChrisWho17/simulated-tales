# Fix failing hotfix badge tests

## Root cause
Two tests in `src/components/adventure/__tests__/VersionHotfixesBadge.test.tsx` fail because the latest changelog entry (v0.4.7) has `fixes: []`, but the tests assume the latest entry always has fixes.

The component is correct: it intentionally hides the count badge and shows "No hotfixes in this patch." when a patch has zero fixes. The tests are stale.

1. **"shows the hotfix count badge"** (line 29) — asserts `hotfixes-count-badge` exists, but it only renders when `fixes.length > 0`.
2. **"renders hotfixes popover with latest version fixes"** (line 50) — asserts `hotfixes-list` exists, but that `<ul>` only renders when `fixes.length > 0`.

## Fix
Edit only `src/components/adventure/__tests__/VersionHotfixesBadge.test.tsx`:

- **Count badge test**: guard with `if (latest.fixes.length > 0)`. When fixes exist, assert the badge shows the count; when absent, assert the badge is null.
- **Hotfixes popover test**: when fixes exist, assert the list + items as before; when the latest has no fixes, assert the "No hotfixes in this patch." message renders.

No component changes. No changelog changes.

## Verification
`bunx vitest run src/components/adventure/__tests__/VersionHotfixesBadge.test.tsx` → all 4 tests pass.