import { useState, useCallback } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { 
  addBookmark, 
  removeBookmark, 
  isBookmarked, 
  getBookmarkForEntry 
} from '@/lib/bookmarkSystem';
import { toast } from 'sonner';

interface BookmarkButtonProps {
  entryId: string;
  entryIndex: number;
  entryContent: string;
  campaignId: string;
  characterName: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export function BookmarkButton({
  entryId,
  entryIndex,
  entryContent,
  campaignId,
  characterName,
  className,
  size = 'icon',
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(() => 
    isBookmarked(entryId, campaignId)
  );

  const handleToggle = useCallback(() => {
    if (bookmarked) {
      const existing = getBookmarkForEntry(entryId, campaignId);
      if (existing) {
        removeBookmark(existing.id);
        setBookmarked(false);
        toast.success('Bookmark removed');
      }
    } else {
      addBookmark(entryId, entryIndex, entryContent, campaignId, characterName);
      setBookmarked(true);
      toast.success('Moment bookmarked!');
    }
  }, [bookmarked, entryId, entryIndex, entryContent, campaignId, characterName]);

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn(
        'transition-all duration-200',
        bookmarked && 'text-primary',
        className
      )}
      onClick={handleToggle}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark this moment'}
    >
      {bookmarked ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
    </Button>
  );
}
