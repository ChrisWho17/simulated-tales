import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { VersionHotfixesBadge } from '../VersionHotfixesBadge';
import { CHANGELOG } from '../WhatsNewModal';

// Radix Popover/Dialog use pointer events; jsdom needs shims.
beforeAll(() => {
  const proto = Element.prototype as unknown as Record<string, unknown>;
  if (!proto.hasPointerCapture) {
    proto.hasPointerCapture = () => false;
    proto.setPointerCapture = () => {};
    proto.releasePointerCapture = () => {};
  }
  if (!proto.scrollIntoView) {
    proto.scrollIntoView = () => {};
  }
  if (typeof (globalThis as { ResizeObserver?: unknown }).ResizeObserver === 'undefined') {
    (globalThis as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

describe('VersionHotfixesBadge', () => {
  const latest = CHANGELOG[0];

  it('shows the hotfix count badge matching latest changelog fixes length', () => {
    render(<VersionHotfixesBadge />);
    const badge = screen.getByTestId('hotfixes-count-badge');
    expect(badge.textContent).toBe(String(latest.fixes.length));
  });

  it('renders highlights popover with latest version entries', async () => {
    render(<VersionHotfixesBadge />);
    fireEvent.click(screen.getByTestId('highlights-trigger'));

    const popover = await screen.findByTestId('highlights-popover');
    expect(popover.textContent).toContain(`v${latest.version}`);

    const list = within(popover).getByTestId('highlights-list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(latest.highlights.length);
    latest.highlights.forEach((h, i) => {
      expect(items[i].textContent).toContain(h);
    });
  });

  it('renders hotfixes popover with latest version fixes', async () => {
    render(<VersionHotfixesBadge />);
    fireEvent.click(screen.getByTestId('hotfixes-trigger'));

    const popover = await screen.findByTestId('hotfixes-popover');
    expect(popover.textContent).toContain(`v${latest.version}`);

    const list = within(popover).getByTestId('hotfixes-list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(latest.fixes.length);
    latest.fixes.forEach((f, i) => {
      expect(items[i].textContent).toContain(f);
    });
  });

  it('opens full hotfix history dialog showing every changelog entry', async () => {
    render(<VersionHotfixesBadge />);
    fireEvent.click(screen.getByTestId('hotfixes-trigger'));
    fireEvent.click(await screen.findByTestId('hotfixes-history-trigger'));

    const dialog = await screen.findByTestId('hotfixes-history-dialog');
    const list = within(dialog).getByTestId('hotfixes-history-list');

    CHANGELOG.forEach((entry) => {
      const card = within(list).getByTestId(`history-entry-${entry.version}`);
      const text = card.textContent ?? '';
      expect(text).toContain(`v${entry.version}`);
      expect(text).toContain(entry.title);
      entry.fixes.forEach((f) => {
        expect(text).toContain(f);
      });
    });
  });
});
