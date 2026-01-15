// Story Bookmark System
// Allows players to save and jump to favorite narrative moments

export interface StoryBookmark {
  id: string;
  entryId: string;
  entryIndex: number;
  title: string;
  preview: string; // First 100 chars of the entry
  createdAt: number;
  campaignId: string;
  characterName: string;
  icon?: string; // Optional emoji/icon
  color?: string; // Optional highlight color
  note?: string; // Player's personal note about this moment
}

const BOOKMARKS_KEY = 'untold-story-bookmarks';

// Load all bookmarks
export function loadBookmarks(): StoryBookmark[] {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save bookmarks
function saveBookmarks(bookmarks: StoryBookmark[]): void {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

// Get bookmarks for a specific campaign
export function getBookmarksForCampaign(campaignId: string): StoryBookmark[] {
  return loadBookmarks().filter(b => b.campaignId === campaignId);
}

// Add a bookmark
export function addBookmark(
  entryId: string,
  entryIndex: number,
  entryContent: string,
  campaignId: string,
  characterName: string,
  customTitle?: string
): StoryBookmark {
  const bookmarks = loadBookmarks();
  
  // Check if already bookmarked
  const existing = bookmarks.find(b => b.entryId === entryId && b.campaignId === campaignId);
  if (existing) {
    return existing;
  }
  
  const preview = entryContent
    .replace(/\*\*/g, '')
    .replace(/\n/g, ' ')
    .slice(0, 100)
    .trim();
  
  const bookmark: StoryBookmark = {
    id: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    entryId,
    entryIndex,
    title: customTitle || `Moment #${bookmarks.filter(b => b.campaignId === campaignId).length + 1}`,
    preview: preview + (entryContent.length > 100 ? '...' : ''),
    createdAt: Date.now(),
    campaignId,
    characterName,
  };
  
  bookmarks.push(bookmark);
  saveBookmarks(bookmarks);
  
  return bookmark;
}

// Remove a bookmark
export function removeBookmark(bookmarkId: string): void {
  const bookmarks = loadBookmarks();
  const filtered = bookmarks.filter(b => b.id !== bookmarkId);
  saveBookmarks(filtered);
}

// Update bookmark title
export function updateBookmarkTitle(bookmarkId: string, newTitle: string): void {
  const bookmarks = loadBookmarks();
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  if (bookmark) {
    bookmark.title = newTitle;
    saveBookmarks(bookmarks);
  }
}

// Update bookmark icon/color
export function updateBookmarkStyle(
  bookmarkId: string, 
  updates: { icon?: string; color?: string }
): void {
  const bookmarks = loadBookmarks();
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  if (bookmark) {
    if (updates.icon !== undefined) bookmark.icon = updates.icon;
    if (updates.color !== undefined) bookmark.color = updates.color;
    saveBookmarks(bookmarks);
  }
}

// Update bookmark note
export function updateBookmarkNote(bookmarkId: string, note: string): void {
  const bookmarks = loadBookmarks();
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  if (bookmark) {
    bookmark.note = note.trim() || undefined;
    saveBookmarks(bookmarks);
  }
}

// Check if an entry is bookmarked
export function isBookmarked(entryId: string, campaignId: string): boolean {
  return loadBookmarks().some(b => b.entryId === entryId && b.campaignId === campaignId);
}

// Get bookmark for entry
export function getBookmarkForEntry(entryId: string, campaignId: string): StoryBookmark | undefined {
  return loadBookmarks().find(b => b.entryId === entryId && b.campaignId === campaignId);
}

// Clear all bookmarks for a campaign
export function clearCampaignBookmarks(campaignId: string): void {
  const bookmarks = loadBookmarks();
  const filtered = bookmarks.filter(b => b.campaignId !== campaignId);
  saveBookmarks(filtered);
}

// Export bookmarks for a campaign
export function exportBookmarks(campaignId: string): string {
  const bookmarks = getBookmarksForCampaign(campaignId);
  return JSON.stringify(bookmarks, null, 2);
}

// Import bookmarks
export function importBookmarks(data: string, campaignId: string): number {
  try {
    const imported: StoryBookmark[] = JSON.parse(data);
    const bookmarks = loadBookmarks();
    
    let count = 0;
    for (const bm of imported) {
      // Reassign to current campaign
      const exists = bookmarks.some(b => b.entryId === bm.entryId && b.campaignId === campaignId);
      if (!exists) {
        bookmarks.push({
          ...bm,
          id: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          campaignId,
        });
        count++;
      }
    }
    
    saveBookmarks(bookmarks);
    return count;
  } catch {
    return 0;
  }
}
