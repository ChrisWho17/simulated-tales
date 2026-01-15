import { useState, useMemo } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from './sheet';
import { Button } from './button';
import { Input } from './input';
import { ScrollArea } from './scroll-area';
import { 
  Bookmark, 
  Search, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getBookmarksForCampaign, 
  removeBookmark, 
  updateBookmarkTitle,
  StoryBookmark 
} from '@/lib/bookmarkSystem';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BookmarksSidebarProps {
  campaignId: string;
  onJumpToEntry?: (entryId: string, entryIndex: number) => void;
  trigger?: React.ReactNode;
}

export function BookmarksSidebar({
  campaignId,
  onJumpToEntry,
  trigger,
}: BookmarksSidebarProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [bookmarks, setBookmarks] = useState<StoryBookmark[]>([]);

  // Load bookmarks when sheet opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setBookmarks(getBookmarksForCampaign(campaignId));
    }
  };

  // Filter bookmarks by search
  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) return bookmarks;
    const query = searchQuery.toLowerCase();
    return bookmarks.filter(b => 
      b.title.toLowerCase().includes(query) ||
      b.preview.toLowerCase().includes(query)
    );
  }, [bookmarks, searchQuery]);

  const handleDelete = (id: string) => {
    removeBookmark(id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
    toast.success('Bookmark deleted');
  };

  const handleStartEdit = (bookmark: StoryBookmark) => {
    setEditingId(bookmark.id);
    setEditTitle(bookmark.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      updateBookmarkTitle(id, editTitle.trim());
      setBookmarks(prev => prev.map(b => 
        b.id === id ? { ...b, title: editTitle.trim() } : b
      ));
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleJump = (bookmark: StoryBookmark) => {
    onJumpToEntry?.(bookmark.entryId, bookmark.entryIndex);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <Bookmark className="w-4 h-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Story Bookmarks
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Bookmark List */}
          <ScrollArea className="h-[calc(100vh-200px)]">
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No bookmarks yet</p>
                <p className="text-sm mt-1">
                  Click the bookmark icon on story entries to save moments
                </p>
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {filteredBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className={cn(
                      "p-3 rounded-lg border border-border/50 bg-card/50",
                      "hover:bg-card hover:border-border transition-all",
                      "cursor-pointer group"
                    )}
                    onClick={() => handleJump(bookmark)}
                  >
                    {editingId === bookmark.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(bookmark.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={() => handleSaveEdit(bookmark.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {bookmark.icon && <span className="mr-1">{bookmark.icon}</span>}
                              {bookmark.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(bookmark.createdAt, 'MMM d, yyyy')} • {bookmark.characterName}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(bookmark);
                              }}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(bookmark.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {bookmark.preview}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
