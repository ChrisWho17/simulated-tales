import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CreationSectionProps {
  title: string;
  /** Short value/summary shown on the collapsed header (e.g. the current pick). */
  summary?: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  tone?: 'default' | 'accent' | 'danger';
  children: ReactNode;
}

/**
 * Compartmentalised, collapsible block for character creation.
 * Keeps each group of options behind a single arrow header so the screen
 * doesn't read like a dictionary page.
 */
export function CreationSection({
  title,
  summary,
  icon,
  defaultOpen = false,
  tone = 'default',
  children,
}: CreationSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'rounded-lg border bg-background/40 overflow-hidden transition-colors',
          tone === 'danger'
            ? 'border-destructive/30'
            : tone === 'accent'
              ? 'border-accent/30'
              : 'border-border/30',
          open && 'bg-background/60'
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-primary/5 transition-colors"
          >
            {icon}
            <span
              className={cn(
                'text-sm font-medium flex-1 min-w-0 break-words',
                tone === 'danger' ? 'text-destructive' : 'text-foreground'
              )}
            >
              {title}
            </span>
            {summary != null && !open && (
              <span className="text-xs text-muted-foreground truncate max-w-[45%]">{summary}</span>
            )}
            <ChevronDown
              className={cn(
                'w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200',
                open && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
