import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { VersionHotfixesBadge } from '../VersionHotfixesBadge';
import type { ChangelogEntry } from '@/lib/changelog';

const entriesWithFixes: ChangelogEntry[] = [
  {
    version: '0.4.6',
    date: 'June 2026',
    title: 'Accent Toggle',
    highlights: ['Accent opt-in'],
    features: [],
    improvements: [],
    fixes: ['Director sync fixed', 'Accent descriptors refined'],
  },
];

const entriesEmptyFixes: ChangelogEntry[] = [
  {
    version: '0.4.7',
    date: 'June 2026',
    title: 'Heights & Weights',
    highlights: ['Custom height slider'],
    features: [],
    improvements: [],
    fixes: [],
  },
];

vi.mock('@/lib/changelog', async () => {
  const actual = await vi.importActual<typeof import('@/lib/changelog')>('@/lib/changelog');
  return {
    ...actual,
    fetchChangelog: vi.fn(),
  };
});

import { fetchChangelog } from '@/lib/changelog';

const mockedFetch = vi.mocked(fetchChangelog);

describe('VersionHotfixesBadge', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it('shows the hotfix count badge when latest patch has fixes', async () => {
    mockedFetch.mockResolvedValue(entriesWithFixes);
    render(<VersionHotfixesBadge />);

    await waitFor(() => {
      expect(screen.getByTestId('hotfixes-count-badge').textContent).toBe('2');
    });
  });

  it('hides the hotfix count badge when latest patch has zero fixes', async () => {
    mockedFetch.mockResolvedValue(entriesEmptyFixes);
    render(<VersionHotfixesBadge />);

    await waitFor(() => {
      expect(screen.getByTestId('version-hotfixes-badge')).toBeTruthy();
    });
    expect(screen.queryByTestId('hotfixes-count-badge')).toBeNull();
  });

  it('renders hotfixes popover with latest version fixes when present', async () => {
    mockedFetch.mockResolvedValue(entriesWithFixes);
    render(<VersionHotfixesBadge />);

    await waitFor(() => expect(screen.getByTestId('hotfixes-trigger')).toBeTruthy());
    fireEvent.click(screen.getByTestId('hotfixes-trigger'));

    await waitFor(() => expect(screen.getByTestId('hotfixes-list')).toBeTruthy());
    expect(screen.getByText('Director sync fixed')).toBeTruthy();
  });

  it('renders empty hotfix message when latest patch has zero fixes', async () => {
    mockedFetch.mockResolvedValue(entriesEmptyFixes);
    render(<VersionHotfixesBadge />);

    await waitFor(() => expect(screen.getByTestId('hotfixes-trigger')).toBeTruthy());
    fireEvent.click(screen.getByTestId('hotfixes-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('hotfixes-empty').textContent).toContain(
        'No hotfixes in this patch.',
      );
    });
    expect(screen.queryByTestId('hotfixes-list')).toBeNull();
  });
});
