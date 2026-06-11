import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { VersionHotfixesBadge } from '../VersionHotfixesBadge';
import { CHANGELOG } from '../WhatsNewModal';

// Radix Popover/Dialog use pointer events + portals; jsdom needs these shims.
beforeAll(() => {
  // pointer events are not implemented in jsdom
  // @ts-expect-error - shim
  if (!Element.prototype.hasPointerCapture) {
    // @ts-expect-error - shim
    Element.prototype.hasPointerCapture = () => false;
    // @ts-expect-error - shim
    Element.prototype.setPointerCapture = () => {};
    // @ts-expect-error - shim
    Element.prototype.releasePointerCapture = () => {};
  }
  // scrollIntoView not in jsdom
  // @ts-expect-error - shim
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
});

describe('VersionHotfixesBadge', () => {
  const latest = CHANGELOG[0];

  it('shows the hotfix count badge matching latest changelog fixes length', () => {
    render(<VersionHotfixesBadge />);
    const badge = screen.getByTestId('hotfixes-count-badge');
    expect(badge).toHaveTextContent(String(latest.fixes.length));
  });

  it('renders highlights popover with latest version entries', async () => {
    render(<VersionHotfixesBadge />);
    fireEvent.click(screen.getByTestId('highlights-trigger'));

    const popover = await screen.findByTestId('highlights-popover');
    expect(popover).toHaveTextContent(`v${latest.version}`);

    const list = within(popover).getByTestId('highlights-list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(latest.highlights.length);
    latest.highlights.forEach((h, i) => {
      expect(items[i]).toHaveTextContent(h);
    });
  });

  it('renders hotfixes popover with latest version fixes', async () => {
    render(<VersionHotfixesBadge />);
    fireEvent.click(screen.getByTestId('hotfixes-trigger'));

    const popover = await screen.findByTestId('hotfixes-popover');
    expect(popover).toHaveTextContent(`v${latest.version}`);

    const list = within(popover).getByTestId('hotfixes-list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(latest.fixes.length);
    latest.fixes.forEach((f, i) => {
      expect(items[i]).toHaveTextContent(f);
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
      expect(card).toHaveTextContent(`v${entry.version}`);
      expect(card).toHaveTextContent(entry.title);
      entry.fixes.forEach((f) => {
        expect(card).toHaveTextContent(f);
      });
    });
  });
});
